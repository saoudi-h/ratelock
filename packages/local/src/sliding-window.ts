import {
    type CacheConfig,
    type CircuitBreakerConfig,
    type ErrorPolicy,
    type Limiter,
    type RetryConfig,
    type SlidingWindowOptions,
    type SlidingWindowResult,
    withCache,
    withCircuitBreaker,
    withErrorPolicy,
    withRetry,
} from '@ratelock/core'

export type SlidingWindowLimiterConfig = SlidingWindowOptions & {
    cache?: CacheConfig
    retry?: RetryConfig
    circuitBreaker?: CircuitBreakerConfig
    errorPolicy?: ErrorPolicy
}

export async function createSlidingWindowLimiter(
    config: SlidingWindowLimiterConfig
): Promise<Limiter<SlidingWindowResult>> {
    const { limit, windowMs, prefix = 'sw' } = config
    const state = new Map<string, number[]>()

    let limiter: Limiter<SlidingWindowResult> = {
        async check(id: string): Promise<SlidingWindowResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()
            const cutoff = now - windowMs

            let timestamps = state.get(key) ?? []
            timestamps = timestamps.filter(ts => ts > cutoff)

            const allowed = timestamps.length < limit
            if (allowed) timestamps.push(now)

            state.set(key, timestamps)

            const oldest = timestamps.length > 0 ? Math.min(...timestamps) : now

            return {
                allowed,
                remaining: Math.max(0, limit - timestamps.length),
                reset: oldest + windowMs,
                windowStart: oldest,
                windowEnd: oldest + windowMs,
            }
        },

        checkBatch(ids: string[]): Promise<SlidingWindowResult[]> {
            return Promise.all(ids.map(id => this.check(id)))
        },
    }

    if (config.cache) limiter = withCache(limiter, config.cache)
    if (config.retry) limiter = withRetry(limiter, config.retry)
    if (config.circuitBreaker) limiter = withCircuitBreaker(limiter, config.circuitBreaker)
    if (config.errorPolicy) limiter = withErrorPolicy(limiter, config.errorPolicy)

    return limiter
}
