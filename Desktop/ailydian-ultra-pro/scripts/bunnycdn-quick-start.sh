#!/bin/bash
# BunnyCDN Quick Start - Interactive Setup Helper
# This script guides you through the entire BunnyCDN setup

set -e

DOMAIN="www.ailydian.com"
TEST_DOMAIN="test-cdn.ailydian.com"
ORIGIN="https://ailydian-ultra-pro.vercel.app"
PULL_ZONE_NAME="ailydian-prod"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐰 BunnyCDN Quick Start - Interactive Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script will guide you through:"
echo "  1. ✅ Pre-flight checks"
echo "  2. 🐰 BunnyCDN account setup instructions"
echo "  3. 🧪 Test domain validation"
echo "  4. 🔄 Production migration"
echo "  5. 📊 Post-migration monitoring"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Pre-flight checks
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 STEP 1: Pre-Flight Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "🔍 Checking current site status..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN")
if [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ Site is online (HTTP $HTTP_STATUS)"
else
    echo "❌ Site returned HTTP $HTTP_STATUS"
    echo "Please fix site issues before proceeding"
    exit 1
fi

echo ""
echo "🔍 Checking DNS configuration..."
CURRENT_DNS=$(dig +short "$DOMAIN" | head -1)
echo "Current DNS: $CURRENT_DNS"

echo ""
echo "⚡ Measuring baseline performance..."
TTFB=$(curl -w "%{time_starttransfer}" -o /dev/null -s "https://$DOMAIN")
TTFB_MS=$(echo "$TTFB * 1000" | bc | cut -d. -f1)
echo "Current TTFB: ${TTFB_MS}ms"
echo "${TTFB_MS}" > ".baseline-ttfb.txt"

echo ""
echo "✅ Pre-flight checks complete!"
echo ""
read -p "Press Enter to continue to BunnyCDN setup..."

# Step 2: BunnyCDN Account Setup
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐰 STEP 2: BunnyCDN Account Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Manual steps (open in browser):"
echo ""
echo "1. Go to: https://bunny.net"
echo "2. Click 'Sign Up' (or 'Get Started')"
echo "3. Enter email: admin@ailydian.com (or your preferred)"
echo "4. Create strong password (min 12 characters)"
echo "5. Verify email"
echo "6. Enable 2FA (Google Authenticator)"
echo "7. Add payment method (gets $10 free credit)"
echo "8. Generate API key: Dashboard → Account → API"
echo ""
read -p "Have you created your BunnyCDN account? (yes/no): " ACCOUNT_CREATED

if [ "$ACCOUNT_CREATED" != "yes" ]; then
    echo "Please create account first, then run this script again"
    exit 0
fi

echo ""
read -p "Enter your BunnyCDN API key (or 'skip'): " API_KEY

if [ "$API_KEY" != "skip" ] && [ -n "$API_KEY" ]; then
    echo "$API_KEY" > ".bunnycdn-api-key.txt"
    chmod 600 ".bunnycdn-api-key.txt"
    echo "✅ API key saved to .bunnycdn-api-key.txt"
fi

echo ""
read -p "Press Enter to continue to Pull Zone setup..."

# Step 3: Pull Zone Setup
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 STEP 3: Pull Zone Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Manual steps in BunnyCDN Dashboard:"
echo ""
echo "1. Go to: Dashboard → CDN → Add Pull Zone"
echo "2. Configure:"
echo "   Name: $PULL_ZONE_NAME"
echo "   Origin URL: $ORIGIN"
echo "   Type: Standard"
echo ""
echo "3. Edge Locations (select these):"
echo "   ✅ Europe: Frankfurt, London, Paris, Amsterdam"
echo "   ✅ US East: New York, Washington DC"
echo "   ✅ US West: Los Angeles, Seattle"
echo ""
echo "4. Advanced Settings:"
echo "   Cache Time: 3600 (1 hour)"
echo "   Browser Cache: 86400 (1 day)"
echo "   Query String Sort: ✅ Enabled"
echo "   Cookies: Forward All"
echo ""
echo "5. Security:"
echo "   Origin Shield: ✅ Enabled"
echo "   DDoS Protection: ✅ Enabled"
echo ""
echo "6. Click 'Add Pull Zone'"
echo ""
read -p "Have you created the Pull Zone? (yes/no): " PULL_ZONE_CREATED

if [ "$PULL_ZONE_CREATED" != "yes" ]; then
    echo "Please create Pull Zone first, then run: ./bunnycdn-quick-start.sh --test"
    exit 0
fi

echo ""
read -p "Enter your Pull Zone URL (e.g., ailydian-prod.b-cdn.net): " PULL_ZONE_URL

if [ -n "$PULL_ZONE_URL" ]; then
    echo "$PULL_ZONE_URL" > ".bunnycdn-pull-zone.txt"
    echo "✅ Pull Zone URL saved"
fi

echo ""
read -p "Press Enter to continue to test domain setup..."

# Step 4: Test Domain Setup
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 STEP 4: Test Domain Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Manual steps:"
echo ""
echo "A. In BunnyCDN Dashboard:"
echo "   1. Pull Zone → Hostnames → Add Custom Hostname"
echo "   2. Hostname: $TEST_DOMAIN"
echo "   3. SSL: Let's Encrypt (Free, Auto)"
echo "   4. Click 'Add'"
echo "   5. Wait 5-10 minutes for SSL provisioning"
echo ""
echo "B. In your Domain Registrar (GoDaddy/Namecheap/etc):"
echo "   1. Add DNS record:"
echo "      Type:  CNAME"
echo "      Host:  test-cdn"
echo "      Value: ${PULL_ZONE_URL:-ailydian-prod.b-cdn.net}"
echo "      TTL:   300"
echo "   2. Save"
echo ""
read -p "Have you completed both steps? (yes/no): " TEST_DOMAIN_SETUP

if [ "$TEST_DOMAIN_SETUP" != "yes" ]; then
    echo "Complete the steps above, then run: ./bunnycdn-quick-start.sh --validate-test"
    exit 0
fi

echo ""
echo "⏱️  Waiting 30 seconds for DNS propagation..."
sleep 30

echo ""
echo "🔍 Testing $TEST_DOMAIN..."

# Run validation
if [ -f "./scripts/bunnycdn-validator.sh" ]; then
    chmod +x ./scripts/bunnycdn-validator.sh
    ./scripts/bunnycdn-validator.sh "$TEST_DOMAIN"
else
    echo "⚠️  Validator script not found, running basic tests..."

    # Basic DNS test
    echo "DNS: $(dig +short $TEST_DOMAIN)"

    # Basic HTTP test
    HTTP_TEST=$(curl -I "https://$TEST_DOMAIN" 2>&1 | head -1)
    echo "HTTP: $HTTP_TEST"

    # Basic cache test
    echo "First request:"
    curl -I "https://$TEST_DOMAIN" 2>/dev/null | grep -i "x-cache" || echo "No cache header"
    sleep 1
    echo "Second request:"
    curl -I "https://$TEST_DOMAIN" 2>/dev/null | grep -i "x-cache" || echo "No cache header"
fi

echo ""
read -p "Did test domain pass all checks? (yes/no): " TEST_PASSED

if [ "$TEST_PASSED" != "yes" ]; then
    echo "⚠️  Please fix test domain issues before production migration"
    echo "Run validation again: ./bunnycdn-validator.sh $TEST_DOMAIN"
    exit 0
fi

echo ""
echo "✅ Test domain validated successfully!"
echo ""
read -p "Ready to proceed to PRODUCTION migration? (yes/no): " PROD_READY

if [ "$PROD_READY" != "yes" ]; then
    echo ""
    echo "When ready for production, run:"
    echo "  ./bunnycdn-quick-start.sh --production"
    exit 0
fi

# Step 5: Production Migration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 STEP 5: Production Migration (CRITICAL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: Zero downtime migration strategy"
echo ""
echo "📝 Phase 1: Lower TTL (Do this NOW, then wait 1 hour)"
echo ""
echo "In your Domain Registrar:"
echo "  Type:  CNAME"
echo "  Host:  www"
echo "  Value: $CURRENT_DNS (keep current!)"
echo "  TTL:   60 (change from 3600 to 60)"
echo ""
read -p "Have you lowered TTL to 60? (yes/no): " TTL_LOWERED

if [ "$TTL_LOWERED" != "yes" ]; then
    echo ""
    echo "Please lower TTL first, then run in 1 hour:"
    echo "  ./bunnycdn-quick-start.sh --migrate-production"
    exit 0
fi

echo ""
echo "⏱️  SET A TIMER FOR 1 HOUR!"
echo ""
echo "After 1 hour, run:"
echo "  ./bunnycdn-quick-start.sh --migrate-production"
echo ""
echo "This allows global DNS cache to expire before we switch"
exit 0
