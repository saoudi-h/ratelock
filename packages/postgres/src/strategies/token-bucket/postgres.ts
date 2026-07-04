import { TABLE, buildKey, buildResult, parseTokenRow } from './shared'

export function createPostgresCheck(
    sql: any,
    prefix: string,
    capacity: number,
    refillRate: number
) {
    return async function check(id: string) {
        const key = buildKey(prefix, id)
        const now = Date.now() / 1000

        const rows = await sql`
            WITH existing AS (
              SELECT key, tokens, capacity, refill_rate, last_refill,
                (LEAST(capacity, tokens + (${now} - last_refill) * refill_rate) >= 1) as allowed
              FROM ${sql(TABLE)} WHERE key = ${key} FOR UPDATE
            ),
            inserted AS (
              INSERT INTO ${sql(TABLE)} (key, tokens, last_refill, capacity, refill_rate, expires_at)
              SELECT ${key}, ${capacity} - 1, ${now}, ${capacity}, ${refillRate}, TO_TIMESTAMP(${now}) + '1 hour'::interval
              WHERE NOT EXISTS (SELECT 1 FROM existing)
              ON CONFLICT (key) DO NOTHING
              RETURNING tokens, capacity, refill_rate, last_refill, true as allowed
            ),
            updates AS (
              UPDATE ${sql(TABLE)} t
              SET
                tokens = CASE WHEN e.allowed THEN LEAST(t.capacity, t.tokens + (${now} - t.last_refill) * t.refill_rate) - 1 ELSE LEAST(t.capacity, t.tokens + (${now} - t.last_refill) * t.refill_rate) END,
                last_refill = CASE WHEN e.allowed THEN ${now} ELSE t.last_refill END,
                expires_at = TO_TIMESTAMP(${now}) + '1 hour'::interval
              FROM existing e
              WHERE t.key = ${key}
              RETURNING t.tokens, t.capacity, t.refill_rate, t.last_refill, e.allowed
            )
            SELECT * FROM inserted UNION ALL SELECT * FROM updates
        `

        const { tokens, rate, allowed } = parseTokenRow(rows[0]!)
        return buildResult(tokens, rate, allowed)
    }
}

export function createPostgresCheckBatch(
    sql: any,
    prefix: string,
    capacity: number,
    refillRate: number
) {
    return async function checkBatch(ids: string[]) {
        if (ids.length === 0) return []
        const keys = ids.map(id => buildKey(prefix, id))
        if (new Set(keys).size !== keys.length) {
            const check = createPostgresCheck(sql, prefix, capacity, refillRate)
            return Promise.all(ids.map(id => check(id)))
        }
        const now = Date.now() / 1000

        const rows = await sql`
            WITH input AS (
              SELECT unnest(${keys}::text[]) AS key
            ),
            existing AS (
              SELECT t.key, t.tokens, t.capacity, t.refill_rate, t.last_refill,
                (LEAST(t.capacity, t.tokens + (${now} - t.last_refill) * t.refill_rate) >= 1) as allowed
              FROM ${sql(TABLE)} t JOIN input i ON t.key = i.key
              FOR UPDATE
            ),
            inserted AS (
              INSERT INTO ${sql(TABLE)} (key, tokens, last_refill, capacity, refill_rate, expires_at)
              SELECT i.key, ${capacity} - 1, ${now}, ${capacity}, ${refillRate}, TO_TIMESTAMP(${now}) + '1 hour'::interval
              FROM input i
              WHERE NOT EXISTS (SELECT 1 FROM existing e WHERE e.key = i.key)
              ON CONFLICT (key) DO NOTHING
              RETURNING key, tokens, capacity, refill_rate, last_refill, true as allowed
            ),
            updates AS (
              UPDATE ${sql(TABLE)} t
              SET
                tokens = CASE WHEN e.allowed THEN LEAST(t.capacity, t.tokens + (${now} - t.last_refill) * t.refill_rate) - 1 ELSE LEAST(t.capacity, t.tokens + (${now} - t.last_refill) * t.refill_rate) END,
                last_refill = CASE WHEN e.allowed THEN ${now} ELSE t.last_refill END,
                expires_at = TO_TIMESTAMP(${now}) + '1 hour'::interval
              FROM existing e
              WHERE t.key = e.key
              RETURNING t.key, t.tokens, t.capacity, t.refill_rate, t.last_refill, e.allowed
            )
            SELECT * FROM inserted UNION ALL SELECT * FROM updates
        `

        type BatchRow = {
            key: string
            tokens: number
            capacity: number
            refill_rate: number
            last_refill: number
            allowed: boolean | number
        }
        const rowMap = new Map<string, BatchRow>(rows.map((r: any) => [r.key, r]))
        return keys.map(key => {
            const r = rowMap.get(key)!
            const { tokens, rate, allowed } = parseTokenRow(r)
            return buildResult(tokens, rate, allowed)
        })
    }
}
