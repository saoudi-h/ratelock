import { createIndividualFixedWindowLimiterFactory } from '@ratelock/core/factory'
import type { IndividualFixedWindowOptions } from '@ratelock/core/strategy'
import type { StorageConfig } from './storage-factory'
import { createStorage } from './storage-factory'

/**
 * Configuration for creating an individual fixed window rate limiter.
 */
export interface IndividualFixedWindowLimiterConfig {
    /**
     * Strategy-specific options.
     */
    strategy: IndividualFixedWindowOptions

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
 * Factory function to create an individual fixed window rate limiter with local storage.
 *
 * @param config - Configuration for the individual fixed window rate limiter
 * @returns A promise that resolves to the factory result containing the limiter and its components
 */
export const createIndividualFixedWindowLimiter = createIndividualFixedWindowLimiterFactory(
    createStorage
) as (config: any) => Promise<any>
