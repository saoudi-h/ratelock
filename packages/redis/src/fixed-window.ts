import {
    type CacheConfig,
    type CircuitBreakerConfig,
    type ErrorPolicy,
    type FixedWindowOptions,
    type FixedWindowResult,
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
  local key = KEYS[1]
  local window = tonumber(ARGV[1])
  local limit = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  
  local window_start = math.floor(now / window) * window
  local ttl = window_start + window - now
  
  redis.call('SET', key, 0, 'PX', ttl, 'NX')
  local current = redis.call('INCR', key)
  
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
    validateFixedWindowOptions(config)
    const { limit, windowMs, prefix = 'fw' } = config

    const { client, disconnect } = await createConnection(config)

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
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
