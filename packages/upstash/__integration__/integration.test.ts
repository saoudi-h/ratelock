import {
    individualFixedWindowContract,
    slidingWindowContract,
    tokenBucketContract,
} from '@ratelock/test-utils'
import { Redis } from '@upstash/redis'
import { describe, expect, it } from 'vitest'

import { fixedWindow, individualFixedWindow, slidingWindow, tokenBucket } from '../src'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN
const enabled = Boolean(url && token)
const prefix = `ratelock-integration:${Date.now()}`

const redis = enabled ? new Redis({ url: url!, token: token! }) : null
let limiterNumber = 0

function nextPrefix(strategy: string): string {
    limiterNumber += 1
    return `${prefix}:${strategy}:${limiterNumber}`
}

describe.skipIf(!enabled)('@ratelock/upstash - Integration', () => {
    describe('FixedWindow strategy', () => {
        it('preserves quota state across real HTTP calls', async () => {
            const limiter = await fixedWindow({
                client: redis!,
                limit: 3,
                windowMs: 60_000,
                prefix: nextPrefix('fixed-window'),
            })

            const first = await limiter.check('fixed-real-user')
            const second = await limiter.check('fixed-real-user')
            const third = await limiter.check('fixed-real-user')
            const denied = await limiter.check('fixed-real-user')

            expect(first.allowed).toBe(true)
            expect(second.remaining).toBe(1)
            expect(third.remaining).toBe(0)
            expect(denied.allowed).toBe(false)
            expect(denied.remaining).toBe(0)
        })

        it('executes duplicate identifiers in pipeline order', async () => {
            const limiter = await fixedWindow({
                client: redis!,
                limit: 3,
                windowMs: 60_000,
                prefix: nextPrefix('fixed-window-batch'),
            })

            const results = await limiter.checkBatch([
                'fixed-batch-user',
                'fixed-batch-user',
                'fixed-batch-user',
                'fixed-batch-user',
            ])

            expect(results.map(result => result.allowed)).toEqual([true, true, true, false])
            expect(results.map(result => result.remaining)).toEqual([2, 1, 0, 0])
        })
    })

    slidingWindowContract(async opts =>
        slidingWindow({
            ...opts,
            client: redis!,
            prefix: nextPrefix('sliding-window'),
        })
    )

    tokenBucketContract(async opts =>
        tokenBucket({
            ...opts,
            client: redis!,
            prefix: nextPrefix('token-bucket'),
        })
    )

    individualFixedWindowContract(async opts =>
        individualFixedWindow({
            ...opts,
            client: redis!,
            prefix: nextPrefix('individual-fixed-window'),
        })
    )
})
