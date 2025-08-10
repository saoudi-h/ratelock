import type { Storage } from '@ratelock/core/storage'
import type { Limited, StrategyMetadata, TokenBased } from '@ratelock/core/strategy'
import { Strategy } from '@ratelock/core/strategy'

/**
 * Options for the Token Bucket rate-limiting strategy.
 */
export interface TokenBucketStrategyOptions {
    /** The maximum number of tokens the bucket can hold. */
    capacity: number
    /** The rate at which tokens are added to the bucket, in tokens per second. */
    refillRate: number
    /** The interval in milliseconds at which the bucket is refilled. Defaults to 1000. */
    refillInterval?: number
    /** The initial number of tokens in the bucket. Defaults to capacity. */
    initialTokens?: number
}

/**
 * A rate-limiting strategy based on a token bucket algorithm with discrete refills.
 *
 * Tokens are added to the bucket at a fixed interval, up to a maximum capacity.
 * Each request consumes one token. Requests are only allowed if there is at least one token available.
 */
export class TokenBucketStrategy
    extends Strategy<TokenBucketStrategy>
    implements TokenBased, Limited
{
    private readonly refillInterval: number
    private readonly tokensPerRefill: number
    override metadata: StrategyMetadata

    /**
     * @param {Storage} storage - The storage service for tracking the token bucket state.
     * @param {TokenBucketStrategyOptions} options - The configuration options for the strategy.
     */
    constructor(
        override storage: Storage,
        override options: TokenBucketStrategyOptions
    ) {
        super(storage, options)
        this.metadata = {
            name: 'token-bucket',
            version: '1.0.0',
            memoryEfficient: true,
            supportsBatch: true,
        }
        this.refillInterval = options.refillInterval ?? 1000
        this.tokensPerRefill = (options.refillRate * this.refillInterval) / 1000
    }

    /**
     * Gets the bucket's maximum token capacity.
     * @returns {number} The capacity.
     */
    getCapacity(): number {
        return this.options.capacity
    }

    /**
     * Gets the refill rate in tokens per second.
     * @returns {number} The refill rate.
     */
    getRefillRate(): number {
        return this.options.refillRate
    }

    /**
     * Gets the refill interval in milliseconds.
     * @returns {number} The refill interval.
     */
    getRefillInterval(): number {
        return this.refillInterval
    }

    /**
     * Gets the maximum number of requests allowed in a single burst, equivalent to the capacity.
     * @returns {number} The limit.
     */
    getLimit(): number {
        return this.options.capacity
    }

    /**
     * Checks if a request for a given identifier is allowed.
     * @param {string} identifier - The unique identifier for the client.
     * @returns {Promise<{ allowed: boolean; remaining: number; tokens: number; refillTime: number }>} The rate limit status.
     */
    async check(identifier: string) {
        const now = Date.now()
        const { capacity, initialTokens } = this.options
        const startingTokens = initialTokens ?? capacity

        const bucketKey = `${identifier}:bucket`

        const bucketDataRaw = await this.storage.get(bucketKey)
        let bucketData: { tokens: number; lastRefill: number } | null = null

        if (bucketDataRaw) {
            try {
                bucketData = JSON.parse(bucketDataRaw)
            } catch {
                bucketData = null
            }
        }

        let currentTokens: number
        let lastRefill: number

        if (!bucketData) {
            currentTokens = startingTokens
            lastRefill = now
        } else {
            currentTokens = bucketData.tokens
            lastRefill = bucketData.lastRefill

            const timeSinceLastRefill = now - lastRefill
            const refillCount = Math.floor(timeSinceLastRefill / this.refillInterval)

            if (refillCount > 0) {
                const tokensToAdd = refillCount * this.tokensPerRefill
                currentTokens = Math.min(capacity, currentTokens + tokensToAdd)
                lastRefill = lastRefill + refillCount * this.refillInterval
            }
        }

        const allowed = currentTokens >= 1
        let finalTokens = currentTokens

        if (allowed) {
            finalTokens = currentTokens - 1
        }

        const newBucketData = { tokens: finalTokens, lastRefill }

        const ttlMs = Math.max(3600000, this.refillInterval * 10)
        await this.storage.set(bucketKey, JSON.stringify(newBucketData), ttlMs)

        const remaining = Math.floor(finalTokens)

        const nextRefillTime = lastRefill + this.refillInterval
        const refillTime = Math.max(now, nextRefillTime)

        return {
            allowed,
            remaining,
            tokens: finalTokens,
            refillTime,
        }
    }
}

/**
 * A rate-limiting strategy based on a token bucket algorithm with continuous refills.
 *
 * This implementation refills the bucket continuously over time rather than at discrete intervals.
 * It provides more fluid and precise rate limiting but can be slightly more computationally expensive
 * due to floating-point calculations.
 */
export class ContinuousTokenBucketStrategy
    extends Strategy<ContinuousTokenBucketStrategy>
    implements TokenBased, Limited
{
    override metadata: StrategyMetadata

    /**
     * @param {Storage} storage - The storage service for tracking the token bucket state.
     * @param {TokenBucketStrategyOptions} options - The configuration options for the strategy.
     */
    constructor(
        override storage: Storage,
        override options: TokenBucketStrategyOptions
    ) {
        super(storage, options)
        this.metadata = {
            name: 'continuous-token-bucket',
            version: '1.0.0',
            memoryEfficient: true,
            supportsBatch: true,
        }
    }

    /**
     * Gets the bucket's maximum token capacity.
     * @returns {number} The capacity.
     */
    getCapacity(): number {
        return this.options.capacity
    }

    /**
     * Gets the refill rate in tokens per second.
     * @returns {number} The refill rate.
     */
    getRefillRate(): number {
        return this.options.refillRate
    }

    /**
     * Gets the refill interval in milliseconds. This is a conceptual value, as refills are continuous.
     * @returns {number} The refill interval.
     */
    getRefillInterval(): number {
        return this.options.refillInterval ?? 1000
    }

    /**
     * Gets the maximum number of requests allowed in a single burst, equivalent to the capacity.
     * @returns {number} The limit.
     */
    getLimit(): number {
        return this.options.capacity
    }

    /**
     * Checks if a request for a given identifier is allowed.
     * @param {string} identifier - The unique identifier for the client.
     * @returns {Promise<{ allowed: boolean; remaining: number; tokens: number; refillTime: number }>} The rate limit status.
     */
    async check(identifier: string) {
        const now = Date.now()
        const { capacity, refillRate, initialTokens } = this.options
        const startingTokens = initialTokens ?? capacity

        const bucketKey = `${identifier}:bucket`

        const bucketDataRaw = await this.storage.get(bucketKey)
        let bucketData: { tokens: number; lastUpdate: number } | null = null

        if (bucketDataRaw) {
            try {
                bucketData = JSON.parse(bucketDataRaw)
            } catch {
                bucketData = null
            }
        }

        let currentTokens: number
        let lastUpdate: number

        if (!bucketData) {
            currentTokens = startingTokens
            lastUpdate = now
        } else {
            const timeDiffSeconds = (now - bucketData.lastUpdate) / 1000
            const tokensToAdd = timeDiffSeconds * refillRate
            currentTokens = Math.min(capacity, bucketData.tokens + tokensToAdd)
            lastUpdate = now
        }

        const allowed = currentTokens >= 1
        const finalTokens = allowed ? currentTokens - 1 : currentTokens

        const newBucketData = { tokens: finalTokens, lastUpdate }
        const ttlMs = 3600000
        await this.storage.set(bucketKey, JSON.stringify(newBucketData), ttlMs)

        const timeToNextToken =
            finalTokens >= capacity ? Infinity : ((1 - (finalTokens % 1)) / refillRate) * 1000

        const refillTime = timeToNextToken === Infinity ? now + 3600000 : now + timeToNextToken
        return {
            allowed,
            remaining: Math.floor(finalTokens),
            tokens: finalTokens,
            refillTime,
        }
    }
}

/**
 * Creates a factory function for the TokenBucketStrategy.
 * @param {TokenBucketStrategyOptions} options - The configuration options.
 * @returns {(context: { storage: Storage }) => TokenBucketStrategy} A factory function that creates a new TokenBucketStrategy instance.
 */
export function createTokenBucketStrategy(options: TokenBucketStrategyOptions) {
    return (context: { storage: Storage }) => {
        return new TokenBucketStrategy(context.storage, options)
    }
}

/**
 * Creates a factory function for the ContinuousTokenBucketStrategy.
 * @param {TokenBucketStrategyOptions} options - The configuration options.
 * @returns {(context: { storage: Storage }) => ContinuousTokenBucketStrategy} A factory function that creates a new ContinuousTokenBucketStrategy instance.
 */
export function createContinuousTokenBucketStrategy(options: TokenBucketStrategyOptions) {
    return (context: { storage: Storage }) => {
        return new ContinuousTokenBucketStrategy(context.storage, options)
    }
}