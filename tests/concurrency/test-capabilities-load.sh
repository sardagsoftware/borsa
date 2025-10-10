#!/bin/bash
# Test capabilities endpoint under concurrent load
# Should NOT return 429 errors since it's whitelisted

set -euo pipefail

BASE_URL="${1:-http://localhost:3100}"
CONCURRENCY="${2:-50}"
DURATION="${3:-10}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing /api/capabilities under load"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "URL:         ${BASE_URL}/api/capabilities"
echo "Concurrency: ${CONCURRENCY} connections"
echo "Duration:    ${DURATION} seconds"
echo ""

# Check if autocannon is installed
if ! command -v autocannon &> /dev/null; then
  echo "Installing autocannon..."
  npm install -g autocannon
fi

# Run load test
echo "Running load test..."
autocannon \
  -c "${CONCURRENCY}" \
  -d "${DURATION}" \
  -m GET \
  "${BASE_URL}/api/capabilities" \
  --renderProgressBar false \
  --json > /tmp/capabilities-load-test.json

# Parse results
TOTAL_REQUESTS=$(jq -r '.requests.total' /tmp/capabilities-load-test.json)
SUCCESS_2XX=$(jq -r '.["2xx"]' /tmp/capabilities-load-test.json)
ERROR_429=$(jq -r '.["429"] // 0' /tmp/capabilities-load-test.json)
ERROR_5XX=$(jq -r '.["5xx"] // 0' /tmp/capabilities-load-test.json)
P95_LATENCY=$(jq -r '.latency.p95' /tmp/capabilities-load-test.json)
P99_LATENCY=$(jq -r '.latency.p99' /tmp/capabilities-load-test.json)
RPS=$(jq -r '.requests.average' /tmp/capabilities-load-test.json)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Requests:  ${TOTAL_REQUESTS}"
echo "Success (2xx):   ${SUCCESS_2XX}"
echo "Rate Limited:    ${ERROR_429}"
echo "Server Errors:   ${ERROR_5XX}"
echo "p95 Latency:     ${P95_LATENCY}ms"
echo "p99 Latency:     ${P99_LATENCY}ms"
echo "Avg RPS:         ${RPS}"
echo ""

# Calculate error rate
ERROR_RATE=$(echo "scale=2; ($ERROR_429 + $ERROR_5XX) * 100 / $TOTAL_REQUESTS" | bc)
echo "Error Rate:      ${ERROR_RATE}%"
echo ""

# Acceptance criteria
PASS=true

if [ "$ERROR_429" -gt 0 ]; then
  echo "❌ FAIL: Got ${ERROR_429} rate limit errors (expected 0)"
  echo "   Capabilities endpoint should be whitelisted"
  PASS=false
else
  echo "✅ PASS: No rate limit errors"
fi

if [ "$ERROR_5XX" -gt 10 ]; then
  echo "❌ FAIL: Got ${ERROR_5XX} server errors (threshold: 10)"
  PASS=false
else
  echo "✅ PASS: Server errors within threshold"
fi

P95_THRESHOLD=1000
if (( $(echo "$P95_LATENCY > $P95_THRESHOLD" | bc -l) )); then
  echo "❌ FAIL: p95 latency ${P95_LATENCY}ms exceeds ${P95_THRESHOLD}ms"
  PASS=false
else
  echo "✅ PASS: p95 latency within threshold"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$PASS" = true ]; then
  echo "✅ All tests passed"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi
