import type { BaseResult } from '@ratelock/core'
import type { Limiter } from '@ratelock/core/limiter'
import { beforeEach, describe, expect, it } from 'vitest'

/**
 * Factory qui retourne une instance fraîche de Limiter pour chaque test.
 */
export type LimiterFactory<T extends BaseResult = BaseResult> = () => Limiter<T>

/**
 * Contrat générique pour valider un adaptateur de Rate Limiter.
 * À utiliser dans les adaptateurs via:
 *
 *   import { describe } from "vitest";
 *   import { limiterContract } from "@ratelock/test-utils";
 *   import { MyLimiter } from "./rate-limiter.impl";
 *
 *   describe("MyLimiter contract", () => {
 *     limiterContract(() => new MyLimiter(...));
 *   });
 */
export function limiterContract<T extends BaseResult = BaseResult>(
    createLimiter: LimiterFactory<T>
) {
    describe('RateLimiter Contract', () => {
        let limiter: Limiter<T>

        beforeEach(() => {
            limiter = createLimiter()
        })

        it('check renvoie un résultat avec allowed (boolean)', async () => {
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
