import type { FixedWindowResult, IndividualFixedWindowOptions, Limiter } from '@ratelock/core'
import { beforeEach, describe, expect, it } from 'vitest'

type IndividualFixedWindowFactory = (
    opts: IndividualFixedWindowOptions
) => Promise<Limiter<FixedWindowResult>>

export function individualFixedWindowContract(createLimiter: IndividualFixedWindowFactory): void {
    describe('IndividualFixedWindow strategy', () => {
        let limiter: Limiter<FixedWindowResult>

        beforeEach(async () => {
            limiter = await createLimiter({ limit: 3, windowMs: 500 })
        })

        it('allows requests within the limit', async () => {
            const r = await limiter.check('ifw-user-1')
            expect(r.allowed).toBe(true)
        })

        it('blocks requests exceeding the limit', async () => {
            // Long window on purpose: a short window could roll over mid-test
            // (slow/cold drivers), legitimately resetting the counter and
            // flipping the denial assertion.
            const steadyLimiter = await createLimiter({ limit: 3, windowMs: 60_000 })
            for (let i = 0; i < 3; i++) {
                await steadyLimiter.check('ifw-saturated')
            }
            const r = await steadyLimiter.check('ifw-saturated')
            expect(r.allowed).toBe(false)
            await steadyLimiter.destroy?.()
        })

        it('isolates different identifiers', async () => {
            for (let i = 0; i < 3; i++) {
                await limiter.check('ifw-a')
            }
            const a = await limiter.check('ifw-a')
            const b = await limiter.check('ifw-b')
            expect(a.allowed).toBe(false)
            expect(b.allowed).toBe(true)
        })

        it('returns reset as epoch timestamp in ms', async () => {
            const r = await limiter.check('ifw-user-3')
            expect(r.reset).toBeGreaterThan(Date.now() - 1000)
        })

        it('handles checkBatch', async () => {
            const results = await limiter.checkBatch(['ifw-batch-1', 'ifw-batch-2'])
            expect(results).toHaveLength(2)
            expect(results[0]!.allowed).toBe(true)
        })

        it('checkBatch shares state across duplicate identifiers', async () => {
            const steadyLimiter = await createLimiter({ limit: 3, windowMs: 60_000 })
            const results = await steadyLimiter.checkBatch(['ifw-dup', 'ifw-other', 'ifw-dup'])
            expect(results).toHaveLength(3)
            // limit 3: two occurrences of the same id must both be admitted.
            expect(results.every(r => r.allowed)).toBe(true)
            await steadyLimiter.destroy?.()
        })

        it('checkBatch denies positions whose identifier is already exhausted', async () => {
            const steadyLimiter = await createLimiter({ limit: 3, windowMs: 60_000 })
            for (let i = 0; i < 3; i++) {
                await steadyLimiter.check('ifw-exhausted')
            }
            const results = await steadyLimiter.checkBatch(['ifw-exhausted', 'ifw-batch-fresh'])
            expect(results[0]!.allowed).toBe(false)
            expect(results[1]!.allowed).toBe(true)
            await steadyLimiter.destroy?.()
        })
    })
}
