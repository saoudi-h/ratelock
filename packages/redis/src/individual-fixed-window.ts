import {
    type CacheConfig,
    type CircuitBreakerConfig,
    type ErrorPolicy,
    type FixedWindowResult,
    type IndividualFixedWindowOptions,
    type Limiter,
    type RetryConfig,
    validateFixedWindowOptions,
    withCache,
    withCircuitBreaker,
    withErrorPolicy,
    withRetry,
} from '@ratelock/core'
import { createConnection } from './client'

const LUA = `
  local startKey = KEYS[1]
  local countKey = KEYS[2]
  local windowMs = tonumber(ARGV[1])
  local limit = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local start = redis.call('GET', startKey)
  if not start then
    start = now
    redis.call('SET', startKey, start, 'PX', windowMs)
  else
    start = tonumber(start)
    if now >= start + windowMs then
      start = now
      redis.call('SET', startKey, start, 'PX', windowMs)
      redis.call('DEL', countKey)
    end
  end
  local ttlMs = start + windowMs - now
  if ttlMs <= 0 then ttlMs = 1 end
  local current = redis.call('INCR', countKey)
  if current == 1 then
    redis.call('PEXPIRE', countKey, ttlMs)
  end
  local allowed = current <= limit and 1 or 0
  if allowed == 0 then
    redis.call('DECR', countKey)
    current = current - 1
  end
  return {allowed, current, math.max(0, limit - current), start + windowMs}
`

export type IndividualFixedWindowLimiterConfig = IndividualFixedWindowOptions & {
    client?: unknown
    url?: string
    driver?: 'redis' | 'ioredis'
    prefix?: string
    cache?: CacheConfig
    retry?: RetryConfig
    circuitBreaker?: CircuitBreakerConfig
    errorPolicy?: ErrorPolicy
}

export async function createIndividualFixedWindowLimiter(
    config: IndividualFixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    validateFixedWindowOptions(config)
    const { limit, windowMs, prefix = 'ifw' } = config

    const { client, disconnect } = await createConnection(config)

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const startKey = `${prefix}:${id}:start`
            const countKey = `${prefix}:${id}:count`
            const now = Date.now()
            const raw = await client.eval(
                LUA,
                [startKey, countKey],
                [windowMs.toString(), limit.toString(), now.toString()]
            )
            const res = raw as [unknown, unknown, unknown, unknown]
            return {
                allowed: Number(res[0]) === 1,
                remaining: Number(res[2]),
                reset: Number(res[3]),
            }
        },

        async checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
            return Promise.all(ids.map(id => limiter.check(id)))
        },

        async destroy() {
            await disconnect()
        },
    }

    if (config.cache) limiter = withCache(limiter, config.cache)
    if (config.retry) limiter = withRetry(limiter, config.retry)
    if (config.circuitBreaker) limiter = withCircuitBreaker(limiter, config.circuitBreaker)
    if (config.errorPolicy) limiter = withErrorPolicy(limiter, config.errorPolicy)

    return limiter
}
