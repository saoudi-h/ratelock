import { individualFixedWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { individualFixedWindow } from '../src/individual-fixed-window'
import { MockPgDriver } from './driver.mock'

describe('@ratelock/postgres - IndividualFixedWindow', () => {
    individualFixedWindowContract(async opts => {
        const driver = new MockPgDriver()
        const limiter = await individualFixedWindow({
            ...opts,
            sql: driver,
            skipMigrations: true,
        })
        return limiter
    })
})
