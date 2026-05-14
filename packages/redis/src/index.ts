export { createFixedWindowLimiter } from './fixed-window'
export type { FixedWindowLimiterConfig } from './fixed-window'

export { createSlidingWindowLimiter } from './sliding-window'
export type { SlidingWindowLimiterConfig } from './sliding-window'

export { createTokenBucketLimiter } from './token-bucket'
export type { TokenBucketLimiterConfig } from './token-bucket'

export { createIndividualFixedWindowLimiter } from './individual-fixed-window'
export type { IndividualFixedWindowLimiterConfig } from './individual-fixed-window'

export { adaptClient, createConnection } from './client'
export type { RedisClient } from './client'

export { withCache, withCircuitBreaker, withErrorPolicy, withRetry } from '@ratelock/core'

export type {
    CacheConfig,
    CircuitBreakerConfig,
    ErrorPolicy,
    FixedWindowOptions,
    FixedWindowResult,
    IndividualFixedWindowOptions,
    Limiter,
    RetryConfig,
    SlidingWindowOptions,
    SlidingWindowResult,
    TokenBucketOptions,
    TokenBucketResult,
} from '@ratelock/core'
