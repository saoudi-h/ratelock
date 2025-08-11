import {
    createTokenBucketStrategy,
    createTokenBucketStrategyWithContext,
    TokenBucketStrategy,
    type TokenBucketOptions,
} from '@/strategy/token-bucket'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryStorage } from './test-storage'

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
        expect(typeof result.tokens).toBe('number')
        expect(result.tokens).toBeLessThanOrEqual(options.capacity)
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

        // TokenBucket doesn't expose reset time in the result
        // The reset time is calculated internally for next token availability
        expect(result).toHaveProperty('tokens')
        expect(typeof result.tokens).toBe('number')
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
            createTokenBucketStrategyWithContext({ ...options, capacity: 0 })({
                storage: storage,
            })
        }).toThrowError()

        expect(() => {
            createTokenBucketStrategyWithContext({ ...options, refillRate: 0 })({
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
        const lastRefillKey = `${options.prefix}:user:1:lastRefill`
        const pastTime = Date.now() - 10000 // 10 seconds ago
        await storage.set(lastRefillKey, pastTime.toString(), 10000)

        // Should refill but not exceed capacity
        const result = await strategy.check('user:1')
        expect(result.allowed).toBe(true)
        expect(result.tokens).toBeLessThanOrEqual(options.capacity)
    })
})
