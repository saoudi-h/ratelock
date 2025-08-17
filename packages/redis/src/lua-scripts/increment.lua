-- Atomically increments a key and sets TTL if it's the first increment
-- KEYS[1] - The key to increment
-- ARGV[1] - TTL in milliseconds (0 or nil for no expiration)
-- Returns: New value as string

local key = KEYS[1]
local ttlMs = tonumber(ARGV[1])

local newValue = redis.call('INCR', key)

-- Set expiration only if this is the first increment and TTL is positive
if newValue == 1 and ttlMs > 0 then
    redis.call('PEXPIRE', key, ttlMs)
end

return tostring(newValue)
