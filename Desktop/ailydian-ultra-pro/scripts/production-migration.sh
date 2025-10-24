#!/bin/bash
# Production Migration Script - Final Step
# Run this AFTER 1 hour of lowered TTL

set -e

DOMAIN="www.ailydian.com"
PULL_ZONE_URL="${1:-ailydian-prod.b-cdn.net}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 PRODUCTION MIGRATION - Final Step"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Domain: $DOMAIN"
echo "Target: $PULL_ZONE_URL"
echo "Time: $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Safety check
echo ""
echo "⚠️  SAFETY CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
read -p "Has it been at least 1 hour since you lowered TTL? (yes/no): " WAITED

if [ "$WAITED" != "yes" ]; then
    echo "❌ Please wait full hour before proceeding"
    echo "This ensures global DNS cache has expired"
    exit 1
fi

echo ""
read -p "Is test domain (test-cdn.ailydian.com) working correctly? (yes/no): " TEST_OK

if [ "$TEST_OK" != "yes" ]; then
    echo "❌ Fix test domain first before production migration"
    exit 1
fi

echo ""
echo "🔍 Checking current site..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN")
if [ "$HTTP_STATUS" != "200" ]; then
    echo "❌ Site is not healthy (HTTP $HTTP_STATUS)"
    echo "Fix site issues before migration"
    exit 1
fi
echo "✅ Site is healthy (HTTP $HTTP_STATUS)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 MIGRATION INSTRUCTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "STEP 1: Add Production Hostname in BunnyCDN"
echo "  1. Go to: BunnyCDN Dashboard → Pull Zone → Hostnames"
echo "  2. Add Custom Hostname: $DOMAIN"
echo "  3. SSL: Let's Encrypt (Auto)"
echo "  4. Wait 10 minutes for SSL provisioning"
echo ""
read -p "Have you added $DOMAIN hostname in BunnyCDN? (yes/no): " HOSTNAME_ADDED

if [ "$HOSTNAME_ADDED" != "yes" ]; then
    echo "Add hostname first, then run this script again"
    exit 0
fi

echo ""
echo "⏱️  Waiting 60 seconds for SSL to provision..."
for i in {60..1}; do
    printf "\r⏱️  %02d seconds remaining..." $i
    sleep 1
done
echo ""

echo ""
echo "STEP 2: Change DNS (THE MIGRATION!)"
echo ""
echo "⚠️  CRITICAL: Copy these exact values to your domain registrar:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Type:  CNAME"
echo "  Host:  www"
echo "  Value: $PULL_ZONE_URL"
echo "  TTL:   60"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  DOUBLE CHECK before saving!"
echo ""
read -p "Have you changed DNS to $PULL_ZONE_URL? (yes/no): " DNS_CHANGED

if [ "$DNS_CHANGED" != "yes" ]; then
    echo "Change DNS, then run: ./production-migration.sh --validate"
    exit 0
fi

# Start monitoring
echo ""
echo "🔍 Starting DNS propagation check..."
echo "This will check every 10 seconds for up to 5 minutes"
echo ""

CHECKS=0
MAX_CHECKS=30  # 5 minutes

while [ $CHECKS -lt $MAX_CHECKS ]; do
    CHECKS=$((CHECKS + 1))
    CURRENT_DNS=$(dig +short "$DOMAIN" | head -1)

    printf "\r[%02d/%02d] DNS: %s   " $CHECKS $MAX_CHECKS "$CURRENT_DNS"

    if [[ "$CURRENT_DNS" == *"b-cdn.net"* ]]; then
        echo ""
        echo ""
        echo "✅ DNS PROPAGATED! Migration successful!"
        break
    fi

    sleep 10
done

if [[ "$CURRENT_DNS" != *"b-cdn.net"* ]]; then
    echo ""
    echo ""
    echo "⚠️  DNS not yet propagated"
    echo "Current: $CURRENT_DNS"
    echo "Expected: $PULL_ZONE_URL"
    echo ""
    echo "This is normal, can take up to 15 minutes"
    echo "Run validation manually: ./dns-migration-helper.sh --validate"
    exit 0
fi

# Validation
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MIGRATION VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check site accessibility
echo ""
echo "🔍 Testing site accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN")
if [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ Site is accessible (HTTP $HTTP_STATUS)"
else
    echo "❌ ALERT: Site returned HTTP $HTTP_STATUS"
    echo ""
    echo "🚨 ROLLBACK RECOMMENDED!"
    echo "Run: ./dns-migration-helper.sh --rollback"
    exit 1
fi

# Check API
echo ""
echo "🔍 Testing API..."
API_RESULT=$(curl -s "https://$DOMAIN/api/health" 2>/dev/null || echo "ERROR")
if [[ "$API_RESULT" == *"OK"* ]] || [[ "$API_RESULT" == *"ok"* ]] || [[ "$API_RESULT" == *"status"* ]]; then
    echo "✅ API is working"
    echo "Response: $API_RESULT"
else
    echo "⚠️  API response unexpected: $API_RESULT"
fi

# Check performance
echo ""
echo "🔍 Testing performance..."
TTFB=$(curl -w "%{time_starttransfer}" -o /dev/null -s "https://$DOMAIN")
TTFB_MS=$(echo "$TTFB * 1000" | bc | cut -d. -f1)
echo "Current TTFB: ${TTFB_MS}ms"

if [ -f ".baseline-ttfb.txt" ]; then
    BASELINE=$(cat .baseline-ttfb.txt)
    IMPROVEMENT=$(echo "scale=1; ($BASELINE - $TTFB_MS) * 100 / $BASELINE" | bc)
    echo "Baseline TTFB: ${BASELINE}ms"
    if (( $(echo "$IMPROVEMENT > 0" | bc -l) )); then
        echo "✅ Performance improved by ${IMPROVEMENT}%"
    else
        DEGRADATION=$(echo "scale=1; $IMPROVEMENT * -1" | bc)
        echo "⚠️  Performance degraded by ${DEGRADATION}%"
    fi
fi

# Check BunnyCDN headers
echo ""
echo "🔍 Checking BunnyCDN headers..."
HEADERS=$(curl -I "https://$DOMAIN" 2>/dev/null)

PULL_ZONE=$(echo "$HEADERS" | grep -i "x-pull-zone" | cut -d: -f2 | tr -d '[:space:]')
CACHE_STATUS=$(echo "$HEADERS" | grep -i "x-cache:" | cut -d: -f2 | tr -d '[:space:]')

if [ -n "$PULL_ZONE" ]; then
    echo "✅ Pull Zone: $PULL_ZONE"
else
    echo "⚠️  No x-pull-zone header (might still be propagating)"
fi

if [ -n "$CACHE_STATUS" ]; then
    echo "✅ Cache Status: $CACHE_STATUS"
else
    echo "⚠️  No cache headers yet"
fi

# Start monitoring
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 STARTING 15-MINUTE MONITORING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Monitoring will run for 15 minutes to ensure stability"
echo ""

if [ -f "./scripts/bunnycdn-monitor.sh" ]; then
    chmod +x ./scripts/bunnycdn-monitor.sh
    ./scripts/bunnycdn-monitor.sh "$DOMAIN" 60 15
else
    echo "⚠️  Monitor script not found, running basic monitoring..."

    for i in {1..15}; do
        HTTP=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN")
        TTFB=$(curl -w "%{time_starttransfer}" -o /dev/null -s "https://$DOMAIN")
        TTFB_MS=$(echo "$TTFB * 1000" | bc | cut -d. -f1)

        printf "\r[%02d/15] HTTP:%s TTFB:%3dms   " $i $HTTP $TTFB_MS

        if [ "$HTTP" != "200" ]; then
            echo ""
            echo "❌ HTTP $HTTP detected!"
            echo "🚨 Consider rollback: ./dns-migration-helper.sh --rollback"
        fi

        sleep 60
    done
    echo ""
fi

# Final report
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MIGRATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Congratulations! BunnyCDN is now active for $DOMAIN"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. ✅ Monitor for next 24 hours"
echo "2. ✅ If stable, raise TTL back to 3600"
echo "3. ✅ Check BunnyCDN dashboard for analytics"
echo "4. ✅ Run full validation:"
echo "     ./bunnycdn-validator.sh $DOMAIN"
echo ""
echo "📊 Performance Comparison:"
echo "  Before: ${BASELINE:-N/A}ms"
echo "  After:  ${TTFB_MS}ms"
echo ""
echo "🔄 If issues occur, rollback with:"
echo "  ./dns-migration-helper.sh --rollback"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Save migration log
LOG_FILE="migration-log-${TIMESTAMP}.txt"
echo "Migration Log - $DOMAIN" > "$LOG_FILE"
echo "Completed: $(date)" >> "$LOG_FILE"
echo "DNS: $CURRENT_DNS" >> "$LOG_FILE"
echo "Pull Zone: ${PULL_ZONE:-Not detected}" >> "$LOG_FILE"
echo "HTTP Status: $HTTP_STATUS" >> "$LOG_FILE"
echo "TTFB: ${TTFB_MS}ms" >> "$LOG_FILE"
echo "Baseline: ${BASELINE:-N/A}ms" >> "$LOG_FILE"

echo ""
echo "Migration log saved: $LOG_FILE"
echo ""

exit 0
