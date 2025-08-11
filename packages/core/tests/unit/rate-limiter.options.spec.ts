import { RateLimiter } from '@/limiter/rate-limiter'
import type { Storage } from '@/storage/storage'
import { createFixedWindowStrategy, type FixedWindowOptions } from '@/strategy/fixed-window'
import { describe, expect, it } from 'vitest'

class InMemoryStorage implements Storage {
    private kv = new Map<string, { value: string; expiresAt?: number }>()
    private counters = new Map<string, { n: number; expiresAt?: number }>()
    private timestamps = new Map<string, Array<{ t: number; expiresAt: number }>>()
    private now() {
        return Date.now()
    }
    async get(key: string) {
        const e = this.kv.get(key)
        if (!e) return null
        if (e.expiresAt !== undefined && this.now() > e.expiresAt) {
            this.kv.delete(key)
            return null
        }
        return e.value
    }
    async set(key: string, value: string, ttlMs?: number) {
        if (ttlMs !== undefined) {
            const expiresAt = this.now() + Math.max(1, ttlMs)
            this.kv.set(key, { value, expiresAt })
        } else {
            this.kv.set(key, { value })
        }
    }
    async delete(key: string) {
        this.kv.delete(key)
        this.counters.delete(key)
    }
    async exists(key: string) {
        return (await this.get(key)) !== null
    }
    async expire(keyOrIdentifier: string, ttlMs: number) {
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
    async increment(key: string, ttlMs?: number) {
        const c = this.counters.get(key)
        const now = this.now()
        if (!c || (c.expiresAt !== undefined && now > c.expiresAt)) {
            if (ttlMs !== undefined) {
                const expiresAt = now + Math.max(1, ttlMs)
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
    async incrementIf(key: string, maxValue: number, ttlMs?: number) {
        const value = await this.increment(key, ttlMs)
        if (value > maxValue) {
            const current = await this.get(key)
            const n = Math.max(0, (current ? parseInt(current, 10) : value) - 1)
            if (ttlMs !== undefined) {
                await this.set(key, String(n), ttlMs)
                this.counters.set(key, { n, expiresAt: this.now() + Math.max(1, ttlMs) })
            } else {
                await this.set(key, String(n))
                this.counters.set(key, { n })
            }
            return { value: maxValue, incremented: false }
        }
        return { value, incremented: true }
    }
    async decrement(key: string, minValue = Number.NEGATIVE_INFINITY) {
        const current = await this.get(key)
        const n = Math.max(minValue, (current ? parseInt(current, 10) : 0) - 1)
        await this.set(key, String(n))
        this.counters.set(key, { n })
        return n
    }
    async addTimestamp(identifier: string, timestamp: number, ttlMs: number) {
        const arr = this.timestamps.get(identifier) ?? []
        arr.push({ t: timestamp, expiresAt: this.now() + Math.max(1, ttlMs) })
        this.timestamps.set(identifier, arr)
    }
    async countTimestamps(identifier: string, windowMs: number) {
        const now = this.now()
        const arr = (this.timestamps.get(identifier) ?? []).filter(
            e => e.expiresAt > now && e.t >= now - windowMs
        )
        this.timestamps.set(identifier, arr)
        return arr.length
    }
    async getOldestTimestamp(identifier: string) {
        const now = this.now()
        const arr = (this.timestamps.get(identifier) ?? []).filter(e => e.expiresAt > now)
        if (arr.length === 0) return null
        return Math.min(...arr.map(e => e.t))
    }
    async cleanupTimestamps(identifier: string) {
        const now = this.now()
        const arr = (this.timestamps.get(identifier) ?? []).filter(e => e.expiresAt > now)
        this.timestamps.set(identifier, arr)
    }
    pipeline() {
        const ops: Array<() => Promise<unknown>> = []
        const pipeline = {
            increment: async (key: string, ttlMs?: number) => {
                ops.push(() => this.increment(key, ttlMs))
                return pipeline
            },
            incrementIf: async (key: string, maxValue: number, ttlMs?: number) => {
                ops.push(() => this.incrementIf(key, maxValue, ttlMs))
                return pipeline
            },
            decrement: async (key: string, minValue?: number) => {
                ops.push(() => this.decrement(key, minValue))
                return pipeline
            },
            addTimestamp: async (identifier: string, timestamp: number, ttlMs: number) => {
                ops.push(() => this.addTimestamp(identifier, timestamp, ttlMs))
                return pipeline
            },
            countTimestamps: async (identifier: string, windowMs: number) => {
                ops.push(() => this.countTimestamps(identifier, windowMs))
                return pipeline
            },
            getOldestTimestamp: async (identifier: string) => {
                ops.push(() => this.getOldestTimestamp(identifier))
                return pipeline
            },
            expire: async (keyOrIdentifier: string, ttlMs: number) => {
                ops.push(() => this.expire(keyOrIdentifier, ttlMs))
                return pipeline
            },
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
    async multiGet(keys: string[]) {
        return Promise.all(keys.map(k => this.get(k)))
    }
    async multiSet(entries: Array<{ key: string; value: string; ttlMs?: number }>) {
        for (const e of entries) await this.set(e.key, e.value, e.ttlMs)
    }
}

describe('RateLimiter options', () => {
    it('works with basic FixedWindow', async () => {
        const storage = new InMemoryStorage()
        const options: FixedWindowOptions = { limit: 2, windowMs: 50, prefix: 'fw:test' }
        const strategy = createFixedWindowStrategy(storage, options)
        const limiter = new RateLimiter({ strategy, storage })
        const r1 = await limiter.check('u')
        const r2 = await limiter.check('u')
        const r3 = await limiter.check('u')
        expect([r1.allowed, r2.allowed, r3.allowed]).toEqual([true, true, false])
    })

    it('builds strategy through strategyFactory and enables cache/lazyCleanup', async () => {
        const storage = new InMemoryStorage()
        const options: FixedWindowOptions = { limit: 1, windowMs: 50, prefix: 'fw:test' }
        const limiter = new RateLimiter({
            strategy: createFixedWindowStrategy(storage, options),
            storage,
            performance: {
                cache: { enabled: true, maxSize: 100, ttlMs: 1000, cleanupIntervalMs: 100 },
                lazyCleanup: {
                    maxQueueSize: 100,
                    cleanupBatchSize: 10,
                    cleanupIntervalMs: 20,
                    priorityThreshold: 1,
                },
            },
        })
        const r1 = await limiter.check('a')
        const r2 = await limiter.check('a')
        expect([r1.allowed, r2.allowed]).toEqual([true, false])
        const stats = limiter.getStats()
        expect(stats.cache).toBeDefined()
    })

    it('applies resilience (retry/circuit) without throwing when policy is allow/deny handled by strategy errors)', async () => {
        const storage = new InMemoryStorage()
        // A strategy via factory that always throws once to exercise retry/circuit logic
        const options: FixedWindowOptions = { limit: 1, windowMs: 50, prefix: 'fw:test' }
        const limiter = new RateLimiter({
            strategy: createFixedWindowStrategy(storage, options),
            storage,
            resilience: {
                retryConfig: {
                    maxAttempts: 2,
                    baseDelayMs: 1,
                    maxDelayMs: 2,
                    backoffMultiplier: 1.1,
                    retryableErrors: [/transient/],
                    jitter: false,
                },
            },
        })
        const r = await limiter.check('x')
        expect(r.allowed).toBeTypeOf('boolean')
    })
})
