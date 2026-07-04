import type { PgDriver } from '../src/drivers/types'

type Row = Record<string, unknown>

export class MockPgDriver implements PgDriver {
    private tables = new Map<string, Map<string, Row>>()
    private nextId = 0

    getTable(name: string): Map<string, Row> {
        if (!this.tables.has(name)) this.tables.set(name, new Map())
        return this.tables.get(name)!
    }

    async query<T = Row>(sql: string, params?: unknown[]): Promise<T[]> {
        const normalized = sql.replace(/\s+/g, ' ').trim()

        if (normalized.includes('CREATE SCHEMA')) return [] as T[]
        if (normalized.includes('CREATE TABLE')) return [] as T[]
        if (normalized.includes('CREATE INDEX')) return [] as T[]
        if (normalized.includes('DROP TABLE')) return [] as T[]
        if (normalized.includes('DROP INDEX')) return [] as T[]

        // Async prune (cleanup.ts): DELETE FROM ratelock.sliding_window WHERE ts < cutoff
        if (normalized.startsWith('DELETE FROM') && !normalized.includes('WITH')) {
            return this.handlePrune(normalized, params ?? []) as T[]
        }

        // Log-based sliding window: single-key check (CTE with remain + oldest + ins).
        if (
            normalized.includes('WITH remain AS') &&
            normalized.includes('sliding_window') &&
            !normalized.includes('WITH input AS')
        ) {
            return this.handleSlidingLogCheck(normalized, params ?? []) as T[]
        }

        // Log-based sliding window: batch check via unnest WITH ORDINALITY.
        if (normalized.includes('WITH input AS') && normalized.includes('sliding_window')) {
            return this.handleSlidingLogBatch(normalized, params ?? []) as T[]
        }

        // Counter-based batch upserts (fixed_window, individual_fixed_window, token_bucket).
        if (normalized.includes('WITH input AS')) {
            return this.handleBatchUpsert(normalized, params ?? []) as T[]
        }

        // Counter-based single upserts.
        if (normalized.includes('INSERT INTO') && normalized.includes('ON CONFLICT')) {
            return this.handleUpsert(normalized, params ?? []) as T[]
        }

        if (normalized.startsWith('UPDATE') && normalized.includes('RETURNING')) {
            return this.handleUpdate(normalized, params ?? []) as T[]
        }

        return [] as T[]
    }

    private handlePrune(sql: string, params: unknown[]): Row[] {
        if (sql.includes('sliding_window')) {
            const cutoffMs = typeof params[0] === 'number' ? (params[0] as number) : Date.now()
            const table = this.getTable('sliding_window_log')
            for (const [k, row] of table) {
                if ((row.ts as number) < cutoffMs) table.delete(k)
            }
        }
        return []
    }

    /** Log-based check: params = [key, cutoffMs, nowMs, expiresAtMs, limit] */
    private handleSlidingLogCheck(_sql: string, params: unknown[]): Row[] {
        const key = params[0] as string
        const cutoffMs = params[1] as number
        const nowMs = params[2] as number
        const expiresAtMs = params[3] as number
        const limit = params[4] as number

        const table = this.getTable('sliding_window_log')
        const entries: Row[] = []
        for (const row of table.values()) {
            if ((row.key as string) === key && (row.ts as number) >= cutoffMs) {
                entries.push(row)
            }
        }
        const count = entries.length
        const oldestTs =
            entries.length > 0 ? Math.min(...entries.map(r => r.ts as number)) : cutoffMs
        const allowed = count < limit
        if (allowed) {
            const newId = this.nextId++
            table.set(`${key}:${newId}`, { key, ts: nowMs, expires_at: expiresAtMs })
        }
        return [
            {
                allowed,
                remaining: Math.max(0, limit - count - (allowed ? 1 : 0)),
                oldest_ts_ms: oldestTs,
                now_ms: nowMs,
            },
        ]
    }

    /** Log-based batch: params = [keys[], cutoffMs, nowMs, expiresAtMs, limit] */
    private handleSlidingLogBatch(_sql: string, params: unknown[]): Row[] {
        const keys = params[0] as string[]
        const cutoffMs = params[1] as number
        const nowMs = params[2] as number
        const expiresAtMs = params[3] as number
        const limit = params[4] as number

        const table = this.getTable('sliding_window_log')
        return keys.map((key, ord) => {
            const entries: Row[] = []
            for (const row of table.values()) {
                if ((row.key as string) === key && (row.ts as number) >= cutoffMs) {
                    entries.push(row)
                }
            }
            const count = entries.length
            const oldestTs =
                entries.length > 0 ? Math.min(...entries.map(r => r.ts as number)) : cutoffMs
            const allowed = count < limit
            if (allowed) {
                const newId = this.nextId++
                table.set(`${key}:${newId}`, { key, ts: nowMs, expires_at: expiresAtMs })
            }
            return {
                ord: ord + 1,
                allowed,
                remaining: Math.max(0, limit - count - (allowed ? 1 : 0)),
                oldest_ts_ms: oldestTs,
                now_ms: nowMs,
            }
        })
    }

    private handleUpdate(sql: string, params: unknown[]): Row[] {
        const normalized = sql.replace(/\s+/g, ' ').trim()
        const key = params[0] as string

        if (normalized.includes('token_bucket')) {
            const table = this.getTable('token_bucket')
            const existing = table.get(key)
            if (!existing) return []

            const now = Date.now()
            const elapsed = (now - (existing.last_refill as number)) / 1000
            const capacity = existing.capacity as number
            const refill_rate = existing.refill_rate as number
            const refilled = Math.min(capacity, (existing.tokens as number) + elapsed * refill_rate)
            const allowed = refilled >= 1

            const tokens = allowed ? refilled - 1 : refilled
            const last_refill = allowed ? now : (existing.last_refill as number)

            table.set(key, { ...existing, tokens, last_refill })
            return [
                {
                    tokens,
                    capacity,
                    refill_rate,
                    last_refill,
                    allowed,
                },
            ]
        }

        return []
    }

    private handleBatchUpsert(sql: string, params: unknown[]): Row[] {
        const keys = params[0] as string[]

        if (sql.includes('individual_fixed_window')) {
            const intervalStr = params[1] as string
            const windowMs =
                typeof intervalStr === 'string' ? parseInt(intervalStr.split(' ')[0]!, 10) : 60000
            return keys.flatMap(key => {
                const res = this.individualFixedWindowUpsert(key, windowMs)
                return res.map(r => ({ ...r, key }))
            })
        }
        if (sql.includes('fixed_window')) {
            const windowMs = 500
            return keys.flatMap(key => {
                const res = this.fixedWindowUpsert(key, windowMs)
                return res.map(r => ({ ...r, key }))
            })
        }
        if (sql.includes('token_bucket')) {
            const capacity = params[2] as number
            const refillRate = params[3] as number
            return keys.flatMap(key => {
                const res = this.tokenBucketUpsert(key, capacity, refillRate)
                return res.map(r => ({ ...r, key }))
            })
        }

        return []
    }

    private handleUpsert(sql: string, params: unknown[]): Row[] {
        const key = params[0] as string

        if (sql.includes('individual_fixed_window')) {
            const intervalStr = params[1] as string
            const windowMs =
                typeof intervalStr === 'string' ? parseInt(intervalStr.split(' ')[0]!, 10) : 60000
            return this.individualFixedWindowUpsert(key, windowMs)
        }
        if (sql.includes('fixed_window')) {
            const windowMs = 500
            return this.fixedWindowUpsert(key, windowMs)
        }
        if (sql.includes('token_bucket')) {
            const capacity = params[2] as number
            const refillRate = params[3] as number
            return this.tokenBucketUpsert(key, capacity, refillRate)
        }

        return []
    }

    private fixedWindowUpsert(key: string, windowMs: number): Row[] {
        const table = this.getTable('fixed_window')
        const now = Date.now()
        const windowStart = Math.floor(now / windowMs) * windowMs
        const expiresAt = windowStart + windowMs
        const existing = table.get(key)

        if (!existing || (existing.expires_at as number) <= now) {
            table.set(key, { count: 1, expires_at: expiresAt })
            return [{ count: 1, reset_ms: expiresAt }]
        }

        const count = (existing.count as number) + 1
        table.set(key, { ...existing, count })
        return [{ count, reset_ms: existing.expires_at as number }]
    }

    private tokenBucketUpsert(key: string, capacity: number, refillRate: number): Row[] {
        const table = this.getTable('token_bucket')
        const now = Date.now()
        const existing = table.get(key)

        if (!existing) {
            table.set(key, {
                tokens: capacity - 1,
                last_refill: now,
                capacity,
                refill_rate: refillRate,
            })
            return [
                {
                    tokens: capacity - 1,
                    capacity,
                    refill_rate: refillRate,
                    last_refill: now,
                    allowed: true,
                },
            ]
        }

        const elapsed = (now - (existing.last_refill as number)) / 1000
        const refilled = (existing.tokens as number) + elapsed * (existing.refill_rate as number)

        if (refilled >= 1) {
            const consumed = this.tokenBucketConsume(key)
            return [
                {
                    ...consumed,
                    capacity,
                    refill_rate: refillRate,
                    last_refill: table.get(key)!.last_refill,
                    allowed: true,
                },
            ]
        }

        return [
            {
                tokens: refilled,
                capacity,
                refill_rate: refillRate,
                last_refill: existing.last_refill,
                allowed: false,
            },
        ]
    }

    private tokenBucketConsume(key: string): Row {
        const table = this.getTable('token_bucket')
        const existing = table.get(key)!
        const now = Date.now()
        const elapsed = (now - (existing.last_refill as number)) / 1000
        const refilled = Math.min(
            existing.capacity as number,
            (existing.tokens as number) + elapsed * (existing.refill_rate as number)
        )
        const tokens = Math.max(0, refilled - 1)

        table.set(key, { ...existing, tokens, last_refill: now })
        return { tokens }
    }

    private individualFixedWindowUpsert(key: string, windowMs: number): Row[] {
        const table = this.getTable('individual_fixed_window')
        const now = Date.now()
        const existing = table.get(key)
        const expired = existing && (existing.window_start as number) + windowMs <= now

        if (!existing || expired) {
            const windowStart = expired ? now : now
            table.set(key, { count: 1, window_start: windowStart, expires_at: now + windowMs })
            return [
                {
                    count: 1,
                    window_start: new Date(windowStart).toISOString(),
                    expires_at: new Date(now + windowMs).toISOString(),
                },
            ]
        }

        const count = (existing.count as number) + 1
        table.set(key, { ...existing, count })
        return [
            {
                count,
                window_start: new Date(existing.window_start as number).toISOString(),
                expires_at: new Date(existing.expires_at as number).toISOString(),
            },
        ]
    }

    async end(): Promise<void> {
        this.tables.clear()
    }
}
