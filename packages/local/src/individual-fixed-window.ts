import type { FixedWindowResult, IndividualFixedWindowOptions, Limiter } from '@ratelock/core'
import {
    validateFixedWindowOptions,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'
import type { LocalLimiterBaseConfig } from './types'

type Entry = { count: number; start: number }

export type IndividualFixedWindowLimiterConfig = IndividualFixedWindowOptions &
    LocalLimiterBaseConfig

export async function individualFixedWindow(
    config: IndividualFixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    validateFixedWindowOptions(config)
    const { limit, windowMs, prefix = 'ifw', maxSize = 100000 } = config
    const state = new Map<string, Entry>()
    let ops = 0

    let sweepIterator = state.keys()

    const sweep = () => {
        const now = Date.now()
        let scanned = 0
        while (scanned < 100 && state.size > 0) {
            let next = sweepIterator.next()
            if (next.done) {
                sweepIterator = state.keys()
                next = sweepIterator.next()
                if (next.done) break
            }
            const key = next.value
            const entry = state.get(key)
            if (entry && now >= entry.start + windowMs) state.delete(key)
            scanned++
        }
        if (state.size > maxSize) {
            const first = state.keys().next().value
            if (first) state.delete(first)
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
                if (++ops % 100 === 0) sweep()
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
