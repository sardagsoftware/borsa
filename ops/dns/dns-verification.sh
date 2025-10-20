#!/bin/bash
# DNS & TLS Verification Script
# Policy: White-Hat • Zero Mock • Audit-Ready

DOMAIN="www.ailydian.com"
APEX="ailydian.com"

echo "🌐 DNS & TLS VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. DNS Resolution
echo "1️⃣  DNS Resolution:"
echo "   A/AAAA records:"
dig +short A $DOMAIN
dig +short AAAA $DOMAIN
echo ""

# 2. TLS Certificate
echo "2️⃣  TLS Certificate:"
echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | \
  openssl x509 -noout -dates -subject -issuer 2>/dev/null
echo ""

# 3. HSTS Header
echo "3️⃣  HSTS Header:"
curl -sI https://$DOMAIN | grep -i strict-transport
echo ""

# 4. HTTP Redirect
echo "4️⃣  HTTP→HTTPS Redirect:"
curl -sI http://$DOMAIN | grep -E "HTTP|Location"
echo ""

# 5. Security Headers
echo "5️⃣  Security Headers:"
curl -sI https://$DOMAIN | grep -E "X-Content-Type|X-Frame|X-XSS|Content-Security|Permissions"
echo ""

echo "✅ Verification complete"
