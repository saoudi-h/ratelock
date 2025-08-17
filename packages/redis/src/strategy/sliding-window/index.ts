import {
    SlidingWindowStrategy as CoreSlidingWindowStrategy,
    createStrategyFactory,
    SlidingWindowOptions,
    slidingWindowValidator,
    type InferStrategyResult,
    type SlidingWindowLimited,
} from '@ratelock/core/strategy'
import { SLIDING_WINDOW } from '../../lua-scripts'
import type { RedisStorage } from '../../storage/redis-storage.interface'

/**
 * Sliding Window Rate Limiting Strategy
 * Implements a more precise rate limiting algorithm than fixed window
 * by tracking requests across window boundaries using Redis sorted sets
 */
export class SlidingWindowStrategy extends CoreSlidingWindowStrategy {
    private scriptSha: string | null = null

    /**
     * Checks if a request is allowed under the sliding window rate limit
     * @param identifier - Unique identifier for the rate limit window
     * @returns Promise containing rate limit result with:
     *          - allowed: boolean indicating if request is permitted
     *          - remaining: number of remaining requests in window
     *          - reset: timestamp when window resets
     *          - windowStart: start timestamp of current window
     *          - windowEnd: end timestamp of current window
     */
    override async check(identifier: string): Promise<InferStrategyResult<SlidingWindowLimited>> {
        const storage = this.storage as RedisStorage

        // Fallback to base implementation if Redis scripting not available
        if (typeof storage.evalScript !== 'function') {
            return super.check(identifier)
        }

        const now = Date.now()
        const { limit, windowMs, prefix = 'sw' } = this.options
        const key = `${prefix}:${identifier}`

        // Lazy load Lua script (only once)
        if (!this.scriptSha) {
            this.scriptSha = await storage.scriptLoad(SLIDING_WINDOW)
        }

        try {
            const result = await storage.evalSha(this.scriptSha, {
                keys: [key],
                arguments: [windowMs.toString(), limit.toString(), now.toString()],
            })

            // Lua script returns [allowed, current, remaining, ttl]
            const allowed = result[0] === 1
            const ttl = result[3]
            const reset = now + ttl

            return {
                allowed,
                remaining: result[2],
                reset,
                windowStart: now - windowMs,
                windowEnd: reset,
            }
        } catch (error: any) {
            // Handle NOSCRIPT error (script not found in Redis cache)
            if (error.message.includes('NOSCRIPT')) {
                this.scriptSha = await storage.scriptLoad(SLIDING_WINDOW)
                const result = await storage.evalSha(this.scriptSha, {
                    keys: [key],
                    arguments: [windowMs.toString(), limit.toString(), now.toString()],
                })

                const allowed = result[0] === 1
                const ttl = result[3]
                const reset = now + ttl

                return {
                    allowed,
                    remaining: result[2],
                    reset,
                    windowStart: now - windowMs,
                    windowEnd: reset,
                }
            }
            throw error
        }
    }
}

/**
 * Factory function for creating SlidingWindowStrategy instances
 * @param storage - Redis storage implementation
 * @param options - Sliding window configuration options
 * @returns New SlidingWindowStrategy instance
 */
export const createSlidingWindowStrategy = createStrategyFactory<
    SlidingWindowStrategy,
    SlidingWindowOptions
>(slidingWindowValidator, (storage, options) => new SlidingWindowStrategy(storage, options))
