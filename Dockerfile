# ============================================================================
# AILYDIAN ULTRA PRO - PRODUCTION DOCKERFILE
# ============================================================================
# Multi-stage build for optimal image size and security
# Base: Node.js 20 Alpine (minimal attack surface)
# Supports: 6 Microservices + Main Server (Phase 4 Integration)
# ============================================================================

# ============================================================================
# STAGE 1: Dependencies
# ============================================================================
FROM node:20-alpine AS dependencies

# Install build dependencies for native modules (sharp, canvas, etc.)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# ============================================================================
# STAGE 2: Builder
# ============================================================================
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build step (if you have TypeScript or build process)
# RUN npm run build

# ============================================================================
# STAGE 3: Runtime
# ============================================================================
FROM node:20-alpine AS runtime

# Install runtime dependencies for native modules
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    dumb-init

# Security hardening
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create necessary directories with correct permissions
RUN mkdir -p \
    logs \
    uploads \
    temp \
    .cache && \
    chown -R nodejs:nodejs /app

# Environment variables
ENV NODE_ENV=production \
    PORT=3100 \
    NODE_OPTIONS="--max-old-space-size=4096"

# Health check (using new global health endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3100/api/services/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose ports
# Main server
EXPOSE 3100
# Microservices (if running in standalone mode)
EXPOSE 3101 3102 3103 3104 3105 3106

# Switch to non-root user
USER nodejs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]
