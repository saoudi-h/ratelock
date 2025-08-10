import type { Storage } from '@/storage/storage'
import { FixedWindow, IndividualFixedWindow, SlidingWindowBuilder, TokenBucket } from '@/strategy'
import { beforeEach, describe, expect, it } from 'vitest'

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
        return n
    }

    async addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<void> {
        const key = `timestamps:${identifier}`
        const timestamps = this.timestamps.get(key) || []
        const expiresAt = this.now() + ttlMs
        timestamps.push({ t: timestamp, expiresAt })
        this.timestamps.set(key, timestamps)
    }

    async countTimestamps(identifier: string, windowMs: number): Promise<number> {
        const key = `timestamps:${identifier}`
        const timestamps = this.timestamps.get(key) || []
        const now = this.now()
        const cutoff = now - windowMs
        return timestamps.filter(t => t.t >= cutoff && t.expiresAt > now).length
    }

    async getOldestTimestamp(identifier: string): Promise<number | null> {
        const key = `timestamps:${identifier}`
        const timestamps = this.timestamps.get(key) || []
        const now = this.now()
        const validTimestamps = timestamps.filter(t => t.expiresAt > now)
        if (validTimestamps.length === 0) return null
        return Math.min(...validTimestamps.map(t => t.t))
    }

    async cleanupTimestamps(identifier: string): Promise<void> {
        const key = `timestamps:${identifier}`
        const timestamps = this.timestamps.get(key) || []
        const now = this.now()
        const validTimestamps = timestamps.filter(t => t.expiresAt > now)
        this.timestamps.set(key, validTimestamps)
    }

    pipeline() {
        const ops: Array<() => Promise<any>> = []
        const pipeline = {
            get: async (key: string) => {
                ops.push(() => this.get(key))
                return pipeline
            },
            set: async (key: string, value: string, ttlMs?: number) => {
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

describe('All Strategies', () => {
    let storage: InMemoryStorage

    beforeEach(() => {
        storage = new InMemoryStorage()
    })

    it('FixedWindow: allows requests within limit', async () => {
        const limiter = FixedWindow({ limit: 2, windowMs: 1000 }).withStorage(storage)

        const r1 = await limiter.check('user1')
        const r2 = await limiter.check('user1')
        const r3 = await limiter.check('user1')

        expect(r1.allowed).toBe(true)
        expect(r2.allowed).toBe(true)
        expect(r3.allowed).toBe(false)
    })

    it('IndividualFixedWindow: starts window at first request', async () => {
        const limiter = IndividualFixedWindow({ limit: 2, windowMs: 1000 }).withStorage(storage)

        const r1 = await limiter.check('user1')
        const r2 = await limiter.check('user1')
        const r3 = await limiter.check('user1')

        expect(r1.allowed).toBe(true)
        expect(r2.allowed).toBe(true)
        expect(r3.allowed).toBe(false)
    })

    it('SlidingWindow: tracks timestamps within window', async () => {
        const limiter = SlidingWindowBuilder({ limit: 2, windowMs: 1000 }).withStorage(storage)

        const r1 = await limiter.check('user1')
        const r2 = await limiter.check('user1')
        const r3 = await limiter.check('user1')

        expect(r1.allowed).toBe(true)
        expect(r2.allowed).toBe(true)
        expect(r3.allowed).toBe(false)
    })

    it('TokenBucket: consumes tokens and refills over time', async () => {
        const limiter = TokenBucket({
            capacity: 2,
            refillRate: 1, // 1 token per second
            refillTime: 1000,
        }).withStorage(storage)

        const r1 = await limiter.check('user1')
        const r2 = await limiter.check('user1')
        const r3 = await limiter.check('user1')

        expect(r1.allowed).toBe(true)
        expect(r2.allowed).toBe(true)
        expect(r3.allowed).toBe(false)
    })
})
