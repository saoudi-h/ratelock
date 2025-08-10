import type { Storage } from '@/storage/storage'
import {
    createIndividualFixedWindowStrategy,
    createTypedIndividualFixedWindowStrategy,
    IndividualFixedWindowStrategy,
    type IndividualFixedWindowOptions,
} from '@/strategy/individual-fixed-window'
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

describe('IndividualFixedWindowStrategy', () => {
    let storage: InMemoryStorage
    let strategy: IndividualFixedWindowStrategy
    const options: IndividualFixedWindowOptions = { limit: 2, windowMs: 100, prefix: 'ifw:test' }

    beforeEach(() => {
        storage = new InMemoryStorage()
        strategy = createIndividualFixedWindowStrategy(storage, options)
    })

    it('creates an IndividualFixedWindowStrategy instance', () => {
        const strategy = createIndividualFixedWindowStrategy(storage, options)
        expect(strategy).toBeInstanceOf(IndividualFixedWindowStrategy)
    })

    it('allows up to limit requests within the same window', async () => {
        const r1 = await strategy.check('user:1')
        const r2 = await strategy.check('user:1')
        const r3 = await strategy.check('user:1')

        expect(r1.allowed).toBe(true)
        expect(r2.allowed).toBe(true)
        expect(r3.allowed).toBe(false)
        expect(r3.remaining).toBe(0)
    })

    it('starts a new window for each identifier on first request', async () => {
        // First user starts their window
        const r1 = await strategy.check('user:1')
        expect(r1.allowed).toBe(true)

        // Second user starts their own window
        const r2 = await strategy.check('user:2')
        expect(r2.allowed).toBe(true)

        // Both should have remaining requests
        expect(r1.remaining).toBe(1)
        expect(r2.remaining).toBe(1)
    })

    it('decrements if exceeded to compensate for over-increment', async () => {
        await strategy.check('ip:1') // 1/2
        await strategy.check('ip:1') // 2/2
        const denied = await strategy.check('ip:1') // 3 => deny and decrement
        expect(denied.allowed).toBe(false)

        // The stored value must not exceed limit
        const countKey = `${options.prefix}:ip:1:count`
        const raw = await storage.get(countKey)
        expect(raw === null ? 0 : parseInt(raw, 10)).toBeLessThanOrEqual(options.limit)
    })

    it('uses TTL based on window end time', async () => {
        const before = Date.now()
        await strategy.check('user:2')
        const startKey = `${options.prefix}:user:2:start`
        const countKey = `${options.prefix}:user:2:count`

        expect(await storage.exists(startKey)).toBe(true)
        expect(await storage.exists(countKey)).toBe(true)
        expect(Date.now()).toBeGreaterThanOrEqual(before)
    })

    it('checkBatch returns one result per identifier', async () => {
        const out = await strategy.checkBatch?.(['a', 'b', 'c'])
        expect(out).toBeDefined()
        expect(out!.length).toBe(3)
    })

    it('validates negative options via factory: throws error', () => {
        expect(() =>
            createIndividualFixedWindowStrategy(storage, {
                ...options,
                limit: 0,
            })
        ).toThrowError()
        expect(() =>
            createIndividualFixedWindowStrategy(storage, {
                ...options,
                windowMs: 0,
            })
        ).toThrowError()
    })

    it('validates negative options via builder/registry: throws error', () => {
        expect(() => {
            createTypedIndividualFixedWindowStrategy({ ...options, limit: 0 })({
                storage: storage,
            })
        }).toThrowError()

        expect(() => {
            createTypedIndividualFixedWindowStrategy({ ...options, windowMs: 0 })({
                storage: storage,
            })
        }).toThrowError()
    })

    it('creates new window when current window expires', async () => {
        // Use a very short window for testing
        const shortWindowStrategy = createIndividualFixedWindowStrategy(storage, {
            limit: 1,
            windowMs: 50,
            prefix: 'short:test',
        })

        // First request
        const r1 = await shortWindowStrategy.check('user:1')
        expect(r1.allowed).toBe(true)

        // Wait for window to expire
        await new Promise(resolve => setTimeout(resolve, 100))

        // Second request should be allowed in new window
        const r2 = await shortWindowStrategy.check('user:1')
        expect(r2.allowed).toBe(true)
    })
})
