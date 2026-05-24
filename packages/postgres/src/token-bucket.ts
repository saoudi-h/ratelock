import {
    type Limiter,
    type TokenBucketOptions,
    type TokenBucketResult,
    validateTokenBucketOptions,
    withCache,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'
import { startAutoCleanup } from './cleanup'
import { createConnection } from './drivers'
import { runMigrations } from './migrations'
import type { PostgresLimiterBaseConfig } from './types'

const TABLE = 'ratelock.token_bucket'

export type TokenBucketLimiterConfig = TokenBucketOptions & PostgresLimiterBaseConfig

export async function tokenBucket(
    config: TokenBucketLimiterConfig
): Promise<Limiter<TokenBucketResult>> {
    validateTokenBucketOptions(config)
    const { capacity, refillRate, prefix = 'tb', skipMigrations = false } = config
    const conn = await createConnection(config)
    const drv = conn.driver

    if (!skipMigrations) await runMigrations(drv, { unlogged: config.unlogged })
    const cleanupHandle = startAutoCleanup(drv)

    let limiter: Limiter<TokenBucketResult> = {
        async check(id: string): Promise<TokenBucketResult> {
            const key = `${prefix}:${id}`
            const now = Date.now() / 1000

            const runUpdate = async (time: number): Promise<TokenBucketResult | null> => {
                const rows = await drv.query<{
                    tokens: number
                    capacity: number
                    refill_rate: number
                    last_refill: number
                    allowed: boolean | number
                }>(
                    `UPDATE ${TABLE} SET
             tokens = CASE
               WHEN LEAST(capacity, tokens + ($2 - last_refill) * refill_rate) >= 1
               THEN LEAST(capacity, tokens + ($2 - last_refill) * refill_rate) - 1
               ELSE LEAST(capacity, tokens + ($2 - last_refill) * refill_rate)
             END,
             last_refill = CASE
               WHEN LEAST(capacity, tokens + ($2 - last_refill) * refill_rate) >= 1
               THEN $2
               ELSE last_refill
             END,
             expires_at = TO_TIMESTAMP($2) + '1 hour'::interval
           WHERE key = $1
           RETURNING tokens, capacity, refill_rate, last_refill, (last_refill = $2) as allowed`,
                    [key, time]
                )

                if (rows.length === 0) return null

                const r = rows[0]!
                const tokens = Number(r.tokens)
                const rate = Number(r.refill_rate)
                const allowed = Boolean(r.allowed)

                if (allowed) {
                    return {
                        allowed: true,
                        remaining: Math.floor(tokens),
                        tokens: Math.floor(tokens),
                        refillTime: 0,
                    }
                }

                return {
                    allowed: false,
                    remaining: Math.floor(tokens),
                    tokens: Math.floor(tokens),
                    refillTime: Math.ceil(((1 - tokens) / rate) * 1000),
                }
            }

            const result = await runUpdate(now)
            if (result) return result

            // Step 2: Try INSERT (new key) with capacity - 1 initial tokens
            const insertRows = await drv.query<{ tokens: number }>(
                `INSERT INTO ${TABLE} (key, tokens, last_refill, capacity, refill_rate, expires_at)
         VALUES ($1, $2 - 1, $4, $2, $3, TO_TIMESTAMP($4) + '1 hour'::interval)
         ON CONFLICT (key) DO NOTHING
         RETURNING tokens`,
                [key, capacity, refillRate, now]
            )

            if (insertRows.length > 0) {
                return {
                    allowed: true,
                    remaining: capacity - 1,
                    tokens: capacity - 1,
                    refillTime: 0,
                }
            }

            // Step 3: Concurrency retry
            const retryResult = await runUpdate(now)
            return (
                retryResult ?? {
                    allowed: false,
                    remaining: 0,
                    tokens: 0,
                    refillTime: Math.ceil((1 / refillRate) * 1000),
                }
            )
        },

        async checkBatch(ids: string[]): Promise<TokenBucketResult[]> {
            return Promise.all(ids.map(id => limiter.check(id)))
        },

        async destroy() {
            cleanupHandle.stop()
            await conn.end()
        },
    }

    if (config.cache) limiter = withCache(limiter, config.cache)
    if (config.retry) limiter = withRetry(limiter, config.retry)
    if (config.circuitBreaker) limiter = withCircuitBreaker(limiter, config.circuitBreaker)
    if (config.fallback) limiter = withFallback(limiter, config.fallback)

    return limiter
}
