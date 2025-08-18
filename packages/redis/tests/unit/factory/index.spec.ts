import { describe, expect, it } from 'vitest'
import * as factories from '../../../src/factory'

describe('Factory Index', () => {
    it('should export all factory functions', () => {
        expect(factories).toMatchObject({
            createFixedWindowLimiter: expect.any(Function),
            createIndividualFixedWindowLimiter: expect.any(Function),
            createSlidingWindowLimiter: expect.any(Function),
            createTokenBucketLimiter: expect.any(Function),
            createRedisStorage: expect.any(Function),
        })
    })
})
