import type { Storage } from '../storage/storage'
import type { BatchConfig } from './batch-processor'
import { BatchProcessor } from './batch-processor'
import type { CacheConfig } from './l1-cache'
import { L1Cache } from './l1-cache'


export class CachedStorage implements Storage {
    private readonly cache: L1Cache<string>
    private readonly batchProcessor?: BatchProcessor<string | null>

    constructor(
        private readonly baseStorage: Storage,
        cacheConfig: CacheConfig,
        batchConfig?: BatchConfig
    ) {
        this.cache = new L1Cache<string>(cacheConfig)
        if (batchConfig) {
            this.batchProcessor = new BatchProcessor<string | null>(batchConfig, keys =>
                this.baseStorage.multiGet(keys)
            )
        }
    }

    async get(key: string): Promise<string | null> {
        const cached = this.cache.get(key)
        if (cached !== undefined) {
            return cached
        }

        if (this.batchProcessor) {
            const value = await this.batchProcessor.add(key)
            if (value !== null) {
                this.cache.set(key, value)
            }
            return value
        }

        const value = await this.baseStorage.get(key)
        if (value !== null) {
            this.cache.set(key, value)
        }
        return value
    }

    async set(key: string, value: string, ttlMs?: number): Promise<void> {
        await this.baseStorage.set(key, value, ttlMs)
        this.cache.set(key, value, ttlMs)
    }

    async delete(key: string): Promise<void> {
        await this.baseStorage.delete(key)
        this.cache.delete(key)
    }

    async exists(key: string): Promise<boolean> {
        const cached = this.cache.get(key)
        if (cached !== undefined) return true
        return this.baseStorage.exists(key)
    }

    async expire(keyOrIdentifier: string, ttlMs: number): Promise<void> {
        await this.baseStorage.expire(keyOrIdentifier, ttlMs)
        this.cache.delete(keyOrIdentifier)
    }

    async increment(key: string, ttlMs?: number): Promise<number> {
        const v = await this.baseStorage.increment(key, ttlMs)
        this.cache.set(key, String(v), ttlMs)
        return v
    }

    async incrementIf(
        key: string,
        maxValue: number,
        ttlMs?: number
    ): Promise<{
        value: number
        incremented: boolean
    }> {
        const res = await this.baseStorage.incrementIf(key, maxValue, ttlMs)
        this.cache.set(key, String(res.value), ttlMs)
        return res
    }

    async decrement(key: string, minValue?: number): Promise<number> {
        const v = await this.baseStorage.decrement(key, minValue)
        this.cache.set(key, String(v))
        return v
    }

    async addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<void> {
        await this.baseStorage.addTimestamp(identifier, timestamp, ttlMs)
        this.cache.delete(identifier)
    }

    async countTimestamps(identifier: string, windowMs: number): Promise<number> {
        return this.baseStorage.countTimestamps(identifier, windowMs)
    }

    async getOldestTimestamp(identifier: string): Promise<number | null> {
        return this.baseStorage.getOldestTimestamp(identifier)
    }

    async cleanupTimestamps(identifier: string): Promise<void> {
        await this.baseStorage.cleanupTimestamps(identifier)
        this.cache.delete(identifier)
    }

    pipeline() {
        return this.baseStorage.pipeline()
    }

    async multiGet(keys: string[]): Promise<(string | null)[]> {
        const results: (string | null)[] = new Array(keys.length).fill(null)
        const missingKeys: string[] = []
        const missingIndices: number[] = []

        for (let i = 0; i < keys.length; i += 1) {
            const k = keys[i]!
            const cached = this.cache.get(k)
            if (cached !== undefined) {
                results[i] = cached
            } else {
                missingKeys.push(k)
                missingIndices.push(i)
            }
        }

        if (missingKeys.length === 0) return results

        const fetched = await this.baseStorage.multiGet(missingKeys)
        for (let j = 0; j < missingKeys.length; j += 1) {
            const idx = missingIndices[j]!
            const k = missingKeys[j]!
            const v = fetched[j] ?? null
            results[idx] = v
            if (v !== null) {
                this.cache.set(k, v)
            }
        }

        return results
    }

    async multiSet(entries: Array<{ key: string; value: string; ttlMs?: number }>): Promise<void> {
      await this.baseStorage.multiSet(entries)
      for (const e of entries) {
        this.cache.set(e.key, e.value, e.ttlMs)
      }
    }
  
    getCacheStats() {
      return this.cache.getStats()
    }
  
    stop(): void {
      this.cache.stop()
      this.batchProcessor?.stop()
    }
  }
