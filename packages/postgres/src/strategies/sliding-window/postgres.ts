import { TABLE, buildKey, buildResult, parseSlidingRow } from './shared'

export function createPostgresCheck(sql: any, prefix: string, windowMs: number, limit: number) {
    return async function check(id: string) {
        const key = buildKey(prefix, id)
        const nowMs = Date.now()
        const currentWindowStartMs = Math.floor(nowMs / windowMs) * windowMs
        const prevWindowStartMs = currentWindowStartMs - windowMs
        const expiresAtMs = currentWindowStartMs + windowMs * 2

        const rows = await sql`
            INSERT INTO ${sql(TABLE)} (key, current_count, previous_count, window_start, expires_at)
            VALUES (${key}, 1, 0, to_timestamp(${currentWindowStartMs} / 1000.0), to_timestamp(${expiresAtMs} / 1000.0))
            ON CONFLICT (key) DO UPDATE SET
              previous_count = CASE
                WHEN ${sql(TABLE)}.window_start < to_timestamp(${prevWindowStartMs} / 1000.0) THEN 0
                WHEN ${sql(TABLE)}.window_start < to_timestamp(${currentWindowStartMs} / 1000.0) THEN ${sql(TABLE)}.current_count
                ELSE ${sql(TABLE)}.previous_count
              END,
              current_count = CASE
                WHEN ${sql(TABLE)}.window_start < to_timestamp(${currentWindowStartMs} / 1000.0) THEN 1
                WHEN (${sql(TABLE)}.previous_count * (1.0 - (extract(epoch from (NOW() - ${sql(TABLE)}.window_start)) * 1000.0 / ${windowMs})) + ${sql(TABLE)}.current_count) < ${limit}
                THEN ${sql(TABLE)}.current_count + 1
                WHEN ${sql(TABLE)}.current_count < ${limit} + 1 THEN ${sql(TABLE)}.current_count + 1
                ELSE ${sql(TABLE)}.current_count
              END,
              window_start = CASE
                WHEN ${sql(TABLE)}.window_start < to_timestamp(${currentWindowStartMs} / 1000.0) THEN to_timestamp(${currentWindowStartMs} / 1000.0)
                ELSE ${sql(TABLE)}.window_start
              END,
              expires_at = to_timestamp(${expiresAtMs} / 1000.0)
            RETURNING current_count, previous_count,
              (extract(epoch from window_start) * 1000)::bigint as window_start_ms
        `
        const { currentCount, previousCount, windowStart } = parseSlidingRow(rows[0]!)
        return buildResult(currentCount, previousCount, windowStart, windowMs, limit, nowMs)
    }
}

export function createPostgresCheckBatch(
    sql: any,
    prefix: string,
    windowMs: number,
    limit: number
) {
    return async function checkBatch(ids: string[]) {
        if (ids.length === 0) return []
        const keys = ids.map(id => buildKey(prefix, id))
        if (new Set(keys).size !== keys.length) {
            const check = createPostgresCheck(sql, prefix, windowMs, limit)
            return Promise.all(ids.map(id => check(id)))
        }
        const nowMs = Date.now()
        const currentWindowStartMs = Math.floor(nowMs / windowMs) * windowMs
        const prevWindowStartMs = currentWindowStartMs - windowMs
        const expiresAtMs = currentWindowStartMs + windowMs * 2

        const rows = await sql`
            WITH input AS (
              SELECT unnest(${keys}::text[]) AS key
            ),
            upserts AS (
              INSERT INTO ${sql(TABLE)} (key, current_count, previous_count, window_start, expires_at)
              SELECT key, 1, 0, to_timestamp(${currentWindowStartMs} / 1000.0), to_timestamp(${expiresAtMs} / 1000.0)
              FROM input
              ON CONFLICT (key) DO UPDATE SET
                previous_count = CASE
                  WHEN ${sql(TABLE)}.window_start < to_timestamp(${prevWindowStartMs} / 1000.0) THEN 0
                  WHEN ${sql(TABLE)}.window_start < to_timestamp(${currentWindowStartMs} / 1000.0) THEN ${sql(TABLE)}.current_count
                  ELSE ${sql(TABLE)}.previous_count
                END,
                current_count = CASE
                  WHEN ${sql(TABLE)}.window_start < to_timestamp(${currentWindowStartMs} / 1000.0) THEN 1
                  WHEN (${sql(TABLE)}.previous_count * (1.0 - (extract(epoch from (NOW() - ${sql(TABLE)}.window_start)) * 1000.0 / ${windowMs})) + ${sql(TABLE)}.current_count) < ${limit}
                  THEN ${sql(TABLE)}.current_count + 1
                  WHEN ${sql(TABLE)}.current_count < ${limit} + 1 THEN ${sql(TABLE)}.current_count + 1
                  ELSE ${sql(TABLE)}.current_count
                END,
                window_start = CASE
                  WHEN ${sql(TABLE)}.window_start < to_timestamp(${currentWindowStartMs} / 1000.0) THEN to_timestamp(${currentWindowStartMs} / 1000.0)
                  ELSE ${sql(TABLE)}.window_start
                END,
                expires_at = to_timestamp(${expiresAtMs} / 1000.0)
              RETURNING key, current_count, previous_count,
                (extract(epoch from window_start) * 1000)::bigint as window_start_ms
            )
            SELECT * FROM upserts
        `
        type BatchRow = {
            key: string
            current_count: number
            previous_count: number
            window_start_ms: string | number
        }
        const rowMap = new Map<string, BatchRow>(rows.map((r: any) => [r.key, r]))
        return keys.map(key => {
            const { currentCount, previousCount, windowStart } = parseSlidingRow(rowMap.get(key)!)
            return buildResult(currentCount, previousCount, windowStart, windowMs, limit, nowMs)
        })
    }
}
