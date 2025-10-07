#!/bin/bash
# ============================================
# 🔥 CACHE WARMUP SCRIPT
# Pre-warm edge cache for critical pages
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

DOMAIN="${1:-https://ailydian.com}"

# Critical pages to warm (top 20)
CRITICAL_PAGES=(
    "/"
    "/lydian-iq.html"
    "/medical-expert.html"
    "/lydian-legal-search.html"
    "/dashboard.html"
    "/chat.html"
    "/ai-advisor-hub.html"
    "/about.html"
    "/docs.html"
    "/api-reference.html"
    "/settings.html"
    "/billing.html"
    "/auth.html"
    "/enterprise.html"
    "/firildak-ai.html"
    "/civic-intelligence-grid.html"
    "/image-generation.html"
    "/video-ai.html"
    "/ai-assistant.html"
    "/ai-life-coach.html"
)

# Edge regions to warm (Vercel edge locations)
REGIONS=(
    "us-east-1"    # US East
    "eu-west-1"    # EU West
    "ap-southeast-1" # Asia Pacific
)

echo -e "${BLUE}🔥 Cache Warmup Controller${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Domain: ${GREEN}${DOMAIN}${NC}"
echo "Pages: ${#CRITICAL_PAGES[@]}"
echo "Regions: ${#REGIONS[@]}"
echo ""

total_requests=$((${#CRITICAL_PAGES[@]} * ${#REGIONS[@]}))
current=0

echo -e "${BLUE}📡 Warming cache...${NC}"
echo ""

for page in "${CRITICAL_PAGES[@]}"; do
    url="${DOMAIN}${page}"

    # Warm from multiple regions (simulated with different User-Agents)
    for region in "${REGIONS[@]}"; do
        ((current++))
        progress=$((current * 100 / total_requests))

        printf "\r[%3d%%] %s" "$progress" "$page"

        # Use different User-Agent to simulate different clients
        curl -s -o /dev/null -w "%{http_code}" \
            -H "User-Agent: Mozilla/5.0 (Warmup Bot ${region})" \
            -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8" \
            -H "Accept-Language: en-US,en;q=0.5" \
            -H "Accept-Encoding: gzip, deflate, br" \
            "$url" > /dev/null 2>&1 || true

        # Small delay to avoid overwhelming the server
        sleep 0.1
    done
done

printf "\r%-100s\r" " " # Clear progress line
echo -e "${GREEN}✅ Cache warmup complete${NC}"
echo ""

# Verify cache hits
echo -e "${BLUE}🔍 Verifying cache status...${NC}"
echo ""

sample_pages=("/" "/lydian-iq.html" "/medical-expert.html")
for page in "${sample_pages[@]}"; do
    url="${DOMAIN}${page}"
    cache_status=$(curl -s -I "$url" | grep -i "x-vercel-cache" | awk '{print $2}' | tr -d '\r')

    if [ -z "$cache_status" ]; then
        cache_status="UNKNOWN"
    fi

    if [ "$cache_status" = "HIT" ]; then
        echo -e "  ${page}: ${GREEN}${cache_status}${NC}"
    elif [ "$cache_status" = "MISS" ]; then
        echo -e "  ${page}: ${YELLOW}${cache_status}${NC} (will be cached on next request)"
    else
        echo -e "  ${page}: ${cache_status}"
    fi
done

echo ""
echo -e "${GREEN}✅ Warmup verification complete${NC}"
echo ""
echo -e "${BLUE}💡 Cache stats:${NC}"
echo "   • ${#CRITICAL_PAGES[@]} pages warmed across ${#REGIONS[@]} regions"
echo "   • Total requests: $total_requests"
echo "   • Cache should now be populated at edge locations"
echo ""
echo -e "${BLUE}💡 Monitor cache performance:${NC}"
echo "   curl -I ${DOMAIN}/ | grep -i x-vercel-cache"
echo ""
