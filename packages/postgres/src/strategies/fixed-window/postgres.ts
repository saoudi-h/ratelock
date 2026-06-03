import { TABLE, buildKey, computeNextWindowStartMs, parseBatchRow, parseRow } from './shared'

export function createPostgresCheck(sql: any, prefix: string, windowMs: number, limit: number) {
    return async function check(id: string) {
        const key = buildKey(prefix, id)
        const nextWindowStartMs = computeNextWindowStartMs(windowMs)

        const rows = await sql`
            INSERT INTO ${sql(TABLE)} (key, count, expires_at)
            VALUES (${key}, 1, to_timestamp(${nextWindowStartMs} / 1000.0))
            ON CONFLICT (key) DO UPDATE SET
              count = CASE
                WHEN ${sql(TABLE)}.expires_at <= NOW() THEN 1
                WHEN ${sql(TABLE)}.count <= ${limit} THEN ${sql(TABLE)}.count + 1
                ELSE ${sql(TABLE)}.count
              END,
              expires_at = CASE
                WHEN ${sql(TABLE)}.expires_at <= NOW() THEN to_timestamp(${nextWindowStartMs} / 1000.0)
                ELSE ${sql(TABLE)}.expires_at
              END
            RETURNING count, (extract(epoch from expires_at) * 1000)::bigint as reset_ms
        `

        const { count, resetMs } = parseRow(rows[0]!)
        return {
            allowed: count <= limit,
            remaining: Math.max(0, limit - count),
            reset: resetMs,
        }
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
        const nextWindowStartMs = computeNextWindowStartMs(windowMs)

        const rows = await sql`
            WITH input AS (
              SELECT unnest(${keys}::text[]) AS key
            ),
            upserts AS (
              INSERT INTO ${sql(TABLE)} (key, count, expires_at)
              SELECT key, 1, to_timestamp(${nextWindowStartMs} / 1000.0)
              FROM input
              ON CONFLICT (key) DO UPDATE SET
                count = CASE
                  WHEN ${sql(TABLE)}.expires_at <= NOW() THEN 1
                  WHEN ${sql(TABLE)}.count <= ${limit} THEN ${sql(TABLE)}.count + 1
                  ELSE ${sql(TABLE)}.count
                END,
                expires_at = CASE
                  WHEN ${sql(TABLE)}.expires_at <= NOW() THEN to_timestamp(${nextWindowStartMs} / 1000.0)
                  ELSE ${sql(TABLE)}.expires_at
                END
              RETURNING key, count, (extract(epoch from expires_at) * 1000)::bigint as reset_ms
            )
            SELECT * FROM upserts
        `

        type BatchRow = { key: string; count: number; resetMs: number }
        const rowMap = new Map<string, BatchRow>(rows.map((r: any) => [r.key, parseBatchRow(r)]))
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
