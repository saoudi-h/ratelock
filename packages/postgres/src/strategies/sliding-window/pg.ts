import type { PgDriver } from '../../drivers/types'
import { TABLE, buildKey, buildResult } from './shared'

type LogRow = {
    allowed: boolean
    remaining: number
    oldest_ts_ms: string | number
    now_ms: string | number
}

/**
 * The `pg` driver returns booleans as `false`/`true`, but some Postgres
 * configurations and the postgres.js driver can return the text `'t'`/`'f'`
 * or the integer `0`/`1`. Normalise to a JS boolean.
 */
function isAllowed(v: unknown): boolean {
    return (
        v === true || v === 't' || v === 1 || (typeof v === 'string' && v.toLowerCase() === 'true')
    )
}

/**
 * Single atomic CTE. Mirrors what the Redis Lua script does:
 *   1. ZREMRANGEBYSCORE (prune) — delegated to the async cleanup timer
 *      (cleanup.ts), NOT inlined. This is what makes our implementation
 *      cheaper than a naive SQL port of the ZSET script: under load, the
 *      cheaper per-op path matters more than instant stale-row eviction.
 *   2. ZCARD key (count entries in window) — done via index range scan.
 *   3. ZADD (conditional INSERT if count < limit).
 *   4. ZRANGE 0 0 WITHSCORES (oldest timestamp) — returned for windowStart.
 *
 * Parameters:
 *   $1 = key
 *   $2 = cutoff epoch ms (now - windowMs)
 *   $3 = now epoch ms
 *   $4 = expires-at epoch ms (now + windowMs * 2)
 *   $5 = limit
 */
const SQL_CHECK = `
WITH remain AS (
  SELECT count(*)::int AS cnt
  FROM ${TABLE}
  WHERE key = $1 AND ts >= to_timestamp($2 / 1000.0)
),
oldest AS (
  SELECT ts FROM ${TABLE}
  WHERE key = $1 AND ts >= to_timestamp($2 / 1000.0)
  ORDER BY ts ASC
  LIMIT 1
),
ins AS (
  INSERT INTO ${TABLE} (key, ts, expires_at)
  SELECT $1, to_timestamp($3 / 1000.0), to_timestamp($4 / 1000.0)
  WHERE (SELECT cnt FROM remain) < $5
  RETURNING 1
)
SELECT
  EXISTS (SELECT 1 FROM ins) AS allowed,
  GREATEST(0, $5 - (SELECT cnt FROM remain)
    - (CASE WHEN EXISTS (SELECT 1 FROM ins) THEN 1 ELSE 0 END))::int AS remaining,
  COALESCE(
    (extract(epoch FROM (SELECT ts FROM oldest)) * 1000)::bigint,
    $2::bigint
  )::bigint AS oldest_ts_ms,
  $3::bigint AS now_ms
`

/**
 * Batch variant — identical semantics, but operates on a list of keys in
 * a single round-trip via `unnest`. Mirrors the counter-based checkBatch
 * commitment: one network request for N ids.
 *
 * Each CTE reads/writes per-key independently (no key cross-contamination),
 * perfect ordering of (key, ts) within each per-key range scan.
 */
const SQL_CHECK_BATCH = `
WITH input AS (
  SELECT * FROM unnest($1::text[]) WITH ORDINALITY AS t(key, ord)
),
remain AS (
  SELECT i.ord, count(*)::int AS cnt
  FROM input i
  LEFT JOIN ${TABLE} s
    ON s.key = i.key AND s.ts >= to_timestamp($2 / 1000.0)
  GROUP BY i.ord
),
oldest AS (
  SELECT i.ord, min(extract(epoch FROM s.ts) * 1000)::bigint AS oldest_ts_ms
  FROM input i
  LEFT JOIN ${TABLE} s
    ON s.key = i.key AND s.ts >= to_timestamp($2 / 1000.0)
  GROUP BY i.ord
),
ins AS (
  INSERT INTO ${TABLE} (key, ts, expires_at)
  SELECT i.key, to_timestamp($3 / 1000.0), to_timestamp($4 / 1000.0)
  FROM input i
  WHERE (SELECT cnt FROM remain r WHERE r.ord = i.ord) < $5
  RETURNING key
)
SELECT
  i.ord,
  EXISTS (SELECT 1 FROM ins WHERE ins.key = i.key) AS allowed,
  GREATEST(0, $5 - COALESCE((SELECT cnt FROM remain r WHERE r.ord = i.ord), 0)
    - (CASE WHEN EXISTS (SELECT 1 FROM ins WHERE ins.key = i.key) THEN 1 ELSE 0 END))::int AS remaining,
  COALESCE(
    (SELECT oldest_ts_ms FROM oldest o WHERE o.ord = i.ord),
    $2::bigint
  )::bigint AS oldest_ts_ms,
  $3::bigint AS now_ms
FROM input i
ORDER BY i.ord
`

export function createPgCheck(drv: PgDriver, prefix: string, windowMs: number, limit: number) {
    return async function check(id: string) {
        const key = buildKey(prefix, id)
        const nowMs = Date.now()
        const cutoffMs = nowMs - windowMs
        const expiresAtMs = nowMs + windowMs * 2
        const rows = await drv.query<LogRow>(SQL_CHECK, [key, cutoffMs, nowMs, expiresAtMs, limit])
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

export function createPgCheckBatch(drv: PgDriver, prefix: string, windowMs: number, limit: number) {
    return async function checkBatch(ids: string[]) {
        if (ids.length === 0) return []
        const keys = ids.map(id => buildKey(prefix, id))
        const nowMs = Date.now()
        const cutoffMs = nowMs - windowMs
        const expiresAtMs = nowMs + windowMs * 2
        const rows = await drv.query<LogRow & { ord: number }>(SQL_CHECK_BATCH, [
            keys,
            cutoffMs,
            nowMs,
            expiresAtMs,
            limit,
        ])
        // rows are ordered by ord, so they map 1:1 to ids
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
