import type { CacheConfig, CircuitBreakerConfig, FallbackPolicy, RetryConfig } from '@ratelock/core'

/** The Redis command surface required by the shared Lua-script strategies. */
export interface RedisScriptClient {
    evalsha(sha1: string, keys: string[], args: string[]): Promise<unknown>
    loadScript(script: string): Promise<string>
    pipeline(): RedisScriptPipeline
}

/** Ordered EVALSHA batch used by `checkBatch`. */
export interface RedisScriptPipeline {
    evalsha(sha1: string, keys: string[], args: string[]): void
    exec(): Promise<unknown[]>
}

export interface RedisConnection {
    client: RedisScriptClient
    disconnect: () => Promise<void>
}

export type ConnectionFactory<Config> = (config: Config) => Promise<RedisConnection>

/** Options shared by all Redis-backed strategies, independent of transport. */
export type RedisLimiterOptions = {
    prefix?: string
    cache?: CacheConfig
    retry?: RetryConfig
    circuitBreaker?: CircuitBreakerConfig
    fallback?: FallbackPolicy
}

export type { CacheConfig, CircuitBreakerConfig, FallbackPolicy, RetryConfig }
