import {
    createIndividualFixedWindowStrategy,
    IndividualFixedWindowStrategy,
    type IndividualFixedWindowOptions,
} from '@/strategy/individual-fixed-window'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryStorage } from './test-storage'

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
        const out = await strategy.checkBatch(['a', 'b', 'c'])
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
            createIndividualFixedWindowStrategy(storage, { ...options, limit: 0 })
        }).toThrowError()

        expect(() => {
            createIndividualFixedWindowStrategy(storage, { ...options, windowMs: 0 })
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
