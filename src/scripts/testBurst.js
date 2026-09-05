const http = require('http');

function makeRequest(reqId, token) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/users/profile',
            method: 'GET',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({
                    reqId,
                    statusCode: res.statusCode,
                    remainingTokens: res.headers['x-ratelimit-remaining']
                });
            });
        });

        req.on('error', err => resolve({ reqId, error: err.message }));
        req.end();
    });
}

async function runConcurrencyTest() {
    console.log('--- Step 1: Requesting a Free Tier JWT Token ---');
    
    // Fetch Free Tier JWT from gateway
http.get('http://localhost:3000/auth/login?tier=free', async (res) => {
        let rawData = '';
        res.on('data', chunk => rawData += chunk);
        res.on('end', async () => {
            const data = JSON.parse(rawData);
            const token = data.token;
            
            console.log(`Token received for Free Tier (Capacity: 5 tokens)\n`);
            console.log('--- Step 2: Firing 15 Parallel Requests simultaneously ---\n');

            // Send 15 requests in parallel using Promise.all
            const promises = Array.from({ length: 15 }, (_, i) => makeRequest(i + 1, token));
            const results = await Promise.all(promises);

            console.table(results);
        });
    });
}

runConcurrencyTest();