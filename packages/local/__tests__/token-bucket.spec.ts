import { tokenBucketContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { tokenBucket } from '../src/token-bucket'

describe('@ratelock/local - TokenBucket', () => {
    tokenBucketContract(async opts => {
        const limiter = await tokenBucket({
            ...opts,
        })
        return limiter
    })
})
