import {
    type FixedWindowOptions,
    type FixedWindowResult,
    type Limiter,
    validateFixedWindowOptions,
    withCache,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'
import { createConnection } from './client'
import type { RedisLimiterBaseConfig } from './types'

const LUA = `
  local key = KEYS[1]
  local window = tonumber(ARGV[1])
  local limit = tonumber(ARGV[2])
  
  local time = redis.call('TIME')
  local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)

  local current = tonumber(redis.call('GET', key)) or 0
  if current >= limit then
    local window_start = math.floor(now / window) * window
    local ttl = window_start + window - now
    return {0, current, 0, ttl, now}
  end

  local window_start = math.floor(now / window) * window
  local ttl = window_start + window - now
  redis.call('SET', key, 0, 'PX', ttl, 'NX')
  current = redis.call('INCR', key)
  
  local allowed = current <= limit and 1 or 0
  local remaining = math.max(0, limit - current)
  return {allowed, current, remaining, ttl, now}
`

export type FixedWindowLimiterConfig = FixedWindowOptions & RedisLimiterBaseConfig

export async function fixedWindow(
    config: FixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    validateFixedWindowOptions(config)
    const { limit, windowMs, prefix = 'fw' } = config

    const { client, disconnect } = await createConnection(config)

    let scriptSha: string | null = null

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const key = `${prefix}:${id}`

            if (!scriptSha) scriptSha = await client.loadScript(LUA)

            let raw: any
            try {
                raw = await client.evalsha(scriptSha, [key], [windowMs.toString(), limit.toString()])
            } catch (err: any) {
                if (err.message && err.message.includes('NOSCRIPT')) {
                    scriptSha = await client.loadScript(LUA)
                    raw = await client.evalsha(scriptSha, [key], [windowMs.toString(), limit.toString()])
                } else {
                    throw err
                }
            }

            const res = raw as [unknown, unknown, unknown, unknown, unknown]
            const now = Number(res[4])
            return {
                allowed: Number(res[0]) === 1,
                remaining: Number(res[2]),
                reset: now + Number(res[3]),
            }
        },

        async checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
            if (!scriptSha) scriptSha = await client.loadScript(LUA)

            const p = client.pipeline()

            for (let i = 0; i < ids.length; i++) {
                const key = `${prefix}:${ids[i]}`
                p.evalsha(scriptSha, [key], [windowMs.toString(), limit.toString()])
            }

            let results: any[]
            try {
                results = await p.exec()
            } catch (err: any) {
                if (err.message && err.message.includes('NOSCRIPT')) {
                    scriptSha = await client.loadScript(LUA)
                    const p2 = client.pipeline()
                    for (let i = 0; i < ids.length; i++) {
                        const key = `${prefix}:${ids[i]}`
                        p2.evalsha(scriptSha, [key], [windowMs.toString(), limit.toString()])
                    }
                    results = await p2.exec()
                } else {
                    throw err
                }
            }

            return results.map((raw: any) => {
                const res = raw as [unknown, unknown, unknown, unknown, unknown]
                const allowed = Number(res[0]) === 1
                const remaining = Number(res[2])
                const ttl = Number(res[3])
                const now = Number(res[4])
                return {
                    allowed,
                    remaining,
                    reset: now + ttl,
                }
            })
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
