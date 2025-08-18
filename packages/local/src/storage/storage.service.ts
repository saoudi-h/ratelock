import type { Storage, StoragePipeline } from '@ratelock/core/storage'
import { StoragePipelineService } from './storage-pipline.service'

/**
 * In-memory storage service that implements the Storage interface.
 * It handles key-value pairs, timestamps, and on-demand expiration.
 */
export class StorageService implements Storage {
    private store = new Map<string, string>()
    private expirations = new Map<string, number>()
    private timestampsStore = new Map<string, Array<{ timestamp: number; expiresAt: number }>>()
    private lastCleanupTime: number = Date.now()
    private CLEANUP_INTERVAL_MS: number = 1000
    private REQUEST_COUNT_SINCE_LAST_CLEANUP: number = 0
    private CLEANUP_REQUEST_THRESHOLD: number = 1000

    constructor() {}

    /**
     * Checks if cleanup should be performed based on time or request count
     */
    private shouldCleanup(): boolean {
        const now = Date.now()
        return (
            now - this.lastCleanupTime >= this.CLEANUP_INTERVAL_MS ||
            this.REQUEST_COUNT_SINCE_LAST_CLEANUP >= this.CLEANUP_REQUEST_THRESHOLD
        )
    }

    /**
     * Performs cleanup if needed based on time or request count
     */
    private performCleanupIfNeeded(): void {
        this.REQUEST_COUNT_SINCE_LAST_CLEANUP++

        if (this.shouldCleanup()) {
            this.cleanupExpiredEntries()
            this.lastCleanupTime = Date.now()
            this.REQUEST_COUNT_SINCE_LAST_CLEANUP = 0
        }
    }

    /**
     * Cleans up all expired entries from the main store and timestamps store.
     */
    private cleanupExpiredEntries(): void {
        const now = Date.now()

        for (const [key, expirationTime] of this.expirations.entries()) {
            if (expirationTime <= now) {
                this.store.delete(key)
                this.expirations.delete(key)
            }
        }

        for (const [identifier, timestamps] of this.timestampsStore.entries()) {
            const validTimestamps = timestamps.filter(t => t.expiresAt > now)
            if (validTimestamps.length === 0) {
                this.timestampsStore.delete(identifier)
            } else if (validTimestamps.length !== timestamps.length) {
                this.timestampsStore.set(identifier, validTimestamps)
            }
        }
    }

    /**
     * Checks if a key has expired and deletes it if necessary.
     * @param {string} key - The key to check.
     */
    private checkExpired(key: string): void {
        const expiration = this.expirations.get(key)
        if (expiration && expiration < Date.now()) {
            this.store.delete(key)
            this.expirations.delete(key)
        }
    }

    /**
     * Retrieves the value associated with a key.
     * @param {string} key - The key to retrieve.
     * @returns {Promise<string | null>} The value or null if the key doesn't exist or has expired.
     */
    async get(key: string): Promise<string | null> {
        this.performCleanupIfNeeded()
        this.checkExpired(key)
        return this.store.get(key) ?? null
    }

    /**
     * Sets a key-value pair with an optional time-to-live (TTL).
     * @param {string} key - The key.
     * @param {string} value - The value.
     * @param {number} [ttlMs] - The time-to-live in milliseconds.
     */
    async set(key: string, value: string, ttlMs?: number): Promise<void> {
        this.performCleanupIfNeeded()
        this.store.set(key, value)
        if (ttlMs && ttlMs > 0) {
            this.expirations.set(key, Date.now() + ttlMs)
        } else {
            this.expirations.delete(key)
        }
    }

    /**
     * Deletes a key-value pair.
     * @param {string} key - The key to delete.
     */
    async delete(key: string): Promise<void> {
        this.performCleanupIfNeeded()
        this.store.delete(key)
        this.expirations.delete(key)
    }

    /**
     * Checks if a key exists and is not expired.
     * @param {string} key - The key to check.
     * @returns {Promise<boolean>} True if the key exists, false otherwise.
     */
    async exists(key: string): Promise<boolean> {
        this.performCleanupIfNeeded()
        this.checkExpired(key)
        return this.store.has(key)
    }

    /**
     * Increments the value of a key. If the key does not exist, it is initialized to 1.
     * @param {string} key - The key.
     * @param {number} [ttlMs] - An optional TTL to set if the key is new.
     * @returns {Promise<number>} The new value.
     */
    async increment(key: string, ttlMs?: number): Promise<number> {
        this.performCleanupIfNeeded()
        this.checkExpired(key)
        const currentValue = parseInt(this.store.get(key) ?? '0', 10)
        const newValue = currentValue + 1

        const shouldSetTTL = ttlMs && !this.store.has(key)

        this.store.set(key, newValue.toString())

        if (shouldSetTTL) {
            this.expirations.set(key, Date.now() + ttlMs)
        }

        return newValue
    }

    /**
     * Increments the value of a key only if it is less than a maximum value.
     * @param {string} key - The key.
     * @param {number} maxValue - The maximum value allowed.
     * @param {number} [ttlMs] - An optional TTL to set if the key is new.
     * @returns {Promise<{ value: number; incremented: boolean }>} The current value and a flag indicating if the increment occurred.
     */
    async incrementIf(
        key: string,
        maxValue: number,
        ttlMs?: number
    ): Promise<{
        value: number
        incremented: boolean
    }> {
        this.performCleanupIfNeeded()
        this.checkExpired(key)
        const currentValue = parseInt(this.store.get(key) ?? '0', 10)

        if (currentValue < maxValue) {
            const newValue = currentValue + 1
            const shouldSetTTL = ttlMs && !this.store.has(key)

            this.store.set(key, newValue.toString())

            if (shouldSetTTL) {
                this.expirations.set(key, Date.now() + ttlMs)
            }

            return { value: newValue, incremented: true }
        }

        return { value: currentValue, incremented: false }
    }

    /**
     * Decrements the value of a key, ensuring it does not fall below a minimum value.
     * @param {string} key - The key.
     * @param {number} [minValue=0] - The minimum value.
     * @returns {Promise<number>} The new value.
     */
    async decrement(key: string, minValue: number = 0): Promise<number> {
        this.performCleanupIfNeeded()
        this.checkExpired(key)
        const currentValue = parseInt(this.store.get(key) ?? '0', 10)
        const newValue = Math.max(minValue, currentValue - 1)

        if (newValue === 0) {
            this.store.delete(key)
            this.expirations.delete(key)
        } else {
            this.store.set(key, newValue.toString())
        }

        return newValue
    }

    /**
     * Adds a timestamp to an identifier's list.
     * @param {string} identifier - The identifier.
     * @param {number} timestamp - The timestamp to add.
     * @param {number} ttlMs - The TTL for this specific timestamp.
     */
    async addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<void> {
        this.performCleanupIfNeeded()
        if (!this.timestampsStore.has(identifier)) {
            this.timestampsStore.set(identifier, [])
        }
        const timestamps = this.timestampsStore.get(identifier)!
        timestamps.push({ timestamp, expiresAt: Date.now() + ttlMs })
    }

    /**
     * Counts the number of timestamps within a specified time window.
     * @param {string} identifier - The identifier.
     * @param {number} windowMs - The time window in milliseconds.
     * @returns {Promise<number>} The number of valid timestamps.
     */
    async countTimestamps(identifier: string, windowMs: number): Promise<number> {
        this.performCleanupIfNeeded()
        const timestamps = this.timestampsStore.get(identifier)
        if (!timestamps || timestamps.length === 0) {
            return 0
        }

        const now = Date.now()
        const windowStart = now - windowMs

        const validTimestamps = timestamps.filter(
            t => t.expiresAt > now && t.timestamp >= windowStart
        )

        if (validTimestamps.length !== timestamps.length) {
            if (validTimestamps.length === 0) {
                this.timestampsStore.delete(identifier)
            } else {
                this.timestampsStore.set(identifier, validTimestamps)
            }
        }

        return validTimestamps.length
    }

    /**
     * Retrieves the oldest valid timestamp for an identifier.
     * @param {string} identifier - The identifier.
     * @returns {Promise<number | null>} The oldest timestamp or null if none exist.
     */
    async getOldestTimestamp(identifier: string): Promise<number | null> {
        this.performCleanupIfNeeded()
        const timestamps = this.timestampsStore.get(identifier)
        if (!timestamps || timestamps.length === 0) {
            return null
        }

        const now = Date.now()
        const validTimestamps = timestamps.filter(t => t.expiresAt > now)

        if (validTimestamps.length === 0) {
            this.timestampsStore.delete(identifier)
            return null
        }

        if (validTimestamps.length !== timestamps.length) {
            this.timestampsStore.set(identifier, validTimestamps)
        }

        return Math.min(...validTimestamps.map(t => t.timestamp))
    }

    /**
     * Manually cleans up all expired timestamps for a specific identifier.
     * @param {string} identifier - The identifier.
     */
    async cleanupTimestamps(identifier: string): Promise<void> {
        this.performCleanupIfNeeded()
        const timestamps = this.timestampsStore.get(identifier)
        if (!timestamps) return

        const now = Date.now()
        const validTimestamps = timestamps.filter(t => t.expiresAt > now)

        if (validTimestamps.length === 0) {
            this.timestampsStore.delete(identifier)
        } else {
            this.timestampsStore.set(identifier, validTimestamps)
        }
    }

    /**
     * Retrieves multiple values for a list of keys.
     * @param {string[]} keys - The keys to retrieve.
     * @returns {Promise<(string | null)[]>} An array of values, with null for keys that don't exist.
     */
    async multiGet(keys: string[]): Promise<(string | null)[]> {
        this.performCleanupIfNeeded()
        return Promise.all(keys.map(key => this.get(key)))
    }

    /**
     * Sets multiple key-value pairs.
     * @param {Array<{ key: string; value: string; ttlMs?: number }>} entries - An array of entries to set.
     */
    async multiSet(entries: Array<{ key: string; value: string; ttlMs?: number }>): Promise<void> {
        this.performCleanupIfNeeded()
        for (const entry of entries) {
            await this.set(entry.key, entry.value, entry.ttlMs)
        }
    }

    /**
     * Creates a new storage pipeline for batch operations.
     * @returns {StoragePipeline} A new storage pipeline instance.
     */
    pipeline(): StoragePipeline {
        return new StoragePipelineService(this)
    }

    /**
     * Sets a new expiration time for an existing key or identifier.
     * @param {string} keyOrIdentifier - The key or identifier to update.
     * @param {number} ttlMs - The new TTL in milliseconds.
     */
    async expire(keyOrIdentifier: string, ttlMs: number): Promise<void> {
        this.performCleanupIfNeeded()
        if (this.store.has(keyOrIdentifier) || this.timestampsStore.has(keyOrIdentifier)) {
            this.expirations.set(keyOrIdentifier, Date.now() + ttlMs)
        }
    }

    /**
     * Sets the cleanup interval for expired entries.
     * @param {number} intervalMs - The interval in milliseconds.
     */
    public setCleanupInterval(intervalMs: number): void {
        this.CLEANUP_INTERVAL_MS = intervalMs
    }

    /**
     * Sets the request threshold for cleanup.
     * @param {number} threshold - The number of requests before cleanup.
     */
    public setCleanupRequestThreshold(threshold: number): void {
        this.CLEANUP_REQUEST_THRESHOLD = threshold
    }

    /**
     * Manually triggers cleanup of expired entries.
     */
    public manualCleanup(): void {
        this.cleanupExpiredEntries()
        this.lastCleanupTime = Date.now()
        this.REQUEST_COUNT_SINCE_LAST_CLEANUP = 0
    }
}
