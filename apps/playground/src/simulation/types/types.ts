/**
 * Available rate limiting algorithm types
 */
export type RateLimitStrategy =
    | 'fixed-window'
    | 'sliding-window'
    | 'token-bucket'
    | 'individual-fixed-window'

/**
 * Configuration for fixed window rate limiting
 */
export interface FixedWindowConfig {
    limit: number
    windowMs: number
}

/**
 * Configuration for sliding window rate limiting
 */
export interface SlidingWindowConfig {
    limit: number
    windowMs: number
}

/**
 * Configuration for token bucket rate limiting
 */
export interface TokenBucketConfig {
    capacity: number
    refillRate: number
    refillTime: number
}

/**
 * Configuration for individual fixed window rate limiting
 */
export interface IndividualFixedWindowConfig {
    limit: number
    windowMs: number
}

/**
 * Complete strategy configuration combining type and specific settings
 */
export type StrategyConfig =
    | { type: 'fixed-window'; config: FixedWindowConfig }
    | { type: 'sliding-window'; config: SlidingWindowConfig }
    | { type: 'token-bucket'; config: TokenBucketConfig }
    | { type: 'individual-fixed-window'; config: IndividualFixedWindowConfig }

/**
 * Local storage configuration options
 */
export interface LocalStorageConfig {
    cleanupIntervalMs?: number
    cleanupRequestThreshold?: number
}

/**
 * Redis storage configuration options
 */
export interface RedisStorageConfig {
    url?: string
    host?: string
    port?: number
    password?: string
    db?: number
    keyPrefix?: string
}

/**
 * Storage backend configuration
 */
export type StorageConfig =
    | { type: 'local'; config: LocalStorageConfig }
    | { type: 'redis'; config: RedisStorageConfig }

/**
 * Result of a rate limit check operation
 */
export interface RateLimitResult {
    allowed: boolean
    remaining?: number
    reset?: number
    retryAfter?: number
    limit?: number
    windowMs?: number
    tokens?: number
    capacity?: number
}

/**
 * Record of a rate limit request event
 */
export interface RequestEvent {
    id: string
    timestamp: number
    userId: string
    allowed: boolean
    result: RateLimitResult
    strategy: RateLimitStrategy
    duration?: number
}

/**
 * Control interface for rate limit simulation
 */
export interface StrategyHookReturn {
    isRunning: boolean
    events: any[]
    now: number
    autoRequests: boolean
    autoRequestInterval: number
    sendManualRequest: () => void
    toggleAutoRequests: () => void
    setAutoRequestInterval: (interval: number) => void
    simulationStartTime: number | null
    startSimulation: () => void
    stopSimulation: () => void
    resetSimulation: () => void
}
