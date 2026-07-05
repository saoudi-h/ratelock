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

  local time = redis.call('TIME')
  local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)

  local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
  local tokens = tonumber(bucket[1]) or capacity
  local last_refill = tonumber(bucket[2]) or now
  local time_elapsed = (now - last_refill) / 1000
  local tokens_to_add = time_elapsed * refill_rate
  tokens = math.min(capacity, tokens + tokens_to_add)
  local allowed = tokens >= 1 and 1 or 0
  local time_until_next = 0
  if allowed == 1 then
    tokens = tokens - 1
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    redis.call('PEXPIRE', key, 3600000)
    if tokens < 1 then
      time_until_next = math.ceil((1 - tokens) / refill_rate * 1000)
    end
  else
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

    let scriptSha: string | null = null

    let limiter: Limiter<TokenBucketResult> = {
        async check(id: string): Promise<TokenBucketResult> {
            const key = `${prefix}:${id}`

            if (!scriptSha) scriptSha = await client.loadScript(LUA)

            let raw: any
            try {
                raw = await client.evalsha(
                    scriptSha,
                    [key],
                    [capacity.toString(), refillRate.toString()]
                )
            } catch (err: any) {
                if (err.message && err.message.includes('NOSCRIPT')) {
                    scriptSha = await client.loadScript(LUA)
                    raw = await client.evalsha(
                        scriptSha,
                        [key],
                        [capacity.toString(), refillRate.toString()]
                    )
                } else {
                    throw err
                }
            }

            const res = raw as [unknown, unknown, unknown]
            return {
                allowed: Number(res[0]) === 1,
                remaining: Number(res[1]),
                tokens: Number(res[1]),
                refillTime: Number(res[2]),
            }
        },

        async checkBatch(ids: string[]): Promise<TokenBucketResult[]> {
            if (!scriptSha) scriptSha = await client.loadScript(LUA)

            const p = client.pipeline()

            for (let i = 0; i < ids.length; i++) {
                const key = `${prefix}:${ids[i]}`
                p.evalsha(scriptSha, [key], [capacity.toString(), refillRate.toString()])
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
                        p2.evalsha(scriptSha, [key], [capacity.toString(), refillRate.toString()])
                    }
                    results = await p2.exec()
                } else {
                    throw err
                }
            }

            return results.map((raw: any) => {
                const res = raw as [unknown, unknown, unknown]
                const allowed = Number(res[0]) === 1
                const remaining = Number(res[1])
                const refillTime = Number(res[2])
                return {
                    allowed,
                    remaining,
                    tokens: remaining,
                    refillTime,
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
