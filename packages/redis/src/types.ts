import type { CacheConfig, CircuitBreakerConfig, FallbackPolicy, RetryConfig } from '@ratelock/core'

/** Représente la structure minimale et stricte attendue d'un client Redis (node-redis, ioredis ou Bun RedisClient). */
export interface RedisClientLike {
    eval(script: string, ...args: any[]): Promise<any>
    get(key: string): Promise<string | null>
    set(key: string, value: string, ...args: any[]): Promise<any>
    del(...keys: string[]): Promise<number>
    pExpire?(key: string, ttlMs: number): Promise<unknown>
    pexpire?(key: string, ttlMs: number): Promise<unknown>
    multi(): any
    /** Bun native client entry point — detected before node-redis/ioredis heuristics. */
    send?(command: string, args: string[]): Promise<unknown>
}

/** Base configuration options for all Redis-backed rate limiters. */
export type RedisLimiterBaseConfig = {
    /**
     * An existing Redis client instance (e.g., node-redis, ioredis, or Bun
     * RedisClient). If provided, the limiter will reuse this instance.
     */
    client?: RedisClientLike
    /**
     * Redis connection URL (e.g., `redis://localhost:6379`).
     */
    url?: string
    /**
     * Explicitly specify the underlying driver: `'redis'` (node-redis), `'ioredis'`,
     * or `'bun'` (Bun >= 1.4 native RedisClient). Automatically detected if omitted.
     */
    driver?: 'redis' | 'ioredis' | 'bun'
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
