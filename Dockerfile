# ====================================================================
# Multi-Stage Production Dockerfile for UrbanFlow AI
# Traffic Data Analysis & Flow Optimization Platform
# ====================================================================

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies (clean install)
RUN npm install

# Copy application source code
COPY . .

# Build frontend and production assets
RUN npm run build

# Prune dev dependencies for lean image
RUN npm prune --production

# Stage 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user for security best practices
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy built artifacts and production dependencies from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Ensure appuser owns the app directory
RUN chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose dev/prod server port
EXPOSE 3000

# Health check to ensure zero-downtime and container orchestration reliability
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the full-stack server
CMD ["npm", "run", "start"]
