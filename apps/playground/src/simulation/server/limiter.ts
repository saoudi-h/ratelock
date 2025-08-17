'use server'
import type { RateLimitResult, StorageConfig, StrategyConfig } from '@/simulation/types'
import { validateStorageConfig, validateStrategyConfig } from '@/simulation/types/validation'
// Rate limiter adapters
import {
    createFixedWindowLimiter as createLocalFixedWindow,
    createIndividualFixedWindowLimiter as createLocalIndividualFixedWindow,
    createSlidingWindowLimiter as createLocalSlidingWindow,
    createTokenBucketLimiter as createLocalTokenBucket,
} from '@ratelock/local'
import {
    createFixedWindowLimiter as createRedisFixedWindow,
    createIndividualFixedWindowLimiter as createRedisIndividualFixedWindow,
    createSlidingWindowLimiter as createRedisSlidingWindow,
    createTokenBucketLimiter as createRedisTokenBucket,
} from '@ratelock/redis'

/**
 * Cache for rate limiter instances keyed by configuration hash
 * Prevents duplicate limiter creation for identical configurations
 */
const limiterCache = new Map<string, any>()

/**
 * Creates a stable hash key from strategy and storage configurations
 * Used for cache lookup and deduplication
 */
function hashConfig(strategy: StrategyConfig, storage: StorageConfig) {
    return JSON.stringify({ strategy, storage })
}


/**
 * Creates or retrieves a rate limiter instance
 * @param strategy Rate limiting strategy configuration
 * @param storage Storage backend configuration
 * @returns Configured rate limiter instance
 * @throws When configuration validation fails or limiter creation fails
 */
export async function getLimiter(strategy: StrategyConfig, storage: StorageConfig) {
    const key = hashConfig(strategy, storage)
    if (limiterCache.has(key)) return limiterCache.get(key)

    const sVal = validateStrategyConfig(strategy)
    if (!sVal.isValid) throw new Error(`Invalid strategy config: ${sVal.errors.join(', ')}`)

    const stVal = validateStorageConfig(storage)
    if (!stVal.isValid) throw new Error(`Invalid storage config: ${stVal.errors.join(', ')}`)

    let factoryResult: any

    if (storage.type === 'local') {
        const localStorage = {
            cleanupIntervalMs: storage.config.cleanupIntervalMs ?? 1000,
            cleanupRequestThreshold: storage.config.cleanupRequestThreshold ?? 1000,
        }

        switch (strategy.type) {
            case 'fixed-window':
                factoryResult = await createLocalFixedWindow({ strategy: strategy.config, storage: localStorage })
                break
            case 'sliding-window':
                factoryResult = await createLocalSlidingWindow({ strategy: strategy.config, storage: localStorage })
                break
            case 'token-bucket':
                factoryResult = await createLocalTokenBucket({ strategy: strategy.config, storage: localStorage })
                break
            case 'individual-fixed-window':
                factoryResult = await createLocalIndividualFixedWindow({ strategy: strategy.config, storage: localStorage })
                break
        }
    } else {

        if(!storage.config.url) throw new Error('Redis URL is required')

        switch (strategy.type) {
            case 'fixed-window':
                factoryResult = await createRedisFixedWindow({ strategy: strategy.config as any, storage: { redisOptions: storage.config.url } })
                break
            case 'sliding-window':
                factoryResult = await createRedisSlidingWindow({ strategy: strategy.config as any, storage: { redisOptions: storage.config.url } })
                break
            case 'token-bucket':
                factoryResult = await createRedisTokenBucket({ strategy: strategy.config as any, storage: { redisOptions: storage.config.url } })
                break
            case 'individual-fixed-window':
                factoryResult = await createRedisIndividualFixedWindow({ strategy: strategy.config as any, storage: { redisOptions: storage.config.url } })
                break
        }
    }

    if (!factoryResult?.limiter) throw new Error('Failed to create limiter')

    limiterCache.set(key, factoryResult.limiter)
    return factoryResult.limiter
}

/**
 * Checks rate limit for a single identifier
 * @param userId Identifier to check
 * @param strategy Rate limiting strategy
 * @param storage Storage configuration
 * @returns Rate limit result with pass/fail status
 */
export async function checkRateLimit(
    userId: string,
    strategy: StrategyConfig,
    storage: StorageConfig
): Promise<RateLimitResult> {
    const limiter = await getLimiter(strategy, storage)
    const result = await limiter.check(userId)
    return result as RateLimitResult
}

/**
 * Checks rate limits for multiple identifiers
 * Falls back to sequential checks if batch operation isn't supported
 * @param identifiers Array of identifiers to check
 * @param strategy Rate limiting strategy
 * @param storage Storage configuration
 * @returns Array of rate limit results
 */
export async function checkRateLimitBatch(
    identifiers: string[],
    strategy: StrategyConfig,
    storage: StorageConfig
): Promise<RateLimitResult[]> {
    const limiter = await getLimiter(strategy, storage)

    if (typeof limiter.check === 'function') {
        const results = await limiter.check(identifiers)
        return results as RateLimitResult[]
    }

    const out: RateLimitResult[] = []
    for (const id of identifiers) {
        out.push(await limiter.check(id))
    }
    return out
}
