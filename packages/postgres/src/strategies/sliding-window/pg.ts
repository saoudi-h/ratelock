import type { PgDriver } from '../../drivers/types'
import { TABLE, buildKey, buildResult, parseSlidingRow } from './shared'

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
                 WHEN ${TABLE}.current_count < $7 + 1 THEN ${TABLE}.current_count + 1
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
                       WHEN ${TABLE}.current_count < $7 + 1 THEN ${TABLE}.current_count + 1
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

export function createPgCheck(drv: PgDriver, prefix: string, windowMs: number, limit: number) {
    return async function check(id: string) {
        const key = buildKey(prefix, id)
        const nowMs = Date.now()
        const currentWindowStartMs = Math.floor(nowMs / windowMs) * windowMs
        const prevWindowStartMs = currentWindowStartMs - windowMs
        const expiresAtMs = currentWindowStartMs + windowMs * 2

        const rows = await drv.query<{
            current_count: number
            previous_count: number
            window_start_ms: string | number
        }>(sqlCheck, [
            key,
            currentWindowStartMs,
            expiresAtMs,
            prevWindowStartMs,
            currentWindowStartMs,
            windowMs,
            limit,
        ])
        const { currentCount, previousCount, windowStart } = parseSlidingRow(rows[0]!)
        return buildResult(currentCount, previousCount, windowStart, windowMs, limit, nowMs)
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
        const nowMs = Date.now()
        const currentWindowStartMs = Math.floor(nowMs / windowMs) * windowMs
        const prevWindowStartMs = currentWindowStartMs - windowMs
        const expiresAtMs = currentWindowStartMs + windowMs * 2

        const rows = await drv.query<{
            key: string
            current_count: number
            previous_count: number
            window_start_ms: string | number
        }>(sqlCheckBatch, [
            keys,
            currentWindowStartMs,
            expiresAtMs,
            prevWindowStartMs,
            currentWindowStartMs,
            windowMs,
            limit,
        ])
        const rowMap = new Map(rows.map(r => [r.key, parseSlidingRow(r)]))
        return keys.map(key => {
            const { currentCount, previousCount, windowStart } = rowMap.get(key)!
            return buildResult(currentCount, previousCount, windowStart, windowMs, limit, nowMs)
        })
    }
}
