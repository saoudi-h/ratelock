import {
    type Limiter,
    type SlidingWindowOptions,
    type SlidingWindowResult,
    validateSlidingWindowOptions,
} from '@ratelock/core'

import { decorateLimiter } from './decorate'
import { createScriptRunner } from './script'
import type { ConnectionFactory, RedisLimiterOptions } from './types'

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

export async function createSlidingWindow<
    Config extends SlidingWindowOptions & RedisLimiterOptions,
>(config: Config, connect: ConnectionFactory<Config>): Promise<Limiter<SlidingWindowResult>> {
    validateSlidingWindowOptions(config)
    const { limit, windowMs, prefix = 'sw' } = config
    let uidCounter = 0
    const { client, disconnect } = await connect(config)
    const script = createScriptRunner(client, LUA)

    const limiter: Limiter<SlidingWindowResult> = {
        async check(id: string): Promise<SlidingWindowResult> {
            const raw = await script.execute({
                keys: [`${prefix}:${id}`],
                args: [windowMs.toString(), limit.toString(), (uidCounter++).toString(36)],
            })
            const result = raw as [unknown, unknown, unknown, unknown, unknown, unknown]
            const now = Number(result[5])

            return {
                allowed: Number(result[0]) === 1,
                remaining: Number(result[2]),
                reset: now + Number(result[3]),
                windowStart: Number(result[4]),
                windowEnd: now + Number(result[3]),
            }
        },

        async checkBatch(ids: string[]): Promise<SlidingWindowResult[]> {
            const results = await script.executeBatch(
                ids.map(id => ({
                    keys: [`${prefix}:${id}`],
                    args: [windowMs.toString(), limit.toString(), (uidCounter++).toString(36)],
                }))
            )

            return results.map(raw => {
                const result = raw as [unknown, unknown, unknown, unknown, unknown, unknown]
                const now = Number(result[5])
                const ttl = Number(result[3])
                return {
                    allowed: Number(result[0]) === 1,
                    remaining: Number(result[2]),
                    reset: now + ttl,
                    windowStart: Number(result[4]),
                    windowEnd: now + ttl,
                }
            })
        },

        async destroy() {
            await disconnect()
        },
    }

    return decorateLimiter(limiter, config)
}
