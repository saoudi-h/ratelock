import { slidingWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { slidingWindow } from '../src/sliding-window'
import { MockPgDriver } from './driver.mock'

describe('@ratelock/postgres - SlidingWindow', () => {
    slidingWindowContract(async opts => {
        const driver = new MockPgDriver()
        const limiter = await slidingWindow({
            ...opts,
            sql: driver,
            skipMigrations: true,
        })
        return limiter
    })
})
