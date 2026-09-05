const fs = require('fs');
const path = require('path');
const { redisClient } = require('../config/redis');

// Load atomic Lua script from disk
const luaScript = fs.readFileSync(
    path.join(__dirname, '../scripts/token_bucket.lua'), 
    'utf8'
);

const rateLimiter = () => {
    return async (req, res, next) => {
        const userId = req.user.id;
        const routeKey = req.baseUrl || req.path;
        const key = `ratelimit:${userId}:${routeKey}`;
        const now = Math.floor(Date.now() / 1000);

        // Dynamically injected by auth.js based on JWT tier
        const { capacity, refillRate } = req.tierConfig;

        try {
            // Atomic check inside Redis
            const result = await redisClient.eval(luaScript, {
                keys: [key],
                arguments: [
                    capacity.toString(), 
                    refillRate.toString(), 
                    now.toString(), 
                    '1'
                ]
            });

            const [allowed, remainingTokens] = result;

            // Set standard HTTP rate-limit headers
            res.setHeader('X-RateLimit-Limit', capacity);
            res.setHeader('X-RateLimit-Remaining', remainingTokens);

            if (allowed === 1) {
                next(); // Hand execution to reverse proxy
            } else {
                res.setHeader('Retry-After', 1);
                return res.status(429).json({
                    status: 429,
                    error: "Too Many Requests",
                    message: `Rate limit of ${capacity} tokens exceeded for tier [${req.user.tier.toUpperCase()}]. Please slow down.`
                });
            }
        } catch (err) {
            console.error('[Limiter Error - Fail Open Triggered]:', err.message);
            next(); // Fail-Open: allow traffic through if Redis is temporarily unreachable
        }
    };
};

module.exports = rateLimiter;