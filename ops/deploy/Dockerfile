# Lydian-IQ v3.0 Production Dockerfile
# Multi-stage build for minimal attack surface

# Stage 1: Build dependencies
FROM node:20-alpine AS builder

ARG VERSION=3.0.1
ARG BUILD_DATE
ARG VCS_REF

LABEL org.opencontainers.image.title="Lydian-IQ API"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${VCS_REF}"
LABEL org.opencontainers.image.vendor="Ailydian"
LABEL org.opencontainers.image.description="Lydian-IQ v3.0 - Federated Learning & Economic Intelligence API"

WORKDIR /build

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy application code
COPY server.js ./
COPY api/ ./api/
COPY lib/ ./lib/
COPY middleware/ ./middleware/
COPY security/ ./security/
COPY policies/ ./policies/
COPY public/ ./public/

# Stage 2: Production runtime
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1000 lydian && \
    adduser -D -u 1000 -G lydian lydian

WORKDIR /app

# Copy from builder
COPY --from=builder --chown=lydian:lydian /build ./

# Create necessary directories
RUN mkdir -p /app/logs /app/tmp && \
    chown -R lydian:lydian /app

# Switch to non-root user
USER lydian

# Expose port
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3100/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]
