require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const pinoHttp = require('pino-http');

const logger = require('./config/logger');
const tracingMiddleware = require('./middleware/tracing');
const { connectRedis } = require('./config/redis');
const { authenticateToken, JWT_SECRET } = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Security & Hardening Middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));
app.use(express.json({ limit: '10kb' })); // Mitigate DoS via oversized payloads

// 2. Tracing & Logging Middleware Stack
app.use(tracingMiddleware);
app.use(pinoHttp({ 
    logger,
    genReqId: (req) => req.id,
    customSuccessMessage: (req, res) => `[${req.id}] ${req.method} ${req.url} -> Status ${res.statusCode}`
}));

// Auth Helper Endpoint
app.get('/auth/login', (req, res) => {
    const tier = req.query.tier || 'free';
    const token = jwt.sign(
        { id: `user_fixed_test_account`, tier }, 
        JWT_SECRET, 
        { expiresIn: '1h' }
    );
    
    res.json({
        message: "VaultFlow JWT Generated",
        tier,
        token
    });
});

// Helper factory to proxy and forward trace headers
const createServiceProxy = (targetUrl, pathPrefix) => createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: { '^/': `${pathPrefix}/` },
    onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('X-Request-ID', req.id);
    }
});

// Microservice Routes
app.use(
    '/api/v1/users',
    authenticateToken,
    rateLimiter(),
    createServiceProxy(process.env.USER_SERVICE_URL || 'http://localhost:4001', '/users')
);

app.use(
    '/api/v1/orders',
    authenticateToken,
    rateLimiter(),
    createServiceProxy(process.env.ORDER_SERVICE_URL || 'http://localhost:4002', '/orders')
);

async function startServer() {
    await connectRedis();
    app.listen(PORT, () => {
        logger.info(`[VaultFlow Gateway]: Security hardened & listening on http://localhost:${PORT}`);
    });
}

startServer();