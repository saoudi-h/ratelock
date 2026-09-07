import type { CacheConfig, CircuitBreakerConfig, FallbackPolicy, RetryConfig } from '@ratelock/core'

/** The pipeline surface required from the official Upstash REST client. */
export interface UpstashRedisPipeline {
    evalsha(sha1: string, keys: string[], args: string[]): unknown
    exec(): Promise<unknown[]>
}

/**
 * The small structural surface required from `@upstash/redis`.
 *
 * It is intentionally not imported from the Node.js entry point so the
 * generated declarations remain usable with `@upstash/redis/cloudflare` and
 * other provider-specific Upstash entry points.
 */
export interface UpstashRedisClient {
    evalsha(sha1: string, keys: string[], args: string[]): Promise<unknown>
    scriptLoad(script: string): Promise<string>
    pipeline(): UpstashRedisPipeline
}

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
