import type { Storage } from '@/storage/storage'
import {
    createTokenBucketStrategy,
    createTypedTokenBucketStrategy,
    TokenBucketStrategy,
    type TokenBucketOptions,
} from '@/strategy/token-bucket'
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

describe('TokenBucketStrategy', () => {
    let storage: InMemoryStorage
    let strategy: TokenBucketStrategy
    const options: TokenBucketOptions = {
        capacity: 3,
        refillRate: 1, // 1 token per second
        refillTime: 1000,
        prefix: 'tb:test',
    }

    beforeEach(() => {
        storage = new InMemoryStorage()
        strategy = createTokenBucketStrategy(storage, options)
    })

    it('creates a TokenBucketStrategy instance', () => {
        const strategy = createTokenBucketStrategy(storage, options)
        expect(strategy).toBeInstanceOf(TokenBucketStrategy)
    })

    it('allows requests up to capacity', async () => {
        const r1 = await strategy.check('user:1')
        const r2 = await strategy.check('user:1')
        const r3 = await strategy.check('user:1')
        const r4 = await strategy.check('user:1')

        expect(r1.allowed).toBe(true)
        expect(r2.allowed).toBe(true)
        expect(r3.allowed).toBe(true)
        expect(r4.allowed).toBe(false)
        expect(r4.remaining).toBe(0)
    })

    it('provides token information in result', async () => {
        const result = await strategy.check('user:1')

        expect(result).toHaveProperty('tokens')
        expect(result).toHaveProperty('capacity')
        expect(result).toHaveProperty('refillRate')
        expect(typeof result.tokens).toBe('number')
        expect(result.capacity).toBe(options.capacity)
        expect(result.refillRate).toBe(options.refillRate)
    })

    it('refills tokens over time', async () => {
        // Consume all tokens
        await strategy.check('user:1') // 1 token consumed
        await strategy.check('user:1') // 2 tokens consumed
        await strategy.check('user:1') // 3 tokens consumed

        // Should be denied
        const denied = await strategy.check('user:1')
        expect(denied.allowed).toBe(false)

        // Wait for refill (simulate time passing)
        const tokensKey = `${options.prefix}:user:1:tokens`
        const lastRefillKey = `${options.prefix}:user:1:lastRefill`

        // Manually set last refill to simulate time passing
        const pastTime = Date.now() - 2000 // 2 seconds ago
        await storage.set(lastRefillKey, pastTime.toString(), 10000)

        // Next check should refill tokens
        const result = await strategy.check('user:1')
        expect(result.allowed).toBe(true)
        expect(result.tokens).toBeGreaterThan(0)
    })

    it('calculates correct reset time', async () => {
        const result = await strategy.check('user:1')

        expect(result).toHaveProperty('reset')
        expect(typeof result.reset).toBe('number')
        // Reset time should be in the future, but we need to account for timing
        const now = Date.now()
        expect(result.reset).toBeGreaterThanOrEqual(now - 1000) // Allow 1 second tolerance
    })

    it('checkBatch returns one result per identifier', async () => {
        const out = await strategy.checkBatch?.(['a', 'b', 'c'])
        expect(out).toBeDefined()
        expect(out!.length).toBe(3)
    })

    it('validates negative options via factory: throws error', () => {
        expect(() =>
            createTokenBucketStrategy(storage, {
                ...options,
                capacity: 0,
            })
        ).toThrowError()
        expect(() =>
            createTokenBucketStrategy(storage, {
                ...options,
                refillRate: 0,
            })
        ).toThrowError()
        expect(() =>
            createTokenBucketStrategy(storage, {
                ...options,
                refillTime: 0,
            })
        ).toThrowError()
    })

    it('validates negative options via builder/registry: throws error', () => {
        expect(() => {
            createTypedTokenBucketStrategy({ ...options, capacity: 0 })({
                storage: storage,
            })
        }).toThrowError()

        expect(() => {
            createTypedTokenBucketStrategy({ ...options, refillRate: 0 })({
                storage: storage,
            })
        }).toThrowError()
    })

    it('handles fractional tokens correctly', async () => {
        const fractionalOptions: TokenBucketOptions = {
            capacity: 1,
            refillRate: 0.5, // 0.5 tokens per second
            refillTime: 1000,
            prefix: 'frac:test',
        }

        const fractionalStrategy = createTokenBucketStrategy(storage, fractionalOptions)

        // First request should be allowed
        const r1 = await fractionalStrategy.check('user:1')
        expect(r1.allowed).toBe(true)
        expect(r1.tokens).toBe(0) // All tokens consumed

        // Second request should be denied immediately
        const r2 = await fractionalStrategy.check('user:1')
        expect(r2.allowed).toBe(false)
    })

    it('respects capacity limit during refill', async () => {
        // Consume all tokens
        await strategy.check('user:1')
        await strategy.check('user:1')
        await strategy.check('user:1')

        // Simulate very long time passing (more than capacity)
        const tokensKey = `${options.prefix}:user:1:tokens`
        const lastRefillKey = `${options.prefix}:user:1:lastRefill`
        const pastTime = Date.now() - 10000 // 10 seconds ago
        await storage.set(lastRefillKey, pastTime.toString(), 10000)

        // Should refill but not exceed capacity
        const result = await strategy.check('user:1')
        expect(result.allowed).toBe(true)
        expect(result.tokens).toBeLessThanOrEqual(options.capacity)
    })
})
