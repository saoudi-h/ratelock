import type { FactoryResult, StorageFactory } from '@ratelock/core/factory'
import { BaseLimiterFactory } from '@ratelock/core/factory'
import type { RateLimiterPerformanceOptions, RateLimiterResilienceOptions } from '@ratelock/core/limiter'
import type { IndividualFixedWindowOptions } from '@ratelock/core/strategy'
import type { RedisStorage } from 'storage/redis-storage.interface'
import type {
    IndividualFixedWindowStrategy} from 'strategy/individual-fixed-window';
import {
    createIndividualFixedWindowStrategy
} from 'strategy/individual-fixed-window'
import type { RedisStorageConfig } from '../storage-factory'
import { createRedisStorage } from '../storage-factory'

/**
 * Factory for creating individual-fixed-window rate limiters.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 */
export class IndividualFixedWindowLimiterFactory<
    TStorageConfig,
    T extends RedisStorage = RedisStorage,
> extends BaseLimiterFactory<
    IndividualFixedWindowOptions,
    TStorageConfig,
    IndividualFixedWindowStrategy,
    T
> {
    /**
     * Creates a new instance of IndividualFixedWindowLimiterFactory.
     *
     * @param storageFactory - Factory function to create storage instances
     */
    constructor(storageFactory: StorageFactory<T, TStorageConfig>) {
        super(createIndividualFixedWindowStrategy, storageFactory)
    }
}

/**
 * Factory function for creating individual-fixed-window rate-limiter factories.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 * @param storageFactory - Factory function to create storage instances
 * @returns A function that creates individual-fixed-window rate limiters
 */
export function createIndividualFixedWindowLimiterFactory<
    TStorageConfig,
    T extends RedisStorage = RedisStorage,
>(storageFactory: StorageFactory<T, TStorageConfig>) {
    const factory = new IndividualFixedWindowLimiterFactory(storageFactory)
    return (config: {
        strategy: IndividualFixedWindowOptions
        storage: TStorageConfig
        prefix?: string
        performance?: RateLimiterPerformanceOptions
        resilience?: RateLimiterResilienceOptions
    }) => factory.create(config)
}

/**
 * Configuration for creating an individual-fixed-window rate limiter with Redis.
 */
export interface RedisIndividualFixedWindowLimiterConfig {
    /**
     * Strategy-specific options.
     */
    strategy: IndividualFixedWindowOptions

    /**
     * Redis storage configuration.
     */
    storage: RedisStorageConfig
}

/**
 * Factory function to create an individual-fixed-window rate limiter with Redis storage.
 *
 * @param config - Configuration for the individual-fixed-window rate limiter.
 * @returns A promise that resolves to the factory result containing the limiter and its components.
 */
export const createIndividualFixedWindowLimiter = createIndividualFixedWindowLimiterFactory(
    createRedisStorage
) as (config: RedisIndividualFixedWindowLimiterConfig) => Promise<FactoryResult<any>>
