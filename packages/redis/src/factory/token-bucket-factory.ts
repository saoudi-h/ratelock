import { createTokenBucketLimiterFactory, FactoryResult } from '@ratelock/core/factory'
import { createRedisStorage, RedisStorageConfig } from './storage-factory'
import type { TokenBucketOptions } from '@ratelock/core/strategy'

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
