import { slidingWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { slidingWindow } from '../src/sliding-window'

describe('@ratelock/local - SlidingWindow', () => {
    slidingWindowContract(async opts => {
        const limiter = await slidingWindow({
            ...opts,
        })
        return limiter
    })
})
