import type { RateLimiterPerformanceOptions, RateLimiterResilienceOptions } from '@/limiter/limiter';
import type { Storage } from '../../storage/storage'
import type {
  SlidingWindowStrategy} from '../../strategy/sliding-window';
import {
  type SlidingWindowOptions,
  createSlidingWindowStrategy
} from '../../strategy/sliding-window'
import { BaseLimiterFactory } from '../base-factory'
import type { StorageFactory } from '../types'

/**
 * Factory for creating sliding window rate limiters.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 */
export class SlidingWindowLimiterFactory<
  TStorageConfig,
  T extends Storage = Storage
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
  T extends Storage = Storage
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