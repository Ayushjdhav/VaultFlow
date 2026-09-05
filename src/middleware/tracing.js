const { v4: uuidv4 } = require('uuid');

const tracingMiddleware = (req, res, next) => {
    // Retain incoming Request ID or generate a new UUID
    const requestId = req.headers['x-request-id'] || uuidv4();
    
    // Attach to request object and response header
    req.id = requestId;
    res.setHeader('X-Request-ID', requestId);

    next();
};

module.exports = tracingMiddleware;