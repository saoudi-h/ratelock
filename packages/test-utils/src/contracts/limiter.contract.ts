import type { BaseResult } from '@ratelock/core'
import type { Limiter } from '@ratelock/core/limiter'
import { beforeEach, describe, expect, it } from 'vitest'

/**
 * Factory function that returns a fresh instance of Limiter for each test.
 */
export type LimiterFactory<T extends BaseResult = BaseResult> = () => Limiter<T>

/**
 * Generic contract to validate a Rate Limiter adapter.
 */
export function limiterContract<T extends BaseResult = BaseResult>(
    createLimiter: LimiterFactory<T>
) {
    describe('RateLimiter Contract', () => {
        let limiter: Limiter<T>
        beforeEach(() => {
            limiter = createLimiter()
        })

        it('check returns a result with allowed (boolean)', async () => {
            const r = await limiter.check('user:1')
            expect(typeof r.allowed).toBe('boolean')
        })

        it('Two', async () => {
            const r1 = await limiter.check('user:2')
            const r2 = await limiter.check('user:2')
            expect(typeof r1.allowed).toBe('boolean')
            expect(typeof r2.allowed).toBe('boolean')
        })
    })
}
