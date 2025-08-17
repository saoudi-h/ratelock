-- KEYS[1] : prefix:{identifier}:start
-- KEYS[2] : prefix:{identifier}:count
-- ARGV[1] : windowMs  (window duration in milliseconds)
-- ARGV[2] : limit     (maximum number of requests)
-- ARGV[3] : nowMs     (current timestamp in milliseconds)

local startKey = KEYS[1]  -- prefix:{identifier}:start
local countKey = KEYS[2]  -- prefix:{identifier}:count
local windowMs = tonumber(ARGV[1])  -- Window duration in milliseconds
local limit = tonumber(ARGV[2])     -- Maximum allowed requests
local now = tonumber(ARGV[3])       -- Current timestamp from client

-- Initialize or reset the window if expired
local start = redis.call('GET', startKey)
if not start then
    start = now
    redis.call('SET', startKey, start, 'PX', windowMs)
else
    start = tonumber(start)
    if now >= start + windowMs then
        -- Window expired - reset tracking
        start = now
        redis.call('SET', startKey, start, 'PX', windowMs)
        redis.call('DEL', countKey)
    end
end

-- Calculate remaining time in current window (minimum 1ms)
local ttlMs = start + windowMs - now
if ttlMs <= 0 then ttlMs = 1 end

-- Atomically increment request counter
local current = redis.call('INCR', countKey)
if current == 1 then
    -- First request in window - set expiration
    redis.call('PEXPIRE', countKey, ttlMs)
end

-- Enforce limit and handle rejection
local allowed = current <= limit
if not allowed then
    redis.call('DECR', countKey)  -- Rollback on rejection
    current = current - 1
end

return {
    allowed and 1 or 0,  -- 1 if allowed, 0 if rejected
    current,             -- Current request count
    math.max(0, limit - current),  -- Remaining allowed requests
    start + windowMs     -- Window reset timestamp
}
