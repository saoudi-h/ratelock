import { Strategy } from '../abstract'
import type { InferStrategyResult, SlidingWindowLimited } from '../capabilities'
import { createStrategyFactory, type StrategyValidator } from '../factory'
import type { BaseStrategyOptions, StrategyMetadata } from '../types'

/**
 * Configuration options for sliding window rate limiting
 */
export interface SlidingWindowOptions extends BaseStrategyOptions {
    limit: number
    windowMs: number
}

/**
 * Validates and normalizes sliding window strategy options
 */
export const slidingWindowValidator: StrategyValidator<SlidingWindowOptions> = {
    validate(options) {
        if (options.limit <= 0) throw new Error('limit must be positive')
        if (options.windowMs <= 0) throw new Error('windowMs must be positive')
    },
    normalize(options) {
        return {
            ...options,
            prefix: options.prefix ?? 'sw',
            enableStats: options.enableStats ?? false,
            cleanupInterval: options.cleanupInterval ?? 60_000,
        }
    },
}

/**
 * Rate limiting strategy using sliding window algorithm
 *
 * Tracks requests in time windows to provide smooth rate limiting.
 * More memory intensive than fixed window but provides better user experience.
 */
export class SlidingWindowStrategy extends Strategy<SlidingWindowLimited, SlidingWindowOptions> {
    readonly metadata: StrategyMetadata = {
        name: 'sliding-window',
        version: '1.0.0',
        memoryEfficient: false, // Uses timestamps which can grow indefinitely
        supportsBatch: true,
    }

    /**
     * Checks if a request is allowed within the current window
     * @param identifier - Unique key for rate limit tracking
     * @returns Rate limit result with allowance details
     */
    override async check(identifier: string): Promise<InferStrategyResult<SlidingWindowLimited>> {
        const now = Date.now()
        const { limit, windowMs } = this.options

        const count = await this.storage.countTimestamps(identifier, windowMs)
        const allowed = count < limit

        const oldestTimestamp = await this.storage.getOldestTimestamp(identifier)
        const reset = oldestTimestamp ? oldestTimestamp + windowMs : now + windowMs
        const remaining = Math.max(0, limit - count)

        if (allowed) {
            await this.storage.addTimestamp(identifier, now, windowMs)
        }

        return {
            allowed,
            remaining,
            reset,
            windowStart: oldestTimestamp || now,
            windowEnd: reset,
        }
    }


    /**
     * Processes multiple identifiers in batch
     * @param identifiers - Array of unique keys to check
     * @returns Array of rate limit results
     */
    override async checkBatch(
        identifiers: string[]
    ): Promise<Array<InferStrategyResult<SlidingWindowLimited>>> {
        const results: Array<InferStrategyResult<SlidingWindowLimited>> = []
        for (const identifier of identifiers) {
            results.push(await this.check(identifier))
        }
        return results
    }

    /**
     * Cleans up expired timestamps for an identifier
     * @param identifier - Unique key to clean up
     */
    override async cleanup(identifier: string): Promise<void> {
        await this.storage.cleanupTimestamps(identifier)
    }
}

/**
 * Factory function for creating sliding window strategy instances
 */
export const createSlidingWindowStrategy = createStrategyFactory<
    SlidingWindowStrategy,
    SlidingWindowOptions
>(slidingWindowValidator, (storage, options) => new SlidingWindowStrategy(storage, options))
