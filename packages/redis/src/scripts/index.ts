import { logger } from '../utils/logger'

/**
 * Lua scripts for atomic Redis operations
 */

export const LUA_SCRIPTS = {
  /**
   * Fixed window increment script
   * KEYS[1]: key
   * ARGV[1]: window size in milliseconds
   * ARGV[2]: limit
   * ARGV[3]: current timestamp
   * Returns: {allowed, current, remaining, ttl}
   */
  FIXED_WINDOW_INCREMENT: `
    local key = KEYS[1]
    local window = tonumber(ARGV[1])
    local limit = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    
    local current = redis.call('GET', key)
    if not current then
      current = 0
    else
      current = tonumber(current)
    end
    
    local ttl = redis.call('PTTL', key)
    if ttl < 0 then
      ttl = window
    end
    
    if current >= limit then
      return {0, current, 0, ttl}
    end
    
    local new_count = redis.call('INCR', key)
    if new_count == 1 then
      redis.call('PEXPIRE', key, window)
    end
    
    return {1, new_count, limit - new_count, ttl}
  `,

  /**
   * Sliding window add request script
   * KEYS[1]: key
   * ARGV[1]: window size in milliseconds
   * ARGV[2]: limit
   * ARGV[3]: current timestamp
   * Returns: {allowed, current, remaining, ttl}
   */
  SLIDING_WINDOW_ADD_REQUEST: `
    local key = KEYS[1]
    local window = tonumber(ARGV[1])
    local limit = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    
    redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
    
    local current = redis.call('ZCARD', key)
    if current >= limit then
      return {0, current, 0, window}
    end
    
    redis.call('ZADD', key, now, now)
    redis.call('PEXPIRE', key, window)
    
    current = current + 1
    return {1, current, limit - current, window}
  `,

  /**
   * Token bucket consume token script
   * KEYS[1]: key
   * ARGV[1]: capacity
   * ARGV[2]: refill rate (tokens per second)
   * ARGV[3]: current timestamp
   * Returns: {allowed, tokens, remaining, next_refill}
   */
  TOKEN_BUCKET_CONSUME: `
    local key = KEYS[1]
    local capacity = tonumber(ARGV[1])
    local refillRate = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    
    local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
    local tokens = tonumber(bucket[1]) or capacity
    local last_refill = tonumber(bucket[2]) or now
    
    local time_passed = now - last_refill
    local tokens_to_add = math.floor(time_passed * refillRate / 1000)
    
    tokens = math.min(capacity, tokens + tokens_to_add)
    
    if tokens < 1 then
      local next_refill = math.ceil((1 - tokens) * 1000 / refillRate)
      return {0, 0, 0, next_refill}
    end
    
    tokens = tokens - 1
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    redis.call('PEXPIRE', key, 86400000)
    
    return {1, tokens, capacity - tokens, 0}
  `,

  /**
   * Get current count/value script
   * KEYS[1]: key
   * Returns: current count/value based on key type
   */
  GET_CURRENT: `
    local key = KEYS[1]
    local key_type = redis.call('TYPE', key)
    
    if key_type == 'string' then
      local value = redis.call('GET', key)
      return tonumber(value) or 0
    elseif key_type == 'zset' then
      return redis.call('ZCARD', key)
    elseif key_type == 'hash' then
      local tokens = redis.call('HGET', key, 'tokens')
      return tonumber(tokens) or 0
    else
      return 0
    end
  `,

  /**
   * Get keys by pattern script
   * KEYS[1]: pattern
   * Returns: array of keys
   */
  GET_KEYS_BY_PATTERN: `
    local pattern = KEYS[1]
    local keys = redis.call('KEYS', pattern)
    return keys
  `,

  /**
   * Delete keys by pattern script
   * KEYS[1]: pattern
   * Returns: number of deleted keys
   */
  DELETE_KEYS_BY_PATTERN: `
    local pattern = KEYS[1]
    local keys = redis.call('KEYS', pattern)
    if #keys == 0 then
      return 0
    end
    return redis.call('DEL', unpack(keys))
  `,

  /**
   * Reset key script
   * KEYS[1]: key
   * Returns: 1 if key was deleted, 0 otherwise
   */
  RESET_KEY: `
    local key = KEYS[1]
    return redis.call('DEL', key)
  `,
} as const

/**
 * Load all Lua scripts into Redis
 */
export async function loadLuaScripts(client: any): Promise<void> {
  const scripts = Object.entries(LUA_SCRIPTS)
  
  for (const [name, script] of scripts) {
    try {
      await client.script('LOAD', script)
      logger.debug(`Lua script loaded: ${name}`)
    } catch (error) {
      logger.error(`Failed to load Lua script: ${name}`, error)
      throw new Error(`Failed to load Lua script: ${name}`)
    }
  }
}

/**
 * Get script SHA1 for a specific script
 */
export function getScriptSHA(scriptName: keyof typeof LUA_SCRIPTS): string {
  // In a real implementation, you would store the SHA1 values
  // For now, we'll use the script directly
  return LUA_SCRIPTS[scriptName]
}