import type { FixedWindowOptions, FixedWindowResult, Limiter } from '@ratelock/core'
import { validateFixedWindowOptions } from '@ratelock/core'

type Entry = { count: number; reset: number }

export type FixedWindowLimiterConfig = FixedWindowOptions & {
    prefix?: string
    maxSize?: number
}

export async function createFixedWindowLimiter(
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

    const limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()
            const entry = state.get(key)

            if (!entry || now >= entry.reset) {
                state.set(key, { count: 1, reset: now + windowMs })
                if (++ops % 1000 === 0 && state.size > maxSize) sweep()
                return { allowed: true, remaining: limit - 1, reset: now + windowMs }
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

    return limiter
}
