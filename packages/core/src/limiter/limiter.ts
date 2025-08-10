import type { BatchConfig } from '../cache/batch-processor'
import type { CacheConfig } from '../cache/l1-cache'
import type { LazyCleanupConfig } from '../cache/lazy-timestamp-cleaner'
import type { CircuitBreakerConfig } from '../error/circuit-breaker'
import type { RetryConfig } from '../error/retry'
import type { Storage } from '../storage/storage'
import type { BaseResult } from '../strategy/base'
import type { Strategy } from '../strategy/strategy'

export interface Limiter<T extends BaseResult = BaseResult> {
    check(identifier: string): Promise<T>
}

export interface RateLimiterPerformanceOptions {
    cache?: CacheConfig
    batch?: BatchConfig
    lazyCleanup?: LazyCleanupConfig
}

export interface RateLimiterResilienceOptions {
    retryConfig?: RetryConfig
    circuitBreakerConfig?: CircuitBreakerConfig
}

export type StrategyFactory<S extends Strategy<any, any>> = (storage: Storage) => S

export interface LimiterOptions<S extends Strategy<any, any> = Strategy<any, any>> {
    // Provide either a constructed strategy OR a factory to build one with effective storage
    strategy?: S
    strategyFactory?: StrategyFactory<S>
    storage: Storage
    errorPolicy?: 'throw' | 'allow' | 'deny'
    prefix?: string
    performance?: RateLimiterPerformanceOptions
    resilience?: RateLimiterResilienceOptions
}
