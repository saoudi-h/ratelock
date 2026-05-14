export interface Limiter<T> {
    check(id: string): Promise<T>
    checkBatch(ids: string[]): Promise<T[]>
}

export type BaseResult = {
    allowed: boolean
}

export type FixedWindowResult = BaseResult & {
    remaining: number
    reset: number
}

export type SlidingWindowResult = BaseResult & {
    remaining: number
    reset: number
    windowStart: number
    windowEnd: number
}

export type TokenBucketResult = BaseResult & {
    remaining: number
    tokens: number
    refillTime: number
}

export type FixedWindowOptions = {
    limit: number
    windowMs: number
    prefix?: string
}

export type SlidingWindowOptions = {
    limit: number
    windowMs: number
    prefix?: string
}

export type TokenBucketOptions = {
    capacity: number
    refillRate: number
    refillInterval?: number
    prefix?: string
}

export type IndividualFixedWindowOptions = {
    limit: number
    windowMs: number
    prefix?: string
}

export type CacheConfig = {
    maxSize: number
    ttlMs: number
}

export type RetryConfig = {
    maxAttempts: number
    baseDelayMs?: number
    maxDelayMs?: number
}

export type CircuitBreakerConfig = {
    failureThreshold: number
    recoveryTimeoutMs: number
}

export type ErrorPolicy = 'throw' | 'allow' | 'deny'
