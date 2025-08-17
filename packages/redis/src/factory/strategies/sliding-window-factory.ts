import type { SlidingWindowOptions } from '@ratelock/core/strategy'
import type { FactoryResult, StorageFactory } from '@ratelock/core/factory';
import { BaseLimiterFactory } from '@ratelock/core/factory'
import { RateLimiterPerformanceOptions, RateLimiterResilienceOptions } from '@ratelock/core/limiter'
import { RedisStorage } from 'storage/redis-storage.interface'
import { createSlidingWindowStrategy, SlidingWindowStrategy } from 'strategy/sliding-window';
import type { RedisStorageConfig } from '../storage-factory'
import { createRedisStorage } from '../storage-factory'





/**
 * Factory for creating sliding window rate limiters.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 */
export class SlidingWindowLimiterFactory<
  TStorageConfig,
  T extends RedisStorage = RedisStorage
> extends BaseLimiterFactory<
  SlidingWindowOptions,
  TStorageConfig,
  SlidingWindowStrategy,
  T
> {
  /**
   * Creates a new instance of SlidingWindowLimiterFactory.
   *
   * @param storageFactory - Factory function to create storage instances
   */
  constructor(storageFactory: StorageFactory<T, TStorageConfig>) {
    super(createSlidingWindowStrategy, storageFactory)
  }
}

/**
 * Factory function for creating sliding window rate limiter factories.
 * Provides an easier way to create sliding window rate limiters.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 * @param storageFactory - Factory function to create storage instances
 * @returns A function that creates sliding window rate limiters
 */
export function createSlidingWindowLimiterFactory<
  TStorageConfig,
  T extends RedisStorage = RedisStorage
>(
  storageFactory: StorageFactory<T, TStorageConfig>
) {
  const factory = new SlidingWindowLimiterFactory(storageFactory)
  return (config: {
    strategy: SlidingWindowOptions
    storage: TStorageConfig
    prefix?: string
    performance?: RateLimiterPerformanceOptions
    resilience?: RateLimiterResilienceOptions
  }) => factory.create(config)
}


/**
 * Configuration for creating a sliding window rate limiter with Redis.
 */
export interface RedisSlidingWindowLimiterConfig {
  /**
   * Strategy-specific options.
   */
  strategy: SlidingWindowOptions

  /**
   * Redis storage configuration.
   */
  storage: RedisStorageConfig
}

/**
 * Factory function to create a sliding window rate limiter with Redis storage.
 *
 * @param config - Configuration for the sliding window rate limiter.
 * @returns A promise that resolves to the factory result containing the limiter and its components.
 */
export const createSlidingWindowLimiter = createSlidingWindowLimiterFactory(createRedisStorage) as (config: RedisSlidingWindowLimiterConfig) => Promise<FactoryResult<any>>
