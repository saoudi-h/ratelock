import {
    type CacheConfig,
    type CircuitBreakerConfig,
    type ErrorPolicy,
    type FixedWindowOptions,
    type FixedWindowResult,
    type Limiter,
    type RetryConfig,
    withCache,
    withCircuitBreaker,
    withErrorPolicy,
    withRetry,
} from '@ratelock/core'

type Entry = { count: number; reset: number }

export type FixedWindowLimiterConfig = FixedWindowOptions & {
    cache?: CacheConfig
    retry?: RetryConfig
    circuitBreaker?: CircuitBreakerConfig
    errorPolicy?: ErrorPolicy
}

export async function createFixedWindowLimiter(
    config: FixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    const { limit, windowMs, prefix = 'fw' } = config
    const state = new Map<string, Entry>()

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()
            const entry = state.get(key)

            if (!entry || now >= entry.reset) {
                state.set(key, { count: 1, reset: now + windowMs })
                return { allowed: true, remaining: limit - 1, reset: now + windowMs }
            }

            const allowed = entry.count < limit
            if (allowed) {
                entry.count++
                state.set(key, entry)
            }

            return {
                allowed,
                remaining: Math.max(0, limit - entry.count - (allowed ? 0 : 1)),
                reset: entry.reset,
            }
        },

        checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
            return Promise.all(ids.map(id => this.check(id)))
        },
    }

    if (config.cache) limiter = withCache(limiter, config.cache)
    if (config.retry) limiter = withRetry(limiter, config.retry)
    if (config.circuitBreaker) limiter = withCircuitBreaker(limiter, config.circuitBreaker)
    if (config.errorPolicy) limiter = withErrorPolicy(limiter, config.errorPolicy)

    return limiter
}
