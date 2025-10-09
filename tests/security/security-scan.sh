#!/bin/bash

##
# Security Testing Script
# White-Hat Policy: Defensive security testing only
#
# Tests:
# - Authentication bypass attempts
# - SQL injection attempts
# - XSS attempts
# - Rate limiting enforcement
# - CORS validation
# - Header security
##

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
VALID_API_KEY="${TEST_API_KEY:-}"
OUTPUT_DIR="./tests/security/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$OUTPUT_DIR/security-scan-$TIMESTAMP.md"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Initialize report
cat > "$REPORT_FILE" << EOF
# Security Scan Report
**Date:** $(date)
**Target:** $API_BASE_URL
**Policy:** White-Hat Defensive Testing

---

## Test Results

EOF

echo -e "${GREEN}=== LyDian Platform Security Scan ===${NC}"
echo "Target: $API_BASE_URL"
echo "Report: $REPORT_FILE"
echo ""

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

##
# Helper function to run test
##
run_test() {
  local test_name="$1"
  local expected_status="$2"
  local curl_command="$3"

  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -n "Testing: $test_name ... "

  # Run curl command and capture status
  actual_status=$(eval "$curl_command" 2>/dev/null | head -n1)

  if [ "$actual_status" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "- ✅ **$test_name**: PASS (Status: $actual_status)" >> "$REPORT_FILE"
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $actual_status)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "- ❌ **$test_name**: FAIL (Expected: $expected_status, Got: $actual_status)" >> "$REPORT_FILE"
    return 1
  fi
}

echo ""
echo "### 1. Authentication Tests" >> "$REPORT_FILE"
echo ""
echo -e "${YELLOW}=== 1. Authentication Tests ===${NC}"

# Test 1.1: Missing API key should return 401
run_test "Missing API key" "401" \
  "curl -s -o /dev/null -w '%{http_code}' -X GET '$API_BASE_URL/api/v1/smart-cities/cities'"

# Test 1.2: Invalid API key should return 401
run_test "Invalid API key" "401" \
  "curl -s -o /dev/null -w '%{http_code}' -X GET '$API_BASE_URL/api/v1/smart-cities/cities' -H 'X-API-Key: lyd_invalid_key_12345'"

# Test 1.3: SQL injection in API key should return 401 (not 500)
run_test "SQL injection in API key" "401" \
  "curl -s -o /dev/null -w '%{http_code}' -X GET '$API_BASE_URL/api/v1/smart-cities/cities' -H \"X-API-Key: lyd_' OR '1'='1\""

# Test 1.4: Valid API key should return 200
if [ -n "$VALID_API_KEY" ]; then
  run_test "Valid API key" "200" \
    "curl -s -o /dev/null -w '%{http_code}' -X GET '$API_BASE_URL/api/v1/smart-cities/cities' -H 'X-API-Key: $VALID_API_KEY'"
fi

echo ""
echo "### 2. Input Validation Tests" >> "$REPORT_FILE"
echo ""
echo -e "${YELLOW}=== 2. Input Validation Tests ===${NC}"

# Test 2.1: SQL injection in query parameter
run_test "SQL injection in query param" "400" \
  "curl -s -o /dev/null -w '%{http_code}' -X GET '$API_BASE_URL/api/v1/smart-cities/cities?limit=10; DROP TABLE cities;--' -H 'X-API-Key: $VALID_API_KEY'"

# Test 2.2: XSS in query parameter
run_test "XSS in query parameter" "400" \
  "curl -s -o /dev/null -w '%{http_code}' -X GET '$API_BASE_URL/api/v1/smart-cities/cities?name=<script>alert(1)</script>' -H 'X-API-Key: $VALID_API_KEY'"

# Test 2.3: Invalid JSON body
run_test "Invalid JSON body" "400" \
  "curl -s -o /dev/null -w '%{http_code}' -X POST '$API_BASE_URL/api/v1/smart-cities/cities' -H 'Content-Type: application/json' -H 'X-API-Key: $VALID_API_KEY' -d 'invalid json'"

# Test 2.4: SQL injection in JSON body
run_test "SQL injection in JSON body" "400" \
  "curl -s -o /dev/null -w '%{http_code}' -X POST '$API_BASE_URL/api/v1/smart-cities/cities' -H 'Content-Type: application/json' -H 'X-API-Key: $VALID_API_KEY' -d '{\"name\": \"'; DROP TABLE cities;--\"}'"

echo ""
echo "### 3. Rate Limiting Tests" >> "$REPORT_FILE"
echo ""
echo -e "${YELLOW}=== 3. Rate Limiting Tests ===${NC}"

# Test 3.1: Check rate limit headers are present
echo -n "Testing: Rate limit headers present ... "
HEADERS=$(curl -s -I -X GET "$API_BASE_URL/api/v1/smart-cities/cities" -H "X-API-Key: $VALID_API_KEY" 2>/dev/null)
if echo "$HEADERS" | grep -qi "X-RateLimit-Limit" && echo "$HEADERS" | grep -qi "X-RateLimit-Remaining"; then
  echo -e "${GREEN}✓ PASS${NC}"
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo "- ✅ **Rate limit headers present**: PASS" >> "$REPORT_FILE"
else
  echo -e "${RED}✗ FAIL${NC}"
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo "- ❌ **Rate limit headers present**: FAIL" >> "$REPORT_FILE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "### 4. Security Headers Tests" >> "$REPORT_FILE"
echo ""
echo -e "${YELLOW}=== 4. Security Headers Tests ===${NC}"

# Test 4.1: Check for X-Content-Type-Options
echo -n "Testing: X-Content-Type-Options header ... "
if echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
  echo -e "${GREEN}✓ PASS${NC}"
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo "- ✅ **X-Content-Type-Options header**: PASS" >> "$REPORT_FILE"
else
  echo -e "${YELLOW}⚠ WARN${NC}"
  echo "- ⚠️ **X-Content-Type-Options header**: WARN (Recommended)" >> "$REPORT_FILE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 4.2: Check for X-Frame-Options
echo -n "Testing: X-Frame-Options header ... "
if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
  echo -e "${GREEN}✓ PASS${NC}"
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo "- ✅ **X-Frame-Options header**: PASS" >> "$REPORT_FILE"
else
  echo -e "${YELLOW}⚠ WARN${NC}"
  echo "- ⚠️ **X-Frame-Options header**: WARN (Recommended)" >> "$REPORT_FILE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "### 5. CORS Tests" >> "$REPORT_FILE"
echo ""
echo -e "${YELLOW}=== 5. CORS Tests ===${NC}"

# Test 5.1: OPTIONS request should return 200
run_test "OPTIONS preflight request" "200" \
  "curl -s -o /dev/null -w '%{http_code}' -X OPTIONS '$API_BASE_URL/api/v1/smart-cities/cities' -H 'Origin: https://example.com'"

# Test 5.2: Check CORS headers
echo -n "Testing: CORS headers present ... "
CORS_HEADERS=$(curl -s -I -X OPTIONS "$API_BASE_URL/api/v1/smart-cities/cities" -H "Origin: https://example.com" 2>/dev/null)
if echo "$CORS_HEADERS" | grep -qi "Access-Control-Allow-Origin"; then
  echo -e "${GREEN}✓ PASS${NC}"
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo "- ✅ **CORS headers present**: PASS" >> "$REPORT_FILE"
else
  echo -e "${RED}✗ FAIL${NC}"
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo "- ❌ **CORS headers present**: FAIL" >> "$REPORT_FILE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "### 6. Error Handling Tests" >> "$REPORT_FILE"
echo ""
echo -e "${YELLOW}=== 6. Error Handling Tests ===${NC}"

# Test 6.1: 404 for non-existent endpoint
run_test "Non-existent endpoint returns 404" "404" \
  "curl -s -o /dev/null -w '%{http_code}' -X GET '$API_BASE_URL/api/v1/nonexistent' -H 'X-API-Key: $VALID_API_KEY'"

# Test 6.2: 405 for wrong HTTP method
run_test "Wrong HTTP method returns 405" "405" \
  "curl -s -o /dev/null -w '%{http_code}' -X DELETE '$API_BASE_URL/api/v1/smart-cities/cities' -H 'X-API-Key: $VALID_API_KEY'"

echo ""
echo "### 7. Idempotency Tests" >> "$REPORT_FILE"
echo ""
echo -e "${YELLOW}=== 7. Idempotency Tests ===${NC}"

# Test 7.1: Duplicate idempotency key should return 409
IDEMPOTENCY_KEY="test_$(date +%s)"
curl -s -o /dev/null -X POST "$API_BASE_URL/api/v1/smart-cities/cities" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $VALID_API_KEY" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{"name":"Test City","coordinates":{"latitude":0,"longitude":0},"population":1000,"timezone":"UTC"}' 2>/dev/null

run_test "Duplicate idempotency key" "409" \
  "curl -s -o /dev/null -w '%{http_code}' -X POST '$API_BASE_URL/api/v1/smart-cities/cities' -H 'Content-Type: application/json' -H 'X-API-Key: $VALID_API_KEY' -H 'Idempotency-Key: $IDEMPOTENCY_KEY' -d '{\"name\":\"Test City\",\"coordinates\":{\"latitude\":0,\"longitude\":0},\"population\":1000,\"timezone\":\"UTC\"}'"

# Summary
echo ""
echo ""
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **Total Tests:** $TOTAL_TESTS" >> "$REPORT_FILE"
echo "- **Passed:** $PASSED_TESTS" >> "$REPORT_FILE"
echo "- **Failed:** $FAILED_TESTS" >> "$REPORT_FILE"
echo "- **Success Rate:** $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ $FAILED_TESTS -eq 0 ]; then
  echo "**Status:** ✅ **ALL TESTS PASSED**" >> "$REPORT_FILE"
else
  echo "**Status:** ❌ **SOME TESTS FAILED**" >> "$REPORT_FILE"
fi

echo -e "${GREEN}=== Security Scan Complete ===${NC}"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo ""
echo "Report saved to: $REPORT_FILE"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ All security tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some security tests failed. Review the report.${NC}"
  exit 1
fi
