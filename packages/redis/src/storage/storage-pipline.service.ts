import type { StoragePipeline } from '@ratelock/core/storage'
import { DECREMENT, INCREMENT, INCREMENT_IF } from 'lua-scripts'

/**
 * Minimal Redis Multi interface for pipeline operations
 * Defines the required Redis commands needed for rate limiting pipelines
 */
interface MinimalRedisMulti {
    get(key: string): this
    set(key: string, value: string, opts?: { PX?: number }): this
    pExpire(key: string, ttl: number): this
    eval(script: string, options: { keys: string[]; arguments: string[] }): this
    zAdd(key: string, member: { score: number; value: string }): this
    zCount(key: string, min: number, max: number): this
    zRangeWithScores(key: string, start: number, stop: number): this
    exec(): Promise<unknown[]>
}

/**
 * Redis Pipeline Service for Rate Limiting
 * Provides transactional operations for rate limiting using Redis pipelines
 */
export class StoragePipelineService implements StoragePipeline {
    constructor(private multi: MinimalRedisMulti) {}

    /* ---------- Simple Key/Value Operations ---------- */

    /**
     * Queues a GET operation in the pipeline
     * @param key - Key to retrieve
     * @returns Pipeline instance for chaining
     */
    get(key: string): this {
        this.multi.get(key)
        return this
    }

    /**
     * Queues a SET operation in the pipeline
     * @param key - Key to set
     * @param value - Value to store
     * @param ttlMs - Optional TTL in milliseconds
     * @returns Pipeline instance for chaining
     */
    set(key: string, value: string, ttlMs?: number): this {
        this.multi.set(key, value, ttlMs ? { PX: ttlMs } : undefined)
        return this
    }

    /**
     * Queues an EXPIRE operation in the pipeline
     * @param keyOrIdentifier - Key to set expiration on
     * @param ttlMs - TTL in milliseconds
     * @returns Pipeline instance for chaining
     */
    expire(keyOrIdentifier: string, ttlMs: number): this {
        this.multi.pExpire(keyOrIdentifier, ttlMs)
        return this
    }

    /* ---------- Lua Counter Operations ---------- */

    /**
     * Queues an INCREMENT operation using Lua script
     * @param key - Key to increment
     * @param ttlMs - Optional TTL in milliseconds
     * @returns Pipeline instance for chaining
     */
    increment(key: string, ttlMs?: number): this {
        this.multi.eval(INCREMENT, {
            keys: [key],
            arguments: [ttlMs?.toString() ?? '0'],
        })
        return this
    }

    /**
     * Queues a conditional INCREMENT operation using Lua script
     * @param key - Key to increment
     * @param maxValue - Maximum allowed value
     * @param ttlMs - Optional TTL in milliseconds
     * @returns Pipeline instance for chaining
     */
    incrementIf(key: string, maxValue: number, ttlMs?: number): this {
        this.multi.eval(INCREMENT_IF, {
            keys: [key],
            arguments: [maxValue.toString(), ttlMs?.toString() ?? '0'],
        })
        return this
    }

    /**
     * Queues a DECREMENT operation using Lua script
     * @param key - Key to decrement
     * @param minValue - Minimum allowed value (default: 0)
     * @returns Pipeline instance for chaining
     */
    decrement(key: string, minValue = 0): this {
        this.multi.eval(DECREMENT, {
            keys: [key],
            arguments: [minValue.toString()],
        })
        return this
    }

    /* ---------- Sorted Set Timestamp Operations ---------- */

    /**
     * Queues adding a timestamp to a sorted set
     * @param identifier - Sorted set key
     * @param timestamp - Timestamp value to add
     * @param ttlMs - TTL for the sorted set
     * @returns Pipeline instance for chaining
     */
    addTimestamp(identifier: string, timestamp: number, ttlMs: number): this {
        this.multi.zAdd(identifier, { score: timestamp, value: String(timestamp) })
        this.multi.pExpire(identifier, ttlMs)
        return this
    }

    /**
     * Queues counting timestamps within a time window
     * @param identifier - Sorted set key
     * @param windowMs - Time window in milliseconds
     * @returns Pipeline instance for chaining
     */
    countTimestamps(identifier: string, windowMs: number): this {
        const now = Date.now()
        this.multi.zCount(identifier, now - windowMs, now)
        return this
    }

    /**
     * Queues getting the oldest timestamp from a sorted set
     * @param identifier - Sorted set key
     * @returns Pipeline instance for chaining
     */
    getOldestTimestamp(identifier: string): this {
        this.multi.zRangeWithScores(identifier, 0, 0)
        return this
    }

    /* ---------- Pipeline Execution ---------- */

    /**
     * Executes all queued commands in the pipeline
     * @returns Array of command results
     */
    async exec(): Promise<unknown[]> {
        return this.multi.exec()
    }
}
