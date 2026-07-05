import type { BaseResult, FallbackPolicy, Limiter } from './types'

import { RatelockError } from './errors'

/**
 * Decorates a rate limiter with a Fallback resilience policy.
 *
 * **Resilience Behavior:**
 * If the downstream rate limit check fails (due to database connection issues, timeouts, lock contention, etc.),
 * this decorator intercepts the exception and applies a predefined strategy:
 * - `'allow'`: Gracefully fails open by returning an allowed result (`allowed: true`) alongside optional customized default properties.
 * - `'deny'`: Fails closed by returning a blocked result (`allowed: false`).
 * - `'throw'`: Propagates a standard `RatelockError` to the caller.
 *
 * @param limiter The downstream RateLimiter engine to wrap.
 * @param policy The fallback strategy to apply ('allow' | 'deny' | 'throw').
 * @param defaults Optional default fields to merge into the fallback result (e.g., remaining, reset).
 * @returns A resilient RateLimiter engine with fallback behaviors.
 */
export function withFallback<T extends BaseResult>(
    limiter: Limiter<T>,
    policy: FallbackPolicy,
    defaults?: Partial<T>
): Limiter<T> {
    const handle = async (id: string): Promise<T> => {
        try {
            return await limiter.check(id)
        } catch (err) {
            switch (policy) {
                case 'allow':
                    return { allowed: true, ...defaults } as T
                case 'deny':
                    return { allowed: false, ...defaults } as T
                case 'throw':
                default:
                    throw new RatelockError(`Rate limit check failed for "${id}"`, {
                        cause: err,
                    })
            }
        }
    }

    const handleBatch = async (ids: string[]): Promise<T[]> => {
        try {
            return await limiter.checkBatch(ids)
        } catch (err) {
            switch (policy) {
                case 'allow':
                    return ids.map(() => ({ allowed: true, ...defaults }) as T)
                case 'deny':
                    return ids.map(() => ({ allowed: false, ...defaults }) as T)
                case 'throw':
                default:
                    throw new RatelockError(
                        `Rate limit check failed for batch of "${ids.join(', ')}"`,
                        { cause: err }
                    )
            }
        }
    }

    return {
        check: handle,
        checkBatch: handleBatch,
        async destroy() {
            await limiter.destroy?.()
        },
    }
}
