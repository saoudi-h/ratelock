import type { StoragePipeline } from '@ratelock/core/storage'
import type { RedisStorage } from './redis-storage.interface'
import type { RedisClientType } from 'types/redis'
import { StoragePipelineService } from './storage-pipline.service'
import { INCREMENT, INCREMENT_IF, DECREMENT } from 'lua-scripts'

/**
 * Redis Storage Service Implementation
 * Provides a complete storage interface for rate limiting using Redis
 */
export class StorageService implements RedisStorage {
    constructor(private client: RedisClientType) {}

    /**
     * Gets the full key name (allows for future key prefixing)
     * @param key - Base key name
     * @returns Full key name
     */
    private getKey(key: string): string {
        return key
    }

    /**
     * Retrieves a value from Redis
     * @param key - Key to retrieve
     * @returns Value or null if not found
     */
    async get(key: string): Promise<string | null> {
        return this.client.get(this.getKey(key))
    }

    /**
     * Stores a value in Redis with optional TTL
     * @param key - Key to set
     * @param value - Value to store
     * @param ttlMs - Optional TTL in milliseconds
     */
    async set(key: string, value: string, ttlMs?: number): Promise<void> {
        const fullKey = this.getKey(key)
        if (ttlMs && ttlMs > 0) {
            await this.client.set(fullKey, value, { PX: ttlMs })
        } else {
            await this.client.set(fullKey, value)
        }
    }

    /**
     * Deletes a key from Redis
     * @param key - Key to delete
     */
    async delete(key: string): Promise<void> {
        await this.client.del(this.getKey(key))
    }

    /**
     * Checks if a key exists in Redis
     * @param key - Key to check
     * @returns True if key exists
     */
    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(this.getKey(key))
        return result === 1
    }

    /**
     * Sets expiration on a key
     * @param keyOrIdentifier - Key to set expiration on
     * @param ttlMs - TTL in milliseconds
     */
    async expire(keyOrIdentifier: string, ttlMs: number): Promise<void> {
        await this.client.pExpire(this.getKey(keyOrIdentifier), ttlMs)
    }

    /**
     * Atomically increments a key value
     * @param key - Key to increment
     * @param ttlMs - Optional TTL in milliseconds
     * @returns New value after increment
     */
    async increment(key: string, ttlMs?: number): Promise<number> {
        const result = await this.client.eval(INCREMENT, {
            keys: [this.getKey(key)],
            arguments: [ttlMs?.toString() ?? '0'],
        })
        return parseInt(result as string, 10)
    }

    /**
     * Conditionally increments a key if below maximum value
     * @param key - Key to increment
     * @param maxValue - Maximum allowed value
     * @param ttlMs - Optional TTL in milliseconds
     * @returns Object with new value and whether increment occurred
     */
    async incrementIf(
        key: string,
        maxValue: number,
        ttlMs?: number
    ): Promise<{ value: number; incremented: boolean }> {
        const result = (await this.client.eval(INCREMENT_IF, {
            keys: [this.getKey(key)],
            arguments: [maxValue.toString(), ttlMs?.toString() ?? '0'],
        })) as [string, number]

        return {
            value: parseInt(result[0], 10),
            incremented: result[1] === 1,
        }
    }

    /**
     * Atomically decrements a key value with minimum value constraint
     * @param key - Key to decrement
     * @param minValue - Minimum allowed value (default: 0)
     * @returns New value after decrement
     */
    async decrement(key: string, minValue: number = 0): Promise<number> {
        const result = await this.client.eval(DECREMENT, {
            keys: [this.getKey(key)],
            arguments: [minValue.toString()],
        })
        return parseInt(result as string, 10)
    }

    /**
     * Adds a timestamp to a sorted set
     * @param identifier - Sorted set key
     * @param timestamp - Timestamp value to add
     * @param ttlMs - TTL for the sorted set
     */
    async addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<void> {
        const fullKey = this.getKey(identifier)
        await this.client.zAdd(fullKey, { score: timestamp, value: timestamp.toString() })
        if (ttlMs > 0) {
            await this.expire(identifier, ttlMs)
        }
    }

    /**
     * Counts timestamps within a time window
     * @param identifier - Sorted set key
     * @param windowMs - Time window in milliseconds
     * @returns Count of timestamps in window
     */
    async countTimestamps(identifier: string, windowMs: number): Promise<number> {
        const now = Date.now()
        const windowStart = now - windowMs
        return this.client.zCount(this.getKey(identifier), windowStart, now)
    }

    /**
     * Gets the oldest timestamp from a sorted set
     * @param identifier - Sorted set key
     * @returns Oldest timestamp or null if none exists
     */
    async getOldestTimestamp(identifier: string): Promise<number | null> {
        const result = await this.client.zRangeWithScores(this.getKey(identifier), 0, 0)
        return result.length > 0 && result[0] ? result[0].score : null
    }

    /**
     * Cleans up timestamp data (no-op implementation)
     * @param _identifier - Identifier (unused)
     */
    async cleanupTimestamps(_identifier: string): Promise<void> {
        return Promise.resolve()
    }

    /**
     * Retrieves multiple values in a single operation
     * @param keys - Array of keys to retrieve
     * @returns Array of values (null for non-existent keys)
     */
    async multiGet(keys: string[]): Promise<(string | null)[]> {
        if (keys.length === 0) return []
        return this.client.mGet(keys.map(k => this.getKey(k)))
    }

    /**
     * Sets multiple values in a single operation
     * @param entries - Array of {key, value, ttlMs} objects
     */
    async multiSet(entries: Array<{ key: string; value: string; ttlMs?: number }>): Promise<void> {
        if (entries.length === 0) return

        const multi = this.client.multi()
        for (const { key, value, ttlMs } of entries) {
            const fullKey = this.getKey(key)
            if (ttlMs && ttlMs > 0) {
                multi.set(fullKey, value, { PX: ttlMs })
            } else {
                multi.set(fullKey, value)
            }
        }
        await multi.exec()
    }

    /**
     * Executes a Lua script
     * @param script - Lua script to execute
     * @param options - Keys and arguments for the script
     * @returns Script execution result
     */
    async evalScript(
        script: string,
        options: { keys: string[]; arguments: string[] }
    ): Promise<any> {
        return this.client.eval(script, {
            keys: options.keys,
            arguments: options.arguments,
        })
    }

    /**
     * Loads a Lua script into Redis
     * @param script - Lua script to load
     * @returns SHA1 digest of the script
     */
    async scriptLoad(script: string): Promise<string> {
        return this.client.scriptLoad(script)
    }

    /**
     * Executes a loaded Lua script by its SHA1 digest
     * @param sha - SHA1 digest of the script
     * @param options - Keys and arguments for the script
     * @returns Script execution result
     */
    async evalSha(sha: string, options: { keys: string[]; arguments: string[] }): Promise<any> {
        return this.client.evalSha(sha, {
            keys: options.keys,
            arguments: options.arguments,
        })
    }

    /**
     * Creates a new storage pipeline for transactional operations
     * @returns StoragePipeline instance
     */
    pipeline(): StoragePipeline {
        return new StoragePipelineService(this.client.multi() as any)
    }
}
