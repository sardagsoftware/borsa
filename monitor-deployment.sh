#!/bin/bash

# 🚀 AILYDIAN DEPLOYMENT MONITOR
# Monitors Vercel deployments and triggers new deploys
# Runs until custom domain is configured

echo "🚀 Starting Ailydian Deployment Monitor..."
echo "📊 Monitoring deployments until custom domain is configured"
echo "⏱️  Check interval: 60 seconds"
echo ""

# Counter
DEPLOY_COUNT=0
MAX_DEPLOYS=20

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

while [ $DEPLOY_COUNT -lt $MAX_DEPLOYS ]; do
    DEPLOY_COUNT=$((DEPLOY_COUNT + 1))

    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${YELLOW}🔄 Deployment #$DEPLOY_COUNT / $MAX_DEPLOYS${NC}"
    echo "⏰ $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    # Check for custom domain
    echo "🔍 Checking for custom domain..."
    DOMAIN_COUNT=$(vercel domains ls 2>&1 | grep -c "ailydian.com")

    if [ $DOMAIN_COUNT -gt 0 ]; then
        echo "${GREEN}✅ Custom domain found!${NC}"
        echo "🎉 Domain: ailydian.com is configured"
        echo "🏁 Monitoring complete!"
        break
    fi

    echo "${YELLOW}⏳ No custom domain yet. Continuing monitoring...${NC}"
    echo ""

    # Trigger new deployment
    echo "🚀 Triggering new deployment..."
    vercel --prod --yes > /dev/null 2>&1 &
    DEPLOY_PID=$!

    echo "📦 Deployment started (PID: $DEPLOY_PID)"

    # Wait for deployment to complete
    wait $DEPLOY_PID

    if [ $? -eq 0 ]; then
        echo "${GREEN}✅ Deployment #$DEPLOY_COUNT successful!${NC}"
    else
        echo "${RED}❌ Deployment #$DEPLOY_COUNT failed${NC}"
    fi

    # Get latest deployment URL
    echo ""
    echo "📊 Latest deployments:"
    vercel ls --prod 2>&1 | head -5

    # Check deployment health
    echo ""
    echo "🏥 Health Check:"
    LATEST_URL=$(vercel ls --prod 2>&1 | grep "https://" | head -1 | awk '{print $2}')

    if [ ! -z "$LATEST_URL" ]; then
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$LATEST_URL" || echo "000")
        CACHE_STATUS=$(curl -sI "$LATEST_URL" | grep -i "x-vercel-cache" | awk '{print $2}' | tr -d '\r')

        if [ "$HTTP_STATUS" = "200" ]; then
            echo "${GREEN}✅ HTTP Status: $HTTP_STATUS${NC}"
        else
            echo "${RED}❌ HTTP Status: $HTTP_STATUS${NC}"
        fi

        if [ ! -z "$CACHE_STATUS" ]; then
            echo "${GREEN}✅ Edge Cache: $CACHE_STATUS${NC}"
        fi
    fi

    echo ""
    echo "⏳ Waiting 60 seconds before next check..."
    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    sleep 60
done

echo ""
echo "${GREEN}🎉 Monitoring complete!${NC}"
echo "📊 Total deployments: $DEPLOY_COUNT"
echo ""
echo "📚 Next steps:"
echo "  1. Configure DNS for ailydian.com"
echo "  2. Run: vercel domains add ailydian.com"
echo "  3. Update nameservers at your registrar"
echo ""
echo "Made with ⚡ for Vercel"
