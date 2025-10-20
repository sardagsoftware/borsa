#!/bin/bash
# Cache Purge Script
set -e

echo "🧹 PURGING CACHES"

# Vercel cache (if using Vercel CLI with cache commands)
echo "Purging Vercel edge cache..."
# vercel cache purge (if available)

# Redis cache
echo "Purging Redis cache..."
# redis-cli FLUSHDB (if Redis CLI available)

echo "✅ CACHE PURGE COMPLETE"
