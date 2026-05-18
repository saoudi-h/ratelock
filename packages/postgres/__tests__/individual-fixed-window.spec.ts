import { individualFixedWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { createIndividualFixedWindowLimiter } from '../src/individual-fixed-window'
import { MockPgDriver } from './driver.mock'

describe('@ratelock/postgres - IndividualFixedWindow', () => {
    individualFixedWindowContract(async opts => {
        const driver = new MockPgDriver()
        const limiter = await createIndividualFixedWindowLimiter({
            ...opts,
            sql: driver,
            skipMigrations: true,
        })
        return limiter
    })
})
