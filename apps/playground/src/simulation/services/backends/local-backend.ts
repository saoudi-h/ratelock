'use client'
import type { RateLimitResult, StorageConfig, StrategyConfig } from '@/simulation/types'
import {
    createFixedWindowLimiter,
    createIndividualFixedWindowLimiter,
    createSlidingWindowLimiter,
    createTokenBucketLimiter,
} from '@ratelock/local'
import { BackendError, type RateLimitBackend } from './types'

/**
 * Client-side rate limit backend using @ratelock/local
 * Designed for public demos without server dependencies
 */
export class LocalBackend implements RateLimitBackend {
    private limiterCache = new Map<string, any>()

    private hashConfig(strategy: StrategyConfig, storage: StorageConfig): string {
        return JSON.stringify({ strategy, storage })
    }

    private async getLimiter(strategy: StrategyConfig, storage: StorageConfig) {
        const key = this.hashConfig(strategy, storage)
        if (this.limiterCache.has(key)) {
            return this.limiterCache.get(key)
        }

        try {
            // Always use local storage configuration for client-side operations
            const localStorage = {
                cleanupIntervalMs:
                    storage.type === 'local' ? (storage.config.cleanupIntervalMs ?? 1000) : 1000,
                cleanupRequestThreshold:
                    storage.type === 'local'
                        ? (storage.config.cleanupRequestThreshold ?? 1000)
                        : 1000,
            }

            let factoryResult: any
            switch (strategy.type) {
                case 'fixed-window':
                    factoryResult = await createFixedWindowLimiter({
                        strategy: strategy.config,
                        storage: localStorage,
                    })
                    break
                case 'sliding-window':
                    factoryResult = await createSlidingWindowLimiter({
                        strategy: strategy.config,
                        storage: localStorage,
                    })
                    break
                case 'token-bucket':
                    factoryResult = await createTokenBucketLimiter({
                        strategy: strategy.config,
                        storage: localStorage,
                    })
                    break
                case 'individual-fixed-window':
                    factoryResult = await createIndividualFixedWindowLimiter({
                        strategy: strategy.config,
                        storage: localStorage,
                    })
                    break
                default:
                    throw new BackendError(
                        `Unsupported strategy type: ${(strategy as any).type}`,
                        'UNSUPPORTED_STRATEGY',
                        'local'
                    )
            }

            if (!factoryResult?.limiter) {
                throw new BackendError(
                    'Failed to create limiter from factory',
                    'FACTORY_ERROR',
                    'local'
                )
            }

            this.limiterCache.set(key, factoryResult.limiter)
            return factoryResult.limiter
        } catch (error) {
            if (error instanceof BackendError) throw error

            throw new BackendError(
                `Failed to create limiter: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'LIMITER_CREATION_ERROR',
                'local',
                error instanceof Error ? error : undefined
            )
        }
    }

    /**
     * Checks rate limit for a single user using client-side limiter
     * @param userId - User identifier
     * @param strategy - Rate limiting strategy configuration
     * @param storage - Storage configuration (local storage settings will be used)
     * @returns Rate limit result with remaining/limit/reset information
     * @throws {BackendError} When limiter creation or check fails
     */
    async checkRateLimit(
        userId: string,
        strategy: StrategyConfig,
        storage: StorageConfig
    ): Promise<RateLimitResult> {
        try {
            const limiter = await this.getLimiter(strategy, storage)
            const result = await limiter.check(userId)
            return result as RateLimitResult
        } catch (error) {
            if (error instanceof BackendError) throw error

            throw new BackendError(
                `Rate limit check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'CHECK_ERROR',
                'local',
                error instanceof Error ? error : undefined
            )
        }
    }

    /**
     * Checks rate limits for multiple users in batch
     * Uses native batch operations when available, falls back to individual checks
     * @param identifiers - Array of user identifiers
     * @param strategy - Rate limiting strategy configuration
     * @param storage - Storage configuration
     * @returns Array of rate limit results matching input identifiers
     * @throws {BackendError} When batch operation fails
     */
    async checkRateLimitBatch(
        identifiers: string[],
        strategy: StrategyConfig,
        storage: StorageConfig
    ): Promise<RateLimitResult[]> {
        try {
            const limiter = await this.getLimiter(strategy, storage)

            if (typeof limiter.checkBatch === 'function') {
                return (await limiter.checkBatch(identifiers)) as RateLimitResult[]
            }

            // Fallback for limiters without native batch support
            const results: RateLimitResult[] = []
            for (const identifier of identifiers) {
                results.push((await limiter.check(identifier)) as RateLimitResult)
            }
            return results
        } catch (error) {
            if (error instanceof BackendError) throw error

            throw new BackendError(
                `Batch rate limit check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'BATCH_CHECK_ERROR',
                'local',
                error instanceof Error ? error : undefined
            )
        }
    }

    supportsBatch(): boolean {
        return true
    }

    async cleanup(): Promise<void> {
        this.limiterCache.clear()
    }
}
