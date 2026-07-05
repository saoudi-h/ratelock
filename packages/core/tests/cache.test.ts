import { describe, expect, it } from 'vitest'
import { withCache } from '../src/cache'
import type { Limiter } from '../src/types'

describe('withCache', () => {
    it('caches denied results and does not evict prematurely', async () => {
        let calls = 0
        const mockLimiter: Limiter<any> = {
            check: async () => {
                calls++
                return { allowed: false, count: calls }
            },
            checkBatch: async () => [],
        }

        const cachedLimiter = withCache(mockLimiter, { maxSize: 2, ttlMs: 1000 })

        // First call caches the denied result
        const res1 = await cachedLimiter.check('1')
        expect(res1).toEqual({ allowed: false, count: 1 })
        expect(calls).toBe(1)

        // Second call should return cached result
        const res2 = await cachedLimiter.check('1')
        expect(res2).toEqual({ allowed: false, count: 1 })
        expect(calls).toBe(1)

        // Fill cache
        await cachedLimiter.check('2')
        expect(calls).toBe(2)

        // Cache size is now 2 (maxSize). Updating '2' should NOT evict '1'
        // Wait, if we check '2' again, it returns cached.
        // What if we check something that is already in cache but we are just retrieving it?
        const res3 = await cachedLimiter.check('1')
        expect(res3).toEqual({ allowed: false, count: 1 })
        expect(calls).toBe(2)

        // Now check a new key, it should evict the first one
        await cachedLimiter.check('3')
        expect(calls).toBe(3)

        // '1' should be evicted
        const res4 = await cachedLimiter.check('1')
        expect(res4).toEqual({ allowed: false, count: 4 })
        expect(calls).toBe(4)
    })

    it('invalidate() evicts a cached entry forcing the next check to hit the limiter', async () => {
        let calls = 0
        const mockLimiter: Limiter<any> = {
            check: async () => {
                calls++
                return { allowed: false, count: calls }
            },
            checkBatch: async () => [],
        }

        const cachedLimiter = withCache(mockLimiter, { maxSize: 10, ttlMs: 60_000 })

        // Populate the cache
        await cachedLimiter.check('user:1')
        expect(calls).toBe(1)

        // Cached — no call
        await cachedLimiter.check('user:1')
        expect(calls).toBe(1)

        // Bust the entry
        cachedLimiter.invalidate?.('user:1')

        // Next call hits the limiter again
        const res = await cachedLimiter.check('user:1')
        expect(res).toEqual({ allowed: false, count: 2 })
        expect(calls).toBe(2)
    })

    it('invalidate() is a no-op for unknown ids', async () => {
        const mockLimiter: Limiter<any> = {
            check: async () => ({ allowed: true }),
            checkBatch: async () => [],
        }
        const cachedLimiter = withCache(mockLimiter, { maxSize: 2, ttlMs: 1000 })
        expect(() => cachedLimiter.invalidate?.('never-cached')).not.toThrow()
    })
})
