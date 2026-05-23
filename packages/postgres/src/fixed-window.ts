import {
    type CacheConfig,
    type CircuitBreakerConfig,
    type ErrorPolicy,
    type FixedWindowOptions,
    type FixedWindowResult,
    type Limiter,
    type RetryConfig,
    validateFixedWindowOptions,
    withCache,
    withCircuitBreaker,
    withErrorPolicy,
    withRetry,
} from '@ratelock/core'
import { startAutoCleanup } from './cleanup'
import { createConnection } from './drivers'
import { runMigrations } from './migrations'

const TABLE = 'ratelock.fixed_window'

export type FixedWindowLimiterConfig = FixedWindowOptions & {
    sql?: unknown
    pool?: unknown
    connectionString?: string
    driver?: 'postgres' | 'pg'
    skipMigrations?: boolean
    unlogged?: boolean
    prefix?: string
    cache?: CacheConfig
    retry?: RetryConfig
    circuitBreaker?: CircuitBreakerConfig
    errorPolicy?: ErrorPolicy
}

export async function createFixedWindowLimiter(
    config: FixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    validateFixedWindowOptions(config)
    const { limit, windowMs, prefix = 'fw', skipMigrations = false } = config
    const conn = await createConnection(config)
    const drv = conn.driver

    if (!skipMigrations) await runMigrations(drv, { unlogged: config.unlogged })
    const cleanupHandle = startAutoCleanup(drv)

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const key = `${prefix}:${id}`
            const rows = await drv.query<{ count: number; expires_at: string }>(
                `INSERT INTO ${TABLE} (key, count, expires_at)
         VALUES ($1, 1, to_timestamp((floor((extract(epoch from now()) * 1000) / $2) * $2 + $2) / 1000.0))
         ON CONFLICT (key) DO UPDATE SET
           count = CASE
             WHEN ${TABLE}.expires_at <= NOW() THEN 1
             ELSE ${TABLE}.count + 1
           END,
           expires_at = CASE
             WHEN ${TABLE}.expires_at <= NOW() THEN to_timestamp((floor((extract(epoch from now()) * 1000) / $2) * $2 + $2) / 1000.0)
             ELSE ${TABLE}.expires_at
           END
         RETURNING count, expires_at`,
                [key, windowMs]
            )

            const row = rows[0]!
            const count = row.count
            const expiresAt = new Date(row.expires_at).getTime()

            return {
                allowed: count <= limit,
                remaining: Math.max(0, limit - count),
                reset: expiresAt,
            }
        },

        async checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
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
    if (config.errorPolicy) limiter = withErrorPolicy(limiter, config.errorPolicy)

    return limiter
}
