import { fixedWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { fixedWindow } from '../src/fixed-window'

describe('@ratelock/local - FixedWindow', () => {
    fixedWindowContract(async opts => {
        const limiter = await fixedWindow({
            ...opts,
        })
        return limiter
    })
})
