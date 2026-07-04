import type { PgDriver } from '../../drivers/types'
import { TABLE, buildKey, computeNextWindowStartMs, parseBatchRow, parseRow } from './shared'

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

export function createPgCheck(drv: PgDriver, prefix: string, windowMs: number, limit: number) {
    return async function check(id: string) {
        const key = buildKey(prefix, id)
        const nextWindowStartMs = computeNextWindowStartMs(windowMs)
        const rows = await drv.query<{ count: number; reset_ms: string | number }>(sqlCheck, [
            key,
            nextWindowStartMs,
            limit,
        ])
        const { count, resetMs } = parseRow(rows[0]!)
        return {
            allowed: count <= limit,
            remaining: Math.max(0, limit - count),
            reset: resetMs,
        }
    }
}

export function createPgCheckBatch(drv: PgDriver, prefix: string, windowMs: number, limit: number) {
    return async function checkBatch(ids: string[]) {
        if (ids.length === 0) return []
        const keys = ids.map(id => buildKey(prefix, id))
        if (new Set(keys).size !== keys.length) {
            const check = createPgCheck(drv, prefix, windowMs, limit)
            return Promise.all(ids.map(id => check(id)))
        }
        const nextWindowStartMs = computeNextWindowStartMs(windowMs)
        const rows = await drv.query<{
            key: string
            count: number
            reset_ms: string | number
        }>(sqlCheckBatch, [keys, nextWindowStartMs, limit])
        const rowMap = new Map(rows.map(r => [r.key, parseBatchRow(r)]))
        return keys.map(key => {
            const row = rowMap.get(key)!
            return {
                allowed: row.count <= limit,
                remaining: Math.max(0, limit - row.count),
                reset: row.resetMs,
            }
        })
    }
}
