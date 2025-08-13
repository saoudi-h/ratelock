-- Token Bucket Rate Limiting Script
-- KEYS[1]: key for the token bucket
-- ARGV[1]: bucket capacity
-- ARGV[2]: refill rate (tokens per second)
-- ARGV[3]: current timestamp in milliseconds

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])  -- tokens per second
local now = tonumber(ARGV[3])

-- Get current bucket state
local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or capacity
local last_refill = tonumber(bucket[2]) or now

-- Calculate tokens to add based on time elapsed
local time_elapsed = (now - last_refill) / 1000  -- convert to seconds
local tokens_to_add = time_elapsed * refill_rate

-- Update token count
tokens = math.min(capacity, tokens + tokens_to_add)

-- Check if we can consume a token
local allowed = tokens >= 1
if allowed then
    tokens = tokens - 1
end

-- Update bucket state
redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
redis.call('PEXPIRE', key, 3600000)  -- 1 hour TTL

-- Calculate time until next token is available
local time_until_next = 0
if tokens < 1 then
    time_until_next = math.ceil((1 - tokens) / refill_rate * 1000)
end

return {allowed and 1 or 0, math.floor(tokens), time_until_next}