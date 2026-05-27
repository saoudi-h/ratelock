import {
    type FixedWindowOptions,
    type FixedWindowResult,
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

const TABLE = 'ratelock.fixed_window'

export type FixedWindowLimiterConfig = FixedWindowOptions & PostgresLimiterBaseConfig

export async function fixedWindow(
    config: FixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    validateFixedWindowOptions(config)
    const { limit, windowMs, prefix = 'fw', skipMigrations = false } = config
    const conn = await createConnection(config)
    const drv = conn.driver

    if (!skipMigrations) await runMigrations(drv, { unlogged: config.unlogged })
    const cleanupHandle = startAutoCleanup(drv)

    const sqlCheck = `INSERT INTO ${TABLE} (key, count, expires_at)
                 VALUES ($1, 1, to_timestamp((floor((extract(epoch from now()) * 1000) / $2) * $2 + $2) / 1000.0))
                 ON CONFLICT (key) DO UPDATE SET
                   count = CASE
                     WHEN ${TABLE}.expires_at <= NOW() THEN 1
                     WHEN ${TABLE}.count <= $3 THEN ${TABLE}.count + 1
                     ELSE ${TABLE}.count
                   END,
                   expires_at = CASE
                     WHEN ${TABLE}.expires_at <= NOW() THEN to_timestamp((floor((extract(epoch from now()) * 1000) / $2) * $2 + $2) / 1000.0)
                     ELSE ${TABLE}.expires_at
                   END
                 RETURNING count, expires_at`

    const sqlCheckBatch = `WITH input AS (
                   SELECT unnest($1::text[]) AS key
                 ),
                 upserts AS (
                   INSERT INTO ${TABLE} (key, count, expires_at)
                   SELECT key, 1, to_timestamp((floor((extract(epoch from now()) * 1000) / $2) * $2 + $2) / 1000.0)
                   FROM input
                   ON CONFLICT (key) DO UPDATE SET
                     count = CASE
                       WHEN ${TABLE}.expires_at <= NOW() THEN 1
                       WHEN ${TABLE}.count <= $3 THEN ${TABLE}.count + 1
                       ELSE ${TABLE}.count
                     END,
                     expires_at = CASE
                       WHEN ${TABLE}.expires_at <= NOW() THEN to_timestamp((floor((extract(epoch from now()) * 1000) / $2) * $2 + $2) / 1000.0)
                       ELSE ${TABLE}.expires_at
                     END
                   RETURNING key, count, expires_at
                 )
                 SELECT * FROM upserts`

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const key = `${prefix}:${id}`
            const rows = await drv.query<{ count: number; expires_at: string }>(
                sqlCheck,
                [key, windowMs, limit]
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
            if (ids.length === 0) return []
            const keys = ids.map(id => `${prefix}:${id}`)
            
            const rows = await drv.query<{ key: string, count: number; expires_at: string }>(
                sqlCheckBatch,
                [keys, windowMs, limit]
            )

            const rowMap = new Map(rows.map(r => [r.key, r]))
            return keys.map(key => {
                const row = rowMap.get(key)!
                const count = row.count
                const expiresAt = new Date(row.expires_at).getTime()
                return {
                    allowed: count <= limit,
                    remaining: Math.max(0, limit - count),
                    reset: expiresAt,
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
