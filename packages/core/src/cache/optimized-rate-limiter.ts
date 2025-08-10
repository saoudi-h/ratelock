import type { Storage } from '../storage/storage'
import type { InferStrategyResult } from '../strategy/behaviors'
import type { Strategy } from '../strategy/strategy'
import type { BatchConfig } from './batch-processor'
import { CachedStorage } from './cached-storage'
import type { CacheConfig } from './l1-cache'
import type { LazyCleanupConfig } from './lazy-timestamp-cleaner'
import { LazyTimestampCleaner } from './lazy-timestamp-cleaner'

/**
 * Infers the result type based on the provided strategy type.
 */
type InferLimiterResult<S> = S extends Strategy<infer T, any> ? InferStrategyResult<T> : never

/**
 * Optimized rate limiter that uses caching and lazy cleanup for better performance.
 */
export class OptimizedRateLimiter<S extends Strategy<any, any>> {
    private readonly cachedStorage: CachedStorage
    private readonly timestampCleaner: LazyTimestampCleaner

    /**
     * Creates an instance of OptimizedRateLimiter.
     * @param baseStorage The base storage instance.
     * @param strategy The rate limiting strategy to use.
     * @param config Configuration for caching, batching, and lazy cleanup.
     */
    constructor(
        // @ts-expect-error baseStorage is not used
        private readonly baseStorage: Storage,
        private readonly strategy: S,
        // @ts-expect-error config is not used
        private readonly config: {
            cache: CacheConfig
            batch?: BatchConfig
            lazyCleanup: LazyCleanupConfig
            prefix?: string
        }
    ) {
        this.cachedStorage = new CachedStorage(baseStorage, config.cache, config.batch)
        this.timestampCleaner = new LazyTimestampCleaner(this.cachedStorage, config.lazyCleanup)
        // Inject the optimized storage into the strategy (without exposing any publicly)
        ;(this.strategy as unknown as { storage: Storage }).storage = this.cachedStorage
    }

    /**
     * Checks if an identifier is allowed.
     * @param identifier The identifier to check.
     * @returns A promise that resolves to the result of the rate limiting check.
     */
    async check(identifier: string): Promise<InferLimiterResult<S>> {
        const res = (await this.strategy.check(identifier)) as InferLimiterResult<S>
        const priority = (res as { allowed: boolean }).allowed ? 1 : 2
        this.timestampCleaner.scheduleCleanup(identifier, priority)
        return res
    }

    /**
     * Checks a batch of identifiers.
     * @param identifiers The identifiers to check.
     * @returns A promise that resolves to an array of results for each identifier.
     */
    async checkBatch(identifiers: string[]): Promise<Array<InferLimiterResult<S>>> {
        if (this.strategy.checkBatch) {
            const out = await this.strategy.checkBatch(identifiers)
            return out as Array<InferLimiterResult<S>>
        }
        const results: Array<InferLimiterResult<S>> = []
        for (const id of identifiers) {
            const r = await this.check(id)
            results.push(r)
        }
        return results
    }

    /**
     * Gets statistics about the cache and timestamp cleaner.
     * @returns An object containing cache and timestamp cleaner statistics.
     */
    getStats() {
        return {
            cache: this.cachedStorage.getCacheStats(),
            timestampCleaner: this.timestampCleaner.getStats(),
        }
    }

    /**
     * Stops the rate limiter and cleans up resources.
     */
    stop(): void {
        this.cachedStorage.stop()
    }
}
