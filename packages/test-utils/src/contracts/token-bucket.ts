import type { Limiter, TokenBucketOptions, TokenBucketResult } from '@ratelock/core'
import { beforeEach, describe, expect, it } from 'vitest'

type TokenBucketFactory = (opts: TokenBucketOptions) => Promise<Limiter<TokenBucketResult>>

export function tokenBucketContract(createLimiter: TokenBucketFactory): void {
    describe('TokenBucket strategy', () => {
        let limiter: Limiter<TokenBucketResult>

        beforeEach(async () => {
            limiter = await createLimiter({ capacity: 5, refillRate: 10 })
        })

        it('allows requests within capacity', async () => {
            const r = await limiter.check('tb-user-1')
            expect(r.allowed).toBe(true)
            expect(r.tokens).toBeGreaterThanOrEqual(0)
        })

        it('blocks requests when tokens exhausted', async () => {
            for (let i = 0; i < 5; i++) {
                const r = await limiter.check('tb-user-2')
                expect(r.allowed).toBe(true)
            }
            const r = await limiter.check('tb-user-2')
            expect(r.allowed).toBe(false)
        })

        it('isolates different identifiers', async () => {
            const [a, b] = await Promise.all([limiter.check('tb-a'), limiter.check('tb-b')])
            expect(a.allowed).toBe(true)
            expect(b.allowed).toBe(true)
        })

        it('reports remaining and refillTime', async () => {
            const r = await limiter.check('tb-user-3')
            expect(typeof r.remaining).toBe('number')
            expect(typeof r.refillTime).toBe('number')
        })

        it('handles checkBatch', async () => {
            const results = await limiter.checkBatch(['tb-batch-1', 'tb-batch-2'])
            expect(results).toHaveLength(2)
            expect(results[0]!.allowed).toBe(true)
        })
    })
}
