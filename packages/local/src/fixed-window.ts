import type { FixedWindowOptions, FixedWindowResult, Limiter } from '@ratelock/core'
import {
    validateFixedWindowOptions,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'
import type { LocalLimiterBaseConfig } from './types'

type Entry = { count: number; reset: number }

export type FixedWindowLimiterConfig = FixedWindowOptions & LocalLimiterBaseConfig

export async function fixedWindow(
    config: FixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    validateFixedWindowOptions(config)
    const { limit, windowMs, prefix = 'fw', maxSize = 100000 } = config
    const state = new Map<string, Entry>()
    let ops = 0

    const sweep = () => {
        const now = Date.now()
        let scanned = 0
        for (const [key, entry] of state) {
            if (now >= entry.reset) state.delete(key)
            if (++scanned >= 100) break
        }
    }

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()
            const entry = state.get(key)

            const windowStart = Math.floor(now / windowMs) * windowMs
            const reset = windowStart + windowMs

            if (!entry || now >= entry.reset) {
                state.set(key, { count: 1, reset })
                if (++ops % 1000 === 0 && state.size > maxSize) sweep()
                return { allowed: true, remaining: limit - 1, reset }
            }

            const allowed = entry.count < limit
            if (allowed) {
                entry.count++
                state.set(key, entry)
            }

            return {
                allowed,
                remaining: Math.max(0, limit - entry.count - (allowed ? 0 : 1)),
                reset: entry.reset,
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
