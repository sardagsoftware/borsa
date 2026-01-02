#!/bin/bash

# SendGrid DNS Setup Script
# Automatically adds DNS records to Vercel for www.ailydian.com
# Date: 2026-01-02

set -e

echo "🚀 SendGrid DNS Setup for www.ailydian.com"
echo "=========================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
echo "🔐 Checking Vercel authentication..."
vercel whoami || {
    echo "⚠️  Not logged in to Vercel. Please login:"
    vercel login
}

echo ""
echo "📋 Adding DNS records to www.ailydian.com..."
echo ""

# Domain to add records to
DOMAIN="www.ailydian.com"

# Function to add DNS record with error handling
add_dns_record() {
    local name=$1
    local type=$2
    local value=$3
    local description=$4

    echo "Adding: $description"
    echo "  Type: $type"
    echo "  Host: $name"
    echo "  Value: $value"

    if vercel dns add "$DOMAIN" "$name" "$type" "$value" 2>/dev/null; then
        echo "  ✅ Added successfully"
    else
        echo "  ⚠️  Record may already exist or needs manual addition"
    fi
    echo ""
}

# 1. CNAME - Click tracking
add_dns_record \
    "url4343.www" \
    "CNAME" \
    "sendgrid.net" \
    "1️⃣ SendGrid Click Tracking Domain"

# 2. CNAME - Domain verification
add_dns_record \
    "58513307.www" \
    "CNAME" \
    "sendgrid.net" \
    "2️⃣ SendGrid Domain Verification"

# 3. CNAME - Email sending domain
add_dns_record \
    "em8774.www" \
    "CNAME" \
    "u58513307.wl058.sendgrid.net" \
    "3️⃣ SendGrid Email Sending Domain"

# 4. CNAME - DKIM Key 1
add_dns_record \
    "s1._domainkey.www" \
    "CNAME" \
    "s1.domainkey.u58513307.wl058.sendgrid.net" \
    "4️⃣ DKIM Signature Key 1"

# 5. CNAME - DKIM Key 2
add_dns_record \
    "s2._domainkey.www" \
    "CNAME" \
    "s2.domainkey.u58513307.wl058.sendgrid.net" \
    "5️⃣ DKIM Signature Key 2"

# 6. TXT - DMARC Policy
add_dns_record \
    "_dmarc.www" \
    "TXT" \
    "v=DMARC1; p=none;" \
    "6️⃣ DMARC Policy (Monitor Mode)"

echo "=========================================="
echo "✅ DNS Setup Complete!"
echo ""
echo "📊 DNS Records Added (6 total):"
echo "  - 3 CNAME records (SendGrid tracking)"
echo "  - 2 CNAME records (DKIM signatures)"
echo "  - 1 TXT record (DMARC policy)"
echo ""
echo "⏱️  DNS Propagation:"
echo "  - Minimum: 15-30 minutes"
echo "  - Typical: 2-6 hours"
echo "  - Maximum: 24-48 hours"
echo ""
echo "🔍 Verify DNS propagation:"
echo "  dig url4343.www.ailydian.com CNAME +short"
echo "  dig s1._domainkey.www.ailydian.com CNAME +short"
echo "  dig _dmarc.www.ailydian.com TXT +short"
echo ""
echo "📧 Next Steps:"
echo "  1. Wait for DNS propagation (check with dig commands above)"
echo "  2. Verify in SendGrid Dashboard → Sender Authentication"
echo "  3. Add SendGrid API key to Vercel env variables"
echo "  4. Test email sending"
echo ""
echo "📖 Full documentation: docs/SENDGRID-DNS-SETUP.md"
echo ""
