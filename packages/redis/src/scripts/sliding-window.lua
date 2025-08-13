-- Sliding Window Rate Limiting Script
-- KEYS[1]: key for the sliding window
-- ARGV[1]: window size in milliseconds
-- ARGV[2]: limit
-- ARGV[3]: current timestamp in milliseconds

local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local window_start = now - window

-- Remove old entries
redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

-- Count current entries
local current = redis.call('ZCARD', key)

-- Check if limit exceeded
local allowed = current < limit
local remaining = math.max(0, limit - current - (allowed and 1 or 0))

if allowed then
    -- Add current request
    redis.call('ZADD', key, now, now)
    -- Set expiration
    redis.call('PEXPIRE', key, window)
end

-- Get TTL
local ttl = redis.call('PTTL', key)
if ttl == -1 or ttl == -2 then
    ttl = window
end

return {allowed and 1 or 0, current + (allowed and 1 or 0), remaining, ttl}