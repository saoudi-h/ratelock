import { describe, expect, it } from 'vitest'
import { withRetry } from '../src/retry'
import type { Limiter } from '../src/types'

describe('withRetry', () => {
    it('retries on failure and eventually succeeds', async () => {
        let attempts = 0
        const mockLimiter: Limiter<any> = {
            check: async () => {
                attempts++
                if (attempts < 3) throw new Error('fail')
                return { allowed: true }
            },
            checkBatch: async () => [],
        }

        const retryLimiter = withRetry(mockLimiter, { maxAttempts: 4, baseDelayMs: 10 })
        const res = await retryLimiter.check('1')

        expect(res).toEqual({ allowed: true })
        expect(attempts).toBe(3)
    })

    it('throws if max attempts reached', async () => {
        const mockLimiter: Limiter<any> = {
            check: async () => {
                throw new Error('persistent fail')
            },
            checkBatch: async () => [],
        }

        const retryLimiter = withRetry(mockLimiter, { maxAttempts: 2, baseDelayMs: 10 })
        await expect(retryLimiter.check('1')).rejects.toThrow('persistent fail')
    })
})
