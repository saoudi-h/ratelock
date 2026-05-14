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
            set(id, result)
            return result
        },
        async checkBatch(ids: string[]): Promise<T[]> {
            const results = await limiter.checkBatch(ids)
            ids.forEach((id, i) => set(id, results[i]!))
            return results
        },
    }
}
