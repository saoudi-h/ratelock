-- Conditionally increments a key if below maximum value
-- KEYS[1] - The key to increment
-- ARGV[1] - Maximum allowed value
-- ARGV[2] - TTL in milliseconds (0 or nil for no expiration)
-- Returns: {new_value, incremented_success} where:
--   new_value = current value after operation
--   incremented_success = 1 if incremented, 0 if at max value

local key = KEYS[1]
local maxValue = tonumber(ARGV[1])
local ttlMs = tonumber(ARGV[2])
local currentValue = tonumber(redis.call('GET', key) or '0')

if currentValue < maxValue then
    local newValue = currentValue + 1
    redis.call('SET', key, tostring(newValue))

    -- Set TTL only if this is the first increment and TTL is positive
    if currentValue == 0 and ttlMs > 0 then
        redis.call('PEXPIRE', key, ttlMs)
    end

    return {tostring(newValue), 1}
else
    return {tostring(currentValue), 0}
end
