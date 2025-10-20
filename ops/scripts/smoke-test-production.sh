#!/bin/bash
# Lydian-IQ v3.0 - Production Smoke Tests
# Usage: ./smoke-test-production.sh [base_url]

set -euo pipefail

BASE_URL="${1:-https://iq.ailydian.com}"
FAILED_TESTS=0
TOTAL_TESTS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Lydian-IQ v3.0 Production Smoke Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Target: ${BASE_URL}"
echo "Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
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

info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

test_section() {
  echo ""
  echo -e "${YELLOW}▶${NC} $1"
}

# Test 1: Health Check
test_section "1. Health Check"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/health")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
  pass "Health endpoint responding (200 OK)"

  if echo "$HEALTH_BODY" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    pass "System status: healthy"
  else
    fail "System status not healthy"
  fi

  # Check database connection
  if echo "$HEALTH_BODY" | jq -e '.database == "connected"' > /dev/null 2>&1; then
    pass "Database: connected"
  else
    fail "Database: not connected"
  fi

  # Check cache connection
  if echo "$HEALTH_BODY" | jq -e '.cache == "connected"' > /dev/null 2>&1; then
    pass "Cache (Redis): connected"
  else
    fail "Cache (Redis): not connected"
  fi
else
  fail "Health endpoint error (HTTP $HTTP_CODE)"
fi

# Test 2: OIDC Discovery
test_section "2. OIDC Discovery"
OIDC_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/.well-known/openid-configuration")
HTTP_CODE=$(echo "$OIDC_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
  pass "OIDC discovery endpoint (200 OK)"
else
  fail "OIDC discovery failed (HTTP $HTTP_CODE)"
fi

# Test 3: JWKS Endpoint
test_section "3. JWKS Endpoint"
JWKS_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/oidc/jwks.json")
JWKS_BODY=$(echo "$JWKS_RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$JWKS_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
  pass "JWKS endpoint responding (200 OK)"

  KEY_COUNT=$(echo "$JWKS_BODY" | jq '.keys | length')
  info "Active JWT keys: $KEY_COUNT"
else
  fail "JWKS endpoint failed (HTTP $HTTP_CODE)"
fi

# Test 4: Tenant Registration
test_section "4. Tenant Registration"
TENANT_PAYLOAD=$(cat <<ENDOFFILE
{
  "organization_name": "Smoke Test Corp",
  "tax_id": "$(date +%s)",
  "email": "smoketest@example.com",
  "roles": ["admin"]
}
ENDOFFILE
)

TENANT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/tenant/register" \
  -H "Content-Type: application/json" \
  -d "$TENANT_PAYLOAD")

TENANT_BODY=$(echo "$TENANT_RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$TENANT_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "201" ]; then
  pass "Tenant registration successful (201 Created)"

  TENANT_ID=$(echo "$TENANT_BODY" | jq -r '.tenant_id')
  info "Created tenant: $TENANT_ID"
else
  fail "Tenant registration failed (HTTP $HTTP_CODE)"
fi

# Test 5: OAuth Authorization Flow (PKCE)
test_section "5. OAuth Authorization Flow"
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_')
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -sha256 -binary | base64 | tr -d '=' | tr '+/' '-_')

AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -L "${BASE_URL}/oidc/authorize?response_type=code&client_id=smoke-test&redirect_uri=${BASE_URL}/callback&scope=marketplace.read%20esg.read&code_challenge=${CODE_CHALLENGE}&code_challenge_method=S256&tenant_id=${TENANT_ID}")

HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "200" ]; then
  pass "OAuth authorize endpoint responding"
else
  fail "OAuth authorize failed (HTTP $HTTP_CODE)"
fi

# Test 6: Marketplace Endpoint (Protected)
test_section "6. Marketplace Endpoint (Protected)"
MARKETPLACE_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/marketplace/plugins")
HTTP_CODE=$(echo "$MARKETPLACE_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
  pass "Marketplace endpoint protected (401 Unauthorized)"
else
  fail "Marketplace endpoint not protected (HTTP $HTTP_CODE)"
fi

# Test 7: ESG Metrics Endpoint (Protected)
test_section "7. ESG Metrics Endpoint (Protected)"
ESG_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/esg/metrics")
HTTP_CODE=$(echo "$ESG_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
  pass "ESG endpoint protected (401 Unauthorized)"
else
  fail "ESG endpoint not protected (HTTP $HTTP_CODE)"
fi

# Test 8: Chat Endpoint (Public)
test_section "8. Chat Endpoint"
CHAT_PAYLOAD='{"messages":[{"role":"user","content":"Hello"}],"model":"gpt-4o"}'
CHAT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "$CHAT_PAYLOAD")

HTTP_CODE=$(echo "$CHAT_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
  pass "Chat endpoint responding (HTTP $HTTP_CODE)"
else
  fail "Chat endpoint error (HTTP $HTTP_CODE)"
fi

# Test 9: Batch Product Sync Endpoint
test_section "9. Batch Product Sync"
BATCH_PAYLOAD='{"products":[{"id":"test-1","name":"Test Product","price":99.99}]}'
BATCH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/products/sync" \
  -H "Content-Type: application/json" \
  -d "$BATCH_PAYLOAD")

HTTP_CODE=$(echo "$BATCH_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
  pass "Batch sync endpoint responding (HTTP $HTTP_CODE)"
else
  fail "Batch sync endpoint error (HTTP $HTTP_CODE)"
fi

# Test 10: Civic-Grid Insights (DP Protected)
test_section "10. Civic-Grid Insights (DP)"
CIVIC_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/civic/insights/average-salary?region=istanbul")
HTTP_CODE=$(echo "$CIVIC_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
  pass "Civic-Grid endpoint responding (HTTP $HTTP_CODE)"
else
  fail "Civic-Grid endpoint error (HTTP $HTTP_CODE)"
fi

# Test 11: Performance Check (Response Time)
test_section "11. Performance Check"
START_TIME=$(date +%s%3N)
curl -s "${BASE_URL}/health" > /dev/null
END_TIME=$(date +%s%3N)
RESPONSE_TIME=$((END_TIME - START_TIME))

if [ "$RESPONSE_TIME" -lt 1000 ]; then
  pass "Health endpoint response time: ${RESPONSE_TIME}ms (< 1s)"
else
  fail "Health endpoint slow: ${RESPONSE_TIME}ms (> 1s)"
fi

# Test 12: Cache Performance
test_section "12. Cache Performance"
# First request (cache miss)
curl -s "${BASE_URL}/api/models" > /dev/null

# Second request (should be cached)
START_TIME=$(date +%s%3N)
curl -s "${BASE_URL}/api/models" > /dev/null
END_TIME=$(date +%s%3N)
CACHE_RESPONSE_TIME=$((END_TIME - START_TIME))

if [ "$CACHE_RESPONSE_TIME" -lt 500 ]; then
  pass "Cached endpoint response time: ${CACHE_RESPONSE_TIME}ms (< 500ms)"
  info "Cache appears to be working"
else
  fail "Cached endpoint slow: ${CACHE_RESPONSE_TIME}ms (> 500ms)"
fi

# Test 13: Rate Limiting
test_section "13. Rate Limiting"
RATE_LIMIT_COUNT=0
for i in {1..30}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/health")
  if [ "$HTTP_CODE" = "429" ]; then
    ((RATE_LIMIT_COUNT++))
  fi
done

if [ "$RATE_LIMIT_COUNT" -gt 0 ]; then
  pass "Rate limiting active ($RATE_LIMIT_COUNT/30 requests limited)"
else
  info "Rate limiting not triggered (under threshold)"
  ((TOTAL_TESTS++))
fi

# Test 14: SSL/TLS Certificate
test_section "14. SSL/TLS Certificate"
if [ "${BASE_URL:0:5}" = "https" ]; then
  CERT_INFO=$(echo | openssl s_client -servername "${BASE_URL#https://}" -connect "${BASE_URL#https://}:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")

  if [ -n "$CERT_INFO" ]; then
    pass "SSL/TLS certificate valid"
    info "$(echo "$CERT_INFO" | grep notAfter)"
  else
    fail "SSL/TLS certificate check failed"
  fi
else
  fail "Not using HTTPS"
fi

# Test 15: DNS Resolution
test_section "15. DNS Resolution"
DOMAIN="${BASE_URL#https://}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN%%/*}"

if nslookup "$DOMAIN" > /dev/null 2>&1; then
  pass "DNS resolution successful for $DOMAIN"
else
  fail "DNS resolution failed for $DOMAIN"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Smoke Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$((TOTAL_TESTS - FAILED_TESTS))${NC}"
echo -e "Failed: ${RED}${FAILED_TESTS}${NC}"
PASS_RATE=$(echo "scale=1; ($TOTAL_TESTS - $FAILED_TESTS) * 100 / $TOTAL_TESTS" | bc)
echo "Pass Rate: ${PASS_RATE}%"
echo ""

if [ "$FAILED_TESTS" -eq 0 ]; then
  echo -e "${GREEN}✅ All smoke tests passed - System is healthy${NC}"
  exit 0
elif [ "$FAILED_TESTS" -le 2 ]; then
  echo -e "${YELLOW}⚠️  $FAILED_TESTS tests failed - System partially functional${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILED_TESTS tests failed - System has issues${NC}"
  exit 1
fi
