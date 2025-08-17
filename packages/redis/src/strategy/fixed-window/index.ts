import type {
    FixedWindowOptions} from '@ratelock/core/strategy';
import {
    FixedWindowStrategy as CoreFixedWindowStrategy,
    createStrategyFactory,
    fixedWindowValidator,
    type InferStrategyResult,
    type WindowedLimited,
} from '@ratelock/core/strategy'
import { FIXED_WINDOW } from '../../lua-scripts'
import type { RedisStorage } from '../../storage/redis-storage.interface'

/**
 * Redis-backed Fixed Window Rate Limiting Strategy
 * Uses Lua scripting for atomic operations and improved performance
 */
export class FixedWindowStrategy extends CoreFixedWindowStrategy {
    private scriptSha: string | null = null

    /**
     * Checks if a request is allowed under the current rate limit
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
        const { limit, windowMs, prefix = 'fw' } = this.options
        const currentWindowIndex = Math.floor((now - (this.options.startTimeMs || 0)) / windowMs)
        const windowKey = `${prefix}:${identifier}:${currentWindowIndex}`

        // Load Lua script if not already loaded
        if (!this.scriptSha) {
            this.scriptSha = await storage.scriptLoad(FIXED_WINDOW)
        }

        try {
            const result = await storage.evalSha(this.scriptSha, {
                keys: [windowKey],
                arguments: [windowMs.toString(), limit.toString(), now.toString()],
            })

            // Lua script returns [allowed, current, remaining, ttl]
            return {
                allowed: result[0] === 1,
                remaining: result[2],
                reset: now + result[3],
            }
        } catch (error: any) {
            // Handle NOSCRIPT error (script not found in Redis)
            if (error.message.includes('NOSCRIPT')) {
                this.scriptSha = await storage.scriptLoad(FIXED_WINDOW)
                const result = await storage.evalSha(this.scriptSha, {
                    keys: [windowKey],
                    arguments: [windowMs.toString(), limit.toString(), now.toString()],
                })

                return {
                    allowed: result[0] === 1,
                    remaining: result[2],
                    reset: now + result[3],
                }
            }
            throw error
        }
    }
}

/**
 * Factory function for creating FixedWindowStrategy instances
 * @param storage - Redis storage implementation
 * @param options - Fixed window configuration options
 * @returns New FixedWindowStrategy instance
 */
export const createFixedWindowStrategy = createStrategyFactory<
    FixedWindowStrategy,
    FixedWindowOptions
>(fixedWindowValidator, (storage, options) => new FixedWindowStrategy(storage, options))
