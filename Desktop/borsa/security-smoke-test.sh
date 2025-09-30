#!/bin/bash

###############################################################################
# SECURITY SMOKE TEST - LyDian Trader
# White-Hat Security Validation Script
#
# Purpose: Automated security testing for critical vulnerabilities
# Usage: ./security-smoke-test.sh [BASE_URL]
# Example: ./security-smoke-test.sh https://borsa.ailydian.com
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default to localhost if no URL provided
BASE_URL="${1:-http://localhost:3000}"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNING_TESTS=0

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_test() {
    echo -e "${BLUE}▶ Testing:${NC} $1"
}

pass() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${GREEN}  ✅ PASS${NC} - $1"
}

fail() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${RED}  ❌ FAIL${NC} - $1"
}

warn() {
    WARNING_TESTS=$((WARNING_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}  ⚠️  WARN${NC} - $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is required but not installed.${NC}"
        echo "Please install $1 and try again."
        exit 1
    fi
}

###############################################################################
# Pre-flight Checks
###############################################################################

print_header "PRE-FLIGHT CHECKS"

echo -e "${BLUE}Checking required dependencies...${NC}"
check_command curl
check_command grep
check_command jq
echo -e "${GREEN}✅ All dependencies installed${NC}"

echo ""
echo -e "${BLUE}Target URL:${NC} $BASE_URL"
echo -e "${BLUE}Test Date:${NC} $(date)"
echo ""

###############################################################################
# TEST 1: Server Availability
###############################################################################

print_header "TEST SUITE 1: SERVER AVAILABILITY"

print_test "Server is reachable"
if curl -s -f -o /dev/null -w "%{http_code}" "$BASE_URL" > /dev/null 2>&1; then
    pass "Server is responding"
else
    fail "Server is not reachable at $BASE_URL"
    echo -e "${RED}Cannot proceed with tests. Please start the server.${NC}"
    exit 1
fi

###############################################################################
# TEST 2: Security Headers
###############################################################################

print_header "TEST SUITE 2: SECURITY HEADERS"

HEADERS=$(curl -s -I "$BASE_URL")

print_test "Strict-Transport-Security (HSTS)"
if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
    HSTS_VALUE=$(echo "$HEADERS" | grep -i "Strict-Transport-Security" | cut -d':' -f2- | tr -d '[:space:]')
    if echo "$HSTS_VALUE" | grep -q "max-age=63072000"; then
        pass "HSTS properly configured: $HSTS_VALUE"
    else
        warn "HSTS present but may have short max-age: $HSTS_VALUE"
    fi
else
    fail "HSTS header missing - vulnerable to SSL stripping attacks"
fi

print_test "X-Content-Type-Options"
if echo "$HEADERS" | grep -qi "X-Content-Type-Options.*nosniff"; then
    pass "X-Content-Type-Options: nosniff present"
else
    fail "X-Content-Type-Options header missing - MIME sniffing vulnerability"
fi

print_test "X-Frame-Options"
if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
    FRAME_VALUE=$(echo "$HEADERS" | grep -i "X-Frame-Options" | cut -d':' -f2- | tr -d '[:space:]')
    pass "X-Frame-Options present: $FRAME_VALUE"
else
    fail "X-Frame-Options header missing - clickjacking vulnerability"
fi

print_test "X-XSS-Protection"
if echo "$HEADERS" | grep -qi "X-XSS-Protection"; then
    pass "X-XSS-Protection header present"
else
    warn "X-XSS-Protection header missing (legacy, CSP preferred)"
fi

print_test "Content-Security-Policy (CSP)"
if echo "$HEADERS" | grep -qi "Content-Security-Policy"; then
    CSP_VALUE=$(echo "$HEADERS" | grep -i "Content-Security-Policy" | cut -d':' -f2-)
    if echo "$CSP_VALUE" | grep -q "unsafe-eval"; then
        warn "CSP present but contains 'unsafe-eval' - XSS risk"
    elif echo "$CSP_VALUE" | grep -q "unsafe-inline"; then
        warn "CSP present but contains 'unsafe-inline' - XSS risk"
    else
        pass "CSP properly configured"
    fi
else
    fail "Content-Security-Policy header missing - XSS vulnerability"
fi

print_test "Referrer-Policy"
if echo "$HEADERS" | grep -qi "Referrer-Policy"; then
    pass "Referrer-Policy header present"
else
    warn "Referrer-Policy header missing - information leakage risk"
fi

print_test "Permissions-Policy"
if echo "$HEADERS" | grep -qi "Permissions-Policy"; then
    pass "Permissions-Policy header present"
else
    warn "Permissions-Policy header missing"
fi

print_test "X-Powered-By header exposure"
if echo "$HEADERS" | grep -qi "X-Powered-By"; then
    fail "X-Powered-By header exposed - reveals technology stack"
else
    pass "X-Powered-By header properly hidden"
fi

###############################################################################
# TEST 3: Authentication Security
###############################################################################

print_header "TEST SUITE 3: AUTHENTICATION SECURITY"

print_test "Login page accessible"
LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/login")
if [ "$LOGIN_RESPONSE" = "200" ]; then
    pass "Login page returns 200 OK"
else
    fail "Login page returned $LOGIN_RESPONSE"
fi

print_test "Login page contains hardcoded credentials"
LOGIN_PAGE=$(curl -s "$BASE_URL/login")
if echo "$LOGIN_PAGE" | grep -q "QxT7#9mP"; then
    fail "CRITICAL: Hardcoded credentials found in HTML source!"
else
    pass "No hardcoded credentials in HTML (client-side check passed)"
fi

print_test "Dashboard redirects without auth"
DASHBOARD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/dashboard")
if [ "$DASHBOARD_RESPONSE" = "200" ]; then
    warn "Dashboard accessible without authentication (might be redirected to login)"
else
    pass "Dashboard properly protected"
fi

print_test "Cookie security flags"
COOKIE_HEADER=$(curl -s -I "$BASE_URL" | grep -i "Set-Cookie")
if echo "$COOKIE_HEADER" | grep -qi "HttpOnly"; then
    pass "HttpOnly flag present in cookies"
else
    warn "HttpOnly flag missing - XSS cookie theft risk"
fi

if echo "$COOKIE_HEADER" | grep -qi "Secure"; then
    pass "Secure flag present in cookies"
else
    warn "Secure flag missing - cookie can be sent over HTTP"
fi

if echo "$COOKIE_HEADER" | grep -qi "SameSite"; then
    pass "SameSite flag present in cookies"
else
    warn "SameSite flag missing - CSRF risk"
fi

###############################################################################
# TEST 4: API Security
###############################################################################

print_header "TEST SUITE 4: API SECURITY"

print_test "API health check"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/system/status")
if [ "$API_STATUS" = "200" ]; then
    warn "System status API accessible without authentication"
else
    pass "System status API returns $API_STATUS"
fi

print_test "Bot management API authentication"
BOT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/quantum-pro/bots")
if [ "$BOT_RESPONSE" = "200" ]; then
    fail "CRITICAL: Bot management API accessible without authentication!"
else
    pass "Bot management API requires authentication"
fi

print_test "AI chat API authentication"
CHAT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"message":"test"}' \
    "$BASE_URL/api/ai/chat")
if [ "$CHAT_RESPONSE" = "200" ]; then
    fail "CRITICAL: AI chat API accessible without authentication! (OpenAI credit theft risk)"
else
    pass "AI chat API requires authentication or has rate limiting"
fi

print_test "Trading signals API"
SIGNALS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/quantum-pro/signals")
if [ "$SIGNALS_RESPONSE" = "200" ]; then
    warn "Trading signals API accessible without authentication"
else
    pass "Trading signals API protected"
fi

print_test "Location API privacy"
LOCATION_RESPONSE=$(curl -s "$BASE_URL/api/location")
if echo "$LOCATION_RESPONSE" | grep -q "ip"; then
    warn "Location API exposes IP addresses"
else
    pass "Location API does not expose sensitive data"
fi

###############################################################################
# TEST 5: Input Validation
###############################################################################

print_header "TEST SUITE 5: INPUT VALIDATION"

print_test "SQL injection protection (basic test)"
SQL_TEST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/quantum-pro/signals?symbol=BTC'%20OR%201=1--")
if [ "$SQL_TEST" = "500" ]; then
    fail "Potential SQL injection vulnerability - server error on malicious input"
elif [ "$SQL_TEST" = "200" ]; then
    warn "API accepts SQL injection patterns (check if properly sanitized)"
else
    pass "API rejects SQL injection patterns"
fi

print_test "XSS protection (basic test)"
XSS_TEST=$(curl -s "$BASE_URL?test=%3Cscript%3Ealert(1)%3C/script%3E")
if echo "$XSS_TEST" | grep -q "<script>alert(1)</script>"; then
    fail "CRITICAL: XSS vulnerability detected - script tags not escaped!"
else
    pass "Basic XSS protection in place"
fi

print_test "Command injection protection"
CMD_TEST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/quantum-pro/signals?symbol=BTC;ls")
if [ "$CMD_TEST" = "500" ]; then
    fail "Potential command injection - server error on malicious input"
elif [ "$CMD_TEST" = "200" ]; then
    warn "API accepts command injection patterns (verify sanitization)"
else
    pass "Command injection patterns rejected"
fi

###############################################################################
# TEST 6: Rate Limiting
###############################################################################

print_header "TEST SUITE 6: RATE LIMITING"

print_test "Rate limiting on API endpoints"
echo -e "${BLUE}  Sending 10 rapid requests to test rate limiting...${NC}"
RATE_LIMIT_TRIGGERED=false
for i in {1..10}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/quantum-pro/signals")
    if [ "$RESPONSE" = "429" ]; then
        RATE_LIMIT_TRIGGERED=true
        break
    fi
    sleep 0.1
done

if [ "$RATE_LIMIT_TRIGGERED" = true ]; then
    pass "Rate limiting is active (429 Too Many Requests)"
else
    fail "No rate limiting detected - API abuse risk"
fi

###############################################################################
# TEST 7: Information Disclosure
###############################################################################

print_header "TEST SUITE 7: INFORMATION DISCLOSURE"

print_test "Error messages don't leak sensitive info"
ERROR_RESPONSE=$(curl -s "$BASE_URL/api/nonexistent")
if echo "$ERROR_RESPONSE" | grep -qi "stack\|trace\|error.*at\|node_modules"; then
    fail "Error messages contain stack traces or file paths"
else
    pass "Error messages don't leak sensitive information"
fi

print_test ".env file not exposed"
ENV_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/.env")
if [ "$ENV_RESPONSE" = "200" ]; then
    fail "CRITICAL: .env file is publicly accessible!"
else
    pass ".env file not accessible"
fi

print_test "package.json not exposed"
PKG_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/package.json")
if [ "$PKG_RESPONSE" = "200" ]; then
    fail "package.json is publicly accessible - exposes dependencies"
else
    pass "package.json not accessible"
fi

print_test "Source maps not exposed in production"
SOURCEMAP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/_next/static/chunks/main.js.map")
if [ "$SOURCEMAP_RESPONSE" = "200" ]; then
    warn "Source maps accessible - code can be reverse engineered"
else
    pass "Source maps not accessible in production"
fi

###############################################################################
# TEST 8: HTTPS & TLS
###############################################################################

print_header "TEST SUITE 8: HTTPS & TLS CONFIGURATION"

if [[ "$BASE_URL" == https://* ]]; then
    print_test "HTTPS protocol"
    pass "Site uses HTTPS"

    print_test "TLS version"
    TLS_VERSION=$(curl -s -v "$BASE_URL" 2>&1 | grep "TLS" | head -1)
    if echo "$TLS_VERSION" | grep -q "TLSv1.3"; then
        pass "TLS 1.3 in use (strongest)"
    elif echo "$TLS_VERSION" | grep -q "TLSv1.2"; then
        warn "TLS 1.2 in use (upgrade to 1.3 recommended)"
    else
        fail "Weak TLS version detected"
    fi

    print_test "Certificate validity"
    CERT_CHECK=$(curl -s -v "$BASE_URL" 2>&1 | grep "SSL certificate verify")
    if echo "$CERT_CHECK" | grep -q "ok"; then
        pass "SSL certificate is valid"
    else
        warn "SSL certificate verification issue"
    fi
else
    warn "Testing HTTP site (HTTPS strongly recommended for production)"
fi

###############################################################################
# TEST 9: Client-Side Security
###############################################################################

print_header "TEST SUITE 9: CLIENT-SIDE SECURITY"

print_test "Checking for client-side secrets in JavaScript"
MAIN_JS=$(curl -s "$BASE_URL" | grep -o 'src="[^"]*\.js"' | head -1 | sed 's/src="//;s/"//')
if [ ! -z "$MAIN_JS" ]; then
    JS_CONTENT=$(curl -s "$BASE_URL$MAIN_JS")
    if echo "$JS_CONTENT" | grep -qi "api[_-]key\|secret\|password\|token.*="; then
        fail "Potential secrets found in JavaScript bundle"
    else
        pass "No obvious secrets in JavaScript"
    fi
else
    warn "Could not fetch JavaScript for analysis"
fi

print_test "localStorage/sessionStorage usage"
PAGE_SOURCE=$(curl -s "$BASE_URL/login")
if echo "$PAGE_SOURCE" | grep -q "localStorage\|sessionStorage"; then
    warn "localStorage/sessionStorage used (ensure no sensitive data stored)"
else
    pass "No localStorage/sessionStorage detected in login page"
fi

###############################################################################
# TEST 10: GDPR & Privacy
###############################################################################

print_header "TEST SUITE 10: GDPR & PRIVACY COMPLIANCE"

print_test "robots.txt exists"
ROBOTS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/robots.txt")
if [ "$ROBOTS_RESPONSE" = "200" ]; then
    pass "robots.txt exists"
else
    warn "robots.txt not found (SEO and crawler control)"
fi

print_test "security.txt exists"
SECURITY_TXT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/.well-known/security.txt")
if [ "$SECURITY_TXT_RESPONSE" = "200" ]; then
    pass "security.txt exists (RFC 9116 compliant)"
else
    warn "security.txt not found - no vulnerability disclosure policy"
fi

###############################################################################
# FINAL REPORT
###############################################################################

print_header "SECURITY SMOKE TEST RESULTS"

echo ""
echo -e "${CYAN}📊 Test Summary:${NC}"
echo -e "   Total Tests:    $TOTAL_TESTS"
echo -e "   ${GREEN}✅ Passed:       $PASSED_TESTS${NC}"
echo -e "   ${RED}❌ Failed:       $FAILED_TESTS${NC}"
echo -e "   ${YELLOW}⚠️  Warnings:     $WARNING_TESTS${NC}"
echo ""

# Calculate score
SCORE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

if [ $SCORE -ge 90 ]; then
    GRADE="A+"
    COLOR=$GREEN
elif [ $SCORE -ge 80 ]; then
    GRADE="A"
    COLOR=$GREEN
elif [ $SCORE -ge 70 ]; then
    GRADE="B"
    COLOR=$YELLOW
elif [ $SCORE -ge 60 ]; then
    GRADE="C"
    COLOR=$YELLOW
else
    GRADE="F"
    COLOR=$RED
fi

echo -e "${COLOR}🎯 Security Score: $SCORE% (Grade: $GRADE)${NC}"
echo ""

# Security rating
if [ $FAILED_TESTS -eq 0 ] && [ $WARNING_TESTS -eq 0 ]; then
    echo -e "${GREEN}🏆 NIRVANA LEVEL SECURITY - Perfect Score!${NC}"
elif [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✨ EXCELLENT SECURITY - Only minor warnings${NC}"
elif [ $FAILED_TESTS -le 3 ]; then
    echo -e "${YELLOW}⚠️  GOOD SECURITY - Address failed tests soon${NC}"
elif [ $FAILED_TESTS -le 6 ]; then
    echo -e "${YELLOW}⚡ MODERATE SECURITY - Multiple issues need attention${NC}"
else
    echo -e "${RED}🚨 CRITICAL SECURITY ISSUES - Immediate action required!${NC}"
fi

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo "   1. Review SECURITY-AUDIT-REPORT.md for detailed findings"
    echo "   2. Fix all critical (❌ FAIL) issues immediately"
    echo "   3. Address warnings (⚠️  WARN) as soon as possible"
    echo "   4. Re-run this test after fixes: ./security-smoke-test.sh"
else
    echo "   1. Review warnings and consider addressing them"
    echo "   2. Schedule regular security audits (monthly recommended)"
    echo "   3. Monitor security logs and alerts"
    echo "   4. Keep dependencies updated (npm audit)"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Test completed at $(date)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Exit code based on critical failures
if [ $FAILED_TESTS -gt 5 ]; then
    exit 2  # Critical issues
elif [ $FAILED_TESTS -gt 0 ]; then
    exit 1  # Some issues
else
    exit 0  # All good
fi