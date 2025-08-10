import type { Storage } from '@ratelock/core/storage'
import type { Limited, StrategyMetadata, Windowed } from '@ratelock/core/strategy'
import { Strategy } from '@ratelock/core/strategy'

/**
 * Options for the Fixed Window rate limiting strategy.
 */
export interface FixedWindowStrategyOptions {
    /** The maximum number of requests allowed within the window. */
    limit: number
    /** The duration of the time window in milliseconds. */
    windowMs: number
    /** The optional start time of the first window in milliseconds since the epoch. */
    startTimeMs?: number
}

/**
 * A rate-limiting strategy that uses a fixed time window.
 *
 * It divides time into fixed-size windows and allows a certain number of requests per window.
 * The counter for a window resets to zero when the next window begins.
 */
export class FixedWindowStrategy
    extends Strategy<FixedWindowStrategy>
    implements Windowed, Limited
{
    override metadata: StrategyMetadata

    /**
     * @param {Storage} storage - The storage service for tracking rate limit counters.
     * @param {FixedWindowStrategyOptions} options - The configuration options for the strategy.
     */
    constructor(
        override storage: Storage,
        override options: FixedWindowStrategyOptions
    ) {
        super(storage, options)
        this.metadata = {
            name: 'fixed-window',
            version: '1.0.0',
            memoryEfficient: true,
            supportsBatch: true,
        }
        this.options.startTimeMs = this.options.startTimeMs ?? 0
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
     * Checks if a request for a given identifier is allowed.
     * @param {string} identifier - The unique identifier for the client (e.g., IP address, user ID).
     * @returns {Promise<{ allowed: boolean; remaining: number; reset: number }>} The rate limit status.
     */
    async check(identifier: string) {
        const now = Date.now()
        const { windowMs, limit, startTimeMs } = this.options

        const currentWindowIndex = Math.floor((now - startTimeMs!) / windowMs)

        const windowKey = `${identifier}:${currentWindowIndex}`

        const windowEndTime = startTimeMs! + (currentWindowIndex + 1) * windowMs
        const ttlMs = Math.max(1, windowEndTime - now)

        const result = await (this.storage as any).incrementIf(windowKey, limit, ttlMs)

        return {
            allowed: result.incremented,
            remaining: Math.max(0, limit - result.value),
            reset: windowEndTime,
        }
    }
}

/**
 * Creates a factory function for the FixedWindowStrategy.
 * @param {FixedWindowStrategyOptions} options - The configuration options.
 * @returns {(context: { storage: Storage }) => FixedWindowStrategy} A factory function that creates a new FixedWindowStrategy instance.
 */
export function createFixedWindowStrategy(options: FixedWindowStrategyOptions) {
    return (context: { storage: Storage }) => {
        return new FixedWindowStrategy(context.storage, options)
    }
}