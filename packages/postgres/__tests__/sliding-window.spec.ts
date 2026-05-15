import { describe } from 'vitest'
import { slidingWindowContract } from '@ratelock/test-utils'
import { createSlidingWindowLimiter } from '../src/sliding-window'
import { MockPgDriver } from './driver.mock'

describe('@ratelock/postgres - SlidingWindow', () => {
  slidingWindowContract(async (opts) => {
    const driver = new MockPgDriver()
    const limiter = await createSlidingWindowLimiter({
      ...opts,
      sql: driver,
      skipMigrations: true,
    })
    return limiter
  })
})
