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

        if (normalized.includes('WITH input AS')) {
            return this.handleBatchUpsert(normalized, params ?? []) as T[]
        }

        if (normalized.includes('INSERT INTO') && normalized.includes('ON CONFLICT')) {
            return this.handleUpsert(normalized, params ?? []) as T[]
        }

        if (normalized.startsWith('UPDATE') && normalized.includes('RETURNING')) {
            return this.handleUpdate(normalized, params ?? []) as T[]
        }

        return [] as T[]
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
            const intervalVal = params[1]
            const windowMs =
                typeof intervalVal === 'number'
                    ? intervalVal
                    : typeof intervalVal === 'string'
                      ? parseInt(intervalVal.split(' ')[0]!, 10)
                      : 60000
            return keys.flatMap(key => {
                const res = this.fixedWindowUpsert(key, windowMs)
                return res.map(r => ({ ...r, key }))
            })
        }
        if (sql.includes('sliding_window')) {
            const intervalStr = params[1] as string
            const windowMs =
                typeof intervalStr === 'string' ? parseInt(intervalStr.split(' ')[0]!, 10) : 60000
            return keys.flatMap(key => {
                const res = this.slidingWindowUpsert(key, windowMs)
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
            const intervalVal = params[1]
            const windowMs =
                typeof intervalVal === 'number'
                    ? intervalVal
                    : typeof intervalVal === 'string'
                      ? parseInt(intervalVal.split(' ')[0]!, 10)
                      : 60000
            return this.fixedWindowUpsert(key, windowMs)
        }
        if (sql.includes('sliding_window')) {
            const intervalStr = params[1] as string
            const windowMs =
                typeof intervalStr === 'string' ? parseInt(intervalStr.split(' ')[0]!, 10) : 60000
            return this.slidingWindowUpsert(key, windowMs)
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
            return [{ count: 1, expires_at: new Date(expiresAt).toISOString() }]
        }

        const count = (existing.count as number) + 1
        table.set(key, { ...existing, count })
        return [{ count, expires_at: new Date(existing.expires_at as number).toISOString() }]
    }

    private slidingWindowUpsert(key: string, windowMs: number): Row[] {
        const table = this.getTable('sliding_window')
        const now = Date.now()
        const existing = table.get(key)

        if (!existing || (existing.expires_at as number) <= now) {
            table.set(key, {
                current_count: 1,
                previous_count: 0,
                window_start: now,
                expires_at: now + windowMs,
            })
            return [
                { current_count: 1, previous_count: 0, window_start: new Date(now).toISOString() },
            ]
        }

        const windowStart = existing.window_start as number
        const expired = now >= windowStart + windowMs
        const newWindowStart = expired ? now : windowStart
        const currentCount = expired ? 1 : (existing.current_count as number) + 1
        const previousCount = expired
            ? (existing.current_count as number)
            : (existing.previous_count as number)

        table.set(key, {
            current_count: currentCount,
            previous_count: previousCount,
            window_start: newWindowStart,
            expires_at: now + windowMs,
        })

        return [
            {
                current_count: currentCount,
                previous_count: previousCount,
                window_start: new Date(newWindowStart).toISOString(),
            },
        ]
    }

    private tokenBucketUpsert(key: string, capacity: number, refillRate: number): Row[] {
        const table = this.getTable('token_bucket')
        const now = Date.now()
        const existing = table.get(key)

        if (!existing) {
            // Step 2: INSERT
            table.set(key, {
                tokens: capacity - 1, // Fix: subtract 1 immediately since it was consumed
                last_refill: now,
                capacity,
                refill_rate: refillRate,
            })
            return [{ tokens: capacity - 1, capacity, refill_rate: refillRate, last_refill: now, allowed: true }]
        }

        // Step 1: UPDATE (conditional consumption)
        const elapsed = (now - (existing.last_refill as number)) / 1000
        const refilled = (existing.tokens as number) + elapsed * (existing.refill_rate as number)

        if (refilled >= 1) {
            const consumed = this.tokenBucketConsume(key)
            return [{ ...consumed, capacity, refill_rate: refillRate, last_refill: table.get(key)!.last_refill, allowed: true }]
        }

        // Step 3: no tokens available
        return [{ tokens: refilled, capacity, refill_rate: refillRate, last_refill: existing.last_refill, allowed: false }]
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
