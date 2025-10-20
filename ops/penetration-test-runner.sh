#!/bin/bash

# 🔐 WHITE-HAT PENETRATION TEST RUNNER
# Beyaz Şapkalı Güvenlik Testi - 0 Hata Hedefi

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🔐 BEYAZ ŞAPKALI PENETRASYONtest BAŞLIYOR"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing: $test_name ... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "📋 Phase 1: Page Load Tests"
echo "───────────────────────────────────────────────────────────────"

run_test "Landing page (/)" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ | grep -q 200"
run_test "Chat page (/chat.html)" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/chat.html | grep -q 200"
run_test "Auth page (/auth.html)" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/auth.html | grep -q 200"
run_test "API docs (/api.html)" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api.html | grep -q 200"

echo ""
echo "🔍 Phase 2: Critical Element Tests"
echo "───────────────────────────────────────────────────────────────"

run_test "Landing h1 exists" "curl -s http://localhost:3000/ | grep -q '<h1'"
run_test "Auth email input exists" "curl -s http://localhost:3000/auth.html | grep -q 'email-input'"
run_test "Chat messagesContainer exists" "curl -s http://localhost:3000/chat.html | grep -q 'messagesContainer'"
run_test "Chat sendMessage function exists" "curl -s http://localhost:3000/chat.html | grep -q 'sendMessage'"

echo ""
echo "🛡️ Phase 3: Security Tests"
echo "───────────────────────────────────────────────────────────────"

run_test "No AilydianSanitizer in chat" "! curl -s http://localhost:3000/chat.html | grep -q 'AilydianSanitizer'"
run_test "CSRF token exists" "curl -s http://localhost:3000/chat.html | grep -q 'csrf'"
run_test "Content-Type headers correct" "curl -sI http://localhost:3000/chat.html | grep -q 'text/html'"

echo ""
echo "⚡ Phase 4: API Endpoint Tests"
echo "───────────────────────────────────────────────────────────────"

run_test "Health endpoint" "curl -s http://localhost:3000/api/health.js | grep -q 'status'"
run_test "Chat API exists" "test -f public/api/chat.js"
run_test "Models API exists" "test -f public/api/models.js"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📊 TEST SONUÇLARI"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ TÜM TESTLER BAŞARILI - 0 HATA!${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED_TESTS TEST BAŞARISIZ${NC}"
    echo ""
    echo "Başarı oranı: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    exit 1
fi
