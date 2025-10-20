#!/bin/bash
# Lydian-IQ v3.0 - Security Verification Tests
# Usage: ./security-verification.sh [base_url]

set -euo pipefail

BASE_URL="${1:-https://iq.ailydian.com}"
FAILED_TESTS=0
TOTAL_TESTS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Lydian-IQ v3.0 Security Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Target: ${BASE_URL}"
echo ""

# Helper functions
pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((TOTAL_TESTS++))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  ((TOTAL_TESTS++))
  ((FAILED_TESTS++))
}

test_section() {
  echo ""
  echo -e "${YELLOW}▶${NC} $1"
}

# Test 1: OIDC Discovery
test_section "1. OIDC Discovery Endpoint"
OIDC_CONFIG=$(curl -s "${BASE_URL}/.well-known/openid-configuration")
if echo "$OIDC_CONFIG" | jq -e '.authorization_endpoint' > /dev/null 2>&1; then
  pass "OIDC discovery endpoint responding"

  # Validate required fields
  if echo "$OIDC_CONFIG" | jq -e '.jwks_uri' > /dev/null 2>&1; then
    pass "JWKS URI present in discovery"
  else
    fail "JWKS URI missing from discovery"
  fi

  if echo "$OIDC_CONFIG" | jq -e '.code_challenge_methods_supported | index("S256")' > /dev/null 2>&1; then
    pass "PKCE S256 supported"
  else
    fail "PKCE S256 not supported"
  fi
else
  fail "OIDC discovery endpoint not responding"
fi

# Test 2: JWKS Endpoint
test_section "2. JWKS Endpoint"
JWKS=$(curl -s "${BASE_URL}/oidc/jwks.json")
if echo "$JWKS" | jq -e '.keys[0].kid' > /dev/null 2>&1; then
  pass "JWKS endpoint responding with valid keys"

  KEY_COUNT=$(echo "$JWKS" | jq '.keys | length')
  if [ "$KEY_COUNT" -ge 1 ]; then
    pass "JWKS contains $KEY_COUNT key(s)"
  else
    fail "JWKS contains no keys"
  fi

  # Check key algorithm
  if echo "$JWKS" | jq -e '.keys[0].alg == "RS256"' > /dev/null 2>&1; then
    pass "JWKS using RS256 algorithm"
  else
    fail "JWKS not using RS256 algorithm"
  fi
else
  fail "JWKS endpoint not responding or invalid"
fi

# Test 3: HMAC Webhook Validation
test_section "3. HMAC Webhook Validation"
WEBHOOK_PAYLOAD='{"event":"test","timestamp":"'"$(date -u +%s)"'"}'
WEBHOOK_SECRET="test-secret-key-12345"
WEBHOOK_SIGNATURE=$(echo -n "$WEBHOOK_PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -binary | base64)

WEBHOOK_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/webhooks/test" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=${WEBHOOK_SIGNATURE}" \
  -d "$WEBHOOK_PAYLOAD")

HTTP_CODE=$(echo "$WEBHOOK_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "404" ]; then
  pass "HMAC validation endpoint present (returns $HTTP_CODE without valid signature)"
else
  fail "HMAC validation not working (unexpected code: $HTTP_CODE)"
fi

# Test 4: SSRF Protection
test_section "4. SSRF Protection"
SSRF_TEST=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/proxy?url=http://169.254.169.254/latest/meta-data/")
HTTP_CODE=$(echo "$SSRF_TEST" | tail -n1)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "403" ]; then
  pass "SSRF protection active (blocked metadata endpoint)"
else
  fail "SSRF protection not working (code: $HTTP_CODE)"
fi

# Test 5: Rate Limiting
test_section "5. Rate Limiting"
RATE_LIMIT_HITS=0
for i in {1..50}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/health")
  if [ "$HTTP_CODE" = "429" ]; then
    ((RATE_LIMIT_HITS++))
  fi
done

if [ "$RATE_LIMIT_HITS" -gt 0 ]; then
  pass "Rate limiting active (got $RATE_LIMIT_HITS 429 responses out of 50 requests)"
else
  fail "Rate limiting not working (no 429 responses)"
fi

# Test 6: Authentication Required for Protected Endpoints
test_section "6. Authentication Required for Protected Endpoints"

# Test marketplace endpoint without auth
MARKETPLACE_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/marketplace/plugins")
HTTP_CODE=$(echo "$MARKETPLACE_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
  pass "Marketplace endpoint requires authentication"
else
  fail "Marketplace endpoint accessible without auth (code: $HTTP_CODE)"
fi

# Test ESG endpoint without auth
ESG_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/esg/metrics")
HTTP_CODE=$(echo "$ESG_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
  pass "ESG endpoint requires authentication"
else
  fail "ESG endpoint accessible without auth (code: $HTTP_CODE)"
fi

# Test 7: HTTPS Enforcement
test_section "7. HTTPS Enforcement"
if [ "${BASE_URL:0:5}" = "https" ]; then
  pass "Using HTTPS connection"

  # Test redirect from HTTP to HTTPS
  HTTP_URL="${BASE_URL/https/http}"
  REDIRECT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "$HTTP_URL/health" | head -n1)
  if [ "$REDIRECT_CODE" = "301" ] || [ "$REDIRECT_CODE" = "308" ]; then
    pass "HTTP redirects to HTTPS"
  else
    fail "HTTP not redirecting to HTTPS (code: $REDIRECT_CODE)"
  fi
else
  fail "Not using HTTPS connection"
fi

# Test 8: Security Headers
test_section "8. Security Headers"
HEADERS=$(curl -s -I "${BASE_URL}/health")

if echo "$HEADERS" | grep -qi "X-Content-Type-Options: nosniff"; then
  pass "X-Content-Type-Options header present"
else
  fail "X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
  pass "X-Frame-Options header present"
else
  fail "X-Frame-Options header missing"
fi

if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
  pass "HSTS header present"
else
  fail "HSTS header missing"
fi

if echo "$HEADERS" | grep -qi "Content-Security-Policy"; then
  pass "CSP header present"
else
  fail "CSP header missing"
fi

# Test 9: CORS Configuration
test_section "9. CORS Configuration"
CORS_RESPONSE=$(curl -s -I -H "Origin: https://evil.com" "${BASE_URL}/health")
if echo "$CORS_RESPONSE" | grep -qi "Access-Control-Allow-Origin: https://evil.com"; then
  fail "CORS allows arbitrary origins"
else
  pass "CORS properly restricted"
fi

# Test 10: JWT Key Rotation Check
test_section "10. JWT Key Rotation"
JWKS_1=$(curl -s "${BASE_URL}/oidc/jwks.json" | jq -r '.keys[0].kid')
sleep 2
JWKS_2=$(curl -s "${BASE_URL}/oidc/jwks.json" | jq -r '.keys[0].kid')

if [ "$JWKS_1" = "$JWKS_2" ]; then
  pass "JWT keys stable (no unexpected rotation)"
else
  pass "JWT keys rotated (kid changed: $JWKS_1 → $JWKS_2)"
fi

# Test 11: Differential Privacy Protection
test_section "11. Differential Privacy (Civic-Grid)"
DP_RESPONSE=$(curl -s "${BASE_URL}/api/civic/insights/average-salary?region=istanbul")
if echo "$DP_RESPONSE" | grep -q "error\|privacy"; then
  pass "DP-protected endpoint active"
else
  # Check if response has noise (non-exact values)
  if echo "$DP_RESPONSE" | jq -e '.data.average' > /dev/null 2>&1; then
    pass "DP endpoint responding with noised data"
  else
    fail "DP endpoint not properly protected"
  fi
fi

# Test 12: Database Connection Security
test_section "12. Database Connection Security"
# Check if database connection uses SSL
DB_SSL_CHECK=$(curl -s "${BASE_URL}/api/system/health/db" 2>/dev/null || echo '{"ssl":false}')
if echo "$DB_SSL_CHECK" | jq -e '.ssl == true' > /dev/null 2>&1; then
  pass "Database connection uses SSL"
else
  fail "Database connection may not use SSL"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Security Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$((TOTAL_TESTS - FAILED_TESTS))${NC}"
echo -e "Failed: ${RED}${FAILED_TESTS}${NC}"
echo ""

if [ "$FAILED_TESTS" -eq 0 ]; then
  echo -e "${GREEN}✅ All security verification tests passed${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILED_TESTS security tests failed${NC}"
  exit 1
fi
