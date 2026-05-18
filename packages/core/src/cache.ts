import type { CacheConfig, Limiter } from './types'

type CacheEntry<T> = { value: T; expiresAt: number }

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
        if (cache.size >= config.maxSize) {
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
            if (result && typeof result === 'object' && 'allowed' in result && result.allowed === false) {
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
                    if (res && typeof res === 'object' && 'allowed' in res && res.allowed === false) {
                        set(id, res)
                    }
                }
            }

            return results
        },
    }
}
