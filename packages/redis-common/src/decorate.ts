import {
    type BaseResult,
    type Limiter,
    withCache,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'

import type { RedisLimiterOptions } from './types'

export function decorateLimiter<T extends BaseResult>(
    limiter: Limiter<T>,
    config: RedisLimiterOptions
): Limiter<T> {
    let decorated = limiter

    if (config.cache) decorated = withCache(decorated, config.cache)
    if (config.retry) decorated = withRetry(decorated, config.retry)
    if (config.circuitBreaker) decorated = withCircuitBreaker(decorated, config.circuitBreaker)
    if (config.fallback) decorated = withFallback(decorated, config.fallback)

    return decorated
}
