export interface CacheConfig {
    maxSize: number
    ttlMs: number
    cleanupIntervalMs: number
    enabled: boolean
}

interface CacheEntry<T> {
    value: T
    createdAt: number
    expiresAt: number
    hitCount: number
    lastAccessed: number
}

export interface L1CacheStats {
    hits: number
    misses: number
    evictions: number
    cleanups: number
    hitRate: number
    size: number
    maxSize: number
}

export class L1Cache<T> {
    private readonly cache = new Map<string, CacheEntry<T>>()
    private cleanupTimer: NodeJS.Timeout | undefined

    private stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        cleanups: 0,
    }

    constructor(private readonly config: CacheConfig) {
        if (config.enabled) {
            this.startCleanupTask()
        }
    }

    get(key: string): T | undefined {
        if (!this.config.enabled) return undefined

        const entry = this.cache.get(key)
        if (!entry) {
            this.stats.misses += 1
            return undefined
        }

        const now = Date.now()
        if (now > entry.expiresAt) {
            this.cache.delete(key)
            this.stats.misses += 1
            return undefined
        }

        entry.hitCount += 1
        entry.lastAccessed = now
        this.stats.hits += 1

        // maintenir LRU
        this.cache.delete(key)
        this.cache.set(key, entry)

        return entry.value
    }

    set(key: string, value: T, customTtlMs?: number): void {
        if (!this.config.enabled) return

        const now = Date.now()
        const ttl = customTtlMs ?? this.config.ttlMs

        if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
            this.evictLRU()
        }

        const entry: CacheEntry<T> = {
            value,
            createdAt: now,
            expiresAt: now + Math.max(0, ttl),
            hitCount: 0,
            lastAccessed: now,
        }

        this.cache.set(key, entry)
    }

    delete(key: string): boolean {
        return this.cache.delete(key)
    }

    clear(): void {
        this.cache.clear()
    }

    private evictLRU(): void {
        if (this.cache.size === 0) return

        let oldestKey: string | undefined
        let oldestTime = Number.MAX_SAFE_INTEGER

        for (const [k, e] of this.cache.entries()) {
            if (e.lastAccessed < oldestTime) {
                oldestTime = e.lastAccessed
                oldestKey = k
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey)
            this.stats.evictions += 1
        }
    }

    private startCleanupTask(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup()
        }, this.config.cleanupIntervalMs)
    }

    private cleanup(): void {
        const now = Date.now()
        for (const [k, e] of this.cache.entries()) {
            if (now > e.expiresAt) {
                this.cache.delete(k)
            }
        }
        this.stats.cleanups += 1
    }

    getStats(): L1CacheStats {
        const total = this.stats.hits + this.stats.misses
        const hitRate = total > 0 ? this.stats.hits / total : 0
        return {
            ...this.stats,
            hitRate: Math.round(hitRate * 100) / 100,
            size: this.cache.size,
            maxSize: this.config.maxSize,
        }
    }

    stop(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer)
            this.cleanupTimer = undefined
        }
    }
}
