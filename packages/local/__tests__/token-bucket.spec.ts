import { tokenBucketContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { createTokenBucketLimiter } from '../src/token-bucket'

describe('@ratelock/local - TokenBucket', () => {
    tokenBucketContract(async opts => {
        const limiter = await createTokenBucketLimiter({
            ...opts,
        })
        return limiter
    })
})
