import type { PgDriver } from '../../drivers/types'
import { TABLE, buildKey, buildResult, parseIndividualRow } from './shared'

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

export function createPgCheck(drv: PgDriver, prefix: string, windowMs: number, limit: number) {
    return async function check(id: string) {
        const key = buildKey(prefix, id)
        const rows = await drv.query<{ count: number; window_start: string; expires_at: string }>(
            sqlCheck,
            [key, `${windowMs} milliseconds`, limit]
        )
        const { count, windowStartMs } = parseIndividualRow(rows[0]!)
        return buildResult(count, windowStartMs, windowMs, limit)
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
        const rows = await drv.query<{
            key: string
            count: number
            window_start: string
            expires_at: string
        }>(sqlCheckBatch, [keys, `${windowMs} milliseconds`, limit])
        const rowMap = new Map(rows.map(r => [r.key, parseIndividualRow(r)]))
        return keys.map(key => {
            const { count, windowStartMs } = rowMap.get(key)!
            return buildResult(count, windowStartMs, windowMs, limit)
        })
    }
}
