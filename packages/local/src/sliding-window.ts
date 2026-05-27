import type { Limiter, SlidingWindowOptions, SlidingWindowResult } from '@ratelock/core'
import {
    validateSlidingWindowOptions,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'
import type { LocalLimiterBaseConfig } from './types'

export type SlidingWindowLimiterConfig = SlidingWindowOptions & LocalLimiterBaseConfig

export async function slidingWindow(
    config: SlidingWindowLimiterConfig
): Promise<Limiter<SlidingWindowResult>> {
    validateSlidingWindowOptions(config)
    const { limit, windowMs, prefix = 'sw', maxSize = 100000 } = config
    const state = new Map<string, number[]>()
    let ops = 0

    let sweepIterator = state.keys()

    const sweep = () => {
        const cutoff = Date.now() - windowMs
        let scanned = 0
        while (scanned < 100 && state.size > 0) {
            let next = sweepIterator.next()
            if (next.done) {
                sweepIterator = state.keys()
                next = sweepIterator.next()
                if (next.done) break
            }
            const key = next.value
            const timestamps = state.get(key)
            if (timestamps) {
                const filtered = timestamps.filter(ts => ts > cutoff)
                if (filtered.length === 0) state.delete(key)
                else state.set(key, filtered)
            }
            scanned++
        }
        if (state.size > maxSize) {
            const first = state.keys().next().value
            if (first) state.delete(first)
        }
    }

    let limiter: Limiter<SlidingWindowResult> = {
        async check(id: string): Promise<SlidingWindowResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()
            const cutoff = now - windowMs

            let timestamps = state.get(key) ?? []
            timestamps = timestamps.filter(ts => ts > cutoff)

            const allowed = timestamps.length < limit
            if (allowed) timestamps.push(now)

            state.set(key, timestamps)

            if (++ops % 100 === 0) sweep()

            const oldest = timestamps.length > 0 ? timestamps[0]! : now

            return {
                allowed,
                remaining: Math.max(0, limit - timestamps.length),
                reset: oldest + windowMs,
                windowStart: oldest,
                windowEnd: oldest + windowMs,
            }
        },

        checkBatch(ids: string[]): Promise<SlidingWindowResult[]> {
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
