import type { IndividualFixedWindowOptions } from '@ratelock/core/strategy'
import {
    IndividualFixedWindowStrategy as CoreIndividualFixedWindowStrategy,
    createStrategyFactory,
    individualFixedWindowValidator,
    type InferStrategyResult,
    type WindowedLimited,
} from '@ratelock/core/strategy'
import { INDIVIDUAL_FIXED_WINDOW } from '../../lua-scripts'
import type { RedisStorage } from '../../storage/redis-storage.interface'

/**
 * Individual Fixed Window Rate Limiting Strategy
 * Uses Redis Lua scripting for atomic operations with per-identifier windows
 * that start at first request rather than global time intervals
 */
export class IndividualFixedWindowStrategy extends CoreIndividualFixedWindowStrategy {
    private scriptSha: string | null = null

    /**
     * Checks if a request is allowed under the individual fixed window rate limit
     * @param identifier - Unique identifier for the rate limit window
     * @returns Promise containing rate limit result with:
     *          - allowed: boolean indicating if request is permitted
     *          - remaining: number of remaining requests in window
     *          - reset: timestamp when window resets
     */
    override async check(identifier: string): Promise<InferStrategyResult<WindowedLimited>> {
        const storage = this.storage as RedisStorage

        // Fallback to base implementation if Redis scripting not available
        if (typeof storage.evalScript !== 'function') {
            return super.check(identifier)
        }

        const now = Date.now()
        const { limit, windowMs, prefix = 'ifw' } = this.options

        // Redis keys used by the Lua script
        const startKey = `${prefix}:${identifier}:start`
        const countKey = `${prefix}:${identifier}:count`

        // Lazy load Lua script (only once)
        if (!this.scriptSha) {
            this.scriptSha = await storage.scriptLoad(INDIVIDUAL_FIXED_WINDOW)
        }

        try {
            const result = await storage.evalSha(this.scriptSha, {
                keys: [startKey, countKey],
                arguments: [windowMs.toString(), limit.toString(), now.toString()],
            })

            // Lua script returns [allowed, current, remaining, reset]
            const [allowedInt, _current, remaining, reset] = result as [
                number,
                number,
                number,
                number,
            ]

            return {
                allowed: Boolean(allowedInt),
                remaining,
                reset,
            }
        } catch (error: any) {
            // Handle NOSCRIPT error (script not found in Redis cache)
            if (error?.message?.includes('NOSCRIPT')) {
                this.scriptSha = await storage.scriptLoad(INDIVIDUAL_FIXED_WINDOW)
                return this.check(identifier) // Single retry
            }
            throw error
        }
    }
}

/**
 * Factory function for creating IndividualFixedWindowStrategy instances
 * @param storage - Redis storage implementation
 * @param options - Individual fixed window configuration options
 * @returns New IndividualFixedWindowStrategy instance
 */
export const createIndividualFixedWindowStrategy = createStrategyFactory<
    IndividualFixedWindowStrategy,
    IndividualFixedWindowOptions
>(
    individualFixedWindowValidator,
    (storage, options) => new IndividualFixedWindowStrategy(storage, options)
)
