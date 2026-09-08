import {
    type FixedWindowResult,
    type IndividualFixedWindowOptions,
    type Limiter,
    validateFixedWindowOptions,
} from '@ratelock/core'

import { decorateLimiter } from './decorate'
import { createScriptRunner } from './script'
import type { ConnectionFactory, RedisLimiterOptions } from './types'

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

export async function createIndividualFixedWindow<
    Config extends IndividualFixedWindowOptions & RedisLimiterOptions,
>(config: Config, connect: ConnectionFactory<Config>): Promise<Limiter<FixedWindowResult>> {
    validateFixedWindowOptions(config)
    const { limit, windowMs, prefix = 'ifw' } = config
    const { client, disconnect } = await connect(config)
    const script = createScriptRunner(client, LUA)

    const limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const raw = await script.execute({
                keys: [`${prefix}:${id}:start`, `${prefix}:${id}:count`],
                args: [windowMs.toString(), limit.toString()],
            })
            const result = raw as [unknown, unknown, unknown, unknown]

            return {
                allowed: Number(result[0]) === 1,
                remaining: Number(result[2]),
                reset: Number(result[3]),
            }
        },

        async checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
            const results = await script.executeBatch(
                ids.map(id => ({
                    keys: [`${prefix}:${id}:start`, `${prefix}:${id}:count`],
                    args: [windowMs.toString(), limit.toString()],
                }))
            )

            return results.map(raw => {
                const result = raw as [unknown, unknown, unknown, unknown]
                return {
                    allowed: Number(result[0]) === 1,
                    remaining: Number(result[2]),
                    reset: Number(result[3]),
                }
            })
        },

        async destroy() {
            await disconnect()
        },
    }

    return decorateLimiter(limiter, config)
}
