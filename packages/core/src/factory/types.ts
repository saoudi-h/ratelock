// src/factory/types.ts

import type { RateLimiter, Strategy } from '..'
import type {
  RateLimiterPerformanceOptions,
  RateLimiterResilienceOptions
} from '../limiter/limiter'
import type { Storage } from '../storage/storage'

/**
 * Base factory configuration that all strategies will extend.
 * Provides common configuration options for rate limiters.
 */
export interface BaseFactoryConfig {
  /**
   * Optional prefix for keys stored in the storage.
   */
  prefix?: string

  /**
   * Optional performance configuration for the rate limiter.
   */
  performance?: RateLimiterPerformanceOptions

  /**
   * Optional resilience configuration for the rate limiter.
   */
  resilience?: RateLimiterResilienceOptions
}

/**
 * Generic factory result - can be customized per implementation.
 * Contains the created rate limiter and optionally its underlying components.
 *
 * @template S - Type of strategy
 * @template T - Type of storage
 */
export interface FactoryResult<
  S extends Strategy<any>,
  T extends Storage = Storage
> {
  /**
   * The created rate limiter instance.
   */
  limiter: RateLimiter<S>

  /**
   * Optional: expose underlying storage component if needed.
   */
  storage?: T

  /**
   * Optional: expose underlying strategy component if needed.
   */
  strategy?: S
}

/**
 * Storage factory interface - allows different packages to provide their own storage implementations.
 *
 * @template T - Type of storage
 * @template TConfig - Type of configuration for the storage
 */
export interface StorageFactory<T extends Storage = Storage, TConfig = any> {
  /**
   * Creates a new storage instance with the specified configuration.
   *
   * @param config - Configuration for the storage
   * @returns The created storage instance or a promise resolving to it
   */
  (config: TConfig): T | Promise<T>
}

/**
 * Strategy factory configuration type with proper inference.
 * Combines base factory configuration with strategy-specific options.
 *
 * @template TStrategyOptions - Type of strategy options
 */
export type StrategyFactoryConfig<TStrategyOptions> = BaseFactoryConfig & {
  /**
   * Strategy-specific options.
   */
  strategy: TStrategyOptions
}

/**
 * Generic limiter factory interface.
 *
 * @template TStrategyOptions - Type of strategy options
 * @template TStorageConfig - Type of storage configuration
 * @template S - Type of strategy
 * @template T - Type of storage
 */
export interface LimiterFactory<
  TStrategyOptions,
  TStorageConfig,
  S extends Strategy<any>,
  T extends Storage = Storage
> {
  /**
   * Creates a new rate limiter instance with the specified configuration.
   *
   * @param config - Configuration for the rate limiter
   * @returns The factory result or a promise resolving to it
   */
  (config: StrategyFactoryConfig<TStrategyOptions> & {
    storage: TStorageConfig
  }): Promise<FactoryResult<S, T>> | FactoryResult<S, T>
}