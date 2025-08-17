import type { Storage } from '@/storage/storage'
import { describe, expect, it } from 'vitest'

function storageContract(createStorage: () => Storage) {
    describe('Storage Contract (minimal local copy)', () => {
        it('set/get stores and retrieves a string value', async () => {
            const storage = createStorage()
            await storage.set('k1', '42')
            const v = await storage.get('k1')
            expect(v).toBe('42')
        })

        it('incrementIf respects the max boundary', async () => {
            const storage = createStorage()
            const r1 = await storage.incrementIf('incIf', 2)
            expect(r1.value).toBe(1)
            expect(r1.incremented).toBe(true)
            const r2 = await storage.incrementIf('incIf', 2)
            expect(r2.value).toBe(2)
            expect(r2.incremented).toBe(true)
            const r3 = await storage.incrementIf('incIf', 2)
            expect(r3.value).toBe(2)
            expect(r3.incremented).toBe(false)
        })

        it('multiGet/multiSet work correctly', async () => {
            const storage = createStorage()
            await storage.multiSet([
                { key: 'm1', value: 'a' },
                { key: 'm2', value: 'b' },
            ])
            const res = await storage.multiGet(['m1', 'm2', 'm3'])
            expect(res).toEqual(['a', 'b', null])
        })
    })
}

class InMemoryStorage implements Storage {
    private kv = new Map<string, { value: string; expiresAt?: number }>()
    private counters = new Map<string, { n: number; expiresAt?: number }>()
    private timestamps = new Map<string, Array<{ t: number; expiresAt: number }>>()

    private now() {
        return Date.now()
    }

    async get(key: string): Promise<string | null> {
        const e = this.kv.get(key)
        if (!e) return null
        if (e.expiresAt !== undefined && this.now() > e.expiresAt) {
            this.kv.delete(key)
            return null
        }
        return e.value
    }

    async set(key: string, value: string, ttlMs?: number): Promise<void> {
        if (ttlMs !== undefined) {
            const expiresAt: number = this.now() + Math.max(1, ttlMs)
            this.kv.set(key, { value, expiresAt })
        } else {
            this.kv.set(key, { value })
        }
    }

    async delete(key: string): Promise<void> {
        this.kv.delete(key)
        this.counters.delete(key)
    }

    async exists(key: string): Promise<boolean> {
        return (await this.get(key)) !== null
    }

    async expire(keyOrIdentifier: string, ttlMs: number): Promise<void> {
        const e = this.kv.get(keyOrIdentifier)
        if (e) {
            e.expiresAt = this.now() + Math.max(1, ttlMs)
            this.kv.set(keyOrIdentifier, e)
        }
        const c = this.counters.get(keyOrIdentifier)
        if (c) {
            c.expiresAt = this.now() + Math.max(1, ttlMs)
            this.counters.set(keyOrIdentifier, c)
        }
    }

    async increment(key: string, ttlMs?: number): Promise<number> {
        const c = this.counters.get(key)
        const now = this.now()
        if (!c || (c.expiresAt !== undefined && now > c.expiresAt)) {
            if (ttlMs !== undefined) {
                const expiresAt: number = now + Math.max(1, ttlMs)
                this.counters.set(key, { n: 1, expiresAt })
                await this.set(key, '1', ttlMs)
            } else {
                this.counters.set(key, { n: 1 })
                await this.set(key, '1')
            }
            return 1
        }
        c.n += 1
        if (ttlMs !== undefined) c.expiresAt = now + Math.max(1, ttlMs)
        this.counters.set(key, c)
        await this.set(key, String(c.n), ttlMs)
        return c.n
    }

    async incrementIf(
        key: string,
        maxValue: number,
        ttlMs?: number
    ): Promise<{ value: number; incremented: boolean }> {
        const value = await this.increment(key, ttlMs)
        if (value > maxValue) {
            // rollback
            const current = await this.get(key)
            const n = Math.max(0, (current ? parseInt(current, 10) : value) - 1)
            if (ttlMs !== undefined) {
                const expiresAt: number = this.now() + Math.max(1, ttlMs)
                await this.set(key, String(n), ttlMs)
                this.counters.set(key, { n, expiresAt })
            } else {
                await this.set(key, String(n))
                this.counters.set(key, { n })
            }
            return { value: maxValue, incremented: false }
        }
        return { value, incremented: true }
    }

    async decrement(key: string, minValue = Number.NEGATIVE_INFINITY): Promise<number> {
        const current = await this.get(key)
        const n = Math.max(minValue, (current ? parseInt(current, 10) : 0) - 1)
        await this.set(key, String(n))
        this.counters.set(key, { n })
        return n
    }

    async addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<void> {
        const arr = this.timestamps.get(identifier) ?? []
        arr.push({ t: timestamp, expiresAt: this.now() + Math.max(1, ttlMs) })
        this.timestamps.set(identifier, arr)
    }

    async countTimestamps(identifier: string, windowMs: number): Promise<number> {
        const now = this.now()
        const arr = (this.timestamps.get(identifier) ?? []).filter(
            e => e.expiresAt > now && e.t >= now - windowMs
        )
        this.timestamps.set(identifier, arr)
        return arr.length
    }

    async getOldestTimestamp(identifier: string): Promise<number | null> {
        const now = this.now()
        const arr = (this.timestamps.get(identifier) ?? []).filter(e => e.expiresAt > now)
        if (arr.length === 0) return null
        return Math.min(...arr.map(e => e.t))
    }

    async cleanupTimestamps(identifier: string): Promise<void> {
        const now = this.now()
        const arr = (this.timestamps.get(identifier) ?? []).filter(e => e.expiresAt > now)
        this.timestamps.set(identifier, arr)
    }

    pipeline() {
        const ops: Array<() => Promise<unknown>> = []
        const pipeline = {
            increment: (key: string, ttlMs?: number) => {
                ops.push(() => this.increment(key, ttlMs))
                return pipeline
            },
            incrementIf: (key: string, maxValue: number, ttlMs?: number) => {
                ops.push(() => this.incrementIf(key, maxValue, ttlMs))
                return pipeline
            },
            decrement: (key: string, minValue?: number) => {
                ops.push(() => this.decrement(key, minValue))
                return pipeline
            },
            addTimestamp: (identifier: string, timestamp: number, ttlMs: number) => {
                ops.push(() => this.addTimestamp(identifier, timestamp, ttlMs))
                return pipeline
            },
            countTimestamps: (identifier: string, windowMs: number) => {
                ops.push(() => this.countTimestamps(identifier, windowMs))
                return pipeline
            },
            getOldestTimestamp: (identifier: string) => {
                ops.push(() => this.getOldestTimestamp(identifier))
                return pipeline
            },
            expire: (keyOrIdentifier: string, ttlMs: number) => {
                ops.push(() => this.expire(keyOrIdentifier, ttlMs))
                return pipeline
            },
            get: (key: string) => {
                ops.push(() => this.get(key))
                return pipeline
            },
            set: (key: string, value: string, ttlMs?: number) => {
                ops.push(() => this.set(key, value, ttlMs))
                return pipeline
            },
            exec: async () => Promise.all(ops.map(fn => fn())),
        }
        return pipeline
    }

    async multiGet(keys: string[]): Promise<(string | null)[]> {
        return Promise.all(keys.map(k => this.get(k)))
    }
    async multiSet(entries: Array<{ key: string; value: string; ttlMs?: number }>): Promise<void> {
        for (const e of entries) await this.set(e.key, e.value, e.ttlMs)
    }
}

describe('Storage Contract - InMemory adapter (integration)', () => {
    storageContract(() => new InMemoryStorage())
})
