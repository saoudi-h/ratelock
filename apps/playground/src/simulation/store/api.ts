'use client'
import { BackendError, getBackend } from '@/simulation/services/backends'
import type { RequestEvent, StorageConfig, StrategyConfig } from '@/simulation/types'
import { DEFAULT_STORAGE_CONFIGS } from '@/simulation/types/constants'

/**
 * Default storage configuration based on environment
 * Uses Redis if NEXT_PUBLIC_BACKEND_STORAGE='redis', otherwise local storage
 */
const defaultStorage: StorageConfig =
    process.env.NEXT_PUBLIC_BACKEND_STORAGE === 'redis'
        ? DEFAULT_STORAGE_CONFIGS.redis
        : DEFAULT_STORAGE_CONFIGS.local

/**
 * Sends a rate limit request and records the event
 * @param timestamp Request timestamp
 * @param userId User identifier
 * @param strategy Rate limiting strategy configuration
 * @param storage Storage configuration (defaults to environment configuration)
 * @returns Request event with results or null if failed
 */
export async function sendRateLimitRequest(
    timestamp: number,
    userId: string,
    strategy: StrategyConfig,
    storage: StorageConfig = defaultStorage
): Promise<RequestEvent | null> {
    try {
        const backend = getBackend()
        const result = await backend.checkRateLimit(userId, strategy, storage)

        const event: RequestEvent = {
            id: `${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp,
            userId,
            allowed: !!(result as any).allowed,
            result: result as any,
            strategy: strategy.type,
        }

        return event
    } catch (error) {
        if (error instanceof BackendError) {
            console.error('Backend error:', error.message, error.code)
        } else {
            console.error('Request failed:', error)
        }
        return null
    }
}
