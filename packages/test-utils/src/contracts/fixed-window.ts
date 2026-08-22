import type { FixedWindowOptions, FixedWindowResult, Limiter } from '@ratelock/core'
import { beforeEach, describe, expect, it } from 'vitest'

type FixedWindowFactory = (opts: FixedWindowOptions) => Promise<Limiter<FixedWindowResult>>

export function fixedWindowContract(createLimiter: FixedWindowFactory): void {
    describe('FixedWindow strategy', () => {
        let limiter: Limiter<FixedWindowResult>

        beforeEach(async () => {
            limiter = await createLimiter({ limit: 5, windowMs: 500 })
        })

        it('allows requests within the limit', async () => {
            const r = await limiter.check('user-1')
            expect(r.allowed).toBe(true)
            expect(r.remaining).toBeGreaterThanOrEqual(0)
            expect(r.remaining).toBeLessThanOrEqual(4)
        })

        it('blocks requests exceeding the limit', async () => {
            // Long window on purpose: a short window could roll over mid-test
            // (slow/cold drivers), legitimately resetting the counter and
            // flipping the denial assertion.
            const steadyLimiter = await createLimiter({ limit: 5, windowMs: 60_000 })
            for (let i = 0; i < 5; i++) {
                const r = await steadyLimiter.check('fw-saturated')
                expect(r.allowed).toBe(true)
            }
            const r = await steadyLimiter.check('fw-saturated')
            expect(r.allowed).toBe(false)
            expect(r.remaining).toBe(0)
            await steadyLimiter.destroy?.()
        })

        it('resets after windowMs', async () => {
            for (let i = 0; i < 5; i++) {
                await limiter.check('user-3')
            }
            const blocked = await limiter.check('user-3')
            expect(blocked.allowed).toBe(false)

            await new Promise(r => setTimeout(r, 550))

            const allowed = await limiter.check('user-3')
            expect(allowed.allowed).toBe(true)
            expect(allowed.remaining).toBe(4)
        })

        it('isolates different identifiers', async () => {
            const [a, b] = await Promise.all([
                limiter.check('isolate-a'),
                limiter.check('isolate-b'),
            ])
            expect(a.allowed).toBe(true)
            expect(b.allowed).toBe(true)
        })

        it('returns reset as epoch timestamp in ms', async () => {
            const now = Date.now()
            const r = await limiter.check('user-4')
            expect(r.reset).toBeGreaterThan(now - 1000)
            expect(r.reset).toBeLessThan(now + 5000)
        })

        it('aligns window resets strictly to the epoch', async () => {
            const windowMs = 500
            const localLimiter = await createLimiter({ limit: 5, windowMs })
            const now = Date.now()
            const expectedReset = Math.floor(now / windowMs) * windowMs + windowMs

            const r = await localLimiter.check('epoch-user')
            expect(r.reset).toBe(expectedReset)
        })

        it('reports accurate remaining count', async () => {
            for (let i = 0; i < 3; i++) {
                const r = await limiter.check('user-5')
                expect(r.remaining).toBe(5 - i - 1)
            }
            const r = await limiter.check('user-5')
            expect(r.remaining).toBe(1)
        })

        it('handles checkBatch', async () => {
            const results = await limiter.checkBatch(['batch-1', 'batch-2', 'batch-1'])
            expect(results).toHaveLength(3)
            expect(results[0]!.allowed).toBe(true)
            expect(results[2]!.allowed).toBe(true)
        })

        it('checkBatch shares state across duplicate identifiers in position order', async () => {
            const steadyLimiter = await createLimiter({ limit: 5, windowMs: 60_000 })
            const results = await steadyLimiter.checkBatch(['fw-dup', 'fw-other', 'fw-dup'])
            expect(results).toHaveLength(3)
            expect(results.every(r => r.allowed)).toBe(true)
            // limit 5: first occurrence consumes one slot, second occurrence
            // must observe the accumulated state of the first.
            expect(results[0]!.remaining).toBe(4)
            expect(results[1]!.remaining).toBe(4)
            expect(results[2]!.remaining).toBe(3)
            await steadyLimiter.destroy?.()
        })

        it('checkBatch denies positions whose identifier is already exhausted', async () => {
            const steadyLimiter = await createLimiter({ limit: 5, windowMs: 60_000 })
            for (let i = 0; i < 5; i++) {
                await steadyLimiter.check('fw-exhausted')
            }
            const results = await steadyLimiter.checkBatch(['fw-exhausted', 'fw-batch-fresh'])
            expect(results[0]!.allowed).toBe(false)
            expect(results[0]!.remaining).toBe(0)
            expect(results[1]!.allowed).toBe(true)
            await steadyLimiter.destroy?.()
        })
    })
}
