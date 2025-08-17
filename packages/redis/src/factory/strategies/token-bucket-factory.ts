import type { TokenBucketOptions } from '@ratelock/core/strategy'
import type { FactoryResult, StorageFactory } from '@ratelock/core/factory'
import { BaseLimiterFactory } from '@ratelock/core/factory'
import { RateLimiterPerformanceOptions, RateLimiterResilienceOptions } from '@ratelock/core/limiter'
import { RedisStorage } from 'storage/redis-storage.interface'
import { createTokenBucketStrategy, TokenBucketStrategy } from 'strategy/token-bucket'
import type { RedisStorageConfig } from '../storage-factory'
import { createRedisStorage } from '../storage-factory'



/**
 * Factory for creating token bucket rate limiters.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 */
export class TokenBucketLimiterFactory<
  TStorageConfig,
  T extends RedisStorage = RedisStorage
> extends BaseLimiterFactory<
  TokenBucketOptions,
  TStorageConfig,
  TokenBucketStrategy,
  T
> {
  /**
   * Creates a new instance of TokenBucketLimiterFactory.
   *
   * @param storageFactory - Factory function to create storage instances
   */
  constructor(storageFactory: StorageFactory<T, TStorageConfig>) {
    super(createTokenBucketStrategy, storageFactory)
  }
}

/**
 * Factory function for creating token bucket rate limiter factories.
 * Provides an easier way to create token bucket rate limiters.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 * @param storageFactory - Factory function to create storage instances
 * @returns A function that creates token bucket rate limiters
 */
export function createTokenBucketLimiterFactory<
  TStorageConfig,
  T extends RedisStorage = RedisStorage
>(
  storageFactory: StorageFactory<T, TStorageConfig>
) {
  const factory = new TokenBucketLimiterFactory(storageFactory)
  return (config: {
    strategy: TokenBucketOptions
    storage: TStorageConfig
    prefix?: string
    performance?: RateLimiterPerformanceOptions
    resilience?: RateLimiterResilienceOptions
  }) => factory.create(config)
}




/**
 * Configuration for creating a token bucket rate limiter with Redis.
 */
export interface RedisTokenBucketLimiterConfig {
  /**
   * Strategy-specific options.
   */
  strategy: TokenBucketOptions

  /**
   * Redis storage configuration.
   */
  storage: RedisStorageConfig
}

/**
 * Factory function to create a token bucket rate limiter with Redis storage.
 *
 * @param config - Configuration for the token bucket rate limiter.
 * @returns A promise that resolves to the factory result containing the limiter and its components.
 */
export const createTokenBucketLimiter = createTokenBucketLimiterFactory(createRedisStorage) as (config: RedisTokenBucketLimiterConfig) => Promise<FactoryResult<any>>
