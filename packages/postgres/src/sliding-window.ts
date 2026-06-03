import {
    type Limiter,
    type SlidingWindowOptions,
    type SlidingWindowResult,
    validateSlidingWindowOptions,
    withCache,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'
import { startAutoCleanup } from './cleanup'
import { createConnection } from './drivers'
import { runMigrations } from './migrations'
import type { PostgresLimiterBaseConfig } from './types'

const TABLE = 'ratelock.sliding_window'

export type SlidingWindowLimiterConfig = SlidingWindowOptions & PostgresLimiterBaseConfig

export async function slidingWindow(
    config: SlidingWindowLimiterConfig
): Promise<Limiter<SlidingWindowResult>> {
    validateSlidingWindowOptions(config)
    const { limit, windowMs, prefix = 'sw', skipMigrations = false } = config
    const conn = await createConnection(config)
    const drv = conn.driver

    if (!skipMigrations) await runMigrations(drv, { unlogged: config.unlogged })
    const cleanupHandle = startAutoCleanup(drv)

    // The previous and current window boundaries are pre-computed in JS so the
    // CASE branches don't have to recompute EXTRACT(EPOCH FROM NOW()) + math
    // on every UPSERT. The windowMs is still passed to SQL for the weighted
    // previous_count interpolation in the limit check. Expiration comparison
    // still uses NOW() so it remains authoritative on the database side,
    // eliminating any clock-drift risk between the application server and the
    // database.
    const sqlCheck = `INSERT INTO ${TABLE} (key, current_count, previous_count, window_start, expires_at)
                 VALUES ($1, 1, 0, to_timestamp($2 / 1000.0), to_timestamp($3 / 1000.0))
                 ON CONFLICT (key) DO UPDATE SET
                   previous_count = CASE
                     WHEN ${TABLE}.window_start < to_timestamp($4 / 1000.0) THEN 0
                     WHEN ${TABLE}.window_start < to_timestamp($5 / 1000.0) THEN ${TABLE}.current_count
                     ELSE ${TABLE}.previous_count
                   END,
                   current_count = CASE
                     WHEN ${TABLE}.window_start < to_timestamp($5 / 1000.0) THEN 1
                     WHEN (${TABLE}.previous_count * (1.0 - (extract(epoch from (NOW() - ${TABLE}.window_start)) * 1000.0 / $6)) + ${TABLE}.current_count) < $7
                     THEN ${TABLE}.current_count + 1
                     ELSE ${TABLE}.current_count
                   END,
                   window_start = CASE
                     WHEN ${TABLE}.window_start < to_timestamp($5 / 1000.0) THEN to_timestamp($2 / 1000.0)
                     ELSE ${TABLE}.window_start
                   END,
                   expires_at = to_timestamp($3 / 1000.0)
                 RETURNING current_count, previous_count,
                   (extract(epoch from window_start) * 1000)::bigint as window_start_ms`

    const sqlCheckBatch = `WITH input AS (
                   SELECT unnest($1::text[]) AS key
                 ),
                 upserts AS (
                   INSERT INTO ${TABLE} (key, current_count, previous_count, window_start, expires_at)
                   SELECT key, 1, 0, to_timestamp($2 / 1000.0), to_timestamp($3 / 1000.0)
                   FROM input
                   ON CONFLICT (key) DO UPDATE SET
                     previous_count = CASE
                       WHEN ${TABLE}.window_start < to_timestamp($4 / 1000.0) THEN 0
                       WHEN ${TABLE}.window_start < to_timestamp($5 / 1000.0) THEN ${TABLE}.current_count
                       ELSE ${TABLE}.previous_count
                     END,
                     current_count = CASE
                       WHEN ${TABLE}.window_start < to_timestamp($5 / 1000.0) THEN 1
                       WHEN (${TABLE}.previous_count * (1.0 - (extract(epoch from (NOW() - ${TABLE}.window_start)) * 1000.0 / $6)) + ${TABLE}.current_count) < $7
                       THEN ${TABLE}.current_count + 1
                       ELSE ${TABLE}.current_count
                     END,
                     window_start = CASE
                       WHEN ${TABLE}.window_start < to_timestamp($5 / 1000.0) THEN to_timestamp($2 / 1000.0)
                       ELSE ${TABLE}.window_start
                     END,
                     expires_at = to_timestamp($3 / 1000.0)
                   RETURNING key, current_count, previous_count,
                     (extract(epoch from window_start) * 1000)::bigint as window_start_ms
                 )
                 SELECT * FROM upserts`

    let limiter: Limiter<SlidingWindowResult> = {
        async check(id: string): Promise<SlidingWindowResult> {
            const key = `${prefix}:${id}`
            const nowMs = Date.now()
            const currentWindowStartMs = Math.floor(nowMs / windowMs) * windowMs
            const prevWindowStartMs = currentWindowStartMs - windowMs
            const expiresAtMs = currentWindowStartMs + windowMs * 2

            type Row = {
                current_count: number
                previous_count: number
                window_start_ms: string | number
            }

            const rows = await drv.query<Row>(sqlCheck, [
                key,
                currentWindowStartMs,
                expiresAtMs,
                prevWindowStartMs,
                currentWindowStartMs,
                windowMs,
                limit,
            ])

            const row = rows[0]!
            const windowStart =
                typeof row.window_start_ms === 'string'
                    ? Number(row.window_start_ms)
                    : row.window_start_ms
            const elapsed = (nowMs - windowStart) / windowMs
            const estimated = row.previous_count * (1 - elapsed) + row.current_count
            const count = Math.ceil(estimated)
            const allowed = count <= limit

            return {
                allowed,
                remaining: Math.max(0, limit - count),
                reset: windowStart + windowMs * 2,
                windowStart,
                windowEnd: windowStart + windowMs,
            }
        },

        async checkBatch(ids: string[]): Promise<SlidingWindowResult[]> {
            if (ids.length === 0) return []
            const keys = ids.map(id => `${prefix}:${id}`)
            const nowMs = Date.now()
            const currentWindowStartMs = Math.floor(nowMs / windowMs) * windowMs
            const prevWindowStartMs = currentWindowStartMs - windowMs
            const expiresAtMs = currentWindowStartMs + windowMs * 2

            type Row = {
                key: string
                current_count: number
                previous_count: number
                window_start_ms: string | number
            }

            const rows = await drv.query<Row>(sqlCheckBatch, [
                keys,
                currentWindowStartMs,
                expiresAtMs,
                prevWindowStartMs,
                currentWindowStartMs,
                windowMs,
                limit,
            ])

            const rowMap = new Map(rows.map(r => [r.key, r]))
            return keys.map(key => {
                const row = rowMap.get(key)!
                const windowStart =
                    typeof row.window_start_ms === 'string'
                        ? Number(row.window_start_ms)
                        : row.window_start_ms
                const elapsed = Math.max(0, (nowMs - windowStart) / windowMs)
                const estimated = row.previous_count * (1 - elapsed) + row.current_count
                const count = Math.ceil(estimated)
                const allowed = count <= limit
                return {
                    allowed,
                    remaining: Math.max(0, limit - count),
                    reset: windowStart + windowMs * 2,
                    windowStart,
                    windowEnd: windowStart + windowMs,
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
