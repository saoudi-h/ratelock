import { individualFixedWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { individualFixedWindow } from '../src/individual-fixed-window'

describe('@ratelock/local - IndividualFixedWindow', () => {
    individualFixedWindowContract(async opts => {
        const limiter = await individualFixedWindow({
            ...opts,
        })
        return limiter
    })
})
