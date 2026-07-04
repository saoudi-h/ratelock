import type { BaseResult, CacheConfig, Limiter } from './types'

type CacheEntry<T> = { value: T; expiresAt: number }

function isDeniedResult(value: unknown): value is BaseResult & { allowed: false } {
    return (
        typeof value === 'object' && value !== null && 'allowed' in value && value.allowed === false
    )
}

/**
 * Wrap a rate limiter with a local in-memory cache decorator.
 * 
 * **DDoS Shield Architecture:**
 * - Caches ONLY blocked/denied results (`allowed: false`) for `ttlMs` (e.g., 100ms or 1s).
 * - Instantaneously intercepts subsequent spam/DDoS requests in-memory without hitting downstream databases.
 * - Does NOT cache allowed results (`allowed: true`) to ensure rate counts increment accurately.
 * 
 * The returned limiter exposes an `invalidate(id)` method — call it to evict a
 * cached "denied" decision early (e.g. after admin action), forcing the next
 * `check(id)` to hit the underlying limiter rather than waiting for `ttlMs`.
 * 
 * @param limiter The downstream RateLimiter engine to decorate.
 * @param config Optional cache settings specifying `ttlMs` and `maxSize`.
 * @returns An decorated RateLimiter engine with memory caching.
 */
export function withCache<T>(limiter: Limiter<T>, config?: CacheConfig): Limiter<T> {
    if (!config) return limiter

    const cache = new Map<string, CacheEntry<T>>()

    const get = (id: string): T | undefined => {
        const entry = cache.get(id)
        if (!entry) return undefined
        if (Date.now() > entry.expiresAt) {
            cache.delete(id)
            return undefined
        }
        return entry.value
    }

    const set = (id: string, value: T) => {
        if (!cache.has(id) && cache.size >= config.maxSize) {
            const first = cache.keys().next().value
            if (first) cache.delete(first)
        }
        cache.set(id, { value, expiresAt: Date.now() + config.ttlMs })
    }

    return {
        async check(id: string): Promise<T> {
            const cached = get(id)
            if (cached) return cached
            const result = await limiter.check(id)
            if (isDeniedResult(result)) {
                set(id, result)
            }
            return result
        },
        async checkBatch(ids: string[]): Promise<T[]> {
            const results: T[] = new Array(ids.length)
            const uncachedIndices: number[] = []
            const uncachedIds: string[] = []

            for (let i = 0; i < ids.length; i++) {
                const id = ids[i]!
                const cached = get(id)
                if (cached) {
                    results[i] = cached
                } else {
                    uncachedIndices.push(i)
                    uncachedIds.push(id)
                }
            }

            if (uncachedIds.length > 0) {
                const freshResults = await limiter.checkBatch(uncachedIds)
                for (let j = 0; j < uncachedIds.length; j++) {
                    const idx = uncachedIndices[j]!
                    const id = uncachedIds[j]!
                    const res = freshResults[j]!
                    results[idx] = res
                    if (isDeniedResult(res)) {
                        set(id, res)
                    }
                }
            }

            return results
        },
        invalidate(id: string): void {
            cache.delete(id)
        },
        async destroy() {
            cache.clear()
            await limiter.destroy?.()
        },
    }
}
