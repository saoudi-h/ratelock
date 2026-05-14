import {
    type CacheConfig,
    type CircuitBreakerConfig,
    type ErrorPolicy,
    type FixedWindowResult,
    type IndividualFixedWindowOptions,
    type Limiter,
    type RetryConfig,
    withCache,
    withCircuitBreaker,
    withErrorPolicy,
    withRetry,
} from '@ratelock/core'

type Entry = { count: number; start: number }

export type IndividualFixedWindowLimiterConfig = IndividualFixedWindowOptions & {
    cache?: CacheConfig
    retry?: RetryConfig
    circuitBreaker?: CircuitBreakerConfig
    errorPolicy?: ErrorPolicy
}

export async function createIndividualFixedWindowLimiter(
    config: IndividualFixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    const { limit, windowMs, prefix = 'ifw' } = config
    const state = new Map<string, Entry>()

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()
            let entry = state.get(key)

            if (!entry || now >= entry.start + windowMs) {
                entry = { count: 0, start: now }
                state.set(key, entry)
            }

            const allowed = entry.count < limit
            if (allowed) {
                entry.count++
                state.set(key, entry)
            }

            return {
                allowed,
                remaining: Math.max(0, limit - entry.count),
                reset: entry.start + windowMs,
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
