import {
    type Limiter,
    type TokenBucketOptions,
    type TokenBucketResult,
    validateTokenBucketOptions,
    withCache,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'
import { createConnection } from './client'
import type { RedisLimiterBaseConfig } from './types'

const LUA = `
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local refill_rate = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
  local tokens = tonumber(bucket[1]) or capacity
  local last_refill = tonumber(bucket[2]) or now
  local time_elapsed = (now - last_refill) / 1000
  local tokens_to_add = time_elapsed * refill_rate
  tokens = math.min(capacity, tokens + tokens_to_add)
  local allowed = tokens >= 1 and 1 or 0
  if allowed == 1 then tokens = tokens - 1 end
  redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
  redis.call('PEXPIRE', key, 3600000)
  local time_until_next = 0
  if tokens < 1 then
    time_until_next = math.ceil((1 - tokens) / refill_rate * 1000)
  end
  return {allowed, math.floor(tokens), time_until_next}
`

export type TokenBucketLimiterConfig = TokenBucketOptions & RedisLimiterBaseConfig

export async function tokenBucket(
    config: TokenBucketLimiterConfig
): Promise<Limiter<TokenBucketResult>> {
    validateTokenBucketOptions(config)
    const { capacity, refillRate, prefix = 'tb' } = config

    const { client, disconnect } = await createConnection(config)

    let limiter: Limiter<TokenBucketResult> = {
        async check(id: string): Promise<TokenBucketResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()
            const raw = await client.eval(
                LUA,
                [key],
                [capacity.toString(), refillRate.toString(), now.toString()]
            )
            const res = raw as [unknown, unknown, unknown]
            return {
                allowed: Number(res[0]) === 1,
                remaining: Number(res[1]),
                tokens: Number(res[1]),
                refillTime: Number(res[2]),
            }
        },

        async checkBatch(ids: string[]): Promise<TokenBucketResult[]> {
            return Promise.all(ids.map(id => limiter.check(id)))
        },

        async destroy() {
            await disconnect()
        },
    }

    if (config.cache) limiter = withCache(limiter, config.cache)
    if (config.retry) limiter = withRetry(limiter, config.retry)
    if (config.circuitBreaker) limiter = withCircuitBreaker(limiter, config.circuitBreaker)
    if (config.fallback) limiter = withFallback(limiter, config.fallback)

    return limiter
}
