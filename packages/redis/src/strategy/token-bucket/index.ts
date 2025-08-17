import type {
    TokenBucketOptions} from '@ratelock/core/strategy';
import {
    TokenBucketStrategy as CoreTokenBucketStrategy,
    createStrategyFactory,
    tokenBucketValidator,
    type InferStrategyResult,
    type TokenBasedLimited,
} from '@ratelock/core/strategy'
import { TOKEN_BUCKET } from '../../lua-scripts'
import type { RedisStorage } from '../../storage/redis-storage.interface'

/**
 * Token Bucket Rate Limiting Strategy
 * Implements an algorithm that allows bursts of requests up to a capacity,
 * with tokens refilling at a fixed rate over time
 */
export class TokenBucketStrategy extends CoreTokenBucketStrategy {
    private scriptSha: string | null = null

    /**
     * Checks if a request is allowed under the token bucket rate limit
     * @param identifier - Unique identifier for the token bucket
     * @returns Promise containing rate limit result with:
     *          - allowed: boolean indicating if request is permitted
     *          - remaining: number of remaining tokens (floored)
     *          - tokens: precise token count (may be fractional)
     *          - refillTime: time in ms between token refills
     */
    override async check(identifier: string): Promise<InferStrategyResult<TokenBasedLimited>> {
        const storage = this.storage as RedisStorage

        // Fallback to base implementation if Redis scripting not available
        if (typeof storage.evalScript !== 'function') {
            return super.check(identifier)
        }

        const now = Date.now()
        const { capacity, refillRate, refillTime: _refillTime, prefix = 'tb' } = this.options
        const key = `${prefix}:${identifier}`

        // Lazy load Lua script (only once)
        if (!this.scriptSha) {
            this.scriptSha = await storage.scriptLoad(TOKEN_BUCKET)
        }

        try {
            const result = await storage.evalSha(this.scriptSha, {
                keys: [key],
                arguments: [capacity.toString(), refillRate.toString(), now.toString()],
            })

            // Lua script returns [allowed, tokens, time_until_next]
            return {
                allowed: result[0] === 1,
                remaining: Math.floor(result[1]),
                tokens: result[1],
                refillTime: this.options.refillTime,
            }
        } catch (error: any) {
            // Handle NOSCRIPT error (script not found in Redis cache)
            if (error.message.includes('NOSCRIPT')) {
                this.scriptSha = await storage.scriptLoad(TOKEN_BUCKET)
                const result = await storage.evalSha(this.scriptSha, {
                    keys: [key],
                    arguments: [capacity.toString(), refillRate.toString(), now.toString()],
                })

                return {
                    allowed: result[0] === 1,
                    remaining: Math.floor(result[1]),
                    tokens: result[1],
                    refillTime: this.options.refillTime,
                }
            }
            throw error
        }
    }
}

/**
 * Factory function for creating TokenBucketStrategy instances
 * @param storage - Redis storage implementation
 * @param options - Token bucket configuration options including:
 *                  - capacity: maximum tokens in bucket
 *                  - refillRate: tokens added per refill interval
 *                  - refillTime: time in ms between refills
 * @returns New TokenBucketStrategy instance
 */
export const createTokenBucketStrategy = createStrategyFactory<
    TokenBucketStrategy,
    TokenBucketOptions
>(tokenBucketValidator, (storage, options) => new TokenBucketStrategy(storage, options))
