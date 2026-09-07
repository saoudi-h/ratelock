import {
    type Limiter,
    type TokenBucketOptions,
    type TokenBucketResult,
    validateTokenBucketOptions,
} from '@ratelock/core'

import { decorateLimiter } from './decorate'
import { createScriptRunner } from './script'
import type { ConnectionFactory, RedisLimiterOptions } from './types'

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

export async function createTokenBucket<Config extends TokenBucketOptions & RedisLimiterOptions>(
    config: Config,
    connect: ConnectionFactory<Config>
): Promise<Limiter<TokenBucketResult>> {
    validateTokenBucketOptions(config)
    const { capacity, refillRate, prefix = 'tb' } = config
    const { client, disconnect } = await connect(config)
    const script = createScriptRunner(client, LUA)

    const limiter: Limiter<TokenBucketResult> = {
        async check(id: string): Promise<TokenBucketResult> {
            const raw = await script.execute({
                keys: [`${prefix}:${id}`],
                args: [capacity.toString(), refillRate.toString()],
            })
            const result = raw as [unknown, unknown, unknown]
            const tokens = Number(result[1])

            return {
                allowed: Number(result[0]) === 1,
                remaining: tokens,
                tokens,
                refillTime: Number(result[2]),
            }
        },

        async checkBatch(ids: string[]): Promise<TokenBucketResult[]> {
            const results = await script.executeBatch(
                ids.map(id => ({
                    keys: [`${prefix}:${id}`],
                    args: [capacity.toString(), refillRate.toString()],
                }))
            )

            return results.map(raw => {
                const result = raw as [unknown, unknown, unknown]
                const tokens = Number(result[1])
                return {
                    allowed: Number(result[0]) === 1,
                    remaining: tokens,
                    tokens,
                    refillTime: Number(result[2]),
                }
            })
        },

        async destroy() {
            await disconnect()
        },
    }

    return decorateLimiter(limiter, config)
}
