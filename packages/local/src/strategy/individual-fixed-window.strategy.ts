import type { Storage } from '@ratelock/core/storage'
import type { IndividualTracking, Limited, StrategyMetadata, Windowed } from '@ratelock/core/strategy'
import { Strategy } from '@ratelock/core/strategy'

/**
 * Options for the Individual Fixed Window rate-limiting strategy.
 */
export interface IndividualFixedWindowStrategyOptions {
    /** The maximum number of requests allowed within the window. */
    limit: number
    /** The duration of the time window in milliseconds. */
    windowMs: number
}

/**
 * A rate-limiting strategy that uses an individual fixed time window for each client.
 *
 * The window starts with the first request from a client and lasts for the configured duration.
 * The counter is reset only after the entire window has passed since the initial request.
 */
export class IndividualFixedWindowStrategy
    extends Strategy<IndividualFixedWindowStrategy>
    implements Windowed, Limited, IndividualTracking
{
    override metadata: StrategyMetadata

    /**
     * @param {Storage} storage - The storage service for tracking rate limit counters.
     * @param {IndividualFixedWindowStrategyOptions} options - The configuration options for the strategy.
     */
    constructor(
        override storage: Storage,
        override options: IndividualFixedWindowStrategyOptions
    ) {
        super(storage, options)
        this.metadata = {
            name: 'individual-fixed-window',
            version: '1.0.0',
            memoryEfficient: true,
            supportsBatch: true,
        }
    }

    /**
     * Gets the window duration in milliseconds.
     * @returns {number} The window duration.
     */
    getWindowMs(): number {
        return this.options.windowMs
    }

    /**
     * Gets the request limit for the window.
     * @returns {number} The request limit.
     */
    getLimit(): number {
        return this.options.limit
    }

    /**
     * Constructs a tracking key for a given identifier.
     * @param {string} identifier - The unique client identifier.
     * @returns {string} The formatted tracking key.
     */
    getTrackingKey(identifier: string): string {
        return `ifw:${identifier}`
    }

    /**
     * Checks if a request for a given identifier is allowed.
     * @param {string} identifier - The unique identifier for the client (e.g., IP address, user ID).
     * @returns {Promise<{ allowed: boolean; remaining: number; reset: number; firstRequest: number }>} The rate limit status.
     */
    async check(identifier: string) {
        const now = Date.now()
        const { windowMs, limit } = this.options

        const metaKey = `${identifier}:meta`
        const lockKey = `${identifier}:lock`

        const lockTtl = 1000
        const lockAcquired = await this.tryAcquireLock(lockKey, lockTtl)

        if (!lockAcquired) {
            return {
                allowed: false,
                remaining: 0,
                reset: now + windowMs,
                firstRequest: now,
            }
        }

        try {
            const metaDataRaw = await this.storage.get(metaKey)
            let metaData: { firstRequest: number; currentCount: number } | null = null

            if (metaDataRaw) {
                try {
                    metaData = JSON.parse(metaDataRaw)
                } catch {
                    metaData = null
                }
            }

            let firstRequest: number
            let currentCount: number
            let windowExpired = false

            if (!metaData) {
                firstRequest = now
                currentCount = 0
            } else {
                firstRequest = metaData.firstRequest
                currentCount = metaData.currentCount

                windowExpired = now - firstRequest >= windowMs

                if (windowExpired) {
                    firstRequest = now
                    currentCount = 0
                }
            }

            const allowed = currentCount < limit

            if (allowed) {
                currentCount += 1

                const newMetaData = { firstRequest, currentCount }
                const remainingWindowTime = windowMs - (now - firstRequest)
                const ttlMs = Math.max(1, remainingWindowTime + 1000)

                await this.storage.set(metaKey, JSON.stringify(newMetaData), ttlMs)
            }

            const remaining = Math.max(0, limit - currentCount)
            const reset = firstRequest + windowMs

            return {
                allowed,
                remaining,
                reset,
                firstRequest,
            }
        } finally {
            await this.storage.delete(lockKey)
        }
    }

    /**
     * Attempts to acquire a distributed lock using the storage service.
     * @param {string} lockKey - The key for the lock.
     * @param {number} ttlMs - The time-to-live for the lock in milliseconds.
     * @returns {Promise<boolean>} True if the lock was acquired, false otherwise.
     */
    private async tryAcquireLock(lockKey: string, ttlMs: number): Promise<boolean> {
        try {
            const existing = await this.storage.get(lockKey)
            if (existing) {
                return false
            }

            await this.storage.set(lockKey, Date.now().toString(), ttlMs)

            const verification = await this.storage.get(lockKey)
            return verification !== null
        } catch {
            return false
        }
    }
}

/**
 * Creates a factory function for the IndividualFixedWindowStrategy.
 * @param {IndividualFixedWindowStrategyOptions} options - The configuration options.
 * @returns {(context: { storage: Storage }) => IndividualFixedWindowStrategy} A factory function that creates a new IndividualFixedWindowStrategy instance.
 */
export function createIndividualFixedWindowStrategy(options: IndividualFixedWindowStrategyOptions) {
    return (context: { storage: Storage }) => {
        return new IndividualFixedWindowStrategy(context.storage, options)
    }
}