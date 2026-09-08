import { fixedWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'

import { fixedWindow } from '../src'
import { createMockUpstashClient } from './client.mock'

describe('@ratelock/upstash - FixedWindow', () => {
    fixedWindowContract(async opts =>
        fixedWindow({
            ...opts,
            client: createMockUpstashClient(),
        })
    )
})
