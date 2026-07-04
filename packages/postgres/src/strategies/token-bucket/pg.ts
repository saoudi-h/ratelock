import type { PgDriver } from '../../drivers/types'
import { TABLE, buildKey, buildResult, parseTokenRow } from './shared'

const sqlCheck = `WITH existing AS (
                   SELECT key, tokens, capacity, refill_rate, last_refill,
                     (LEAST(capacity, tokens + ($2 - last_refill) * refill_rate) >= 1) as allowed
                   FROM ${TABLE} WHERE key = $1 FOR UPDATE
                 ),
                 inserted AS (
                   INSERT INTO ${TABLE} (key, tokens, last_refill, capacity, refill_rate, expires_at)
                   SELECT $1, $3 - 1, $2, $3, $4, TO_TIMESTAMP($2) + '1 hour'::interval
                   WHERE NOT EXISTS (SELECT 1 FROM existing)
                   ON CONFLICT (key) DO NOTHING
                   RETURNING tokens, capacity, refill_rate, last_refill, true as allowed
                 ),
                 updates AS (
                   UPDATE ${TABLE} t
                   SET
                     tokens = CASE WHEN e.allowed THEN LEAST(t.capacity, t.tokens + ($2 - t.last_refill) * t.refill_rate) - 1 ELSE LEAST(t.capacity, t.tokens + ($2 - t.last_refill) * t.refill_rate) END,
                     last_refill = CASE WHEN e.allowed THEN $2 ELSE t.last_refill END,
                     expires_at = TO_TIMESTAMP($2) + '1 hour'::interval
                   FROM existing e
                   WHERE t.key = $1
                   RETURNING t.tokens, t.capacity, t.refill_rate, t.last_refill, e.allowed
                 )
                 SELECT * FROM inserted UNION ALL SELECT * FROM updates`

const sqlCheckBatch = `WITH input AS (
                   SELECT unnest($1::text[]) AS key
                 ),
                 existing AS (
                   SELECT t.key, t.tokens, t.capacity, t.refill_rate, t.last_refill,
                     (LEAST(t.capacity, t.tokens + ($2 - t.last_refill) * t.refill_rate) >= 1) as allowed
                   FROM ${TABLE} t JOIN input i ON t.key = i.key
                   FOR UPDATE
                 ),
                 inserted AS (
                   INSERT INTO ${TABLE} (key, tokens, last_refill, capacity, refill_rate, expires_at)
                   SELECT i.key, $3 - 1, $2, $3, $4, TO_TIMESTAMP($2) + '1 hour'::interval
                   FROM input i
                   WHERE NOT EXISTS (SELECT 1 FROM existing e WHERE e.key = i.key)
                   ON CONFLICT (key) DO NOTHING
                   RETURNING key, tokens, capacity, refill_rate, last_refill, true as allowed
                 ),
                 updates AS (
                   UPDATE ${TABLE} t
                   SET
                     tokens = CASE WHEN e.allowed THEN LEAST(t.capacity, t.tokens + ($2 - t.last_refill) * t.refill_rate) - 1 ELSE LEAST(t.capacity, t.tokens + ($2 - t.last_refill) * t.refill_rate) END,
                     last_refill = CASE WHEN e.allowed THEN $2 ELSE t.last_refill END,
                     expires_at = TO_TIMESTAMP($2) + '1 hour'::interval
                   FROM existing e
                   WHERE t.key = e.key
                   RETURNING t.key, t.tokens, t.capacity, t.refill_rate, t.last_refill, e.allowed
                 )
                 SELECT * FROM inserted UNION ALL SELECT * FROM updates`

export function createPgCheck(drv: PgDriver, prefix: string, capacity: number, refillRate: number) {
    return async function check(id: string) {
        const key = buildKey(prefix, id)
        const now = Date.now() / 1000
        const rows = await drv.query<{
            tokens: number
            capacity: number
            refill_rate: number
            last_refill: number
            allowed: boolean | number
        }>(sqlCheck, [key, now, capacity, refillRate])
        const { tokens, rate, allowed } = parseTokenRow(rows[0]!)
        return buildResult(tokens, rate, allowed)
    }
}

export function createPgCheckBatch(
    drv: PgDriver,
    prefix: string,
    capacity: number,
    refillRate: number
) {
    return async function checkBatch(ids: string[]) {
        if (ids.length === 0) return []
        const keys = ids.map(id => buildKey(prefix, id))
        if (new Set(keys).size !== keys.length) {
            const check = createPgCheck(drv, prefix, capacity, refillRate)
            return Promise.all(ids.map(id => check(id)))
        }
        const now = Date.now() / 1000
        const rows = await drv.query<{
            key: string
            tokens: number
            capacity: number
            refill_rate: number
            last_refill: number
            allowed: boolean | number
        }>(sqlCheckBatch, [keys, now, capacity, refillRate])
        const rowMap = new Map(rows.map(r => [r.key, parseTokenRow(r)]))
        return keys.map(key => {
            const { tokens, rate, allowed } = rowMap.get(key)!
            return buildResult(tokens, rate, allowed)
        })
    }
}
