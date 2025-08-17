-- Atomically decrements a key with minimum value constraint
-- KEYS[1] - The key to decrement
-- ARGV[1] - Minimum allowed value (key will be deleted if reaches this value)
-- Returns: New value after decrement operation

local key = KEYS[1]
local minValue = tonumber(ARGV[1])
local currentValue = tonumber(redis.call('GET', key) or '0')
local newValue = math.max(minValue, currentValue - 1)

if newValue <= minValue then
    redis.call('DEL', key)  -- Clean up key when reaching minimum
    return tostring(minValue)
else
    redis.call('SET', key, tostring(newValue))
    return tostring(newValue)
end
