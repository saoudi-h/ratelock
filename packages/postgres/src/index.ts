export { fixedWindow } from './fixed-window'
export type { FixedWindowLimiterConfig } from './fixed-window'

export { slidingWindow } from './sliding-window'
export type { SlidingWindowLimiterConfig } from './sliding-window'

export { tokenBucket } from './token-bucket'
export type { TokenBucketLimiterConfig } from './token-bucket'

export { individualFixedWindow } from './individual-fixed-window'
export type { IndividualFixedWindowLimiterConfig } from './individual-fixed-window'

export { cleanupExpired } from './cleanup'
export { createConnection, pgDriver, postgresDriver } from './drivers'
export type { PgDriver } from './drivers/types'
export { runMigrations } from './migrations'
export type { PgPoolLike, PostgresLimiterBaseConfig, PostgresSqlLike } from './types'

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

export { withCache, withCircuitBreaker, withFallback, withRetry } from '@ratelock/core'
export type { CacheConfig, CircuitBreakerConfig, FallbackPolicy, RetryConfig } from '@ratelock/core'
