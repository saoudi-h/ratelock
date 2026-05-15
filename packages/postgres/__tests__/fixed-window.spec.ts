import { describe } from 'vitest'
import { fixedWindowContract } from '@ratelock/test-utils'
import { createFixedWindowLimiter } from '../src/fixed-window'
import { MockPgDriver } from './driver.mock'

describe('@ratelock/postgres - FixedWindow', () => {
  fixedWindowContract(async (opts) => {
    const driver = new MockPgDriver()
    const limiter = await createFixedWindowLimiter({
      ...opts,
      sql: driver,
      skipMigrations: true,
    })
    return limiter
  })
})
