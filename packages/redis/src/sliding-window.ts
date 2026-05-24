import {
    type CacheConfig,
    type CircuitBreakerConfig,
    type FallbackPolicy,
    type Limiter,
    type RetryConfig,
    type SlidingWindowOptions,
    type SlidingWindowResult,
    validateSlidingWindowOptions,
    withCache,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'
import { createConnection } from './client'

const LUA = `
  local key = KEYS[1]
  local window = tonumber(ARGV[1])
  local limit = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local uid = ARGV[4]
  redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
  local current = redis.call('ZCARD', key)
  local allowed = current < limit and 1 or 0
  local remaining = math.max(0, limit - current - (allowed == 1 and 1 or 0))
  if allowed == 1 then
    redis.call('ZADD', key, now, now .. ':' .. uid)
    redis.call('PEXPIRE', key, window)
  end
  local ttl = redis.call('PTTL', key)
  if ttl == -1 or ttl == -2 then ttl = window end
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldest_ts = #oldest > 0 and tonumber(oldest[2]) or (now - window)
  return {allowed, current + (allowed == 1 and 1 or 0), remaining, ttl, oldest_ts}
`

export type SlidingWindowLimiterConfig = SlidingWindowOptions & {
    client?: unknown
    url?: string
    driver?: 'redis' | 'ioredis'
    prefix?: string
    cache?: CacheConfig
    retry?: RetryConfig
    circuitBreaker?: CircuitBreakerConfig
    fallback?: FallbackPolicy
}

export async function slidingWindow(
    config: SlidingWindowLimiterConfig
): Promise<Limiter<SlidingWindowResult>> {
    validateSlidingWindowOptions(config)
    const { limit, windowMs, prefix = 'sw' } = config
    let uidCounter = 0

    const { client, disconnect } = await createConnection(config)

    let limiter: Limiter<SlidingWindowResult> = {
        async check(id: string): Promise<SlidingWindowResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()
            const uid = (uidCounter++).toString(36)
            const raw = await client.eval(
                LUA,
                [key],
                [windowMs.toString(), limit.toString(), now.toString(), uid]
            )
            const res = raw as [unknown, unknown, unknown, unknown, unknown]
            return {
                allowed: Number(res[0]) === 1,
                remaining: Number(res[2]),
                reset: now + Number(res[3]),
                windowStart: Number(res[4]),
                windowEnd: now + Number(res[3]),
            }
        },

        async checkBatch(ids: string[]): Promise<SlidingWindowResult[]> {
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
