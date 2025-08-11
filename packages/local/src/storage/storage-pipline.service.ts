import type { StoragePipeline } from '@ratelock/core/storage'
import type { StorageService } from './storage.service'

/**
 * A service that allows for queuing multiple storage operations to be executed in a single batch.
 * This is useful for performing multiple actions sequentially without waiting for each one to complete individually.
 */
export class StoragePipelineService implements StoragePipeline {
    private commands: Array<() => Promise<unknown>> = []

    constructor(private storage: StorageService) {}

    /**
     * Queues an 'incrementIf' operation.
     * @param {string} key - The key to increment.
     * @param {number} maxValue - The maximum value allowed.
     * @param {number} [ttlMs] - An optional TTL to set if the key is new.
     * @returns {Promise<this>} The pipeline instance for chaining.
     */
    incrementIf(key: string, maxValue: number, ttlMs?: number | undefined): Promise<this> {
        this.commands.push(() => this.storage.incrementIf(key, maxValue, ttlMs))
        return Promise.resolve(this)
    }

    /**
     * Queues a 'decrement' operation.
     * @param {string} key - The key to decrement.
     * @param {number} [minValue] - The minimum value to which the key can be decremented.
     * @returns {Promise<this>} The pipeline instance for chaining.
     */
    decrement(key: string, minValue?: number | undefined): Promise<this> {
        this.commands.push(() => this.storage.decrement(key, minValue))
        return Promise.resolve(this)
    }

    /**
     * Queues a 'get' operation.
     * @param {string} key - The key to retrieve.
     * @returns {Promise<this>} The pipeline instance for chaining.
     */
    get(key: string): Promise<this> {
        this.commands.push(() => this.storage.get(key))
        return Promise.resolve(this)
    }

    /**
     * Queues a 'set' operation.
     * @param {string} key - The key.
     * @param {string} value - The value.
     * @param {number} [ttlMs] - The time-to-live in milliseconds.
     * @returns {Promise<this>} The pipeline instance for chaining.
     */
    set(key: string, value: string, ttlMs?: number | undefined): Promise<this> {
        this.commands.push(() => this.storage.set(key, value, ttlMs))
        return Promise.resolve(this)
    }

    /**
     * Queues an 'increment' operation.
     * @param {string} key - The key to increment.
     * @param {number} [ttlMs] - An optional TTL to set if the key is new.
     * @returns {Promise<this>} The pipeline instance for chaining.
     */
    increment(key: string, ttlMs?: number): Promise<this> {
        this.commands.push(() => this.storage.increment(key, ttlMs))
        return Promise.resolve(this)
    }

    /**
     * Queues an 'addTimestamp' operation.
     * @param {string} identifier - The identifier to associate the timestamp with.
     * @param {number} timestamp - The timestamp value.
     * @param {number} ttlMs - The time-to-live for this timestamp.
     * @returns {Promise<this>} The pipeline instance for chaining.
     */
    addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<this> {
        this.commands.push(() => this.storage.addTimestamp(identifier, timestamp, ttlMs))
        return Promise.resolve(this)
    }

    /**
     * Queues a 'countTimestamps' operation.
     * @param {string} identifier - The identifier to count timestamps for.
     * @param {number} windowMs - The time window in milliseconds.
     * @returns {Promise<this>} The pipeline instance for chaining.
     */
    countTimestamps(identifier: string, windowMs: number): Promise<this> {
        this.commands.push(() => this.storage.countTimestamps(identifier, windowMs))
        return Promise.resolve(this)
    }

    /**
     * Queues a 'getOldestTimestamp' operation.
     * @param {string} identifier - The identifier.
     * @returns {Promise<this>} The pipeline instance for chaining.
     */
    getOldestTimestamp(identifier: string): Promise<this> {
        this.commands.push(() => this.storage.getOldestTimestamp(identifier))
        return Promise.resolve(this)
    }

    /**
     * Queues an 'expire' operation to set a new TTL for a key or identifier.
     * @param {string} keyOrIdentifier - The key or identifier to update.
     * @param {number} ttlMs - The new TTL in milliseconds.
     * @returns {Promise<this>} The pipeline instance for chaining.
     */
    expire(keyOrIdentifier: string, ttlMs: number): Promise<this> {
        this.commands.push(() => this.storage.expire(keyOrIdentifier, ttlMs))
        return Promise.resolve(this)
    }

    /**
     * Executes all queued commands sequentially.
     * @returns {Promise<unknown[]>} An array of results from each command in the order they were queued.
     */
    async exec(): Promise<unknown[]> {
        // Perform cleanup before executing the pipeline
        // Note: This will trigger cleanup for the first operation in the pipeline
        // which is sufficient for our needs
        const results = []
        for (const cmd of this.commands) {
            results.push(await cmd())
        }
        return results
    }
}
