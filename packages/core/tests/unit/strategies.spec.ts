import { FixedWindow, IndividualFixedWindow, SlidingWindowBuilder, TokenBucket } from '@/strategy'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryStorage } from './test-storage'

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
