/** A rate limiter instance capable of checking and batch-checking identifiers. */
export interface Limiter<T> {
    /** Check whether the given identifier is allowed under the rate limit. */
    check(id: string): Promise<T>
    /** Check multiple identifiers in a single call. */
    checkBatch(ids: string[]): Promise<T[]>
    /** Release resources held by this limiter (connections, timers, etc.). */
    destroy?(): Promise<void>
}

/** Base result returned by all rate limiter strategies. */
export type BaseResult = {
    allowed: boolean
}

/** Result from a fixed-window rate limiter. */
export type FixedWindowResult = BaseResult & {
    /** Number of requests remaining in the current window. */
    remaining: number
    /** Epoch timestamp (ms) when the current window resets. */
    reset: number
}

/** Result from a sliding-window rate limiter. */
export type SlidingWindowResult = BaseResult & {
    /** Number of requests remaining in the current window. */
    remaining: number
    /** Epoch timestamp (ms) when the oldest entry expires. */
    reset: number
    /** Epoch timestamp (ms) of the start of the current window. */
    windowStart: number
    /** Epoch timestamp (ms) of the end of the current window. */
    windowEnd: number
}

/** Result from a token-bucket rate limiter. */
export type TokenBucketResult = BaseResult & {
    /** Number of tokens remaining after this check. */
    remaining: number
    /** Current token count (same as remaining). */
    tokens: number
    /** Milliseconds until the next token is available (0 if allowed). */
    refillTime: number
}

/** Configuration options for fixed-window rate limiters. */
export type FixedWindowOptions = {
    /** Maximum number of requests allowed per window. */
    limit: number
    /** Duration of the window in milliseconds. */
    windowMs: number
}

/** Configuration options for sliding-window rate limiters. */
export type SlidingWindowOptions = {
    /** Maximum number of requests allowed per window. */
    limit: number
    /** Duration of the window in milliseconds. */
    windowMs: number
}

/** Configuration options for token-bucket rate limiters. */
export type TokenBucketOptions = {
    /** Maximum number of tokens the bucket can hold. */
    capacity: number
    /** Number of tokens added per second. */
    refillRate: number
}

/** Configuration options for individual (per-key) fixed-window rate limiters. */
export type IndividualFixedWindowOptions = {
    /** Maximum number of requests allowed per window per key. */
    limit: number
    /** Duration of the window in milliseconds. */
    windowMs: number
}

/** Configuration for the in-memory denial cache decorator. */
export type CacheConfig = {
    /** Maximum number of entries in the cache. */
    maxSize: number
    /** Time-to-live for cached entries in milliseconds. */
    ttlMs: number
}

/** Configuration for the retry decorator with exponential backoff. */
export type RetryConfig = {
    /** Maximum number of attempts before giving up. */
    maxAttempts: number
    /** Initial delay between retries in milliseconds (default: 100). */
    baseDelayMs?: number
    /** Maximum delay between retries in milliseconds (default: 2000). */
    maxDelayMs?: number
}

/** Configuration for the circuit breaker decorator. */
export type CircuitBreakerConfig = {
    /** Number of consecutive failures before opening the circuit. */
    failureThreshold: number
    /** Milliseconds to wait before attempting recovery (half-open state). */
    recoveryTimeoutMs: number
}

/**
 * Error handling policy when the underlying limiter throws.
 * - `'throw'`: Re-throw the error.
 * - `'allow'`: Silently allow the request.
 * - `'deny'`: Silently deny the request.
 */
export type FallbackPolicy = 'throw' | 'allow' | 'deny'
