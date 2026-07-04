import { fixedWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { fixedWindow } from '../src/fixed-window'
import { MockRedisClient } from './client.mock'

describe('@ratelock/redis - FixedWindow', () => {
    fixedWindowContract(async opts => {
        const client = new MockRedisClient()
        return fixedWindow({
            ...opts,
            client,
        })
    })
})
