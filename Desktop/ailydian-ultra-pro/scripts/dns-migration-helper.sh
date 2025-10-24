#!/bin/bash
# DNS Migration Helper Script
# Provides step-by-step guidance for DNS migration with safety checks

set -e

DOMAIN="www.ailydian.com"
OLD_TARGET="273140a7bc1139dc.vercel-dns-016.com"
NEW_TARGET="ailydian-prod.b-cdn.net"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 DNS Migration Helper - Zero Downtime"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Domain: $DOMAIN"
echo "Current: $OLD_TARGET"
echo "Target: $NEW_TARGET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Phase 1: Pre-Migration Check
echo ""
echo "📋 PHASE 1: Pre-Migration Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check current DNS
echo ""
echo "🔍 Checking current DNS configuration..."
CURRENT_DNS=$(dig +short "$DOMAIN" | head -1)
echo "Current DNS: $CURRENT_DNS"

if [[ "$CURRENT_DNS" != *"vercel"* ]]; then
    echo "⚠️  WARNING: Current DNS does not point to Vercel"
    echo "Expected: *vercel*, Got: $CURRENT_DNS"
    read -p "Continue anyway? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        echo "❌ Migration aborted by user"
        exit 1
    fi
fi

# Check if site is accessible
echo ""
echo "🔍 Checking site accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN")
if [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ Site is accessible (HTTP $HTTP_STATUS)"
else
    echo "❌ Site returned HTTP $HTTP_STATUS"
    read -p "Continue anyway? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        echo "❌ Migration aborted by user"
        exit 1
    fi
fi

# Check TTFB before migration
echo ""
echo "⚡ Measuring current performance..."
TTFB_BEFORE=$(curl -w "%{time_starttransfer}" -o /dev/null -s "https://$DOMAIN")
echo "Current TTFB: ${TTFB_BEFORE}s"
echo "$TTFB_BEFORE" > "ttfb-before-migration-${TIMESTAMP}.txt"

# Phase 2: Migration Instructions
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PHASE 2: Migration Steps (MANUAL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: These steps must be done in your domain registrar:"
echo ""
echo "STEP 1: Lower TTL (Do this NOW, then wait 1 hour)"
echo "  Type:  CNAME"
echo "  Host:  www"
echo "  Value: $OLD_TARGET (keep current!)"
echo "  TTL:   60 (change from 3600 to 60)"
echo ""
echo "STEP 2: Wait 1 hour for DNS cache to expire globally"
echo ""
echo "STEP 3: Change DNS target"
echo "  Type:  CNAME"
echo "  Host:  www"
echo "  Value: $NEW_TARGET (NEW!)"
echo "  TTL:   60 (keep low for quick rollback)"
echo ""
echo "STEP 4: Run this script again with --validate flag"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

read -p "Have you completed STEP 1 (lowered TTL to 60)? (yes/no): " STEP1
if [ "$STEP1" == "yes" ]; then
    echo "✅ TTL lowered to 60"
    echo "⏱️  Please wait 1 hour before proceeding to STEP 3"
    echo ""
    echo "Set a timer for 1 hour, then run:"
    echo "  ./dns-migration-helper.sh --migrate"
    exit 0
fi

# Phase 3: Post-Migration Validation
if [ "$1" == "--validate" ] || [ "$1" == "--migrate" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 PHASE 3: Post-Migration Validation"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    echo ""
    echo "🔍 Checking DNS propagation..."
    CURRENT_DNS=$(dig +short "$DOMAIN" | head -1)
    echo "Current DNS: $CURRENT_DNS"

    if [[ "$CURRENT_DNS" == *"b-cdn.net"* ]]; then
        echo "✅ DNS successfully migrated to BunnyCDN"
    else
        echo "❌ DNS not yet migrated"
        echo "Current: $CURRENT_DNS"
        echo "Expected: $NEW_TARGET"
        echo ""
        echo "Wait a few minutes and try again, or check your DNS settings"
        exit 1
    fi

    # Check site accessibility
    echo ""
    echo "🔍 Checking site accessibility..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN")
    if [ "$HTTP_STATUS" == "200" ]; then
        echo "✅ Site is accessible (HTTP $HTTP_STATUS)"
    else
        echo "❌ Site returned HTTP $HTTP_STATUS"
        echo ""
        echo "🚨 ROLLBACK RECOMMENDED!"
        echo "Run: ./dns-migration-helper.sh --rollback"
        exit 1
    fi

    # Check API
    echo ""
    echo "🔍 Checking API functionality..."
    API_RESULT=$(curl -s "https://$DOMAIN/api/health" 2>/dev/null)
    if [[ "$API_RESULT" == *"OK"* ]] || [[ "$API_RESULT" == *"ok"* ]]; then
        echo "✅ API is working"
    else
        echo "⚠️  API response: $API_RESULT"
    fi

    # Check TTFB
    echo ""
    echo "⚡ Measuring new performance..."
    TTFB_AFTER=$(curl -w "%{time_starttransfer}" -o /dev/null -s "https://$DOMAIN")
    echo "New TTFB: ${TTFB_AFTER}s"
    echo "$TTFB_AFTER" > "ttfb-after-migration-${TIMESTAMP}.txt"

    # Compare performance
    if [ -f "ttfb-before-migration-"*".txt" ]; then
        TTFB_BEFORE=$(cat ttfb-before-migration-*.txt | tail -1)
        IMPROVEMENT=$(echo "scale=2; ($TTFB_BEFORE - $TTFB_AFTER) / $TTFB_BEFORE * 100" | bc)
        echo ""
        echo "📊 Performance Comparison:"
        echo "  Before: ${TTFB_BEFORE}s"
        echo "  After:  ${TTFB_AFTER}s"
        if (( $(echo "$IMPROVEMENT > 0" | bc -l) )); then
            echo "  ✅ Improvement: ${IMPROVEMENT}% faster"
        else
            DEGRADATION=$(echo "scale=2; $IMPROVEMENT * -1" | bc)
            echo "  ❌ Degradation: ${DEGRADATION}% slower"
            echo "  ⚠️  Consider rollback if this is significant"
        fi
    fi

    # Check BunnyCDN headers
    echo ""
    echo "🐰 Checking BunnyCDN headers..."
    PULL_ZONE=$(curl -I "https://$DOMAIN" 2>/dev/null | grep -i "x-pull-zone" | cut -d: -f2 | tr -d '[:space:]')
    CACHE_STATUS=$(curl -I "https://$DOMAIN" 2>/dev/null | grep -i "x-cache:" | cut -d: -f2 | tr -d '[:space:]')

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

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ MIGRATION VALIDATION COMPLETE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Next steps:"
    echo "1. Monitor for 15 minutes (check errors, performance)"
    echo "2. If all good, raise TTL back to 3600"
    echo "3. Run: ./bunnycdn-validator.sh www.ailydian.com"
    echo ""
    echo "If issues occur, rollback with:"
    echo "  ./dns-migration-helper.sh --rollback"

    exit 0
fi

# Phase 4: Rollback
if [ "$1" == "--rollback" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🚨 EMERGENCY ROLLBACK"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚠️  MANUAL ACTION REQUIRED in your domain registrar:"
    echo ""
    echo "Change DNS back to Vercel:"
    echo "  Type:  CNAME"
    echo "  Host:  www"
    echo "  Value: $OLD_TARGET"
    echo "  TTL:   60"
    echo ""
    echo "Site will be back to normal in 1-2 minutes"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    exit 0
fi

# Default: Show help
echo ""
echo "Usage:"
echo "  ./dns-migration-helper.sh              # Pre-migration checks"
echo "  ./dns-migration-helper.sh --migrate    # Post-migration validation"
echo "  ./dns-migration-helper.sh --validate   # Same as --migrate"
echo "  ./dns-migration-helper.sh --rollback   # Emergency rollback instructions"
echo ""

exit 0
