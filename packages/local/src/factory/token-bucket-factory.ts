import { createTokenBucketLimiterFactory } from '@ratelock/core/factory'
import type { TokenBucketOptions } from '@ratelock/core/strategy'
import type { StorageConfig } from './storage-factory'
import { createStorage } from './storage-factory'

/**
 * Configuration for creating a token bucket rate limiter.
 */
export interface TokenBucketLimiterConfig {
    /**
     * Strategy-specific options.
     */
    strategy: TokenBucketOptions

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
 * Factory function to create a token bucket rate limiter with local storage.
 *
 * @param config - Configuration for the token bucket rate limiter
 * @returns A promise that resolves to the factory result containing the limiter and its components
 */
export const createTokenBucketLimiter = createTokenBucketLimiterFactory(createStorage) as (
    config: any
) => Promise<any>
