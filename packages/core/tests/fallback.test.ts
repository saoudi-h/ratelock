import { describe, expect, it } from 'vitest'
import { RatelockError } from '../src/errors'
import { withFallback } from '../src/fallback'
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

    it('preserves original error as cause on throw policy', async () => {
        const original = new Error('connection refused')
        const mockLimiter: Limiter<any> = {
            check: async () => {
                throw original
            },
            checkBatch: async () => [],
        }

        const fallback = withFallback(mockLimiter, 'throw')
        try {
            await fallback.check('1')
            expect.fail('should have thrown')
        } catch (err) {
            expect(err).toBeInstanceOf(RatelockError)
            expect((err as Error & { cause: unknown }).cause).toBe(original)
        }
    })

    it('preserves original error as cause on throw policy for batch', async () => {
        const original = new Error('batch failure')
        const mockLimiter: Limiter<any> = {
            check: async () => ({ allowed: true }),
            checkBatch: async () => {
                throw original
            },
        }

        const fallback = withFallback(mockLimiter, 'throw')
        try {
            await fallback.checkBatch(['1', '2'])
            expect.fail('should have thrown')
        } catch (err) {
            expect(err).toBeInstanceOf(RatelockError)
            expect((err as Error & { cause: unknown }).cause).toBe(original)
        }
    })
})
