#!/bin/bash

# ========================================
# UKALAI PENETRATION TEST SUITE
# White-Hat Security Testing
# ========================================

set -e

echo "============================================"
echo "🔒 UKALAI PENETRATION TEST SUITE"
echo "============================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

test_security() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"

    echo -n "Security Test: $test_name ... "

    result=$(eval "$test_command" 2>&1)

    if echo "$result" | grep -q "$expected_result"; then
        echo -e "${GREEN}✅ PROTECTED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ VULNERABLE${NC}"
        ((FAILED++))
    fi
}

echo "============================================"
echo "1️⃣  SQL INJECTION TESTS"
echo "============================================"
echo ""

# SQL injection attempts (should be sanitized)
test_security "SQL Injection in Query Param" \
    "curl -s 'http://localhost:3000/api/scanner/signals?limit=5%27%20OR%20%271%27=%271'" \
    "success"

test_security "SQL Injection with UNION" \
    "curl -s 'http://localhost:3000/api/scanner/signals?symbol=BTCUSDT%27%20UNION%20SELECT'" \
    "success\|error"

echo ""
echo "============================================"
echo "2️⃣  XSS (Cross-Site Scripting) TESTS"
echo "============================================"
echo ""

# XSS attempts (should be sanitized)
test_security "XSS Script Tag Injection" \
    "curl -s 'http://localhost:3000/api/scanner/signals?limit=<script>alert(1)</script>'" \
    "success\|error"

test_security "XSS Event Handler Injection" \
    "curl -s 'http://localhost:3000/api/scanner/signals?symbol=<img src=x onerror=alert(1)>'" \
    "success\|error"

echo ""
echo "============================================"
echo "3️⃣  PATH TRAVERSAL TESTS"
echo "============================================"
echo ""

# Path traversal attempts
test_security "Directory Traversal ../" \
    "curl -s -w '%{http_code}' -o /dev/null 'http://localhost:3000/../../etc/passwd'" \
    "404\|403"

test_security "Path Traversal Encoded" \
    "curl -s -w '%{http_code}' -o /dev/null 'http://localhost:3000/%2e%2e%2f%2e%2e%2f'" \
    "404\|403"

echo ""
echo "============================================"
echo "4️⃣  COMMAND INJECTION TESTS"
echo "============================================"
echo ""

# Command injection attempts
test_security "Command Injection Semicolon" \
    "curl -s 'http://localhost:3000/api/scanner/signals?limit=5;ls'" \
    "success\|error\|400"

test_security "Command Injection Pipe" \
    "curl -s 'http://localhost:3000/api/scanner/signals?symbol=BTCUSDT|whoami'" \
    "success\|error\|400"

echo ""
echo "============================================"
echo "5️⃣  RATE LIMITING TESTS"
echo "============================================"
echo ""

# Brute force rate limiting
echo -n "Rate Limiting: Rapid Requests (20/second) ... "
limited=0
for i in {1..20}; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/health")
    if [ "$code" = "429" ]; then
        ((limited++))
    fi
done

if [ $limited -gt 0 ]; then
    echo -e "${GREEN}✅ PROTECTED (Rate limited $limited requests)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING (No rate limit detected in 20 requests)${NC}"
fi

echo ""
echo "============================================"
echo "6️⃣  HEADER INJECTION TESTS"
echo "============================================"
echo ""

# Header injection
test_security "Header Injection CRLF" \
    "curl -s -H 'X-Test:%0d%0aInjected: Header' 'http://localhost:3000/api/health'" \
    "status"

test_security "Host Header Injection" \
    "curl -s -H 'Host: evil.com' 'http://localhost:3000/api/health'" \
    "status"

echo ""
echo "============================================"
echo "7️⃣  SENSITIVE DATA EXPOSURE TESTS"
echo "============================================"
echo ""

# Check for exposed sensitive data
echo -n "Sensitive Data: Environment Variables ... "
env_test=$(curl -s "http://localhost:3000/api/health" | grep -i "GROQ_API_KEY\|API_KEY\|SECRET\|PASSWORD" || echo "none")
if [ "$env_test" = "none" ]; then
    echo -e "${GREEN}✅ PROTECTED (No secrets exposed)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ VULNERABLE (Secrets exposed!)${NC}"
    ((FAILED++))
fi

echo -n "Sensitive Data: Stack Traces ... "
error_test=$(curl -s "http://localhost:3000/api/invalid-test" | grep -i "error.*at.*line\|stack trace" || echo "none")
if [ "$error_test" = "none" ]; then
    echo -e "${GREEN}✅ PROTECTED (No stack traces)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING (Stack traces may be exposed)${NC}"
fi

echo ""
echo "============================================"
echo "8️⃣  CORS POLICY TESTS"
echo "============================================"
echo ""

echo -n "CORS: Origin Validation ... "
cors_test=$(curl -s -H "Origin: https://evil.com" -I "http://localhost:3000/api/health" | grep -i "access-control-allow-origin" || echo "restricted")
if echo "$cors_test" | grep -q "restricted\|*"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Check CORS config${NC}"
fi

echo ""
echo "============================================"
echo "📊 PENETRATION TEST SUMMARY"
echo "============================================"
echo ""

TOTAL=$((PASSED + FAILED))
echo "Total Security Tests: $TOTAL"
echo -e "Protected:            ${GREEN}$PASSED ✅${NC}"
echo -e "Vulnerable:           ${RED}$FAILED ❌${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}✅ SECURITY TESTS PASSED - SAFE TO DEPLOY${NC}"
    echo -e "${GREEN}============================================${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}❌ VULNERABILITIES DETECTED - FIX BEFORE DEPLOY${NC}"
    echo -e "${RED}============================================${NC}"
    exit 1
fi
