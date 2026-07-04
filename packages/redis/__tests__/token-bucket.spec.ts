import { tokenBucketContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { tokenBucket } from '../src/token-bucket'
import { MockRedisClient } from './client.mock'

describe('@ratelock/redis - TokenBucket', () => {
    tokenBucketContract(async opts => {
        const client = new MockRedisClient()
        return tokenBucket({
            ...opts,
            client,
        })
    })
})
