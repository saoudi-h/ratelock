import { Strategy } from '../abstract'
import { createStrategy } from '../builder'
import type { InferStrategyResult, TokenBasedLimited } from '../capabilities'
import { createStrategyFactory, type StrategyValidator } from '../factory'
import { StrategyRegistry } from '../registry'
import type {
    BaseStrategyOptions,
    StrategyContext,
    StrategyMetadata,
    TypedStrategyFactory,
} from '../types'

export interface TokenBucketOptions extends BaseStrategyOptions {
    capacity: number
    refillRate: number // tokens per second
    refillTime: number // milliseconds between refills
}

export const tokenBucketValidator: StrategyValidator<TokenBucketOptions> = {
    validate(options) {
        if (options.capacity <= 0) throw new Error('capacity must be positive')
        if (options.refillRate <= 0) throw new Error('refillRate must be positive')
        if (options.refillTime <= 0) throw new Error('refillTime must be positive')
    },
    normalize(options) {
        return {
            ...options,
            prefix: options.prefix ?? 'tb',
            enableStats: options.enableStats ?? false,
            cleanupInterval: options.cleanupInterval ?? 60_000,
        }
    },
}

export class TokenBucketStrategy extends Strategy<TokenBasedLimited, TokenBucketOptions> {
    readonly metadata: StrategyMetadata = {
        name: 'token-bucket',
        version: '1.0.0',
        memoryEfficient: true,
        supportsBatch: true,
    }

    override async check(identifier: string): Promise<InferStrategyResult<TokenBasedLimited>> {
        const now = Date.now()
        const { capacity, refillRate, refillTime, prefix = 'tb' } = this.options

        const tokensKey = `${prefix}:${identifier}:tokens`
        const lastRefillKey = `${prefix}:${identifier}:lastRefill`

        // Get current state
        const [currentTokensStr, lastRefillStr] = await Promise.all([
            this.storage.get(tokensKey),
            this.storage.get(lastRefillKey),
        ])

        let currentTokens = currentTokensStr ? parseFloat(currentTokensStr) : capacity
        const lastRefill = lastRefillStr ? parseInt(lastRefillStr, 10) : now

        // Calculate tokens to add based on time elapsed
        const timeElapsed = now - lastRefill
        const tokensToAdd = (timeElapsed / 1000) * refillRate
        currentTokens = Math.min(capacity, currentTokens + tokensToAdd)

        // Check if we can consume a token
        const allowed = currentTokens >= 1
        if (allowed) {
            currentTokens -= 1
        }

        // Update storage
        const ttlMs = Math.max(1000, refillTime * 10) // Keep data for 10x refill time
        await Promise.all([
            this.storage.set(tokensKey, currentTokens.toString(), ttlMs),
            this.storage.set(lastRefillKey, now.toString(), ttlMs),
        ])

        // Calculate next refill time (commented out as not used in result)
        // const tokensNeeded = 1 - currentTokens
        // const timeToNextToken = (tokensNeeded / refillRate) * 1000 // Not used in result
        // const nextRefill = now + timeToNextToken // Not used in result

        return {
            allowed,
            remaining: Math.floor(currentTokens),
            // reset: nextRefill, // Not exposed in result type
            tokens: currentTokens,
            refillTime: this.options.refillTime,
            // capacity, // Not exposed in result type
            // refillRate, // Not exposed in result type
        }
    }

    override async checkBatch(
        identifiers: string[]
    ): Promise<Array<InferStrategyResult<TokenBasedLimited>>> {
        const results: Array<InferStrategyResult<TokenBasedLimited>> = []
        for (const identifier of identifiers) {
            results.push(await this.check(identifier))
        }
        return results
    }
}

export const createTokenBucketStrategy = createStrategyFactory<
    TokenBucketStrategy,
    TokenBucketOptions
>(tokenBucketValidator, (storage, options) => new TokenBucketStrategy(storage, options))

export const createTypedTokenBucketStrategy: TypedStrategyFactory<
    TokenBucketStrategy,
    TokenBucketOptions
> = options => (context: StrategyContext) => createTokenBucketStrategy(context.storage, options)

StrategyRegistry.register('token-bucket', createTypedTokenBucketStrategy)

export const TokenBucket = createStrategy<TokenBucketStrategy, TokenBucketOptions>(
    createTypedTokenBucketStrategy
)
