import type { FixedWindowOptions } from '@ratelock/core/strategy'
import type { FactoryResult, StorageFactory } from '@ratelock/core/factory'
import { BaseLimiterFactory } from '@ratelock/core/factory'
import { RateLimiterPerformanceOptions, RateLimiterResilienceOptions } from '@ratelock/core/limiter'
import { RedisStorage } from 'storage/redis-storage.interface'
import { createFixedWindowStrategy, FixedWindowStrategy } from 'strategy/fixed-window'
import type { RedisStorageConfig } from '../storage-factory'
import { createRedisStorage } from '../storage-factory'



/**
 * Factory for creating fixed window rate limiters.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 */
export class FixedWindowLimiterFactory<
    TStorageConfig,
    T extends RedisStorage = RedisStorage,
> extends BaseLimiterFactory<FixedWindowOptions, TStorageConfig, FixedWindowStrategy, T> {
    /**
     * Creates a new instance of FixedWindowLimiterFactory.
     *
     * @param storageFactory - Factory function to create storage instances
     */
    constructor(storageFactory: StorageFactory<T, TStorageConfig>) {
        super(createFixedWindowStrategy, storageFactory)
    }
}

/**
 * Factory function for creating fixed window rate limiter factories.
 * Provides an easier way to create fixed window rate limiters.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 * @param storageFactory - Factory function to create storage instances
 * @returns A function that creates fixed window rate limiters
 */
export function createFixedWindowLimiterFactory<
    TStorageConfig,
    T extends RedisStorage = RedisStorage,
>(storageFactory: StorageFactory<T, TStorageConfig>) {
    const factory = new FixedWindowLimiterFactory(storageFactory)
    return (config: {
        strategy: FixedWindowOptions
        storage: TStorageConfig
        prefix?: string
        performance?: RateLimiterPerformanceOptions
        resilience?: RateLimiterResilienceOptions
    }) => factory.create(config)
}

/**
 * Configuration for creating a fixed window rate limiter with Redis.
 */
export interface RedisFixedWindowLimiterConfig {
    /**
     * Strategy-specific options.
     */
    strategy: FixedWindowOptions

    /**
     * Redis storage configuration.
     */
    storage: RedisStorageConfig
}

/**
 * Factory function to create a fixed window rate limiter with Redis storage.
 *
 * @param config - Configuration for the fixed window rate limiter.
 * @returns A promise that resolves to the factory result containing the limiter and its components.
 */
export const createFixedWindowLimiter = createFixedWindowLimiterFactory(createRedisStorage) as (
    config: RedisFixedWindowLimiterConfig
) => Promise<FactoryResult<any>>
