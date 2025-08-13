import { createIndividualFixedWindowLimiterFactory, FactoryResult } from '@ratelock/core/factory'
import { createRedisStorage, RedisStorageConfig } from './storage-factory'
import type { IndividualFixedWindowOptions } from '@ratelock/core/strategy'

/**
 * Configuration for creating an individual fixed window rate limiter with Redis.
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
 * Factory function to create an individual fixed window rate limiter with Redis storage.
 *
 * @param config - Configuration for the individual fixed window rate limiter.
 * @returns A promise that resolves to the factory result containing the limiter and its components.
 */
export const createIndividualFixedWindowLimiter = createIndividualFixedWindowLimiterFactory(createRedisStorage) as (config: RedisIndividualFixedWindowLimiterConfig) => Promise<FactoryResult<any>>
