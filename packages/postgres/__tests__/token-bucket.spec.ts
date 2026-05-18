import { tokenBucketContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { createTokenBucketLimiter } from '../src/token-bucket'
import { MockPgDriver } from './driver.mock'

describe('@ratelock/postgres - TokenBucket', () => {
    tokenBucketContract(async opts => {
        const driver = new MockPgDriver()
        const limiter = await createTokenBucketLimiter({
            ...opts,
            sql: driver,
            skipMigrations: true,
        })
        return limiter
    })
})
