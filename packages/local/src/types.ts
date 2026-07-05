import type { CircuitBreakerConfig, FallbackPolicy, RetryConfig } from '@ratelock/core'

/** Base configuration options for all in-memory Local rate limiters. */
export type LocalLimiterBaseConfig = {
    /** Key prefix in the internal Map store to avoid conflicts (default: strategy-specific like `'fw'`). */
    prefix?: string
    /**
     * Maximum number of keys allowed in the internal store before LRU cleanup triggers.
     * @default 100000
     */
    maxSize?: number
    /** Built-in retry policy configuration for transient errors. */
    retry?: RetryConfig
    /** Built-in circuit breaker configuration. */
    circuitBreaker?: CircuitBreakerConfig
    /** Built-in fallback policy behavior when the check fails. */
    fallback?: FallbackPolicy
}
export type { CircuitBreakerConfig, FallbackPolicy, RetryConfig }
