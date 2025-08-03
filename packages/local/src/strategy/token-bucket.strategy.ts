import type { Storage } from '@ratelock/core/storage'
import type { Limited, TokenBased } from '@ratelock/core/strategy'
import { Strategy } from '@ratelock/core/strategy'

export interface TokenBucketStrategyOptions {
    capacity: number 
    refillRate: number 
    refillInterval?: number 
    initialTokens?: number 
}

export class TokenBucketStrategy
    extends Strategy<TokenBucketStrategy>
    implements TokenBased, Limited
{
    private readonly refillInterval: number
    private readonly tokensPerRefill: number
    constructor(
        private storage: Storage,
        private options: TokenBucketStrategyOptions
    ) {
        super()

        this.refillInterval = options.refillInterval ?? 1000 
        
        this.tokensPerRefill = (options.refillRate * this.refillInterval) / 1000
    }

    getCapacity(): number {
        return this.options.capacity
    }

    getRefillRate(): number {
        return this.options.refillRate
    }
    getRefillInterval(): number {
        return this.refillInterval
    }

    getLimit(): number {
        
        return this.options.capacity
    }

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

export class ContinuousTokenBucketStrategy
    extends Strategy<ContinuousTokenBucketStrategy>
    implements TokenBased, Limited
{
    constructor(
        private storage: Storage,
        private options: TokenBucketStrategyOptions
    ) {
        super()
    }
    getCapacity(): number {
        return this.options.capacity
    }

    getRefillRate(): number {
        return this.options.refillRate
    }

    getRefillInterval(): number {
        return this.options.refillInterval ?? 1000
    }

    getLimit(): number {
        return this.options.capacity
    }

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
export function createTokenBucketStrategy(options: TokenBucketStrategyOptions) {
    return (context: { storage: Storage }) => {
        return new TokenBucketStrategy(context.storage, options)
    }
}

export function createContinuousTokenBucketStrategy(options: TokenBucketStrategyOptions) {
    return (context: { storage: Storage }) => {
        return new ContinuousTokenBucketStrategy(context.storage, options)
    }
}
