# ⚡ VaultFlow API Gateway

VaultFlow is a high-performance, distributed API Gateway built with **Node.js**, **Express**, and **Redis**. It provides dynamic JWT authentication, tiered token-bucket rate limiting driven by atomic Lua scripts, reverse-proxy routing to downstream microservices, security hardening, and distributed request tracing.

---

## 📐 Architecture & Request Lifecycle

```text
[ Client Request ]
       │
       ▼
[ VaultFlow Gateway : 3000 ]
       ├── 1. Security & Hardening (Helmet, CORS, Payload Limits)
       ├── 2. Tracing Middleware (Assigns/Propagates X-Request-ID)
       ├── 3. Pino HTTP Logger (Structured JSON Logging)
       ├── 4. JWT Middleware (Auth Check & Tier Extraction)
       └── 5. Distributed Rate Limiter (Atomic Redis Lua Script)
               │
               ├── (Exceeded Limit) ──► HTTP 429 Too Many Requests
               │
               └── (Allowed) ────────► Reverse Proxy (http-proxy-middleware)
                                              │
                        ┌─────────────────────┴─────────────────────┐
                        ▼                                           ▼
            [ User Microservice : 4001 ]                [ Order Microservice : 4002 ]
✨ Key Features
Atomic Token Bucket Rate Limiting: Eliminates race conditions across distributed gateway instances using inline Redis Lua scripts.

Tiered Capacity Management: Dynamic rate limit buckets mapped directly to user subscription tiers extracted from JWT payloads (Free, Premium, Admin).

Reverse Proxy Integration: Configured with http-proxy-middleware for seamless path rewriting and upstream service load balancing.

Security Hardening: Protected with helmet security response headers, cross-origin resource sharing (CORS) rules, and strict request body payload limits to mitigate DoS risks.

Distributed Observability: Automatically generates or propagates X-Request-ID correlation headers across microservice boundaries and outputs high-performance structured JSON logs via Pino.

🛠️ Tech Stack
Runtime: Node.js, Express

In-Memory Store & Cache: Redis (@redis/client utilizing atomic Lua scripting)

Authentication & Security: JSON Web Tokens (jsonwebtoken), Helmet, CORS

Reverse Proxy: http-proxy-middleware

Observability: pino, pino-http, uuid

🚀 Getting Started & Installation
1. Prerequisites
Node.js (v18 or higher)

Redis Server (or Memurai on Windows) running locally at 127.0.0.1:6379

2. Environment Setup
Create a .env file in the root directory of the project and configure your local parameters:

Code snippet
PORT=3000
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=vaultflow-super-secret-production-key
USER_SERVICE_URL=http://localhost:4001
ORDER_SERVICE_URL=http://localhost:4002
LOG_LEVEL=info
3. Installation
Clone the repository and install dependencies:

Bash
git clone [https://github.com/Ayushjdhav/VaultFlow.git](https://github.com/Ayushjdhav/VaultFlow.git)
cd VaultFlow
npm install
🏃‍♂️ How to Run & Test
To verify the complete system functionality, open three separate terminal windows:

Terminal 1: Start Downstream Mock Microservices
Bash
npm run services
Terminal 2: Start VaultFlow API Gateway
Bash
npm start
Terminal 3: Run the Automated Burst & Concurrency Test
The project includes a load-testing script (testBurst.js) that simulates 15 parallel simultaneous requests against a Free Tier token (capacity: 5 tokens):

Bash
node src/scripts/testBurst.js
Expected Test Output
Plaintext
--- Step 1: Requesting a FreeTier JWT Token ---
Token received for Free Tier (Capacity: 5 tokens)

--- Step 2: Firing 15 Parallel Requests simultaneously ---

┌─────────┬───────┬────────────┬─────────────────┐
│ (index) │ reqId │ statusCode │ remainingTokens │
├─────────┼───────┼────────────┼─────────────────┤
│ 0       │ 1     │    200     │ '4'             │
│ 1       │ 2     │    200     │ '3'             │
│ 2       │ 3     │    200     │ '2'             │
│ 3       │ 4     │    200     │ '1'             │
│ 4       │ 5     │    200     │ '0'             │
│ 5       │ 6     │    429     │ '0'             │
│ 6       │ 7     │    429     │ '0'             │
│ 7       │ 8     │    429     │ '0'             │
│ ...     │ ...   │    429     │ '0'             │
└─────────┴───────┴────────────┴─────────────────┘
