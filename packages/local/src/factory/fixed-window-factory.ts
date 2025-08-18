import type { FixedWindowOptions } from '@ratelock/core'
import type { FactoryResult } from '@ratelock/core/factory'
import { createFixedWindowLimiterFactory } from '@ratelock/core/factory'
import type { StorageConfig } from './storage-factory'
import { createStorage } from './storage-factory'

/**
 * Configuration for creating a fixed window rate limiter.
 */
export interface FixedWindowLimiterConfig {
    /**
     * Strategy-specific options.
     */
    strategy: FixedWindowOptions

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
 * Factory function to create a fixed window rate limiter with local storage.
 *
 * @param config - Configuration for the fixed window rate limiter
 * @returns A promise that resolves to the factory result containing the limiter and its components
 */
export const createFixedWindowLimiter = createFixedWindowLimiterFactory(createStorage) as (
    config: any
) => Promise<FactoryResult<any>>
