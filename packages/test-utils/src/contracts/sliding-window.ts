import type { Limiter, SlidingWindowOptions, SlidingWindowResult } from '@ratelock/core'
import { beforeEach, describe, expect, it } from 'vitest'

type SlidingWindowFactory = (opts: SlidingWindowOptions) => Promise<Limiter<SlidingWindowResult>>

export function slidingWindowContract(createLimiter: SlidingWindowFactory): void {
    describe('SlidingWindow strategy', () => {
        let limiter: Limiter<SlidingWindowResult>

        beforeEach(async () => {
            limiter = await createLimiter({ limit: 5, windowMs: 500 })
        })

        it('allows requests within the limit', async () => {
            const r = await limiter.check('sl-user-1')
            expect(r.allowed).toBe(true)
            expect(r.remaining).toBeGreaterThanOrEqual(0)
        })

        it('blocks requests exceeding the limit', async () => {
            // Long window on purpose: entries from the first checks must not
            // expire while the test is still issuing requests.
            const steadyLimiter = await createLimiter({ limit: 5, windowMs: 60_000 })
            for (let i = 0; i < 5; i++) {
                const r = await steadyLimiter.check('sw-saturated')
                expect(r.allowed).toBe(true)
            }
            const r = await steadyLimiter.check('sw-saturated')
            expect(r.allowed).toBe(false)
            expect(r.remaining).toBe(0)
            await steadyLimiter.destroy?.()
        })

        it('provides windowStart and windowEnd', async () => {
            const r = await limiter.check('sl-user-3')
            expect(r.windowStart).toBeGreaterThan(0)
            expect(r.windowEnd).toBeGreaterThan(r.windowStart)
        })

        it('isolates different identifiers', async () => {
            const [a, b] = await Promise.all([limiter.check('sl-a'), limiter.check('sl-b')])
            expect(a.allowed).toBe(true)
            expect(b.allowed).toBe(true)
        })

        it('handles checkBatch', async () => {
            const results = await limiter.checkBatch(['sl-batch-1', 'sl-batch-2'])
            expect(results).toHaveLength(2)
            expect(results[0]!.allowed).toBe(true)
        })

        it('checkBatch accumulates duplicate identifiers into the shared window', async () => {
            const steadyLimiter = await createLimiter({ limit: 5, windowMs: 60_000 })
            const results = await steadyLimiter.checkBatch(['sw-dup', 'sw-dup'])
            expect(results).toHaveLength(2)
            expect(results.every(r => r.allowed)).toBe(true)
            // Second occurrence must see the entry added by the first.
            expect(results[0]!.remaining - results[1]!.remaining).toBe(1)
            await steadyLimiter.destroy?.()
        })
    })
}
