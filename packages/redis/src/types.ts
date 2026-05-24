import type { CacheConfig, CircuitBreakerConfig, FallbackPolicy, RetryConfig } from '@ratelock/core'

/** Représente la structure minimale et stricte attendue d'un client Redis (node-redis ou ioredis). */
export interface RedisClientLike {
    eval(script: string, ...args: any[]): Promise<any>
    get(key: string): Promise<string | null>
    set(key: string, value: string, ...args: any[]): Promise<any>
    del(...keys: string[]): Promise<number>
    pExpire?(key: string, ttlMs: number): Promise<unknown>
    pexpire?(key: string, ttlMs: number): Promise<unknown>
    multi(): any
}

/** Base configuration options for all Redis-backed rate limiters. */
export type RedisLimiterBaseConfig = {
    /**
     * An existing Redis client instance (e.g., node-redis or ioredis client).
     * If provided, the limiter will reuse this instance.
     */
    client?: RedisClientLike
    /**
     * Redis connection URL (e.g., `redis://localhost:6379`).
     * Interchangeable with `connectionString`.
     */
    url?: string
    /**
     * Redis connection string (e.g., `redis://localhost:6379`).
     * Interchangeable with `url`.
     */
    connectionString?: string
    /**
     * Explicitly specify the underlying driver: `'redis'` (node-redis) or `'ioredis'`.
     * Automatically detected if omitted.
     */
    driver?: 'redis' | 'ioredis'
    /** Key prefix in Redis to avoid conflicts (default: strategy-specific like `'fw'`). */
    prefix?: string
    /** Built-in in-memory denial cache configuration. */
    cache?: CacheConfig
    /** Built-in retry policy configuration for transient Redis errors. */
    retry?: RetryConfig
    /** Built-in circuit breaker configuration. */
    circuitBreaker?: CircuitBreakerConfig
    /** Built-in fallback policy behavior when Redis is unavailable. */
    fallback?: FallbackPolicy
}
export type { CacheConfig, CircuitBreakerConfig, FallbackPolicy, RetryConfig }
