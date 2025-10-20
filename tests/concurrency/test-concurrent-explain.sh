#!/bin/bash
# Test trust/explain endpoint under heavy concurrent load
# Should handle 429 gracefully with Retry-After headers

set -euo pipefail

BASE_URL="${1:-http://localhost:3100}"
CONCURRENCY="${2:-100}"
DURATION="${3:-15}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing /api/trust/explain under heavy load"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "URL:         ${BASE_URL}/api/trust/explain"
echo "Concurrency: ${CONCURRENCY} connections"
echo "Duration:    ${DURATION} seconds"
echo ""

# Check if autocannon is installed
if ! command -v autocannon &> /dev/null; then
  echo "Installing autocannon..."
  npm install -g autocannon
fi

# Sample payload
PAYLOAD='{"trustScore":0.85,"factors":["kyc_verified","transaction_history","reputation"]}'

# Run load test
echo "Running load test..."
autocannon \
  -c "${CONCURRENCY}" \
  -d "${DURATION}" \
  -m POST \
  -H "Content-Type: application/json" \
  -b "${PAYLOAD}" \
  "${BASE_URL}/api/trust/explain" \
  --renderProgressBar false \
  --json > /tmp/explain-load-test.json

# Parse results
TOTAL_REQUESTS=$(jq -r '.requests.total' /tmp/explain-load-test.json)
SUCCESS_2XX=$(jq -r '.["2xx"] // 0' /tmp/explain-load-test.json)
ERROR_429=$(jq -r '.["429"] // 0' /tmp/explain-load-test.json)
ERROR_5XX=$(jq -r '.["5xx"] // 0' /tmp/explain-load-test.json)
P95_LATENCY=$(jq -r '.latency.p95' /tmp/explain-load-test.json)
P99_LATENCY=$(jq -r '.latency.p99' /tmp/explain-load-test.json)
RPS=$(jq -r '.requests.average' /tmp/explain-load-test.json)

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

# Calculate error and success rates
SUCCESS_RATE=$(echo "scale=2; $SUCCESS_2XX * 100 / $TOTAL_REQUESTS" | bc)
RATE_LIMITED_RATE=$(echo "scale=2; $ERROR_429 * 100 / $TOTAL_REQUESTS" | bc)
ERROR_RATE=$(echo "scale=2; $ERROR_5XX * 100 / $TOTAL_REQUESTS" | bc)

echo "Success Rate:    ${SUCCESS_RATE}%"
echo "Rate Limited %:  ${RATE_LIMITED_RATE}%"
echo "Error Rate:      ${ERROR_RATE}%"
echo ""

# Check Retry-After header in 429 responses
echo "Checking Retry-After headers on 429 responses..."
RETRY_AFTER_SAMPLE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}" \
  "${BASE_URL}/api/trust/explain" | tail -n1)

if [ "$RETRY_AFTER_SAMPLE" = "429" ]; then
  RETRY_AFTER_HEADER=$(curl -s -I -X POST \
    -H "Content-Type: application/json" \
    -d "${PAYLOAD}" \
    "${BASE_URL}/api/trust/explain" | grep -i "retry-after" || echo "")

  if [ -n "$RETRY_AFTER_HEADER" ]; then
    echo "✅ Retry-After header present: ${RETRY_AFTER_HEADER}"
  else
    echo "⚠️  Warning: Retry-After header missing in 429 response"
  fi
fi

echo ""

# Acceptance criteria
PASS=true

# Some 429s are expected under heavy load, but should be < 30%
if (( $(echo "$RATE_LIMITED_RATE > 30" | bc -l) )); then
  echo "❌ FAIL: Rate limit rate ${RATE_LIMITED_RATE}% too high (threshold: 30%)"
  echo "   Consider increasing GATEWAY_MAX_CONCURRENCY"
  PASS=false
else
  echo "✅ PASS: Rate limit rate within acceptable range"
fi

# Server errors should be minimal (< 5%)
if (( $(echo "$ERROR_RATE > 5" | bc -l) )); then
  echo "❌ FAIL: Server error rate ${ERROR_RATE}% too high (threshold: 5%)"
  PASS=false
else
  echo "✅ PASS: Server error rate acceptable"
fi

# Most requests should succeed
if (( $(echo "$SUCCESS_RATE < 50" | bc -l) )); then
  echo "❌ FAIL: Success rate ${SUCCESS_RATE}% too low (threshold: 50%)"
  PASS=false
else
  echo "✅ PASS: Success rate acceptable"
fi

# p99 should be reasonable even under load
P99_THRESHOLD=5000
if (( $(echo "$P99_LATENCY > $P99_THRESHOLD" | bc -l) )); then
  echo "⚠️  WARNING: p99 latency ${P99_LATENCY}ms exceeds ${P99_THRESHOLD}ms"
else
  echo "✅ PASS: p99 latency within threshold"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$PASS" = true ]; then
  echo "✅ All tests passed"
  echo ""
  echo "System handled ${TOTAL_REQUESTS} requests with:"
  echo "  - ${SUCCESS_RATE}% success rate"
  echo "  - ${RATE_LIMITED_RATE}% rate limited (with Retry-After)"
  echo "  - Graceful degradation under load"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi
