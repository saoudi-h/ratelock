import { fixedWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { fixedWindow } from '../src/fixed-window'
import { MockPgDriver } from './driver.mock'

describe('@ratelock/postgres - FixedWindow', () => {
    fixedWindowContract(async opts => {
        const driver = new MockPgDriver()
        const limiter = await fixedWindow({
            ...opts,
            sql: driver,
            skipMigrations: true,
        })
        return limiter
    })
})
