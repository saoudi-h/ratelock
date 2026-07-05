import type { Limiter, TokenBucketOptions, TokenBucketResult } from '@ratelock/core'
import {
    validateTokenBucketOptions,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'
import type { LocalLimiterBaseConfig } from './types'

type Bucket = { tokens: number; lastRefill: number }

export type TokenBucketLimiterConfig = TokenBucketOptions & LocalLimiterBaseConfig

export async function tokenBucket(
    config: TokenBucketLimiterConfig
): Promise<Limiter<TokenBucketResult>> {
    validateTokenBucketOptions(config)
    const { capacity, refillRate, prefix = 'tb', maxSize = 100000 } = config
    const state = new Map<string, Bucket>()
    let ops = 0

    let sweepIterator = state.keys()

    const sweep = () => {
        const now = Date.now()
        let scanned = 0
        while (scanned < 100 && state.size > 0) {
            let next = sweepIterator.next()
            if (next.done) {
                sweepIterator = state.keys()
                next = sweepIterator.next()
                if (next.done) break
            }
            const key = next.value
            const bucket = state.get(key)
            if (bucket) {
                const elapsed = (now - bucket.lastRefill) / 1000
                const tokens = Math.min(capacity, bucket.tokens + elapsed * refillRate)
                if (tokens >= capacity) state.delete(key)
            }
            scanned++
        }
        if (state.size > maxSize) {
            const first = state.keys().next().value
            if (first) state.delete(first)
        }
    }

    let limiter: Limiter<TokenBucketResult> = {
        async check(id: string): Promise<TokenBucketResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()
            let bucket = state.get(key)

            if (!bucket) {
                bucket = { tokens: capacity - 1, lastRefill: now }
                state.set(key, bucket)
                if (++ops % 100 === 0) sweep()
                return {
                    allowed: true,
                    remaining: capacity - 1,
                    tokens: capacity - 1,
                    refillTime: 0,
                }
            }

            const elapsed = (now - bucket.lastRefill) / 1000
            const refilled = Math.min(capacity, bucket.tokens + elapsed * refillRate)

            if (refilled >= 1) {
                bucket.tokens = refilled - 1
                bucket.lastRefill = now
                state.set(key, bucket)
                return {
                    allowed: true,
                    remaining: Math.floor(bucket.tokens),
                    tokens: Math.floor(bucket.tokens),
                    refillTime: 0,
                }
            }

            return {
                allowed: false,
                remaining: Math.floor(bucket.tokens),
                tokens: Math.floor(bucket.tokens),
                refillTime: Math.ceil(((1 - bucket.tokens) / refillRate) * 1000),
            }
        },

        checkBatch(ids: string[]): Promise<TokenBucketResult[]> {
            return Promise.all(ids.map(id => limiter.check(id)))
        },
        async destroy() {
            state.clear()
        },
    }

    if (config.retry) limiter = withRetry(limiter, config.retry)
    if (config.circuitBreaker) limiter = withCircuitBreaker(limiter, config.circuitBreaker)
    if (config.fallback) limiter = withFallback(limiter, config.fallback)

    return limiter
}
