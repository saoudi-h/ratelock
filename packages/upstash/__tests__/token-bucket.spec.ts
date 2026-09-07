import { tokenBucketContract } from '@ratelock/test-utils'
import { describe } from 'vitest'

import { tokenBucket } from '../src'
import { createMockUpstashClient } from './client.mock'

describe('@ratelock/upstash - TokenBucket', () => {
    tokenBucketContract(async opts =>
        tokenBucket({
            ...opts,
            client: createMockUpstashClient(),
        })
    )
})
