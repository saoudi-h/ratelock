import type { Storage } from '@ratelock/core/storage'
import type { Limited, SlidingWindow, StrategyMetadata } from '@ratelock/core/strategy'
import { Strategy } from '@ratelock/core/strategy'

/**
 * Options for the Sliding Window rate-limiting strategy.
 */
export interface SlidingWindowStrategyOptions {
    /** The maximum number of requests allowed within the window. */
    limit: number
    /** The duration of the time window in milliseconds. */
    windowMs: number
    /**
     * The precision of the window in milliseconds.
     * For the `SlidingWindowStrategy`, this defines the granularity of timestamp storage.
     * For the `OptimizedSlidingWindowStrategy`, this defines the size of each sub-window.
     * Defaults to `windowMs / 10`, with a minimum of 100ms for the non-optimized version, and 1000ms for the optimized one.
     */
    precision?: number
}

/**
 * A sliding window rate-limiting strategy that tracks individual timestamps.
 *
 * This implementation stores a timestamp for every request within the window.
 * While very accurate, it can be memory-intensive for high-traffic scenarios.
 */
export class SlidingWindowStrategy
    extends Strategy<SlidingWindowStrategy>
    implements SlidingWindow, Limited
{
    override metadata: StrategyMetadata
    private readonly precision: number

    /**
     * @param {Storage} storage - The storage service for tracking rate limit counters.
     * @param {SlidingWindowStrategyOptions} options - The configuration options for the strategy.
     */
    constructor(
        override storage: Storage,
        override options: SlidingWindowStrategyOptions
    ) {
        super(storage, options)
        this.metadata = {
            name: 'sliding-window',
            version: '1.0.0',
            memoryEfficient: true,
            supportsBatch: true,
        }
        this.precision = options.precision ?? Math.max(100, Math.floor(options.windowMs / 10))
    }

    /**
     * Gets the window duration in milliseconds.
     * @returns {number} The window duration.
     */
    getWindowMs(): number {
        return this.options.windowMs
    }

    /**
     * Gets the request limit for the window.
     * @returns {number} The request limit.
     */
    getLimit(): number {
        return this.options.limit
    }

    /**
     * Gets the precision of the window in milliseconds.
     * @returns {number} The precision value.
     */
    getPrecision(): number {
        return this.precision
    }

    /**
     * Checks if a request for a given identifier is allowed.
     * @param {string} identifier - The unique identifier for the client (e.g., IP address, user ID).
     * @returns {Promise<{ allowed: boolean; remaining: number; reset: number; oldestRequest: number }>} The rate limit status.
     */
    async check(identifier: string) {
        const now = Date.now()
        const { windowMs, limit } = this.options

        await this.storage.cleanupTimestamps(identifier)

        const currentCount = await this.storage.countTimestamps(identifier, windowMs)

        const allowed = currentCount < limit

        if (allowed) {
            const ttlMs = windowMs + this.precision
            await this.storage.addTimestamp(identifier, now, ttlMs)
        }

        const remaining = Math.max(0, limit - (allowed ? currentCount + 1 : currentCount))

        const oldestTimestamp = await this.storage.getOldestTimestamp(identifier)
        const reset = oldestTimestamp ? oldestTimestamp + windowMs : now + windowMs
        const oldestRequest = oldestTimestamp ?? now
        return {
            allowed,
            remaining,
            reset,
            oldestRequest,
        }
    }
}

/**
 * An optimized sliding window rate-limiting strategy that uses sub-windows.
 *
 * Instead of storing every timestamp, this implementation divides the window into smaller
 * sub-windows and stores a counter for each. This reduces memory usage and improves performance
 * at the cost of some precision.
 */
export class OptimizedSlidingWindowStrategy
    extends Strategy<OptimizedSlidingWindowStrategy>
    implements SlidingWindow, Limited
{
    private readonly subWindowMs: number
    private readonly subWindowCount: number
    override metadata: StrategyMetadata

    /**
     * @param {Storage} storage - The storage service for tracking rate limit counters.
     * @param {SlidingWindowStrategyOptions} options - The configuration options for the strategy.
     */
    constructor(
        override storage: Storage,
        override options: SlidingWindowStrategyOptions
    ) {
        super(storage, options)
        this.metadata = {
            name: 'sliding-window',
            version: '1.0.0',
            memoryEfficient: true,
            supportsBatch: true,
        }

        this.subWindowMs = options.precision ?? Math.max(1000, Math.floor(options.windowMs / 10))
        this.subWindowCount = Math.ceil(options.windowMs / this.subWindowMs)
    }

    /**
     * Gets the window duration in milliseconds.
     * @returns {number} The window duration.
     */
    getWindowMs(): number {
        return this.options.windowMs
    }

    /**
     * Gets the request limit for the window.
     * @returns {number} The request limit.
     */
    getLimit(): number {
        return this.options.limit
    }

    /**
     * Gets the precision (sub-window size) of the window in milliseconds.
     * @returns {number} The precision value.
     */
    getPrecision(): number {
        return this.subWindowMs
    }

    /**
     * Checks if a request for a given identifier is allowed.
     * @param {string} identifier - The unique identifier for the client (e.g., IP address, user ID).
     * @returns {Promise<{ allowed: boolean; remaining: number; reset: number; oldestRequest: number }>} The rate limit status.
     */
    async check(identifier: string) {
        const now = Date.now()
        const { limit } = this.options

        const currentSubWindow = Math.floor(now / this.subWindowMs)
        const oldestSubWindow = currentSubWindow - this.subWindowCount + 1

        let totalCount = 0
        const pipeline = this.storage.pipeline()

        for (let i = oldestSubWindow; i <= currentSubWindow; i++) {
            const subWindowKey = `${identifier}:sw:${i}`
            await pipeline.get(subWindowKey)
        }

        const results = await pipeline.exec()
        for (const result of results) {
            if (result) {
                totalCount += parseInt(result as string, 10)
            }
        }

        const allowed = totalCount < limit

        if (allowed) {
            const currentSubWindowKey = `${identifier}:sw:${currentSubWindow}`
            const ttlMs = this.subWindowMs * this.subWindowCount + 1000
            await this.storage.increment(currentSubWindowKey, ttlMs)
        }

        const remaining = Math.max(0, limit - (allowed ? totalCount + 1 : totalCount))
        const reset = (oldestSubWindow + this.subWindowCount) * this.subWindowMs
        const oldestRequest = oldestSubWindow * this.subWindowMs

        return {
            allowed,
            remaining,
            reset,
            oldestRequest,
        }
    }
}

/**
 * Creates a factory function for the SlidingWindowStrategy.
 * @param {SlidingWindowStrategyOptions} options - The configuration options.
 * @returns {(context: { storage: Storage }) => SlidingWindowStrategy} A factory function that creates a new SlidingWindowStrategy instance.
 */
export function createSlidingWindowStrategy(options: SlidingWindowStrategyOptions) {
    return (context: { storage: Storage }) => {
        return new SlidingWindowStrategy(context.storage, options)
    }
}

/**
 * Creates a factory function for the OptimizedSlidingWindowStrategy.
 * @param {SlidingWindowStrategyOptions} options - The configuration options.
 * @returns {(context: { storage: Storage }) => OptimizedSlidingWindowStrategy} A factory function that creates a new OptimizedSlidingWindowStrategy instance.
 */
export function createOptimizedSlidingWindowStrategy(options: SlidingWindowStrategyOptions) {
    return (context: { storage: Storage }) => {
        return new OptimizedSlidingWindowStrategy(context.storage, options)
    }
}