import { slidingWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { slidingWindow } from '../src/sliding-window'
import { MockRedisClient } from './client.mock'

describe('@ratelock/redis - SlidingWindow', () => {
    slidingWindowContract(async opts => {
        const client = new MockRedisClient()
        return slidingWindow({
            ...opts,
            client,
        })
    })
})
