import { createSlidingWindowLimiterFactory, FactoryResult } from '@ratelock/core/factory'
import { createRedisStorage, RedisStorageConfig } from './storage-factory'
import type { SlidingWindowOptions } from '@ratelock/core/strategy'

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
