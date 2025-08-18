import { createSlidingWindowLimiterFactory } from '@ratelock/core/factory'
import type { SlidingWindowOptions } from '@ratelock/core/strategy'
import type { StorageConfig } from './storage-factory'
import { createStorage } from './storage-factory'

/**
 * Configuration for creating a sliding window rate limiter.
 */
export interface SlidingWindowLimiterConfig {
    /**
     * Strategy-specific options.
     */
    strategy: SlidingWindowOptions

    /**
     * Storage configuration.
     */
    storage?: StorageConfig

    /**
     * Optional prefix for keys stored in the storage.
     */
    prefix?: string

    /**
     * Optional performance configuration.
     */
    performance?: any

    /**
     * Optional resilience configuration.
     */
    resilience?: any
}

/**
 * Factory function to create a sliding window rate limiter with local storage.
 *
 * @param config - Configuration for the sliding window rate limiter
 * @returns A promise that resolves to the factory result containing the limiter and its components
 */
export const createSlidingWindowLimiter = createSlidingWindowLimiterFactory(createStorage) as (
    config: any
) => Promise<any>
