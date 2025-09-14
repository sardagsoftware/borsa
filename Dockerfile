# Ultra Pro AI-LENS Crypto Trader Dockerfile
# Simple Docker build for Borsa Trading Platform
FROM node:20-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl libc6-compat

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Generate Prisma client (if prisma schema exists)
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

# Build application
RUN npm run build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]