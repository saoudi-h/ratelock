import type { RateLimiterPerformanceOptions, RateLimiterResilienceOptions } from '@/limiter/limiter'
import type { Storage } from '../../storage/storage'
import type { TokenBucketStrategy } from '../../strategy/token-bucket'
import { type TokenBucketOptions, createTokenBucketStrategy } from '../../strategy/token-bucket'
import { BaseLimiterFactory } from '../base-factory'
import type { StorageFactory } from '../types'

/**
 * Factory for creating token bucket rate limiters.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 */
export class TokenBucketLimiterFactory<
    TStorageConfig,
    T extends Storage = Storage,
> extends BaseLimiterFactory<TokenBucketOptions, TStorageConfig, TokenBucketStrategy, T> {
    /**
     * Creates a new instance of TokenBucketLimiterFactory.
     *
     * @param storageFactory - Factory function to create storage instances
     */
    constructor(storageFactory: StorageFactory<T, TStorageConfig>) {
        super(createTokenBucketStrategy, storageFactory)
    }
}

/**
 * Factory function for creating token bucket rate limiter factories.
 * Provides an easier way to create token bucket rate limiters.
 *
 * @template TStorageConfig - Type of storage configuration
 * @template T - Type of storage
 * @param storageFactory - Factory function to create storage instances
 * @returns A function that creates token bucket rate limiters
 */
export function createTokenBucketLimiterFactory<TStorageConfig, T extends Storage = Storage>(
    storageFactory: StorageFactory<T, TStorageConfig>
) {
    const factory = new TokenBucketLimiterFactory(storageFactory)
    return (config: {
        strategy: TokenBucketOptions
        storage: TStorageConfig
        prefix?: string
        performance?: RateLimiterPerformanceOptions
        resilience?: RateLimiterResilienceOptions
    }) => factory.create(config)
}
