import { fixedWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { createFixedWindowLimiter } from '../src/fixed-window'

describe('@ratelock/local - FixedWindow', () => {
    fixedWindowContract(async opts => {
        const limiter = await createFixedWindowLimiter({
            ...opts,
        })
        return limiter
    })
})
