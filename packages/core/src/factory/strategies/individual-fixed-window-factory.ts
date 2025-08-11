// src/factory/strategies/individual-fixed-window-factory.ts
import type { RateLimiterPerformanceOptions, RateLimiterResilienceOptions } from '@/limiter/limiter';
import type { Storage } from '../../storage/storage'
import type {
  IndividualFixedWindowStrategy} from '../../strategy/individual-fixed-window';
import {
  type IndividualFixedWindowOptions,
  createIndividualFixedWindowStrategy
} from '../../strategy/individual-fixed-window'
import { BaseLimiterFactory } from '../base-factory'
import type { StorageFactory } from '../types'

/**
 * Factory for creating individual fixed window rate limiters.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 */
export class IndividualFixedWindowLimiterFactory<
  TStorageConfig,
  T extends Storage = Storage
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
 * Factory function for creating individual fixed window rate limiter factories.
 * Provides an easier way to create individual fixed window rate limiters.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 * @param storageFactory - Factory function to create storage instances
 * @returns A function that creates individual fixed window rate limiters
 */
export function createIndividualFixedWindowLimiterFactory<
  TStorageConfig,
  T extends Storage = Storage
>(
  storageFactory: StorageFactory<T, TStorageConfig>
) {
  const factory = new IndividualFixedWindowLimiterFactory(storageFactory)
  return (config: {
    strategy: IndividualFixedWindowOptions
    storage: TStorageConfig
    prefix?: string
    performance?: RateLimiterPerformanceOptions
    resilience?: RateLimiterResilienceOptions
  }) => factory.create(config)
}