import type { CacheConfig, CircuitBreakerConfig, FallbackPolicy, RetryConfig } from '@ratelock/core'
import type { Redis } from '@upstash/redis'

/** The official Upstash REST client surface used by RateLock. */
export type UpstashRedisClient = Pick<Redis, 'evalsha' | 'scriptLoad' | 'pipeline'>

/** Base configuration shared by all Upstash-backed rate limiters. */
export type UpstashLimiterBaseConfig = {
    /** An `@upstash/redis` client, usable from Node, serverless and Edge runtimes. */
    client: UpstashRedisClient
    /** Key prefix in Upstash Redis (default: strategy-specific like `'fw'`). */
    prefix?: string
    /** Built-in in-memory denial cache configuration. */
    cache?: CacheConfig
    /** Built-in retry policy configuration for transient Upstash errors. */
    retry?: RetryConfig
    /** Built-in circuit breaker configuration. */
    circuitBreaker?: CircuitBreakerConfig
    /** Built-in fallback policy behavior when Upstash is unavailable. */
    fallback?: FallbackPolicy
}

export type { CacheConfig, CircuitBreakerConfig, FallbackPolicy, RetryConfig }
