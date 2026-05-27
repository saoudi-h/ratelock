import { describe, expect, it } from 'vitest'
import { withFallback } from '../src/fallback'
import { RatelockError } from '../src/errors'
import type { Limiter } from '../src/types'

describe('withFallback', () => {
    it('applies defaults to allow policy', async () => {
        const mockLimiter: Limiter<any> = {
            check: async () => {
                throw new Error('fail')
            },
            checkBatch: async () => [],
        }

        const fallback = withFallback(mockLimiter, 'allow', { remaining: 10, reset: 0 })
        const res = await fallback.check('1')
        expect(res).toEqual({ allowed: true, remaining: 10, reset: 0 })
    })

    it('throws RatelockError on throw policy', async () => {
        const mockLimiter: Limiter<any> = {
            check: async () => {
                throw new Error('fail')
            },
            checkBatch: async () => [],
        }

        const fallback = withFallback(mockLimiter, 'throw')
        await expect(fallback.check('1')).rejects.toThrow(RatelockError)
    })
})
