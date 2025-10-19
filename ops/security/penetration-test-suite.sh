#!/bin/bash
# ═════════════════════════════════════════════════════════════════════════════
# AILYDIAN PENETRATION TESTING SUITE
# White-Hat Security Testing - Full Automated Suite
# ═════════════════════════════════════════════════════════════════════════════
# Usage: ./ops/security/penetration-test-suite.sh [TARGET_URL]
# Example: ./ops/security/penetration-test-suite.sh https://ailydian.com
# ═════════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_URL="${1:-http://localhost:3100}"
REPORT_DIR="./ops/security/reports"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="$REPORT_DIR/pentest-report-$TIMESTAMP.md"

# Create reports directory
mkdir -p "$REPORT_DIR"

# Functions
print_header() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  $1${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_failure() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Initialize report
cat > "$REPORT_FILE" <<EOF
# AILYDIAN PENETRATION TEST REPORT
**Date:** $(date)
**Target:** $TARGET_URL
**Tester:** Automated Script
**Policy:** White-Hat, Non-Destructive

---

## TEST RESULTS

EOF

# ═════════════════════════════════════════════════════════════════════════════
# TEST SUITE 1: AUTHENTICATION & AUTHORIZATION
# ═════════════════════════════════════════════════════════════════════════════

print_header "TEST SUITE 1: AUTHENTICATION & AUTHORIZATION"

echo "### 1. Authentication & Authorization" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Test 1.1: SQL Injection in Login
print_warning "Test 1.1: SQL Injection in Login"
SQL_INJECT=$(curl -s -X POST "$TARGET_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ailydian.com'"'"' OR '"'"'1'"'"'='"'"'1", "password": "test"}' \
  -w "\nHTTP_CODE:%{http_code}")

if echo "$SQL_INJECT" | grep -q "HTTP_CODE:400\|HTTP_CODE:401"; then
  print_success "SQL injection properly blocked"
  echo "- [x] SQL Injection in Login: BLOCKED ✅" >> "$REPORT_FILE"
else
  print_failure "SQL injection may be possible!"
  echo "- [ ] SQL Injection in Login: VULNERABLE ❌" >> "$REPORT_FILE"
fi

# Test 1.2: NoSQL Injection
print_warning "Test 1.2: NoSQL Injection"
NOSQL_INJECT=$(curl -s -X POST "$TARGET_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": {"$ne": null}, "password": {"$ne": null}}' \
  -w "\nHTTP_CODE:%{http_code}")

if echo "$NOSQL_INJECT" | grep -q "HTTP_CODE:400\|HTTP_CODE:401"; then
  print_success "NoSQL injection properly blocked"
  echo "- [x] NoSQL Injection: BLOCKED ✅" >> "$REPORT_FILE"
else
  print_failure "NoSQL injection may be possible!"
  echo "- [ ] NoSQL Injection: VULNERABLE ❌" >> "$REPORT_FILE"
fi

# Test 1.3: JWT Token Validation
print_warning "Test 1.3: Invalid JWT Token"
INVALID_JWT=$(curl -s -X GET "$TARGET_URL/api/session-info" \
  -H "Authorization: Bearer invalid.jwt.token" \
  -w "\nHTTP_CODE:%{http_code}")

if echo "$INVALID_JWT" | grep -q "HTTP_CODE:401"; then
  print_success "Invalid JWT properly rejected"
  echo "- [x] JWT Validation: WORKING ✅" >> "$REPORT_FILE"
else
  print_failure "Invalid JWT accepted!"
  echo "- [ ] JWT Validation: VULNERABLE ❌" >> "$REPORT_FILE"
fi

# Test 1.4: API Key Brute Force Protection
print_warning "Test 1.4: API Key Brute Force (10 attempts)"
BRUTE_FORCE_BLOCKED=false
for i in {1..10}; do
  RESPONSE=$(curl -s -X GET "$TARGET_URL/api/models" \
    -H "X-LyDian-API-Key: sk-ailydian-invalid-$i" \
    -w "\nHTTP_CODE:%{http_code}")

  if echo "$RESPONSE" | grep -q "HTTP_CODE:429"; then
    BRUTE_FORCE_BLOCKED=true
    break
  fi
done

if [ "$BRUTE_FORCE_BLOCKED" = true ]; then
  print_success "Brute force protection active"
  echo "- [x] API Key Brute Force Protection: ACTIVE ✅" >> "$REPORT_FILE"
else
  print_failure "No brute force protection detected!"
  echo "- [ ] API Key Brute Force Protection: MISSING ❌" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# ═════════════════════════════════════════════════════════════════════════════
# TEST SUITE 2: INJECTION ATTACKS
# ═════════════════════════════════════════════════════════════════════════════

print_header "TEST SUITE 2: INJECTION ATTACKS"

echo "### 2. Injection Attacks" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Test 2.1: XSS in Chat
print_warning "Test 2.1: XSS in Chat"
XSS_TEST=$(curl -s -X POST "$TARGET_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "<script>alert(1)</script>"}' \
  -w "\nHTTP_CODE:%{http_code}")

if echo "$XSS_TEST" | grep -q -v "<script>"; then
  print_success "XSS properly sanitized"
  echo "- [x] XSS Protection: ACTIVE ✅" >> "$REPORT_FILE"
else
  print_failure "XSS may be possible!"
  echo "- [ ] XSS Protection: VULNERABLE ❌" >> "$REPORT_FILE"
fi

# Test 2.2: Command Injection
print_warning "Test 2.2: Command Injection"
CMD_INJECT=$(curl -s -X POST "$TARGET_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "test; ls -la; whoami"}' \
  -w "\nHTTP_CODE:%{http_code}")

if ! echo "$CMD_INJECT" | grep -q "total \|root\|admin"; then
  print_success "Command injection properly blocked"
  echo "- [x] Command Injection Protection: ACTIVE ✅" >> "$REPORT_FILE"
else
  print_failure "Command injection may be possible!"
  echo "- [ ] Command Injection Protection: VULNERABLE ❌" >> "$REPORT_FILE"
fi

# Test 2.3: Path Traversal
print_warning "Test 2.3: Path Traversal"
PATH_TRAV=$(curl -s -X GET "$TARGET_URL/../../../../etc/passwd" \
  -w "\nHTTP_CODE:%{http_code}")

if echo "$PATH_TRAV" | grep -q "HTTP_CODE:404\|HTTP_CODE:400"; then
  print_success "Path traversal properly blocked"
  echo "- [x] Path Traversal Protection: ACTIVE ✅" >> "$REPORT_FILE"
else
  print_failure "Path traversal may be possible!"
  echo "- [ ] Path Traversal Protection: VULNERABLE ❌" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# ═════════════════════════════════════════════════════════════════════════════
# TEST SUITE 3: SECURITY HEADERS
# ═════════════════════════════════════════════════════════════════════════════

print_header "TEST SUITE 3: SECURITY HEADERS"

echo "### 3. Security Headers" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Get headers
HEADERS=$(curl -sI "$TARGET_URL" | tr -d '\r')

# Check headers
check_header() {
  local header=$1
  local name=$2

  if echo "$HEADERS" | grep -qi "$header:"; then
    print_success "$name present"
    echo "- [x] $name: PRESENT ✅" >> "$REPORT_FILE"
  else
    print_failure "$name MISSING!"
    echo "- [ ] $name: MISSING ❌" >> "$REPORT_FILE"
  fi
}

check_header "X-Frame-Options" "X-Frame-Options"
check_header "X-Content-Type-Options" "X-Content-Type-Options"
check_header "X-XSS-Protection" "X-XSS-Protection"
check_header "Strict-Transport-Security" "Strict-Transport-Security"
check_header "Content-Security-Policy" "Content-Security-Policy"
check_header "Referrer-Policy" "Referrer-Policy"

echo "" >> "$REPORT_FILE"

# ═════════════════════════════════════════════════════════════════════════════
# TEST SUITE 4: RATE LIMITING & DDOS
# ═════════════════════════════════════════════════════════════════════════════

print_header "TEST SUITE 4: RATE LIMITING & DDOS PROTECTION"

echo "### 4. Rate Limiting & DDoS Protection" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Test 4.1: Rate Limiting
print_warning "Test 4.1: Rate Limiting (150 requests)"
RATE_LIMITED=false
for i in {1..150}; do
  RESPONSE=$(curl -s -X GET "$TARGET_URL/api/health" \
    -w "\nHTTP_CODE:%{http_code}")

  if echo "$RESPONSE" | grep -q "HTTP_CODE:429"; then
    RATE_LIMITED=true
    print_success "Rate limiting triggered at request $i"
    echo "- [x] Rate Limiting: ACTIVE (triggered at $i requests) ✅" >> "$REPORT_FILE"
    break
  fi
done

if [ "$RATE_LIMITED" = false ]; then
  print_failure "No rate limiting detected after 150 requests!"
  echo "- [ ] Rate Limiting: NOT DETECTED ❌" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# ═════════════════════════════════════════════════════════════════════════════
# TEST SUITE 5: CSRF PROTECTION
# ═════════════════════════════════════════════════════════════════════════════

print_header "TEST SUITE 5: CSRF PROTECTION"

echo "### 5. CSRF Protection" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Test 5.1: CSRF Token Required
print_warning "Test 5.1: CSRF Token Required for POST"
CSRF_TEST=$(curl -s -X POST "$TARGET_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "password"}' \
  -w "\nHTTP_CODE:%{http_code}")

if echo "$CSRF_TEST" | grep -q "HTTP_CODE:403\|CSRF"; then
  print_success "CSRF protection active"
  echo "- [x] CSRF Protection: ACTIVE ✅" >> "$REPORT_FILE"
else
  print_warning "CSRF protection may be missing"
  echo "- [ ] CSRF Protection: UNCLEAR ⚠️" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# ═════════════════════════════════════════════════════════════════════════════
# TEST SUITE 6: PAYMENT SECURITY
# ═════════════════════════════════════════════════════════════════════════════

print_header "TEST SUITE 6: PAYMENT SECURITY"

echo "### 6. Payment Security" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Test 6.1: Price Manipulation
print_warning "Test 6.1: Price Manipulation Attempt"
PRICE_MANIP=$(curl -s -X POST "$TARGET_URL/api/payment/create" \
  -H "Content-Type: application/json" \
  -d '{"plan": "premium", "clientPrice": 0.01}' \
  -w "\nHTTP_CODE:%{http_code}")

if echo "$PRICE_MANIP" | grep -q "HTTP_CODE:400\|HTTP_CODE:401\|HTTP_CODE:403"; then
  print_success "Price manipulation properly blocked"
  echo "- [x] Price Manipulation Protection: ACTIVE ✅" >> "$REPORT_FILE"
else
  print_warning "Price manipulation check unclear"
  echo "- [ ] Price Manipulation Protection: UNCLEAR ⚠️" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# ═════════════════════════════════════════════════════════════════════════════
# FINAL REPORT
# ═════════════════════════════════════════════════════════════════════════════

print_header "PENETRATION TEST COMPLETE"

cat >> "$REPORT_FILE" <<EOF

---

## SUMMARY

**Test Target:** $TARGET_URL
**Test Duration:** $(date)
**Tests Performed:** 15+

## RECOMMENDATIONS

1. Review all failed tests immediately
2. Implement missing security controls
3. Regular security audits
4. Keep dependencies updated

## NEXT STEPS

1. Fix all CRITICAL vulnerabilities
2. Implement additional security layers
3. Set up continuous security monitoring
4. Conduct external security audit

---

**Report Generated:** $(date)
**Tool:** Ailydian Penetration Testing Suite (White-Hat)
EOF

print_success "Full report generated: $REPORT_FILE"

# Display summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Penetration Test Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📄 Full report: ${YELLOW}$REPORT_FILE${NC}"
echo ""
echo -e "${YELLOW}⚠️  Review the report for detailed findings${NC}"
echo ""
