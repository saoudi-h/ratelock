import {
    type Limiter,
    type SlidingWindowOptions,
    type SlidingWindowResult,
    validateSlidingWindowOptions,
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
  local uid = ARGV[3]
  local time = redis.call('TIME')
  local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
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
  return {allowed, current + (allowed == 1 and 1 or 0), remaining, ttl, oldest_ts, now}
`

export type SlidingWindowLimiterConfig = SlidingWindowOptions & RedisLimiterBaseConfig

export async function slidingWindow(
    config: SlidingWindowLimiterConfig
): Promise<Limiter<SlidingWindowResult>> {
    validateSlidingWindowOptions(config)
    const { limit, windowMs, prefix = 'sw' } = config
    let uidCounter = 0

    const { client, disconnect } = await createConnection(config)

    let scriptSha: string | null = null

    let limiter: Limiter<SlidingWindowResult> = {
        async check(id: string): Promise<SlidingWindowResult> {
            const key = `${prefix}:${id}`
            const uid = (uidCounter++).toString(36)
            
            if (!scriptSha) scriptSha = await client.loadScript(LUA)

            let raw: any
            try {
                raw = await client.evalsha(scriptSha, [key], [windowMs.toString(), limit.toString(), uid])
            } catch (err: any) {
                if (err.message && err.message.includes('NOSCRIPT')) {
                    scriptSha = await client.loadScript(LUA)
                    raw = await client.evalsha(scriptSha, [key], [windowMs.toString(), limit.toString(), uid])
                } else {
                    throw err
                }
            }

            const res = raw as [unknown, unknown, unknown, unknown, unknown, unknown]
            const now = Number(res[5])
            return {
                allowed: Number(res[0]) === 1,
                remaining: Number(res[2]),
                reset: now + Number(res[3]),
                windowStart: Number(res[4]),
                windowEnd: now + Number(res[3]),
            }
        },

        async checkBatch(ids: string[]): Promise<SlidingWindowResult[]> {
            if (!scriptSha) scriptSha = await client.loadScript(LUA)

            const p = client.pipeline()
            const batchUids = ids.map(() => (uidCounter++).toString(36))

            for (let i = 0; i < ids.length; i++) {
                const key = `${prefix}:${ids[i]}`
                p.evalsha(scriptSha, [key], [windowMs.toString(), limit.toString(), batchUids[i]!])
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
                        p2.evalsha(scriptSha, [key], [windowMs.toString(), limit.toString(), batchUids[i]!])
                    }
                    results = await p2.exec()
                } else {
                    throw err
                }
            }

            return results.map((raw: any) => {
                const res = raw as [unknown, unknown, unknown, unknown, unknown, unknown]
                const allowed = Number(res[0]) === 1
                const remaining = Number(res[2])
                const ttl = Number(res[3])
                const oldestTs = Number(res[4])
                const now = Number(res[5])
                return {
                    allowed,
                    remaining,
                    reset: now + ttl,
                    windowStart: oldestTs,
                    windowEnd: now + ttl,
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
