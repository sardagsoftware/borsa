#!/bin/bash
# API Smoke Tests - Production
# Policy: White-Hat • Zero Mock • Audit-Ready

DOMAIN="https://www.ailydian.com"
PASS=0
FAIL=0

test_endpoint() {
  local name="$1"
  local endpoint="$2"
  local expected_status="$3"
  
  echo -n "Testing $name... "
  status=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$endpoint" 2>&1)
  
  if [ "$status" = "$expected_status" ]; then
    echo "✅ PASS ($status)"
    ((PASS++))
  else
    echo "❌ FAIL (expected $expected_status, got $status)"
    ((FAIL++))
  fi
}

echo "🧪 API SMOKE TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Core Endpoints
test_endpoint "Health Check" "/api/health" "200"
test_endpoint "Feature Flags" "/api/feature-flags" "200"
test_endpoint "Models List" "/api/models" "200"

# Auth Endpoints (should redirect or return JSON)
test_endpoint "Google OAuth (redirect)" "/api/auth/google" "302"
test_endpoint "Microsoft OAuth (redirect)" "/api/auth/microsoft" "302"
test_endpoint "GitHub OAuth (redirect)" "/api/auth/github" "302"

# Frontend Pages
test_endpoint "Homepage" "/" "200"
test_endpoint "Auth Page" "/auth.html" "200"
test_endpoint "Dashboard" "/dashboard.html" "200"
test_endpoint "Medical AI" "/medical-expert.html" "200"
test_endpoint "Legal AI" "/lydian-legal-search.html" "200"

# 404 Test
test_endpoint "404 Page" "/nonexistent-page-12345" "404"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: ✅ $PASS passed, ❌ $FAIL failed"
if [ $FAIL -eq 0 ]; then
  echo "Status: 🟢 ALL TESTS PASSED"
  exit 0
else
  echo "Status: 🔴 SOME TESTS FAILED"
  exit 1
fi
