const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    // Force RESP2 protocol to support older Windows Redis instances
    RESP: 2
});

redisClient.on('error', (err) => console.error('[Redis Client Error]:', err));
redisClient.on('connect', () => console.log('[VaultFlow Redis]: Client connected successfully.'));

async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
    return redisClient;
}

module.exports = { redisClient, connectRedis };