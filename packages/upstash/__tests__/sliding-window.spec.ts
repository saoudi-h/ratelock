import { slidingWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'

import { slidingWindow } from '../src'
import { createMockUpstashClient } from './client.mock'

describe('@ratelock/upstash - SlidingWindow', () => {
    slidingWindowContract(async opts =>
        slidingWindow({
            ...opts,
            client: createMockUpstashClient(),
        })
    )
})
