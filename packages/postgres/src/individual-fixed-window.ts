import {
    type FixedWindowResult,
    type IndividualFixedWindowOptions,
    type Limiter,
    validateFixedWindowOptions,
    withCache,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'
import { startAutoCleanup } from './cleanup'
import { createConnection } from './drivers'
import { runMigrations } from './migrations'
import type { PostgresLimiterBaseConfig } from './types'

const TABLE = 'ratelock.individual_fixed_window'

export type IndividualFixedWindowLimiterConfig = IndividualFixedWindowOptions &
    PostgresLimiterBaseConfig

export async function individualFixedWindow(
    config: IndividualFixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    validateFixedWindowOptions(config)
    const { limit, windowMs, prefix = 'ifw', skipMigrations = false } = config
    const conn = await createConnection(config)
    const drv = conn.driver

    if (!skipMigrations) await runMigrations(drv, { unlogged: config.unlogged })
    const cleanupHandle = startAutoCleanup(drv)

    const sqlCheck = `INSERT INTO ${TABLE} (key, count, window_start, expires_at)
                 VALUES ($1, 1, NOW(), NOW() + $2::interval)
                 ON CONFLICT (key) DO UPDATE SET
                   window_start = CASE
                     WHEN ${TABLE}.window_start < NOW() - $2::interval
                     THEN NOW() ELSE ${TABLE}.window_start
                   END,
                   count = CASE
                     WHEN ${TABLE}.window_start < NOW() - $2::interval
                     THEN 1
                     WHEN ${TABLE}.count <= $3 THEN ${TABLE}.count + 1
                     ELSE ${TABLE}.count
                   END,
                   expires_at = CASE
                     WHEN ${TABLE}.window_start < NOW() - $2::interval
                     THEN NOW() + $2::interval
                     ELSE ${TABLE}.expires_at
                   END
                 RETURNING count, window_start, expires_at`

    const sqlCheckBatch = `WITH input AS (
                   SELECT unnest($1::text[]) AS key
                 ),
                 upserts AS (
                   INSERT INTO ${TABLE} (key, count, window_start, expires_at)
                   SELECT key, 1, NOW(), NOW() + $2::interval
                   FROM input
                   ON CONFLICT (key) DO UPDATE SET
                     window_start = CASE
                       WHEN ${TABLE}.window_start < NOW() - $2::interval
                       THEN NOW() ELSE ${TABLE}.window_start
                     END,
                     count = CASE
                       WHEN ${TABLE}.window_start < NOW() - $2::interval
                       THEN 1
                       WHEN ${TABLE}.count <= $3 THEN ${TABLE}.count + 1
                       ELSE ${TABLE}.count
                     END,
                     expires_at = CASE
                       WHEN ${TABLE}.window_start < NOW() - $2::interval
                       THEN NOW() + $2::interval
                       ELSE ${TABLE}.expires_at
                     END
                   RETURNING key, count, window_start, expires_at
                 )
                 SELECT * FROM upserts`

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const key = `${prefix}:${id}`

            type Row = { count: number; window_start: string; expires_at: string }

            const rows = await drv.query<Row>(
                sqlCheck,
                [key, `${windowMs} milliseconds`, limit]
            )

            const row = rows[0]!
            const count = row.count
            const windowStart = new Date(row.window_start).getTime()

            return {
                allowed: count <= limit,
                remaining: Math.max(0, limit - count),
                reset: windowStart + windowMs,
            }
        },

        async checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
            if (ids.length === 0) return []
            const keys = ids.map(id => `${prefix}:${id}`)
            
            type Row = { key: string; count: number; window_start: string; expires_at: string }
            
            const rows = await drv.query<Row>(
                sqlCheckBatch,
                [keys, `${windowMs} milliseconds`, limit]
            )

            const rowMap = new Map(rows.map(r => [r.key, r]))
            return keys.map(key => {
                const row = rowMap.get(key)!
                const count = row.count
                const windowStart = new Date(row.window_start).getTime()
                return {
                    allowed: count <= limit,
                    remaining: Math.max(0, limit - count),
                    reset: windowStart + windowMs,
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
