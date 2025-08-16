import type { RateLimitResult, StorageConfig, StrategyConfig } from '@/simulation/types'
import { BackendError, type RateLimitBackend } from './types'

/**
 * Next.js API-based rate limit backend implementation
 * Used in development/testing environments with database access (Redis, MongoDB, etc.)
 */
export class ApiBackend implements RateLimitBackend {
    private baseUrl: string
    private timeout: number

    constructor(config?: { baseUrl?: string; timeout?: number }) {
        this.baseUrl = config?.baseUrl ?? ''
        this.timeout = config?.timeout ?? 10000
    }

    /**
     * Checks rate limit for a single user
     * @param userId - User identifier
     * @param strategy - Rate limiting strategy configuration
     * @param storage - Storage backend configuration
     * @returns Rate limit result with remaining/limit/reset information
     * @throws {BackendError} When API request fails or times out
     */
    async checkRateLimit(
        userId: string,
        strategy: StrategyConfig,
        storage: StorageConfig
    ): Promise<RateLimitResult> {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), this.timeout)

            const response = await fetch(`${this.baseUrl}/api/ratelimit/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, strategy, storage }),
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error')
                throw new BackendError(
                    `API request failed: ${response.status} ${response.statusText}`,
                    'API_REQUEST_FAILED',
                    'api',
                    new Error(errorText)
                )
            }

            const json = await response.json()
            return (json.data ?? json) as RateLimitResult
        } catch (error) {
            if (error instanceof BackendError) throw error

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new BackendError(
                        `Request timeout after ${this.timeout}ms`,
                        'TIMEOUT',
                        'api',
                        error
                    )
                }
                throw new BackendError(
                    `Network error: ${error.message}`,
                    'NETWORK_ERROR',
                    'api',
                    error
                )
            }

            throw new BackendError('Unknown error occurred', 'UNKNOWN_ERROR', 'api')
        }
    }

    /**
     * Checks rate limits for multiple users in a single batch request
     * @param identifiers - Array of user identifiers
     * @param strategy - Rate limiting strategy configuration
     * @param storage - Storage backend configuration
     * @returns Array of rate limit results matching input identifiers
     * @throws {BackendError} When API request fails or times out
     */
    async checkRateLimitBatch(
        identifiers: string[],
        strategy: StrategyConfig,
        storage: StorageConfig
    ): Promise<RateLimitResult[]> {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), this.timeout)

            const response = await fetch(`${this.baseUrl}/api/ratelimit/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifiers, strategy, storage }),
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error')
                throw new BackendError(
                    `Batch API request failed: ${response.status} ${response.statusText}`,
                    'API_REQUEST_FAILED',
                    'api',
                    new Error(errorText)
                )
            }

            const json = await response.json()
            return (json.data ?? json) as RateLimitResult[]
        } catch (error) {
            if (error instanceof BackendError) throw error

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new BackendError(
                        `Batch request timeout after ${this.timeout}ms`,
                        'TIMEOUT',
                        'api',
                        error
                    )
                }
                throw new BackendError(
                    `Batch network error: ${error.message}`,
                    'NETWORK_ERROR',
                    'api',
                    error
                )
            }

            throw new BackendError('Unknown batch error occurred', 'UNKNOWN_ERROR', 'api')
        }
    }

    supportsBatch(): boolean {
        return true
    }

    async cleanup(): Promise<void> {
        // No cleanup required for API backend
    }
}
