import {
    type FixedWindowResult,
    type IndividualFixedWindowOptions,
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
  local startKey = KEYS[1]
  local countKey = KEYS[2]
  local windowMs = tonumber(ARGV[1])
  local limit = tonumber(ARGV[2])

  local time = redis.call('TIME')
  local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)

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
  
  local current = tonumber(redis.call('GET', countKey)) or 0
  if current >= limit then
    return {0, current, 0, start + windowMs}
  end
  
  current = redis.call('INCR', countKey)
  if current == 1 then
    redis.call('PEXPIRE', countKey, ttlMs)
  end
  return {1, current, math.max(0, limit - current), start + windowMs}
`

export type IndividualFixedWindowLimiterConfig = IndividualFixedWindowOptions &
    RedisLimiterBaseConfig

export async function individualFixedWindow(
    config: IndividualFixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    validateFixedWindowOptions(config)
    const { limit, windowMs, prefix = 'ifw' } = config

    const { client, disconnect } = await createConnection(config)

    let scriptSha: string | null = null

    let limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const startKey = `${prefix}:${id}:start`
            const countKey = `${prefix}:${id}:count`

            if (!scriptSha) scriptSha = await client.loadScript(LUA)

            let raw: any
            try {
                raw = await client.evalsha(
                    scriptSha,
                    [startKey, countKey],
                    [windowMs.toString(), limit.toString()]
                )
            } catch (err: any) {
                if (err.message && err.message.includes('NOSCRIPT')) {
                    scriptSha = await client.loadScript(LUA)
                    raw = await client.evalsha(
                        scriptSha,
                        [startKey, countKey],
                        [windowMs.toString(), limit.toString()]
                    )
                } else {
                    throw err
                }
            }

            const res = raw as [unknown, unknown, unknown, unknown]
            return {
                allowed: Number(res[0]) === 1,
                remaining: Number(res[2]),
                reset: Number(res[3]),
            }
        },

        async checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
            if (!scriptSha) scriptSha = await client.loadScript(LUA)

            const p = client.pipeline()

            for (let i = 0; i < ids.length; i++) {
                const startKey = `${prefix}:${ids[i]}:start`
                const countKey = `${prefix}:${ids[i]}:count`
                p.evalsha(scriptSha, [startKey, countKey], [windowMs.toString(), limit.toString()])
            }

            let results: any[]
            try {
                results = await p.exec()
            } catch (err: any) {
                if (err.message && err.message.includes('NOSCRIPT')) {
                    scriptSha = await client.loadScript(LUA)
                    const p2 = client.pipeline()
                    for (let i = 0; i < ids.length; i++) {
                        const startKey = `${prefix}:${ids[i]}:start`
                        const countKey = `${prefix}:${ids[i]}:count`
                        p2.evalsha(
                            scriptSha,
                            [startKey, countKey],
                            [windowMs.toString(), limit.toString()]
                        )
                    }
                    results = await p2.exec()
                } else {
                    throw err
                }
            }

            return results.map((raw: any) => {
                const res = raw as [unknown, unknown, unknown, unknown]
                const allowed = Number(res[0]) === 1
                const remaining = Number(res[2])
                const reset = Number(res[3])
                return {
                    allowed,
                    remaining,
                    reset,
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
