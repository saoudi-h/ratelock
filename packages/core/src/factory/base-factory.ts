import { RateLimiter } from '../limiter/rate-limiter'
import type { Storage } from '../storage/storage'
import type { Strategy } from '../strategy/strategy'
import type { BaseFactoryConfig, FactoryResult, StorageFactory } from './types'

/**
 * Abstract base class for rate limiter factories.
 * Provides a common interface for creating rate limiters with different strategies and storage implementations.
 *
 * @template TStrategyOptions - Type of options for the strategy
 * @template TStorageConfig - Type of configuration for the storage
 * @template S - Type of strategy
 * @template T - Type of storage
 */
export abstract class BaseLimiterFactory<
    TStrategyOptions,
    TStorageConfig,
    S extends Strategy<any>,
    T extends Storage = Storage,
> {
    /**
     * Creates a new instance of BaseLimiterFactory.
     *
     * @param strategyFactory - Factory function to create strategy instances
     * @param storageFactory - Factory function to create storage instances
     */
    constructor(
        protected readonly strategyFactory: (storage: T, options: TStrategyOptions) => S,
        protected readonly storageFactory: StorageFactory<T, TStorageConfig>
    ) {}

    /**
     * Creates a new rate limiter instance with the specified configuration.
     *
     * @param config - Configuration for the rate limiter
     * @returns Promise resolving to the factory result containing the limiter and its components
     */
    async create(
        config: BaseFactoryConfig & {
            strategy: TStrategyOptions
            storage: TStorageConfig
        }
    ): Promise<FactoryResult<S, T>> {
        // Create storage instance
        const storage = await this.storageFactory(config.storage)

        // Create strategy instance
        const strategy = this.strategyFactory(storage, config.strategy)

        // Create rate limiter
        const limiter = new RateLimiter<S>({
            ...config,
            strategy,
            storage,
        })

        return {
            limiter,
            storage,
            strategy,
        }
    }
}
