-- KEYS[1]: Rate limit key (e.g., "ratelimit:user_123:/api/v1/users")
-- ARGV[1]: Bucket Capacity (e.g., 5)
-- ARGV[2]: Refill Rate in tokens/sec (e.g., 1)
-- ARGV[3]: Current Unix Timestamp in seconds
-- ARGV[4]: Requested tokens (default 1)

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

-- 1. Fetch current bucket state from Redis
local data = redis.call("HMGET", key, "tokens", "last_updated")
local tokens = tonumber(data[1])
local last_updated = tonumber(data[2])

if tokens == nil then
    -- First request: initialize full bucket
    tokens = capacity
    last_updated = now
else
    -- Compute refilled tokens based on elapsed time
    local delta = math.max(0, now - last_updated)
    tokens = math.min(capacity, tokens + (delta * refill_rate))
    last_updated = now
end

-- 2. Check token availability
if tokens >= requested then
    tokens = tokens - requested
    redis.call("HMSET", key, "tokens", tokens, "last_updated", last_updated)
    -- Expire key after full refill duration to clear memory automatically
    redis.call("EXPIRE", key, math.ceil(capacity / refill_rate))
    return {1, math.floor(tokens)} -- Status: 1 (Allowed), Remaining Tokens
else
    return {0, math.floor(tokens)} -- Status: 0 (Blocked), Remaining Tokens
end