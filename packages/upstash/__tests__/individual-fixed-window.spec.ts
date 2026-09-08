import { individualFixedWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'

import { individualFixedWindow } from '../src'
import { createMockUpstashClient } from './client.mock'

describe('@ratelock/upstash - IndividualFixedWindow', () => {
    individualFixedWindowContract(async opts =>
        individualFixedWindow({
            ...opts,
            client: createMockUpstashClient(),
        })
    )
})
