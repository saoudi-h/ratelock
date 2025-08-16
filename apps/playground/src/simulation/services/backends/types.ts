import type { RateLimitResult, StorageConfig, StrategyConfig } from '@/simulation/types'

/**
 * Abstract interface for rate limiting backends
 * Enables switching between different implementations:
 * - ApiBackend: Uses Next.js API (for dev/test with databases)
 * - LocalBackend: Uses @ratelock/local directly (for client-side demos)
 */
export interface RateLimitBackend {
    /**
     * Checks rate limit for a single user
     * @param userId - Unique user identifier
     * @param strategy - Rate limiting strategy configuration
     * @param storage - Storage backend configuration
     * @returns Promise resolving to rate limit result
     */
    checkRateLimit(
        userId: string,
        strategy: StrategyConfig,
        storage: StorageConfig
    ): Promise<RateLimitResult>

    /**
     * Checks rate limits for multiple users in a single batch operation
     * @param identifiers - Array of user identifiers
     * @param strategy - Rate limiting strategy configuration
     * @param storage - Storage backend configuration
     * @returns Promise resolving to array of rate limit results
     */
    checkRateLimitBatch(
        identifiers: string[],
        strategy: StrategyConfig,
        storage: StorageConfig
    ): Promise<RateLimitResult[]>

    /**
     * Indicates whether this backend supports native batch operations
     * @returns true if batch operations are natively supported
     */
    supportsBatch(): boolean

    /**
     * Cleans up backend resources if needed
     * @returns Promise that resolves when cleanup is complete
     */
    cleanup?(): Promise<void>
}

/**
 * Configuration for backend selection and setup
 */
export interface BackendConfig {
    type: 'api' | 'local'
    // API backend specific configuration
    api?: {
        baseUrl?: string
        timeout?: number
    }
    // Local backend specific configuration (currently empty)
    local?: Record<string, never>
}

/**
 * Backend-specific error class
 * @property code - Machine-readable error code
 * @property backend - Backend type where error occurred ('api' or 'local')
 * @property originalError - Underlying error if available
 */
export class BackendError extends Error {
    public readonly code: string
    public readonly backend: string
    public readonly originalError?: Error

    constructor(message: string, code: string, backend: string, originalError?: Error) {
        super(message)
        this.name = 'BackendError'
        this.code = code
        this.backend = backend
        this.originalError = originalError
    }
}
