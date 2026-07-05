import { individualFixedWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { individualFixedWindow } from '../src/individual-fixed-window'
import { MockRedisClient } from './client.mock'

describe('@ratelock/redis - IndividualFixedWindow', () => {
    individualFixedWindowContract(async opts => {
        const client = new MockRedisClient()
        return individualFixedWindow({
            ...opts,
            client,
        })
    })
})
