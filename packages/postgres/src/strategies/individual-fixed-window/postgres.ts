import { TABLE, buildKey, buildResult, parseIndividualRow } from './shared'

export function createPostgresCheck(sql: any, prefix: string, windowMs: number, limit: number) {
    return async function check(id: string) {
        const key = buildKey(prefix, id)
        const interval = `${windowMs} milliseconds`

        const rows = await sql`
            INSERT INTO ${sql(TABLE)} (key, count, window_start, expires_at)
            VALUES (${key}, 1, NOW(), NOW() + ${interval}::interval)
            ON CONFLICT (key) DO UPDATE SET
              window_start = CASE
                WHEN ${sql(TABLE)}.window_start < NOW() - ${interval}::interval
                THEN NOW() ELSE ${sql(TABLE)}.window_start
              END,
              count = CASE
                WHEN ${sql(TABLE)}.window_start < NOW() - ${interval}::interval
                THEN 1
                WHEN ${sql(TABLE)}.count <= ${limit} THEN ${sql(TABLE)}.count + 1
                ELSE ${sql(TABLE)}.count
              END,
              expires_at = CASE
                WHEN ${sql(TABLE)}.window_start < NOW() - ${interval}::interval
                THEN NOW() + ${interval}::interval
                ELSE ${sql(TABLE)}.expires_at
              END
            RETURNING count, window_start, expires_at
        `
        const { count, windowStartMs } = parseIndividualRow(rows[0]!)
        return buildResult(count, windowStartMs, windowMs, limit)
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
        const interval = `${windowMs} milliseconds`

        const rows = await sql`
            WITH input AS (
              SELECT unnest(${keys}::text[]) AS key
            ),
            upserts AS (
              INSERT INTO ${sql(TABLE)} (key, count, window_start, expires_at)
              SELECT key, 1, NOW(), NOW() + ${interval}::interval
              FROM input
              ON CONFLICT (key) DO UPDATE SET
                window_start = CASE
                  WHEN ${sql(TABLE)}.window_start < NOW() - ${interval}::interval
                  THEN NOW() ELSE ${sql(TABLE)}.window_start
                END,
                count = CASE
                  WHEN ${sql(TABLE)}.window_start < NOW() - ${interval}::interval
                  THEN 1
                  WHEN ${sql(TABLE)}.count <= ${limit} THEN ${sql(TABLE)}.count + 1
                  ELSE ${sql(TABLE)}.count
                END,
                expires_at = CASE
                  WHEN ${sql(TABLE)}.window_start < NOW() - ${interval}::interval
                  THEN NOW() + ${interval}::interval
                  ELSE ${sql(TABLE)}.expires_at
                END
              RETURNING key, count, window_start, expires_at
            )
            SELECT * FROM upserts
        `
        type BatchRow = { key: string; count: number; window_start: string; expires_at: string }
        const rowMap = new Map<string, BatchRow>(rows.map((r: any) => [r.key, r]))
        return keys.map(key => {
            const { count, windowStartMs } = parseIndividualRow(rowMap.get(key)!)
            return buildResult(count, windowStartMs, windowMs, limit)
        })
    }
}
