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

    // The next window boundary is pre-computed in JS so the CASE branches don't
    // have to recompute EXTRACT(EPOCH FROM NOW()) * 1000 + floor() + multiply on
    // every UPSERT. The cast to_timestamp($2 / 1000.0) is a single float→timestamptz
    // conversion; without the pre-compute, the same cast would be repeated in both
    // CASE reset branches. The expiration comparison still uses NOW() so it
    // remains authoritative on the database side, eliminating any clock-drift risk
    // between the application server and the database.
    const sqlCheck = `INSERT INTO ${TABLE} (key, count, expires_at)
                 VALUES ($1, 1, to_timestamp($2 / 1000.0))
                 ON CONFLICT (key) DO UPDATE SET
                   count = CASE
                     WHEN ${TABLE}.expires_at <= NOW() THEN 1
                     WHEN ${TABLE}.count <= $3 THEN ${TABLE}.count + 1
                     ELSE ${TABLE}.count
                   END,
                   expires_at = CASE
                     WHEN ${TABLE}.expires_at <= NOW() THEN to_timestamp($2 / 1000.0)
                     ELSE ${TABLE}.expires_at
                   END
                 RETURNING count, (extract(epoch from expires_at) * 1000)::bigint as reset_ms`

    const sqlCheckBatch = `WITH input AS (
                   SELECT unnest($1::text[]) AS key
                 ),
                 upserts AS (
                   INSERT INTO ${TABLE} (key, count, expires_at)
                   SELECT key, 1, to_timestamp($2 / 1000.0)
                   FROM input
                   ON CONFLICT (key) DO UPDATE SET
                     count = CASE
                       WHEN ${TABLE}.expires_at <= NOW() THEN 1
                       WHEN ${TABLE}.count <= $3 THEN ${TABLE}.count + 1
                       ELSE ${TABLE}.count
                     END,
                     expires_at = CASE
                       WHEN ${TABLE}.expires_at <= NOW() THEN to_timestamp($2 / 1000.0)
                       ELSE ${TABLE}.expires_at
                     END
                   RETURNING key, count, (extract(epoch from expires_at) * 1000)::bigint as reset_ms
                 )
                 SELECT * FROM upserts`

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const key = `${prefix}:${id}`
            const nextWindowStartMs = (Math.floor(Date.now() / windowMs) + 1) * windowMs
            const rows = await drv.query<{ count: number; reset_ms: string | number }>(sqlCheck, [
                key,
                nextWindowStartMs,
                limit,
            ])

            const row = rows[0]!
            const count = row.count
            const resetMs = typeof row.reset_ms === 'string' ? Number(row.reset_ms) : row.reset_ms

            return {
                allowed: count <= limit,
                remaining: Math.max(0, limit - count),
                reset: resetMs,
            }
        },

        async checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
            if (ids.length === 0) return []
            const keys = ids.map(id => `${prefix}:${id}`)
            const nextWindowStartMs = (Math.floor(Date.now() / windowMs) + 1) * windowMs
            const rows = await drv.query<{
                key: string
                count: number
                reset_ms: string | number
            }>(sqlCheckBatch, [keys, nextWindowStartMs, limit])

            const rowMap = new Map(rows.map(r => [r.key, r]))
            return keys.map(key => {
                const row = rowMap.get(key)!
                const count = row.count
                const resetMs =
                    typeof row.reset_ms === 'string' ? Number(row.reset_ms) : row.reset_ms
                return {
                    allowed: count <= limit,
                    remaining: Math.max(0, limit - count),
                    reset: resetMs,
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
