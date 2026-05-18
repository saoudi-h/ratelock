import {
    type CacheConfig,
    type CircuitBreakerConfig,
    type ErrorPolicy,
    type Limiter,
    type RetryConfig,
    type SlidingWindowOptions,
    type SlidingWindowResult,
    withCache,
    withCircuitBreaker,
    withErrorPolicy,
    withRetry,
} from '@ratelock/core'
import { createConnection } from './client'

const LUA = `
  local key = KEYS[1]
  local window = tonumber(ARGV[1])
  local limit = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
  local current = redis.call('ZCARD', key)
  local allowed = current < limit and 1 or 0
  local remaining = math.max(0, limit - current - (allowed == 1 and 1 or 0))
  if allowed == 1 then
    redis.call('ZADD', key, now, now)
    redis.call('PEXPIRE', key, window)
  end
  local ttl = redis.call('PTTL', key)
  if ttl == -1 or ttl == -2 then ttl = window end
  return {allowed, current + (allowed == 1 and 1 or 0), remaining, ttl}
`

export type SlidingWindowLimiterConfig = SlidingWindowOptions & {
    client?: unknown
    url?: string
    driver?: 'redis' | 'ioredis'
    prefix?: string
    cache?: CacheConfig
    retry?: RetryConfig
    circuitBreaker?: CircuitBreakerConfig
    errorPolicy?: ErrorPolicy
}

export async function createSlidingWindowLimiter(
    config: SlidingWindowLimiterConfig
): Promise<Limiter<SlidingWindowResult>> {
    const { limit, windowMs, prefix = 'sw' } = config

    const { client, disconnect: _disconnect } = await createConnection(config)

    let limiter: Limiter<SlidingWindowResult> = {
        async check(id: string): Promise<SlidingWindowResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()
            const raw = await client.eval(
                LUA,
                [key],
                [windowMs.toString(), limit.toString(), now.toString()]
            )
      const res = raw as [unknown, unknown, unknown, unknown]
      return {
        allowed: Number(res[0]) === 1,
        remaining: Number(res[2]),
        reset: now + Number(res[3]),
        windowStart: now - windowMs,
        windowEnd: now + Number(res[3]),
      }
        },

        async checkBatch(ids: string[]): Promise<SlidingWindowResult[]> {
            return Promise.all(ids.map(id => this.check(id)))
        },
    }

    if (config.cache) limiter = withCache(limiter, config.cache)
    if (config.retry) limiter = withRetry(limiter, config.retry)
    if (config.circuitBreaker) limiter = withCircuitBreaker(limiter, config.circuitBreaker)
    if (config.errorPolicy) limiter = withErrorPolicy(limiter, config.errorPolicy)

    return limiter
}
