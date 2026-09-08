import {
    type FixedWindowOptions,
    type FixedWindowResult,
    type Limiter,
    validateFixedWindowOptions,
} from '@ratelock/core'

import { decorateLimiter } from './decorate'
import { createScriptRunner } from './script'
import type { ConnectionFactory, RedisLimiterOptions } from './types'

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

export async function createFixedWindow<Config extends FixedWindowOptions & RedisLimiterOptions>(
    config: Config,
    connect: ConnectionFactory<Config>
): Promise<Limiter<FixedWindowResult>> {
    validateFixedWindowOptions(config)
    const { limit, windowMs, prefix = 'fw' } = config
    const { client, disconnect } = await connect(config)
    const script = createScriptRunner(client, LUA)

    const limiter: Limiter<FixedWindowResult> = {
        async check(id: string): Promise<FixedWindowResult> {
            const raw = await script.execute({
                keys: [`${prefix}:${id}`],
                args: [windowMs.toString(), limit.toString()],
            })
            const result = raw as [unknown, unknown, unknown, unknown, unknown]
            const now = Number(result[4])

            return {
                allowed: Number(result[0]) === 1,
                remaining: Number(result[2]),
                reset: now + Number(result[3]),
            }
        },

        async checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
            const results = await script.executeBatch(
                ids.map(id => ({
                    keys: [`${prefix}:${id}`],
                    args: [windowMs.toString(), limit.toString()],
                }))
            )

            return results.map(raw => {
                const result = raw as [unknown, unknown, unknown, unknown, unknown]
                const now = Number(result[4])
                return {
                    allowed: Number(result[0]) === 1,
                    remaining: Number(result[2]),
                    reset: now + Number(result[3]),
                }
            })
        },

        async destroy() {
            await disconnect()
        },
    }

    return decorateLimiter(limiter, config)
}
