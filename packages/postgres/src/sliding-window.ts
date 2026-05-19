import {
    type CacheConfig,
    type CircuitBreakerConfig,
    type ErrorPolicy,
    type Limiter,
    type RetryConfig,
    type SlidingWindowOptions,
    type SlidingWindowResult,
    validateSlidingWindowOptions,
    withCache,
    withCircuitBreaker,
    withErrorPolicy,
    withRetry,
} from '@ratelock/core'
import { startAutoCleanup } from './cleanup'
import { createConnection } from './drivers'
import { runMigrations } from './migrations'

const TABLE = 'ratelock.sliding_window'

export type SlidingWindowLimiterConfig = SlidingWindowOptions & {
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

export async function createSlidingWindowLimiter(
    config: SlidingWindowLimiterConfig
): Promise<Limiter<SlidingWindowResult>> {
    validateSlidingWindowOptions(config)
    const { limit, windowMs, prefix = 'sw', skipMigrations = false } = config
    const conn = await createConnection(config)
    const drv = conn.driver

    if (!skipMigrations) await runMigrations(drv, { unlogged: config.unlogged })
    const cleanupHandle = startAutoCleanup(drv)

    let limiter: Limiter<SlidingWindowResult> = {
        async check(id: string): Promise<SlidingWindowResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()

            type Row = {
                current_count: number
                previous_count: number
                window_start: string
            }

            const rows = await drv.query<Row>(
                `INSERT INTO ${TABLE} (key, current_count, previous_count, window_start, expires_at)
         VALUES ($1, 1, 0, NOW(), NOW() + $2::interval)
         ON CONFLICT (key) DO UPDATE SET
           previous_count = CASE
             WHEN ${TABLE}.window_start < NOW() - $3::interval
             THEN 0
             WHEN ${TABLE}.window_start < NOW() - $2::interval
             THEN ${TABLE}.current_count
             ELSE ${TABLE}.previous_count
           END,
           current_count = CASE
             WHEN ${TABLE}.window_start < NOW() - $2::interval
             THEN 1
             ELSE ${TABLE}.current_count + 1
           END,
           window_start = CASE
             WHEN ${TABLE}.window_start < NOW() - $2::interval
             THEN NOW()
             ELSE ${TABLE}.window_start
           END,
           expires_at = NOW() + $2::interval
         RETURNING current_count, previous_count, window_start`,
                [key, `${windowMs} milliseconds`, `${windowMs * 2} milliseconds`]
            )

            const row = rows[0]!
            const windowStart = new Date(row.window_start).getTime()
            const elapsed = (now - windowStart) / windowMs
            const estimated = row.previous_count * (1 - elapsed) + row.current_count
            const count = Math.ceil(estimated)
            const allowed = count <= limit

            return {
                allowed,
                remaining: Math.max(0, limit - count),
                reset: windowStart + windowMs + windowMs,
                windowStart,
                windowEnd: windowStart + windowMs,
            }
        },

        async checkBatch(ids: string[]): Promise<SlidingWindowResult[]> {
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
