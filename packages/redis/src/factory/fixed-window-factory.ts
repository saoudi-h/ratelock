import type { FactoryResult } from '@ratelock/core/factory';
import { createFixedWindowLimiterFactory } from '@ratelock/core/factory'
import type { RedisStorageConfig } from './storage-factory';
import { createRedisStorage } from './storage-factory'
import type { FixedWindowOptions } from '@ratelock/core'

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
export const createFixedWindowLimiter = createFixedWindowLimiterFactory(createRedisStorage) as (config: RedisFixedWindowLimiterConfig) => Promise<FactoryResult<any>>
