export { createFixedWindowLimiter } from './fixed-window'
export type { FixedWindowLimiterConfig } from './fixed-window'

export { createSlidingWindowLimiter } from './sliding-window'
export type { SlidingWindowLimiterConfig } from './sliding-window'

export { createTokenBucketLimiter } from './token-bucket'
export type { TokenBucketLimiterConfig } from './token-bucket'

export { createIndividualFixedWindowLimiter } from './individual-fixed-window'
export type { IndividualFixedWindowLimiterConfig } from './individual-fixed-window'

export { createConnection, pgDriver, postgresDriver } from './drivers'
export type { PgDriver } from './drivers/types'

export { cleanupExpired } from './cleanup'
export { runMigrations } from './migrations'

export type {
    FixedWindowOptions,
    FixedWindowResult,
    IndividualFixedWindowOptions,
    Limiter,
    SlidingWindowOptions,
    SlidingWindowResult,
    TokenBucketOptions,
    TokenBucketResult,
} from '@ratelock/core'

export { withCache, withCircuitBreaker, withErrorPolicy, withRetry } from '@ratelock/core'
export type { CacheConfig, CircuitBreakerConfig, ErrorPolicy, RetryConfig } from '@ratelock/core'
