#!/bin/bash
# ============================================
# 🗑️  CACHE PURGE SCRIPT
# Purge CDN cache for Vercel deployment
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="${1:-ailydian.com}"

echo -e "${BLUE}🗑️  Cache Purge Controller${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Domain: ${GREEN}${DOMAIN}${NC}"
echo ""

# Check if running in production
read -p "⚠️  This will purge ALL cache for ${DOMAIN}. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo -e "${BLUE}📡 Purging Vercel edge cache...${NC}"

# Purge Vercel cache (requires VERCEL_TOKEN in env)
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  VERCEL_TOKEN not set. Skipping Vercel purge.${NC}"
    echo "   Set VERCEL_TOKEN in your environment or .env file"
else
    # Get team ID
    TEAM_ID=$(vercel teams ls --token "$VERCEL_TOKEN" | grep -o 'team_[a-zA-Z0-9]*' | head -1)

    if [ -z "$TEAM_ID" ]; then
        echo -e "${YELLOW}⚠️  Could not detect team ID. Using personal account.${NC}"
        TEAM_PARAM=""
    else
        TEAM_PARAM="?teamId=$TEAM_ID"
        echo "Team ID: $TEAM_ID"
    fi

    # Purge all paths
    echo "Purging: https://${DOMAIN}/*"

    curl -X POST "https://api.vercel.com/v1/purge${TEAM_PARAM}" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"path\": \"/*\", \"domain\": \"${DOMAIN}\"}" \
      --silent --show-error || {
        echo -e "${RED}❌ Purge failed${NC}"
        exit 1
      }

    echo -e "${GREEN}✅ Vercel cache purged${NC}"
fi

# Also purge Redis cache if needed
if [ ! -z "$UPSTASH_REDIS_REST_URL" ] && [ ! -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
    echo ""
    echo -e "${BLUE}📡 Purging Redis cache...${NC}"

    # Pattern-based deletion for cache keys
    PATTERNS=("cache:*" "ratelimit:*" "temp:*")

    for pattern in "${PATTERNS[@]}"; do
        echo "Deleting pattern: $pattern"
        curl -X POST "$UPSTASH_REDIS_REST_URL/scan/0" \
          -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
          -d "MATCH $pattern COUNT 1000" \
          --silent | grep -o '"[^"]*"' | while read -r key; do
            key=$(echo "$key" | tr -d '"')
            curl -X POST "$UPSTASH_REDIS_REST_URL/del/$key" \
              -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
              --silent > /dev/null
          done
    done

    echo -e "${GREEN}✅ Redis cache purged${NC}"
fi

echo ""
echo -e "${GREEN}✅ Cache purge complete${NC}"
echo ""
echo -e "${BLUE}💡 Next steps:${NC}"
echo "   1. Run warmup script: ./ops/scripts/warmup.sh"
echo "   2. Monitor cache hit ratio in dashboard"
echo "   3. Check edge performance: curl -I https://${DOMAIN}"
echo ""
