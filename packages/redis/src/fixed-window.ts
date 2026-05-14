import {
    type CacheConfig,
    type CircuitBreakerConfig,
    type ErrorPolicy,
    type FixedWindowOptions,
    type FixedWindowResult,
    type Limiter,
    type RetryConfig,
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
  redis.call('SET', key, 0, 'PX', window, 'NX')
  local current = redis.call('INCR', key)
  local ttl = redis.call('PTTL', key)
  if ttl == -1 then
    redis.call('PEXPIRE', key, window)
    ttl = window
  end
  local allowed = current <= limit and 1 or 0
  local remaining = math.max(0, limit - current)
  return {allowed, current, remaining, ttl}
`

export type FixedWindowLimiterConfig = FixedWindowOptions & {
    client?: unknown
    url?: string
    driver?: 'redis' | 'ioredis'
    prefix?: string
    cache?: CacheConfig
    retry?: RetryConfig
    circuitBreaker?: CircuitBreakerConfig
    errorPolicy?: ErrorPolicy
}

export async function createFixedWindowLimiter(
    config: FixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    const { limit, windowMs, prefix = 'fw' } = config

    const { client, disconnect: _disconnect } = await createConnection(config)

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const key = `${prefix}:${id}`
            const now = Date.now()
            const raw = await client.eval(
                LUA,
                [key],
                [windowMs.toString(), limit.toString(), now.toString()]
            )
            const res = raw as [number, number, number, number]
            return { allowed: res[0] === 1, remaining: res[2]!, reset: now + res[3]! }
        },

        async checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
            return Promise.all(ids.map(id => this.check(id)))
        },
    }

    if (config.cache) limiter = withCache(limiter, config.cache)
    if (config.retry) limiter = withRetry(limiter, config.retry)
    if (config.circuitBreaker) limiter = withCircuitBreaker(limiter, config.circuitBreaker)
    if (config.errorPolicy) limiter = withErrorPolicy(limiter, config.errorPolicy)

    return limiter
}
