import { TABLE, buildKey, buildResult } from './shared'

type LogRow = {
    allowed: boolean
    remaining: number
    oldest_ts_ms: string | number
    now_ms: string | number
}

/** Normalise the `allowed` column across pg drivers (boolean / 't' / 1). */
function isAllowed(v: unknown): boolean {
    return (
        v === true || v === 't' || v === 1 || (typeof v === 'string' && v.toLowerCase() === 'true')
    )
}

/**
 * Single atomic CTE for postgres.js (tagged-template style — every runtime
 * value is sent as a parameter automatically by the driver).
 *
 * Semantics are identical to pg.ts: count in-window entries, conditional
 * INSERT, return oldest timestamp + whether the INSERT happened.
 */
const SQL_CHECK = (
    sql: any,
    key: string,
    cutoffMs: number,
    nowMs: number,
    expiresAtMs: number,
    limit: number
) => sql`
WITH remain AS (
  SELECT count(*)::int AS cnt
  FROM ${sql(TABLE)}
  WHERE key = ${key} AND ts >= to_timestamp(${cutoffMs} / 1000.0)
),
oldest AS (
  SELECT ts FROM ${sql(TABLE)}
  WHERE key = ${key} AND ts >= to_timestamp(${cutoffMs} / 1000.0)
  ORDER BY ts ASC
  LIMIT 1
),
ins AS (
  INSERT INTO ${sql(TABLE)} (key, ts, expires_at)
  SELECT ${key}, to_timestamp(${nowMs} / 1000.0), to_timestamp(${expiresAtMs} / 1000.0)
  WHERE (SELECT cnt FROM remain) < ${limit}
  RETURNING 1
)
SELECT
  EXISTS (SELECT 1 FROM ins) AS allowed,
  GREATEST(0, ${limit} - (SELECT cnt FROM remain)
    - (CASE WHEN EXISTS (SELECT 1 FROM ins) THEN 1 ELSE 0 END))::int AS remaining,
  COALESCE(
    (extract(epoch FROM (SELECT ts FROM oldest)) * 1000)::bigint,
    ${cutoffMs}::bigint
  )::bigint AS oldest_ts_ms,
  ${nowMs}::bigint AS now_ms
`

/** Batch variant: one round-trip for N ids via unnest with ordinality. */
const SQL_CHECK_BATCH = (
    sql: any,
    keys: string[],
    cutoffMs: number,
    nowMs: number,
    expiresAtMs: number,
    limit: number
) => sql`
WITH input AS (
  SELECT * FROM unnest(${keys}::text[]) WITH ORDINALITY AS t(key, ord)
),
remain AS (
  SELECT i.ord, count(*)::int AS cnt
  FROM input i
  LEFT JOIN ${sql(TABLE)} s
    ON s.key = i.key AND s.ts >= to_timestamp(${cutoffMs} / 1000.0)
  GROUP BY i.ord
),
oldest AS (
  SELECT i.ord, min(extract(epoch FROM s.ts) * 1000)::bigint AS oldest_ts_ms
  FROM input i
  LEFT JOIN ${sql(TABLE)} s
    ON s.key = i.key AND s.ts >= to_timestamp(${cutoffMs} / 1000.0)
  GROUP BY i.ord
),
ins AS (
  INSERT INTO ${sql(TABLE)} (key, ts, expires_at)
  SELECT i.key, to_timestamp(${nowMs} / 1000.0), to_timestamp(${expiresAtMs} / 1000.0)
  FROM input i
  WHERE (SELECT cnt FROM remain r WHERE r.ord = i.ord) < ${limit}
  RETURNING key
)
SELECT
  i.ord,
  EXISTS (SELECT 1 FROM ins WHERE ins.key = i.key) AS allowed,
  GREATEST(0, ${limit} - COALESCE((SELECT cnt FROM remain r WHERE r.ord = i.ord), 0)
    - (CASE WHEN EXISTS (SELECT 1 FROM ins WHERE ins.key = i.key) THEN 1 ELSE 0 END))::int AS remaining,
  COALESCE(
    (SELECT oldest_ts_ms FROM oldest o WHERE o.ord = i.ord),
    ${cutoffMs}::bigint
  )::bigint AS oldest_ts_ms,
  ${nowMs}::bigint AS now_ms
FROM input i
ORDER BY i.ord
`

export function createPostgresCheck(sql: any, prefix: string, windowMs: number, limit: number) {
    return async function check(id: string) {
        const key = buildKey(prefix, id)
        const nowMs = Date.now()
        const cutoffMs = nowMs - windowMs
        const expiresAtMs = nowMs + windowMs * 2
        const rows: LogRow[] = await SQL_CHECK(sql, key, cutoffMs, nowMs, expiresAtMs, limit)
        const row = rows[0]!
        const allowed = isAllowed(row.allowed)
        const remaining = Number(row.remaining)
        const oldestTs = Number(row.oldest_ts_ms)
        return buildResult(
            limit - remaining - (allowed ? 1 : 0),
            oldestTs,
            Number(row.now_ms),
            windowMs,
            limit,
            allowed
        )
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
        const nowMs = Date.now()
        const cutoffMs = nowMs - windowMs
        const expiresAtMs = nowMs + windowMs * 2
        const rows: (LogRow & { ord: number })[] = await SQL_CHECK_BATCH(
            sql,
            keys,
            cutoffMs,
            nowMs,
            expiresAtMs,
            limit
        )
        return rows.map(row => {
            const allowed = isAllowed(row.allowed)
            const remaining = Number(row.remaining)
            const oldestTs = Number(row.oldest_ts_ms)
            return buildResult(
                limit - remaining - (allowed ? 1 : 0),
                oldestTs,
                Number(row.now_ms),
                windowMs,
                limit,
                allowed
            )
        })
    }
}
