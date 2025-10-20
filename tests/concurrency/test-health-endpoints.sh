#!/bin/bash
# Test health endpoints - should always return 200
# No rate limiting or concurrency limits

set -euo pipefail

BASE_URL="${1:-http://localhost:3100}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 Testing Health Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Base URL: ${BASE_URL}"
echo ""

PASS=true

# Test /health
echo "Testing /health..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HEALTH_CODE" = "200" ]; then
  echo -e "${GREEN}✓${NC} /health → 200 OK"
  echo "  Response: ${HEALTH_BODY}"
else
  echo -e "${RED}✗${NC} /health → ${HEALTH_CODE} (expected 200)"
  PASS=false
fi

echo ""

# Test /api/health
echo "Testing /api/health..."
API_HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/health")
API_HEALTH_CODE=$(echo "$API_HEALTH_RESPONSE" | tail -n1)
API_HEALTH_BODY=$(echo "$API_HEALTH_RESPONSE" | head -n -1)

if [ "$API_HEALTH_CODE" = "200" ]; then
  echo -e "${GREEN}✓${NC} /api/health → 200 OK"
  echo "  Response: ${API_HEALTH_BODY}"
else
  echo -e "${RED}✗${NC} /api/health → ${API_HEALTH_CODE} (expected 200)"
  PASS=false
fi

echo ""

# Test /api/capabilities
echo "Testing /api/capabilities..."
CAP_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/capabilities")
CAP_CODE=$(echo "$CAP_RESPONSE" | tail -n1)
CAP_BODY=$(echo "$CAP_RESPONSE" | head -n -1)

if [ "$CAP_CODE" = "200" ]; then
  echo -e "${GREEN}✓${NC} /api/capabilities → 200 OK"

  # Check if response is valid JSON
  if echo "$CAP_BODY" | jq -e '.features' > /dev/null 2>&1; then
    FEATURE_COUNT=$(echo "$CAP_BODY" | jq '.features | length')
    echo "  Features: ${FEATURE_COUNT}"
  else
    echo -e "${RED}✗${NC} Invalid JSON response"
    PASS=false
  fi
else
  echo -e "${RED}✗${NC} /api/capabilities → ${CAP_CODE} (expected 200)"
  echo "  This endpoint should be whitelisted!"
  PASS=false
fi

echo ""

# Test /api/connectors/healthz
echo "Testing /api/connectors/healthz..."
CONN_HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/connectors/healthz")
CONN_HEALTH_CODE=$(echo "$CONN_HEALTH_RESPONSE" | tail -n1)
CONN_HEALTH_BODY=$(echo "$CONN_HEALTH_RESPONSE" | head -n -1)

if [ "$CONN_HEALTH_CODE" = "200" ]; then
  echo -e "${GREEN}✓${NC} /api/connectors/healthz → 200 OK"
  echo "  Response: ${CONN_HEALTH_BODY}"
else
  echo -e "${RED}✗${NC} /api/connectors/healthz → ${CONN_HEALTH_CODE} (expected 200)"
  PASS=false
fi

echo ""

# Test concurrency metrics
echo "Testing /api/concurrency/metrics..."
METRICS_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/concurrency/metrics")
METRICS_CODE=$(echo "$METRICS_RESPONSE" | tail -n1)
METRICS_BODY=$(echo "$METRICS_RESPONSE" | head -n -1)

if [ "$METRICS_CODE" = "200" ]; then
  echo -e "${GREEN}✓${NC} /api/concurrency/metrics → 200 OK"

  if echo "$METRICS_BODY" | jq -e . > /dev/null 2>&1; then
    echo "  In Flight: $(echo "$METRICS_BODY" | jq -r '.inFlight')"
    echo "  Queued: $(echo "$METRICS_BODY" | jq -r '.queued')"
    echo "  Utilization: $(echo "$METRICS_BODY" | jq -r '.utilizationPercent')%"
    echo "  Peak: $(echo "$METRICS_BODY" | jq -r '.peakConcurrency')"
    echo "  Rejections: $(echo "$METRICS_BODY" | jq -r '.totalRejections')"
  fi
else
  echo -e "${RED}✗${NC} /api/concurrency/metrics → ${METRICS_CODE}"
  PASS=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$PASS" = true ]; then
  echo -e "${GREEN}✅ All health endpoints working${NC}"
  exit 0
else
  echo -e "${RED}❌ Some health endpoints failed${NC}"
  exit 1
fi
