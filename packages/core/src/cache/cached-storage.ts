import type { Storage } from '../storage/storage'
import type { BatchConfig } from './batch-processor'
import { BatchProcessor } from './batch-processor'
import type { CacheConfig } from './l1-cache'
import { L1Cache } from './l1-cache'

/**
 * Implementation of Storage that includes caching and optional batch processing.
 */
export class CachedStorage implements Storage {
    private readonly cache: L1Cache<string>
    private readonly batchProcessor?: BatchProcessor<string | null>

    /**
     * Creates an instance of CachedStorage.
     * @param baseStorage The base storage instance.
     * @param cacheConfig Configuration for the L1 cache.
     * @param batchConfig Optional configuration for batch processing.
     */
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

    /**
     * Gets the value associated with the key.
     * @param key The key to get the value for.
     * @returns A promise that resolves to the value associated with the key, or null if the key does not exist.
     */
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

    /**
     * Sets the value for a key.
     * @param key The key to set the value for.
     * @param value The value to set.
     * @param ttlMs Optional TTL in milliseconds.
     * @returns A promise that resolves when the operation is complete.
     */
    async set(key: string, value: string, ttlMs?: number): Promise<void> {
        await this.baseStorage.set(key, value, ttlMs)
        this.cache.set(key, value, ttlMs)
    }

    /**
     * Deletes a key.
     * @param key The key to delete.
     * @returns A promise that resolves when the operation is complete.
     */
    async delete(key: string): Promise<void> {
        await this.baseStorage.delete(key)
        this.cache.delete(key)
    }

    /**
     * Checks if a key exists.
     * @param key The key to check.
     * @returns A promise that resolves to true if the key exists, false otherwise.
     */
    async exists(key: string): Promise<boolean> {
        const cached = this.cache.get(key)
        if (cached !== undefined) return true
        return this.baseStorage.exists(key)
    }

    /**
     * Sets the TTL for a key.
     * @param keyOrIdentifier The key or identifier to set the TTL for.
     * @param ttlMs The TTL in milliseconds.
     * @returns A promise that resolves when the operation is complete.
     */
    async expire(keyOrIdentifier: string, ttlMs: number): Promise<void> {
        await this.baseStorage.expire(keyOrIdentifier, ttlMs)
        this.cache.delete(keyOrIdentifier)
    }

    /**
     * Increments the value of a key.
     * @param key The key to increment.
     * @param ttlMs Optional TTL in milliseconds.
     * @returns A promise that resolves to the new value.
     */
    async increment(key: string, ttlMs?: number): Promise<number> {
        const v = await this.baseStorage.increment(key, ttlMs)
        this.cache.set(key, String(v), ttlMs)
        return v
    }

    /**
     * Increments the value of a key if it is below a maximum value.
     * @param key The key to increment.
     * @param maxValue The maximum value to increment to.
     * @param ttlMs Optional TTL in milliseconds.
     * @returns A promise that resolves to an object containing the new value and a boolean indicating if the value was incremented.
     */
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

    /**
     * Decrements the value of a key.
     * @param key The key to decrement.
     * @param minValue Optional minimum value to decrement to.
     * @returns A promise that resolves to the new value.
     */
    async decrement(key: string, minValue?: number): Promise<number> {
        const v = await this.baseStorage.decrement(key, minValue)
        this.cache.set(key, String(v))
        return v
    }

    /**
     * Adds a timestamp for a key.
     * @param identifier The identifier to add the timestamp for.
     * @param timestamp The timestamp to add.
     * @param ttlMs The TTL in milliseconds.
     * @returns A promise that resolves when the operation is complete.
     */
    async addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<void> {
        await this.baseStorage.addTimestamp(identifier, timestamp, ttlMs)
        this.cache.delete(identifier)
    }

    /**
     * Counts the number of timestamps for a key within a time window.
     * @param identifier The identifier to count timestamps for.
     * @param windowMs The time window in milliseconds.
     * @returns A promise that resolves to the count of timestamps.
     */
    async countTimestamps(identifier: string, windowMs: number): Promise<number> {
        return this.baseStorage.countTimestamps(identifier, windowMs)
    }

    /**
     * Gets the oldest timestamp for a key.
     * @param identifier The identifier to get the oldest timestamp for.
     * @returns A promise that resolves to the oldest timestamp, or null if there are no timestamps.
     */
    async getOldestTimestamp(identifier: string): Promise<number | null> {
        return this.baseStorage.getOldestTimestamp(identifier)
    }

    /**
     * Cleans up timestamps for a key.
     * @param identifier The identifier to clean up timestamps for.
     * @returns A promise that resolves when the operation is complete.
     */
    async cleanupTimestamps(identifier: string): Promise<void> {
        await this.baseStorage.cleanupTimestamps(identifier)
        this.cache.delete(identifier)
    }

    /**
     * Creates a pipeline for batch operations.
     * @returns A pipeline for batch operations.
     */
    pipeline() {
        return this.baseStorage.pipeline()
    }

    /**
     * Gets the values associated with multiple keys.
     * @param keys The keys to get the values for.
     * @returns A promise that resolves to an array of values associated with the keys.
     */
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

    /**
     * Sets the values for multiple keys.
     * @param entries An array of objects containing the key, value, and optional TTL.
     * @returns A promise that resolves when the operation is complete.
     */
    async multiSet(entries: Array<{ key: string; value: string; ttlMs?: number }>): Promise<void> {
        await this.baseStorage.multiSet(entries)
        for (const e of entries) {
            this.cache.set(e.key, e.value, e.ttlMs)
        }
    }

    /**
     * Gets statistics about the cache.
     * @returns An object containing cache statistics.
     */
    getCacheStats() {
        return this.cache.getStats()
    }

    /**
     * Stops the cached storage and cleans up resources.
     */
    stop(): void {
        this.cache.stop()
        this.batchProcessor?.stop()
    }
}
