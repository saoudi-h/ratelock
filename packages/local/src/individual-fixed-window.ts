import type {
    CircuitBreakerConfig,
    FallbackPolicy,
    FixedWindowResult,
    IndividualFixedWindowOptions,
    Limiter,
    RetryConfig,
} from '@ratelock/core'
import {
    validateFixedWindowOptions,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'

type Entry = { count: number; start: number }

export type IndividualFixedWindowLimiterConfig = IndividualFixedWindowOptions & {
    prefix?: string
    maxSize?: number
    retry?: RetryConfig
    circuitBreaker?: CircuitBreakerConfig
    fallback?: FallbackPolicy
}

export async function individualFixedWindow(
    config: IndividualFixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    validateFixedWindowOptions(config)
    const { limit, windowMs, prefix = 'ifw', maxSize = 100000 } = config
    const state = new Map<string, Entry>()
    let ops = 0

    const sweep = () => {
        const now = Date.now()
        let scanned = 0
        for (const [key, entry] of state) {
            if (now >= entry.start + windowMs) state.delete(key)
            if (++scanned >= 100) break
        }
    }

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()
            let entry = state.get(key)

            if (!entry || now >= entry.start + windowMs) {
                entry = { count: 1, start: now }
                state.set(key, entry)
                if (++ops % 1000 === 0 && state.size > maxSize) sweep()
                return {
                    allowed: true,
                    remaining: limit - 1,
                    reset: now + windowMs,
                }
            }

            const allowed = entry.count < limit
            if (allowed) {
                entry.count++
                state.set(key, entry)
            }

            return {
                allowed,
                remaining: Math.max(0, limit - entry.count),
                reset: entry.start + windowMs,
            }
        },

        checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
            return Promise.all(ids.map(id => limiter.check(id)))
        },
        async destroy() {
            state.clear()
        },
    }

    if (config.retry) limiter = withRetry(limiter, config.retry)
    if (config.circuitBreaker) limiter = withCircuitBreaker(limiter, config.circuitBreaker)
    if (config.fallback) limiter = withFallback(limiter, config.fallback)

    return limiter
}
