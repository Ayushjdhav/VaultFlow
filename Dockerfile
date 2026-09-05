# Use lightweight Node 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose Gateway port
EXPOSE 3000

# Default command (overridden by docker-compose for microservices)
CMD ["node", "src/gateway.js"]