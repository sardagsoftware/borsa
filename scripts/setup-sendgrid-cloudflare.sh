#!/bin/bash

# SendGrid DNS Setup for Cloudflare
# Adds DNS records via Cloudflare API for www.ailydian.com
# Date: 2026-01-02

set -e

echo "☁️  SendGrid DNS Setup for Cloudflare"
echo "====================================="
echo ""

# Configuration
ZONE_NAME="ailydian.com"
DOMAIN="www"  # Subdomain (www.ailydian.com)

# Cloudflare credentials (set these as environment variables)
# export CLOUDFLARE_EMAIL="your-email@example.com"
# export CLOUDFLARE_API_KEY="your-cloudflare-api-key"
# OR use API Token (recommended):
# export CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"

if [ -z "$CLOUDFLARE_API_TOKEN" ] && [ -z "$CLOUDFLARE_API_KEY" ]; then
    echo "⚠️  Cloudflare credentials not found!"
    echo ""
    echo "Please set one of the following:"
    echo ""
    echo "Option 1: API Token (Recommended)"
    echo "  export CLOUDFLARE_API_TOKEN='your-api-token'"
    echo ""
    echo "Option 2: Email + Global API Key"
    echo "  export CLOUDFLARE_EMAIL='your-email@example.com'"
    echo "  export CLOUDFLARE_API_KEY='your-global-api-key'"
    echo ""
    echo "Get your Cloudflare API Token:"
    echo "  https://dash.cloudflare.com/profile/api-tokens"
    echo ""
    exit 1
fi

# Get Zone ID
echo "🔍 Getting Cloudflare Zone ID for $ZONE_NAME..."

if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
    ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" | jq -r '.result[0].id')
else
    ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME" \
        -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
        -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
        -H "Content-Type: application/json" | jq -r '.result[0].id')
fi

if [ "$ZONE_ID" == "null" ] || [ -z "$ZONE_ID" ]; then
    echo "❌ Could not find Zone ID for $ZONE_NAME"
    echo "   Please check your domain is added to Cloudflare"
    exit 1
fi

echo "✅ Zone ID: $ZONE_ID"
echo ""

# Function to add DNS record via Cloudflare API
add_cloudflare_dns() {
    local name=$1
    local type=$2
    local content=$3
    local description=$4

    echo "Adding: $description"
    echo "  Type: $type"
    echo "  Name: $name"
    echo "  Content: $content"

    local response
    if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
        response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"$type\",\"name\":\"$name\",\"content\":\"$content\",\"ttl\":3600,\"proxied\":false}")
    else
        response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
            -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
            -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"$type\",\"name\":\"$name\",\"content\":\"$content\",\"ttl\":3600,\"proxied\":false}")
    fi

    local success=$(echo "$response" | jq -r '.success')

    if [ "$success" == "true" ]; then
        echo "  ✅ Added successfully"
    else
        local error=$(echo "$response" | jq -r '.errors[0].message // "Unknown error"')
        echo "  ⚠️  $error"
    fi
    echo ""
}

echo "📋 Adding SendGrid DNS records..."
echo ""

# 1. CNAME - Click tracking
add_cloudflare_dns \
    "url4343.$DOMAIN.$ZONE_NAME" \
    "CNAME" \
    "sendgrid.net" \
    "1️⃣ SendGrid Click Tracking"

# 2. CNAME - Domain verification
add_cloudflare_dns \
    "58513307.$DOMAIN.$ZONE_NAME" \
    "CNAME" \
    "sendgrid.net" \
    "2️⃣ SendGrid Domain Verification"

# 3. CNAME - Email sending domain
add_cloudflare_dns \
    "em8774.$DOMAIN.$ZONE_NAME" \
    "CNAME" \
    "u58513307.wl058.sendgrid.net" \
    "3️⃣ SendGrid Email Sending Domain"

# 4. CNAME - DKIM Key 1
add_cloudflare_dns \
    "s1._domainkey.$DOMAIN.$ZONE_NAME" \
    "CNAME" \
    "s1.domainkey.u58513307.wl058.sendgrid.net" \
    "4️⃣ DKIM Signature Key 1"

# 5. CNAME - DKIM Key 2
add_cloudflare_dns \
    "s2._domainkey.$DOMAIN.$ZONE_NAME" \
    "CNAME" \
    "s2.domainkey.u58513307.wl058.sendgrid.net" \
    "5️⃣ DKIM Signature Key 2"

# 6. TXT - DMARC Policy
add_cloudflare_dns \
    "_dmarc.$DOMAIN.$ZONE_NAME" \
    "TXT" \
    "v=DMARC1; p=none;" \
    "6️⃣ DMARC Policy"

echo "====================================="
echo "✅ Cloudflare DNS Setup Complete!"
echo ""
echo "📊 DNS Records Added (6 total):"
echo "  - 3 CNAME records (SendGrid tracking)"
echo "  - 2 CNAME records (DKIM signatures)"
echo "  - 1 TXT record (DMARC policy)"
echo ""
echo "⏱️  DNS Propagation:"
echo "  - Cloudflare: Usually instant (1-5 minutes)"
echo "  - Global: 15-30 minutes typically"
echo ""
echo "🔍 Verify DNS records:"
echo "  dig url4343.www.ailydian.com CNAME +short"
echo "  dig s1._domainkey.www.ailydian.com CNAME +short"
echo "  dig _dmarc.www.ailydian.com TXT +short"
echo ""
echo "📧 Next Steps:"
echo "  1. Wait 5-10 minutes for Cloudflare propagation"
echo "  2. Verify in SendGrid Dashboard → Sender Authentication"
echo "  3. Add SendGrid API key to Vercel env variables"
echo "  4. Test email sending"
echo ""
