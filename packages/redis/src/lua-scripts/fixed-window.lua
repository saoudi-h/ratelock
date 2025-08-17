-- Fixed Window Rate Limiting Script
-- KEYS[1]: key for the window
-- ARGV[1]: window size in milliseconds
-- ARGV[2]: limit
-- ARGV[3]: current timestamp in milliseconds

local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- Calculate window start
local window_start = math.floor(now / window) * window

-- Set the key with expiration
redis.call('SET', key, 0, 'PX', window, 'NX')

-- Increment counter and get current count
local current = redis.call('INCR', key)
local ttl = redis.call('PTTL', key)

-- If this is the first increment, set expiration
if ttl == -1 then
    redis.call('PEXPIRE', key, window)
    ttl = window
end

-- Check if limit exceeded
local allowed = current <= limit
local remaining = math.max(0, limit - current)

return {allowed and 1 or 0, current, remaining, ttl}
