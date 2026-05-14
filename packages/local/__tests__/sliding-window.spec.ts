import { slidingWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { createSlidingWindowLimiter } from '../src/sliding-window'

describe('@ratelock/local - SlidingWindow', () => {
    slidingWindowContract(async opts => {
        const limiter = await createSlidingWindowLimiter({
            ...opts,
        })
        return limiter
    })
})
