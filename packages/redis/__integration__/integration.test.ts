import {
    fixedWindowContract,
    individualFixedWindowContract,
    slidingWindowContract,
    tokenBucketContract,
} from '@ratelock/test-utils'
import { describe, expect, it } from 'vitest'
import {
    createFixedWindowLimiter,
    createIndividualFixedWindowLimiter,
    createSlidingWindowLimiter,
    createTokenBucketLimiter,
} from '../src'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://:testpassword@localhost:6380'

describe('@ratelock/redis - Integration', () => {
    describe('FixedWindow', () => {
        fixedWindowContract(async opts => {
            const limiter = await createFixedWindowLimiter({
                ...opts,
                url: REDIS_URL,
            })
            return limiter
        })
    })

    describe('SlidingWindow', () => {
        slidingWindowContract(async opts => {
            const limiter = await createSlidingWindowLimiter({
                ...opts,
                url: REDIS_URL,
            })
            return limiter
        })
    })

    describe('TokenBucket', () => {
        tokenBucketContract(async opts => {
            const limiter = await createTokenBucketLimiter({
                ...opts,
                url: REDIS_URL,
            })
            return limiter
        })
    })

    describe('IndividualFixedWindow', () => {
        individualFixedWindowContract(async opts => {
            const limiter = await createIndividualFixedWindowLimiter({
                ...opts,
                url: REDIS_URL,
            })
            return limiter
        })
    })
})

describe('@ratelock/redis - Connection Management', () => {
    it('creates and destroys a limiter without errors', async () => {
        const limiter = await createFixedWindowLimiter({
            url: REDIS_URL,
            limit: 10,
            windowMs: 60_000,
        })
        await limiter.destroy?.()
    })

    it('supports passing an existing client', async () => {
        const { createClient } = await import('redis')
        const client = createClient({ url: REDIS_URL })
        await client.connect()

        const limiter = await createFixedWindowLimiter({
            client,
            limit: 10,
            windowMs: 60_000,
        })

        const result = await limiter.check('test-client')
        expect(result.allowed).toBe(true)

        await limiter.destroy?.()
        await client.quit()
    })
})
