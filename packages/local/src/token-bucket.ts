import type { Limiter, TokenBucketOptions, TokenBucketResult } from '@ratelock/core'

type Bucket = { tokens: number; lastRefill: number }

export type TokenBucketLimiterConfig = TokenBucketOptions & {
  prefix?: string
}

export async function createTokenBucketLimiter(
  config: TokenBucketLimiterConfig,
): Promise<Limiter<TokenBucketResult>> {
  const { capacity, refillRate, prefix = 'tb' } = config
  const state = new Map<string, Bucket>()

  return {
    async check(id: string): Promise<TokenBucketResult> {
      const key = `${prefix}:${id}`
      const now = Date.now()
      let bucket = state.get(key)

      if (!bucket) {
        bucket = { tokens: capacity, lastRefill: now }
        state.set(key, bucket)
      }

      const elapsed = (now - bucket.lastRefill) / 1000
      bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillRate)
      bucket.lastRefill = now

      const allowed = bucket.tokens >= 1
      if (allowed) bucket.tokens -= 1

      state.set(key, bucket)

      const timeUntilNext = allowed ? 0 : Math.ceil(((1 - bucket.tokens) / refillRate) * 1000)

      return {
        allowed,
        remaining: Math.floor(bucket.tokens),
        tokens: Math.floor(bucket.tokens),
        refillTime: timeUntilNext,
      }
    },

    checkBatch(ids: string[]): Promise<TokenBucketResult[]> {
      return Promise.all(ids.map((id) => this.check(id)))
    },
  }
}
