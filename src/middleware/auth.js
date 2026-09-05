const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'vaultflow-super-secret-production-key';

// Rate Limiting Tier Matrix
const TIER_LIMITS = {
    free: { capacity: 5, refillRate: 1 },       // Max 5 tokens burst, +1 token/sec
    premium: { capacity: 20, refillRate: 5 },    // Max 20 tokens burst, +5 tokens/sec
    admin: { capacity: 100, refillRate: 20 }    // Max 100 tokens burst, +20 tokens/sec
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // Fallback: Treat unauthenticated calls as Anonymous Free Tier (tracked by IP)
        req.user = { id: req.ip, tier: 'free' };
        req.tierConfig = TIER_LIMITS.free;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({
                status: 403,
                error: 'Forbidden',
                message: 'Invalid or expired JWT token.'
            });
        }

        req.user = decodedUser; // Contains user ID and assigned tier
        req.tierConfig = TIER_LIMITS[decodedUser.tier] || TIER_LIMITS.free;
        next();
    });
};

module.exports = { authenticateToken, TIER_LIMITS, JWT_SECRET };