import { RateLimiter } from '../src/limiter/rate-limiter'
import type { Storage } from '../src/storage/storage'
import {
    FixedWindow,
    IndividualFixedWindow,
    SlidingWindowBuilder,
    TokenBucket,
} from '../src/strategy'

// Example storage implementation (in-memory for demo)
class ExampleStorage implements Storage {
    private data = new Map<string, string>()
    private counters = new Map<string, number>()
    private timestamps = new Map<string, Array<{ t: number; expiresAt: number }>>()

    async get(key: string): Promise<string | null> {
        return this.data.get(key) || null
    }

    async set(key: string, value: string, ttlMs?: number): Promise<void> {
        this.data.set(key, value)
        if (ttlMs) {
            setTimeout(() => this.data.delete(key), ttlMs)
        }
    }

    async delete(key: string): Promise<void> {
        this.data.delete(key)
    }

    async exists(key: string): Promise<boolean> {
        return this.data.has(key)
    }

    async expire(key: string, ttlMs: number): Promise<void> {
        setTimeout(() => this.data.delete(key), ttlMs)
    }

    async increment(key: string, ttlMs?: number): Promise<number> {
        const current = this.counters.get(key) || 0
        const newValue = current + 1
        this.counters.set(key, newValue)
        if (ttlMs) {
            setTimeout(() => this.counters.delete(key), ttlMs)
        }
        return newValue
    }

    async incrementIf(
        key: string,
        maxValue: number,
        ttlMs?: number
    ): Promise<{ value: number; incremented: boolean }> {
        const current = this.counters.get(key) || 0
        if (current >= maxValue) {
            return { value: current, incremented: false }
        }
        const newValue = current + 1
        this.counters.set(key, newValue)
        if (ttlMs) {
            setTimeout(() => this.counters.delete(key), ttlMs)
        }
        return { value: newValue, incremented: true }
    }

    async decrement(key: string, minValue = 0): Promise<number> {
        const current = this.counters.get(key) || 0
        const newValue = Math.max(minValue, current - 1)
        this.counters.set(key, newValue)
        return newValue
    }

    async addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<void> {
        const key = `timestamps:${identifier}`
        const timestamps = this.timestamps.get(key) || []
        const expiresAt = Date.now() + ttlMs
        timestamps.push({ t: timestamp, expiresAt })
        this.timestamps.set(key, timestamps)
    }

    async countTimestamps(identifier: string, windowMs: number): Promise<number> {
        const key = `timestamps:${identifier}`
        const timestamps = this.timestamps.get(key) || []
        const now = Date.now()
        const cutoff = now - windowMs
        return timestamps.filter(t => t.t >= cutoff && t.expiresAt > now).length
    }

    async getOldestTimestamp(identifier: string): Promise<number | null> {
        const key = `timestamps:${identifier}`
        const timestamps = this.timestamps.get(key) || []
        const now = Date.now()
        const validTimestamps = timestamps.filter(t => t.expiresAt > now)
        if (validTimestamps.length === 0) return null
        return Math.min(...validTimestamps.map(t => t.t))
    }

    async cleanupTimestamps(identifier: string): Promise<void> {
        const key = `timestamps:${identifier}`
        const timestamps = this.timestamps.get(key) || []
        const now = Date.now()
        const validTimestamps = timestamps.filter(t => t.expiresAt > now)
        this.timestamps.set(key, validTimestamps)
    }

    pipeline() {
        const ops: Array<() => Promise<any>> = []
        return {
            get: async (key: string) => {
                ops.push(() => this.get(key))
                return this
            },
            set: async (key: string, value: string, ttlMs?: number) => {
                ops.push(() => this.set(key, value, ttlMs))
                return this
            },
            exec: async () => Promise.all(ops.map(fn => fn())),
        }
    }

    async multiGet(keys: string[]): Promise<(string | null)[]> {
        return Promise.all(keys.map(k => this.get(k)))
    }

    async multiSet(entries: Array<{ key: string; value: string; ttlMs?: number }>): Promise<void> {
        for (const e of entries) await this.set(e.key, e.value, e.ttlMs)
    }
}

async function demonstrateStrategies() {
    const storage = new ExampleStorage()

    console.log('=== Rate Limiting Strategies Demo ===\n')

    // 1. Fixed Window Strategy
    console.log('1. Fixed Window Strategy:')
    const fixedWindowLimiter = new RateLimiter({
        strategyFactory: s => FixedWindow({ limit: 3, windowMs: 5000 }).withStorage(s),
        storage,
    })

    for (let i = 1; i <= 5; i++) {
        const result = await fixedWindowLimiter.check('user1')
        console.log(
            `  Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining} remaining)`
        )
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n2. Individual Fixed Window Strategy:')
    const individualFixedWindowLimiter = new RateLimiter({
        strategyFactory: s => IndividualFixedWindow({ limit: 3, windowMs: 5000 }).withStorage(s),
        storage,
    })

    for (let i = 1; i <= 5; i++) {
        const result = await individualFixedWindowLimiter.check('user2')
        console.log(
            `  Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining} remaining)`
        )
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n3. Sliding Window Strategy:')
    const slidingWindowLimiter = new RateLimiter({
        strategyFactory: s => SlidingWindowBuilder({ limit: 3, windowMs: 5000 }).withStorage(s),
        storage,
    })

    for (let i = 1; i <= 5; i++) {
        const result = await slidingWindowLimiter.check('user3')
        console.log(
            `  Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining} remaining)`
        )
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n4. Token Bucket Strategy:')
    const tokenBucketLimiter = new RateLimiter({
        strategyFactory: s =>
            TokenBucket({
                capacity: 3,
                refillRate: 0.5, // 1 token every 2 seconds
                refillTime: 2000,
            }).withStorage(s),
        storage,
    })

    for (let i = 1; i <= 5; i++) {
        const result = await tokenBucketLimiter.check('user4')
        console.log(
            `  Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining} remaining)`
        )
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n=== Advanced Usage with Performance & Resilience ===\n')

    // Advanced example with performance and resilience features
    const advancedLimiter = new RateLimiter({
        strategyFactory: s => FixedWindow({ limit: 10, windowMs: 60000 }).withStorage(s),
        storage,
        performance: {
            cache: { enabled: true, maxSize: 1000, ttlMs: 5000, cleanupIntervalMs: 1000 },
            lazyCleanup: {
                maxQueueSize: 1000,
                cleanupBatchSize: 50,
                cleanupIntervalMs: 50,
                priorityThreshold: 1,
            },
        },
        resilience: {
            retryConfig: {
                maxAttempts: 3,
                baseDelayMs: 10,
                maxDelayMs: 100,
                backoffMultiplier: 2,
                retryableErrors: [/timeout/],
                jitter: true,
            },
            circuitBreakerConfig: {
                failureThreshold: 5,
                recoveryTimeoutMs: 5000,
                monitoringWindowMs: 60000,
                minimumRequestsForStats: 20,
            },
        },
    })

    console.log('Advanced limiter with cache and circuit breaker:')
    for (let i = 1; i <= 3; i++) {
        const result = await advancedLimiter.check('advanced-user')
        console.log(
            `  Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining} remaining)`
        )
    }

    const stats = advancedLimiter.getStats()
    console.log('\nStats:', stats)
}

// Run the demo
if (require.main === module) {
    demonstrateStrategies().catch(console.error)
}

export { demonstrateStrategies, ExampleStorage }
