# ============================================================================
# AILYDIAN ULTRA PRO - MAIN API DOCKERFILE
# ============================================================================
# Multi-stage build for optimal image size and security
# Base: Node.js 20 Alpine (minimal attack surface)
# ============================================================================

# ============================================================================
# STAGE 1: Dependencies
# ============================================================================
FROM node:20-alpine AS dependencies

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ============================================================================
# STAGE 2: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build step (if you have TypeScript or build process)
# RUN npm run build

# ============================================================================
# STAGE 3: Runtime
# ============================================================================
FROM node:20-alpine AS runtime

# Security hardening
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    apk add --no-cache dumb-init

WORKDIR /app

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Environment variables
ENV NODE_ENV=production \
    PORT=3100 \
    NODE_OPTIONS="--max-old-space-size=2048"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3100/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose port
EXPOSE 3100

# Switch to non-root user
USER nodejs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]
