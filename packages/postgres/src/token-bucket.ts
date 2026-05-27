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

    const sqlCheck = `WITH existing AS (
                   SELECT key, tokens, capacity, refill_rate, last_refill,
                     (LEAST(capacity, tokens + ($2 - last_refill) * refill_rate) >= 1) as allowed
                   FROM ${TABLE} WHERE key = $1 FOR UPDATE
                 ),
                 inserted AS (
                   INSERT INTO ${TABLE} (key, tokens, last_refill, capacity, refill_rate, expires_at)
                   SELECT $1, $3 - 1, $2, $3, $4, TO_TIMESTAMP($2) + '1 hour'::interval
                   WHERE NOT EXISTS (SELECT 1 FROM existing)
                   ON CONFLICT (key) DO NOTHING
                   RETURNING tokens, capacity, refill_rate, last_refill, true as allowed
                 ),
                 updates AS (
                   UPDATE ${TABLE} t
                   SET
                     tokens = CASE WHEN e.allowed THEN LEAST(t.capacity, t.tokens + ($2 - t.last_refill) * t.refill_rate) - 1 ELSE LEAST(t.capacity, t.tokens + ($2 - t.last_refill) * t.refill_rate) END,
                     last_refill = CASE WHEN e.allowed THEN $2 ELSE t.last_refill END,
                     expires_at = TO_TIMESTAMP($2) + '1 hour'::interval
                   FROM existing e
                   WHERE t.key = $1
                   RETURNING t.tokens, t.capacity, t.refill_rate, t.last_refill, e.allowed
                 )
                 SELECT * FROM inserted UNION ALL SELECT * FROM updates`

    const sqlCheckBatch = `WITH input AS (
                   SELECT unnest($1::text[]) AS key
                 ),
                 existing AS (
                   SELECT t.key, t.tokens, t.capacity, t.refill_rate, t.last_refill,
                     (LEAST(t.capacity, t.tokens + ($2 - t.last_refill) * t.refill_rate) >= 1) as allowed
                   FROM ${TABLE} t JOIN input i ON t.key = i.key
                   FOR UPDATE
                 ),
                 inserted AS (
                   INSERT INTO ${TABLE} (key, tokens, last_refill, capacity, refill_rate, expires_at)
                   SELECT i.key, $3 - 1, $2, $3, $4, TO_TIMESTAMP($2) + '1 hour'::interval
                   FROM input i
                   WHERE NOT EXISTS (SELECT 1 FROM existing e WHERE e.key = i.key)
                   ON CONFLICT (key) DO NOTHING
                   RETURNING key, tokens, capacity, refill_rate, last_refill, true as allowed
                 ),
                 updates AS (
                   UPDATE ${TABLE} t
                   SET
                     tokens = CASE WHEN e.allowed THEN LEAST(t.capacity, t.tokens + ($2 - t.last_refill) * t.refill_rate) - 1 ELSE LEAST(t.capacity, t.tokens + ($2 - t.last_refill) * t.refill_rate) END,
                     last_refill = CASE WHEN e.allowed THEN $2 ELSE t.last_refill END,
                     expires_at = TO_TIMESTAMP($2) + '1 hour'::interval
                   FROM existing e
                   WHERE t.key = e.key
                   RETURNING t.key, t.tokens, t.capacity, t.refill_rate, t.last_refill, e.allowed
                 )
                 SELECT * FROM inserted UNION ALL SELECT * FROM updates`

    let limiter: Limiter<TokenBucketResult> = {
        async check(id: string): Promise<TokenBucketResult> {
            const key = `${prefix}:${id}`
            const now = Date.now() / 1000

            const rows = await drv.query<{
                tokens: number
                capacity: number
                refill_rate: number
                last_refill: number
                allowed: boolean | number
            }>(
                sqlCheck,
                [key, now, capacity, refillRate]
            )

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
        },

        async checkBatch(ids: string[]): Promise<TokenBucketResult[]> {
            if (ids.length === 0) return []
            const keys = ids.map(id => `${prefix}:${id}`)
            const now = Date.now() / 1000

            const rows = await drv.query<{ key: string, tokens: number; capacity: number; refill_rate: number; last_refill: number; allowed: boolean | number }>(
                sqlCheckBatch,
                [keys, now, capacity, refillRate]
            )

            const rowMap = new Map(rows.map(r => [r.key, r]))
            return keys.map(key => {
                const r = rowMap.get(key)!
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
            })
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
