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
            for (let i = 0; i < 5; i++) {
                const r = await limiter.check('user-2')
                expect(r.allowed).toBe(true)
            }
            const r = await limiter.check('user-2')
            expect(r.allowed).toBe(false)
            expect(r.remaining).toBe(0)
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
    })
}
