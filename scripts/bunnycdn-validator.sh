#!/bin/bash
# BunnyCDN Validation & Testing Script
# Usage: ./bunnycdn-validator.sh [test-cdn.ailydian.com or www.ailydian.com]

set -e

DOMAIN="${1:-test-cdn.ailydian.com}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="bunnycdn-test-report-${TIMESTAMP}.txt"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐰 BunnyCDN Validation Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Domain: $DOMAIN"
echo "Time: $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start report
echo "BunnyCDN Validation Report - $DOMAIN" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Test 1: DNS Resolution
echo ""
echo "📍 TEST 1: DNS Resolution"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DNS_RESULT=$(dig +short "$DOMAIN" | head -1)
echo "Result: $DNS_RESULT"
echo "TEST 1: DNS Resolution" >> "$REPORT_FILE"
echo "Result: $DNS_RESULT" >> "$REPORT_FILE"
if [[ "$DNS_RESULT" == *"b-cdn.net"* ]]; then
    echo "✅ PASS: Domain points to BunnyCDN"
    echo "Status: ✅ PASS" >> "$REPORT_FILE"
else
    echo "❌ FAIL: Domain does not point to BunnyCDN"
    echo "Status: ❌ FAIL - Expected: *.b-cdn.net, Got: $DNS_RESULT" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Test 2: HTTPS/SSL
echo ""
echo "🔒 TEST 2: HTTPS/SSL Certificate"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SSL_RESULT=$(curl -I "https://$DOMAIN" 2>&1 | head -1)
echo "Result: $SSL_RESULT"
echo "TEST 2: HTTPS/SSL" >> "$REPORT_FILE"
echo "Result: $SSL_RESULT" >> "$REPORT_FILE"
if [[ "$SSL_RESULT" == *"200"* ]] || [[ "$SSL_RESULT" == *"301"* ]] || [[ "$SSL_RESULT" == *"302"* ]]; then
    echo "✅ PASS: HTTPS working"
    echo "Status: ✅ PASS" >> "$REPORT_FILE"
else
    echo "❌ FAIL: HTTPS not working"
    echo "Status: ❌ FAIL" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Test 3: Cache Headers
echo ""
echo "📦 TEST 3: Cache Functionality"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "First request (should be MISS):"
CACHE_1=$(curl -I "https://$DOMAIN" 2>/dev/null | grep -i "x-cache" | head -1)
echo "$CACHE_1"
sleep 1
echo "Second request (should be HIT):"
CACHE_2=$(curl -I "https://$DOMAIN" 2>/dev/null | grep -i "x-cache" | head -1)
echo "$CACHE_2"

echo "TEST 3: Cache Functionality" >> "$REPORT_FILE"
echo "First request: $CACHE_1" >> "$REPORT_FILE"
echo "Second request: $CACHE_2" >> "$REPORT_FILE"

if [[ "$CACHE_2" == *"HIT"* ]]; then
    echo "✅ PASS: Cache is working (HIT on second request)"
    echo "Status: ✅ PASS - Cache working" >> "$REPORT_FILE"
else
    echo "⚠️  WARNING: Cache might not be configured"
    echo "Status: ⚠️  WARNING - No cache HIT detected" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Test 4: Performance (TTFB)
echo ""
echo "⚡ TEST 4: Performance (TTFB)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TTFB=$(curl -w "%{time_starttransfer}" -o /dev/null -s "https://$DOMAIN")
echo "TTFB: ${TTFB}s"
echo "TEST 4: Performance" >> "$REPORT_FILE"
echo "TTFB: ${TTFB}s" >> "$REPORT_FILE"

TTFB_MS=$(echo "$TTFB * 1000" | bc | cut -d. -f1)
if [ "$TTFB_MS" -lt 100 ]; then
    echo "✅ PASS: Excellent (< 100ms)"
    echo "Status: ✅ PASS - Excellent (< 100ms)" >> "$REPORT_FILE"
elif [ "$TTFB_MS" -lt 200 ]; then
    echo "✅ PASS: Good (< 200ms)"
    echo "Status: ✅ PASS - Good (< 200ms)" >> "$REPORT_FILE"
else
    echo "⚠️  WARNING: Slow (> 200ms)"
    echo "Status: ⚠️  WARNING - Slow (> 200ms)" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Test 5: API Functionality
echo ""
echo "🔌 TEST 5: API Functionality"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
API_RESULT=$(curl -s "https://$DOMAIN/api/health" 2>/dev/null)
echo "Response: $API_RESULT"
echo "TEST 5: API Functionality" >> "$REPORT_FILE"
echo "Response: $API_RESULT" >> "$REPORT_FILE"
if [[ "$API_RESULT" == *"OK"* ]] || [[ "$API_RESULT" == *"ok"* ]] || [[ "$API_RESULT" == *"status"* ]]; then
    echo "✅ PASS: API working"
    echo "Status: ✅ PASS" >> "$REPORT_FILE"
else
    echo "❌ FAIL: API not responding correctly"
    echo "Status: ❌ FAIL" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Test 6: Security Headers
echo ""
echo "🛡️  TEST 6: Security Headers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEADERS=$(curl -I "https://$DOMAIN" 2>/dev/null)

echo "TEST 6: Security Headers" >> "$REPORT_FILE"

# Check HSTS
if echo "$HEADERS" | grep -qi "strict-transport-security"; then
    echo "✅ HSTS: Present"
    echo "✅ HSTS: Present" >> "$REPORT_FILE"
else
    echo "❌ HSTS: Missing"
    echo "❌ HSTS: Missing" >> "$REPORT_FILE"
fi

# Check X-Frame-Options
if echo "$HEADERS" | grep -qi "x-frame-options"; then
    echo "✅ X-Frame-Options: Present"
    echo "✅ X-Frame-Options: Present" >> "$REPORT_FILE"
else
    echo "❌ X-Frame-Options: Missing"
    echo "❌ X-Frame-Options: Missing" >> "$REPORT_FILE"
fi

# Check X-Content-Type-Options
if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    echo "✅ X-Content-Type-Options: Present"
    echo "✅ X-Content-Type-Options: Present" >> "$REPORT_FILE"
else
    echo "❌ X-Content-Type-Options: Missing"
    echo "❌ X-Content-Type-Options: Missing" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# Test 7: Content Delivery
echo ""
echo "📄 TEST 7: Content Delivery"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CONTENT=$(curl -s "https://$DOMAIN" 2>/dev/null | grep -o "LyDian" | head -1)
echo "TEST 7: Content Delivery" >> "$REPORT_FILE"
if [ -n "$CONTENT" ]; then
    echo "✅ PASS: Homepage content delivered correctly"
    echo "Status: ✅ PASS - Homepage content delivered" >> "$REPORT_FILE"
else
    echo "⚠️  WARNING: Homepage content might be different"
    echo "Status: ⚠️  WARNING - Content verification inconclusive" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Test 8: Pull Zone Detection
echo ""
echo "🐰 TEST 8: BunnyCDN Pull Zone Detection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PULL_ZONE=$(curl -I "https://$DOMAIN" 2>/dev/null | grep -i "x-pull-zone" | cut -d: -f2 | tr -d '[:space:]')
CACHE_STATUS=$(curl -I "https://$DOMAIN" 2>/dev/null | grep -i "x-cache:" | cut -d: -f2 | tr -d '[:space:]')

echo "TEST 8: BunnyCDN Detection" >> "$REPORT_FILE"
if [ -n "$PULL_ZONE" ]; then
    echo "✅ Pull Zone: $PULL_ZONE"
    echo "✅ Pull Zone: $PULL_ZONE" >> "$REPORT_FILE"
else
    echo "⚠️  Pull Zone header not found"
    echo "⚠️  Pull Zone header not found" >> "$REPORT_FILE"
fi

if [ -n "$CACHE_STATUS" ]; then
    echo "✅ Cache Status: $CACHE_STATUS"
    echo "✅ Cache Status: $CACHE_STATUS" >> "$REPORT_FILE"
else
    echo "⚠️  Cache status header not found"
    echo "⚠️  Cache status header not found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Final Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Domain: $DOMAIN"
echo "TTFB: ${TTFB}s (${TTFB_MS}ms)"
echo "Pull Zone: ${PULL_ZONE:-Not detected}"
echo "Cache: ${CACHE_STATUS:-Unknown}"
echo ""
echo "Report saved to: $REPORT_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "" >> "$REPORT_FILE"
echo "SUMMARY" >> "$REPORT_FILE"
echo "Domain: $DOMAIN" >> "$REPORT_FILE"
echo "TTFB: ${TTFB}s (${TTFB_MS}ms)" >> "$REPORT_FILE"
echo "Pull Zone: ${PULL_ZONE:-Not detected}" >> "$REPORT_FILE"
echo "Cache Status: ${CACHE_STATUS:-Unknown}" >> "$REPORT_FILE"
echo "Test completed: $(date)" >> "$REPORT_FILE"

exit 0
