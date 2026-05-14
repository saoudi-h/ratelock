import { individualFixedWindowContract } from '@ratelock/test-utils'
import { describe } from 'vitest'
import { createIndividualFixedWindowLimiter } from '../src/individual-fixed-window'

describe('@ratelock/local - IndividualFixedWindow', () => {
    individualFixedWindowContract(async opts => {
        const limiter = await createIndividualFixedWindowLimiter({
            ...opts,
        })
        return limiter
    })
})
