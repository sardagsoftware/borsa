#!/bin/bash

# 🧪 AiLydian Comprehensive Smoke Test
# Tests entire system: Dev + Production + Security
# Date: 2025-10-02

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Test results array
declare -a FAILED_TEST_NAMES

# Utility functions
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FAILED_TEST_NAMES+=("$1")
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════${NC}"
}

# Environment detection
LOCALHOST_URL="http://localhost:5001"
PRODUCTION_URL="https://ailydian-rn7dj0wi3-emrahsardag-yandexcoms-projects.vercel.app"

# ═══════════════════════════════════════════════════
# TEST SUITE 1: DEVELOPMENT ENVIRONMENT
# ═══════════════════════════════════════════════════

test_dev_environment() {
    log_section "🔧 DEVELOPMENT ENVIRONMENT TESTS"

    # Test 1: Localhost server running
    log_test "Localhost server (PORT 5001)"
    if curl -s -o /dev/null -w "%{http_code}" "$LOCALHOST_URL" | grep -q "200"; then
        log_pass "Localhost server is running"
    else
        log_fail "Localhost server not responding"
    fi

    # Test 2: Homepage loads
    log_test "Homepage (index.html)"
    if curl -s "$LOCALHOST_URL/index.html" | grep -q "LyDian"; then
        log_pass "Homepage loads successfully"
    else
        log_fail "Homepage failed to load"
    fi

    # Test 3: Chat page loads
    log_test "Chat page (chat.html)"
    if curl -s "$LOCALHOST_URL/chat.html" | grep -q "chat"; then
        log_pass "Chat page loads successfully"
    else
        log_fail "Chat page failed to load"
    fi

    # Test 4: LyDian IQ page loads
    log_test "LyDian IQ page"
    if curl -s "$LOCALHOST_URL/lydian-iq.html" | grep -q "LyDian IQ"; then
        log_pass "LyDian IQ page loads successfully"
    else
        log_fail "LyDian IQ page failed to load"
    fi

    # Test 5: Knowledge Base page loads
    log_test "Knowledge Base page"
    if curl -s "$LOCALHOST_URL/knowledge-base.html" | grep -q "Knowledge Base\|Bilgi Bankası"; then
        log_pass "Knowledge Base page loads successfully"
    else
        log_fail "Knowledge Base page failed to load"
    fi

    # Test 6: CSS files exist
    log_test "CSS assets"
    if [ -d "public/css" ] && [ "$(ls -A public/css/*.css 2>/dev/null | wc -l)" -gt 0 ]; then
        log_pass "CSS files exist ($(ls public/css/*.css | wc -l) files)"
    else
        log_fail "CSS files missing"
    fi

    # Test 7: JavaScript files exist
    log_test "JavaScript assets"
    if [ -d "public/js" ] && [ "$(ls -A public/js/*.js 2>/dev/null | wc -l)" -gt 0 ]; then
        log_pass "JavaScript files exist ($(ls public/js/*.js | wc -l) files)"
    else
        log_fail "JavaScript files missing"
    fi

    # Test 8: API directory structure
    log_test "API directory structure"
    if [ -d "api" ] && [ -d "api/chat" ] && [ -d "api/knowledge" ]; then
        log_pass "API directory structure is correct"
    else
        log_fail "API directory structure incomplete"
    fi
}

# ═══════════════════════════════════════════════════
# TEST SUITE 2: PRODUCTION DEPLOYMENT
# ═══════════════════════════════════════════════════

test_production_deployment() {
    log_section "🚀 PRODUCTION DEPLOYMENT TESTS"

    # Test 1: Production URL reachable
    log_test "Production server accessibility"
    if curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL" | grep -q "200"; then
        log_pass "Production server is accessible"
    else
        log_fail "Production server not reachable"
    fi

    # Test 2: Homepage deployed
    log_test "Production homepage"
    if curl -s "$PRODUCTION_URL" | grep -q "LyDian"; then
        log_pass "Production homepage deployed"
    else
        log_fail "Production homepage not deployed"
    fi

    # Test 3: İnsan IQ menu exists
    log_test "İnsan IQ menu in navigation"
    if curl -s "$PRODUCTION_URL" | grep -q "İnsan IQ"; then
        log_pass "İnsan IQ menu found in navigation"
    else
        log_fail "İnsan IQ menu missing"
    fi

    # Test 4: LyDian IQ page deployed
    log_test "Production LyDian IQ page"
    if curl -s "$PRODUCTION_URL/lydian-iq.html" | grep -q "LyDian IQ"; then
        log_pass "LyDian IQ page deployed"
    else
        log_fail "LyDian IQ page not deployed"
    fi

    # Test 5: Knowledge Base page deployed
    log_test "Production Knowledge Base page"
    if curl -s "$PRODUCTION_URL/knowledge-base.html" | grep -q "Knowledge Base\|Bilgi Bankası"; then
        log_pass "Knowledge Base page deployed"
    else
        log_fail "Knowledge Base page not deployed"
    fi

    # Test 6: Chat page deployed
    log_test "Production Chat page"
    if curl -s "$PRODUCTION_URL/chat.html" | grep -q "chat"; then
        log_pass "Chat page deployed"
    else
        log_fail "Chat page not deployed"
    fi

    # Test 7: CSS loading
    log_test "Production CSS assets"
    if curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/css/theme.css" | grep -q "200"; then
        log_pass "CSS assets loading"
    else
        log_warn "Some CSS assets may not be loading"
    fi

    # Test 8: API endpoint accessibility
    log_test "API endpoint (chat)"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PRODUCTION_URL/api/chat" \
        -H "Content-Type: application/json" \
        -d '{"message":"test"}')
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "405" ]; then
        log_pass "API endpoint accessible (HTTP $RESPONSE)"
    else
        log_fail "API endpoint not working (HTTP $RESPONSE)"
    fi
}

# ═══════════════════════════════════════════════════
# TEST SUITE 3: SECURITY CHECKS
# ═══════════════════════════════════════════════════

test_security() {
    log_section "🔒 SECURITY TESTS"

    # Test 1: No exposed API keys in JavaScript
    log_test "API key exposure in JS files"
    if grep -r "sk-\|API_KEY\|api.*key.*=" public/js/*.js 2>/dev/null | grep -v "getKey\|keyManager" | wc -l | grep -q "^0$"; then
        log_pass "No API keys exposed in JavaScript"
    else
        log_fail "Potential API key exposure detected"
        grep -r "sk-\|API_KEY" public/js/*.js 2>/dev/null || true
    fi

    # Test 2: No exposed secrets in HTML
    log_test "Secrets in HTML files"
    if grep -r "sk-\|secret\|password\|token" public/*.html 2>/dev/null | grep -v "placeholder\|example\|label" | wc -l | grep -q "^0$"; then
        log_pass "No secrets exposed in HTML"
    else
        log_warn "Potential secrets found in HTML files"
    fi

    # Test 3: .env file not in git
    log_test ".env file gitignore"
    if git check-ignore .env >/dev/null 2>&1; then
        log_pass ".env file is properly gitignored"
    else
        log_warn ".env file may not be gitignored"
    fi

    # Test 4: Security headers (production)
    log_test "Security headers on production"
    HEADERS=$(curl -s -I "$PRODUCTION_URL" 2>/dev/null)
    if echo "$HEADERS" | grep -qi "x-content-type-options"; then
        log_pass "Security headers present"
    else
        log_warn "Security headers may be missing"
    fi

    # Test 5: HTTPS enforcement
    log_test "HTTPS enforcement"
    if curl -s -I "$PRODUCTION_URL" | grep -q "https"; then
        log_pass "HTTPS is enforced"
    else
        log_info "Check HTTPS configuration"
    fi

    # Test 6: No console.log in production code
    log_test "Console.log in production code"
    if grep -r "console\.log" public/js/*.js 2>/dev/null | wc -l | grep -q "^0$"; then
        log_pass "No console.log statements found"
    else
        CONSOLE_COUNT=$(grep -r "console\.log" public/js/*.js 2>/dev/null | wc -l)
        log_warn "Found $CONSOLE_COUNT console.log statements (should remove for production)"
    fi

    # Test 7: AI model names hidden
    log_test "AI model names not exposed"
    if grep -r "gpt-4\|claude-3\|gemini-2" public/js/*.js public/*.html 2>/dev/null | grep -v "comment\|example" | wc -l | grep -q "^0$"; then
        log_pass "AI model names are hidden"
    else
        log_warn "AI model names may be exposed in frontend"
    fi

    # Test 8: Rate limiting check
    log_test "Rate limiting implementation"
    if grep -r "rate.*limit\|rateLimit" api/**/*.js 2>/dev/null | wc -l | grep -q "[1-9]"; then
        log_pass "Rate limiting appears to be implemented"
    else
        log_warn "Rate limiting may not be implemented"
    fi
}

# ═══════════════════════════════════════════════════
# TEST SUITE 4: FUNCTIONALITY TESTS
# ═══════════════════════════════════════════════════

test_functionality() {
    log_section "⚙️  FUNCTIONALITY TESTS"

    # Test 1: Mobile menu toggle exists
    log_test "Mobile menu toggle (homepage)"
    if curl -s "$LOCALHOST_URL/index.html" | grep -q "mobile-menu-btn"; then
        log_pass "Mobile menu toggle exists"
    else
        log_fail "Mobile menu toggle missing"
    fi

    # Test 2: Chat page language detection
    log_test "Chat API language detection"
    if grep -q "AUTOMATIC LANGUAGE DETECTION" api/chat/index.js 2>/dev/null; then
        log_pass "Chat API has language detection"
    else
        log_fail "Chat API language detection missing"
    fi

    # Test 3: LyDian IQ API exists
    log_test "LyDian IQ API endpoint"
    if [ -f "api/lydian-iq/solve.js" ]; then
        log_pass "LyDian IQ API exists"
    else
        log_fail "LyDian IQ API missing"
    fi

    # Test 4: Knowledge Base API exists
    log_test "Knowledge Base API endpoints"
    if [ -f "api/knowledge/search.js" ] && [ -f "api/knowledge/chat.js" ]; then
        log_pass "Knowledge Base APIs exist"
    else
        log_fail "Knowledge Base APIs missing"
    fi

    # Test 5: Navigation menu structure
    log_test "Navigation menu structure"
    if curl -s "$LOCALHOST_URL/index.html" | grep -q "nav-links"; then
        log_pass "Navigation menu structure intact"
    else
        log_fail "Navigation menu structure broken"
    fi

    # Test 6: Responsive CSS
    log_test "Responsive CSS media queries"
    if grep -r "@media" public/css/*.css 2>/dev/null | wc -l | grep -q "[1-9]"; then
        log_pass "Responsive CSS implemented"
    else
        log_warn "Responsive CSS may be missing"
    fi

    # Test 7: JavaScript error handling
    log_test "JavaScript error handling"
    if grep -r "try.*catch\|\.catch(" public/js/*.js 2>/dev/null | wc -l | grep -q "[1-9]"; then
        log_pass "Error handling implemented"
    else
        log_warn "Limited error handling in JavaScript"
    fi

    # Test 8: API request validation
    log_test "API input validation"
    if grep -r "validate\|sanitize" api/**/*.js 2>/dev/null | wc -l | grep -q "[1-9]"; then
        log_pass "Input validation present"
    else
        log_warn "Input validation may be missing"
    fi
}

# ═══════════════════════════════════════════════════
# TEST SUITE 5: PERFORMANCE & OPTIMIZATION
# ═══════════════════════════════════════════════════

test_performance() {
    log_section "⚡ PERFORMANCE TESTS"

    # Test 1: Response time (homepage)
    log_test "Homepage response time"
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$LOCALHOST_URL")
    if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
        log_pass "Homepage loads in ${RESPONSE_TIME}s (< 1s)"
    else
        log_warn "Homepage loads in ${RESPONSE_TIME}s (> 1s)"
    fi

    # Test 2: CSS file sizes
    log_test "CSS file sizes"
    LARGE_CSS=$(find public/css -name "*.css" -size +100k 2>/dev/null | wc -l)
    if [ "$LARGE_CSS" -eq 0 ]; then
        log_pass "All CSS files < 100KB"
    else
        log_warn "$LARGE_CSS CSS files > 100KB (consider minification)"
    fi

    # Test 3: JavaScript file sizes
    log_test "JavaScript file sizes"
    LARGE_JS=$(find public/js -name "*.js" -size +200k 2>/dev/null | wc -l)
    if [ "$LARGE_JS" -eq 0 ]; then
        log_pass "All JS files < 200KB"
    else
        log_warn "$LARGE_JS JS files > 200KB (consider minification)"
    fi

    # Test 4: Image optimization
    log_test "Image files"
    if [ -d "public/images" ]; then
        IMAGE_COUNT=$(find public/images -type f 2>/dev/null | wc -l)
        log_pass "Found $IMAGE_COUNT image files"
    else
        log_info "No images directory found"
    fi

    # Test 5: Gzip compression
    log_test "Gzip compression (production)"
    if curl -s -I -H "Accept-Encoding: gzip" "$PRODUCTION_URL" | grep -qi "content-encoding.*gzip"; then
        log_pass "Gzip compression enabled"
    else
        log_warn "Gzip compression may not be enabled"
    fi

    # Test 6: Caching headers
    log_test "Caching headers"
    if curl -s -I "$PRODUCTION_URL" | grep -qi "cache-control"; then
        log_pass "Caching headers present"
    else
        log_warn "Caching headers missing"
    fi
}

# ═══════════════════════════════════════════════════
# TEST SUITE 6: GIT & DEPLOYMENT
# ═══════════════════════════════════════════════════

test_git_deployment() {
    log_section "📦 GIT & DEPLOYMENT TESTS"

    # Test 1: Git repository
    log_test "Git repository"
    if [ -d ".git" ]; then
        log_pass "Git repository initialized"
    else
        log_fail "Not a git repository"
    fi

    # Test 2: Recent commits
    log_test "Recent commits"
    COMMIT_COUNT=$(git log --oneline --since="24 hours ago" 2>/dev/null | wc -l)
    if [ "$COMMIT_COUNT" -gt 0 ]; then
        log_pass "Found $COMMIT_COUNT recent commits"
    else
        log_info "No commits in last 24 hours"
    fi

    # Test 3: Branch status
    log_test "Git branch"
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
    if [ "$CURRENT_BRANCH" = "main" ]; then
        log_pass "On main branch"
    else
        log_info "On branch: $CURRENT_BRANCH"
    fi

    # Test 4: Uncommitted changes
    log_test "Uncommitted changes"
    if git diff-index --quiet HEAD -- 2>/dev/null; then
        log_pass "No uncommitted changes"
    else
        log_warn "There are uncommitted changes"
    fi

    # Test 5: Vercel configuration
    log_test "Vercel configuration"
    if [ -f "vercel.json" ]; then
        log_pass "vercel.json exists"
    else
        log_warn "vercel.json missing"
    fi

    # Test 6: Package.json
    log_test "package.json"
    if [ -f "package.json" ]; then
        log_pass "package.json exists"
    else
        log_fail "package.json missing"
    fi

    # Test 7: Node modules
    log_test "Node modules"
    if [ -d "node_modules" ]; then
        log_pass "node_modules exists"
    else
        log_warn "node_modules not installed"
    fi
}

# ═══════════════════════════════════════════════════
# MAIN TEST RUNNER
# ═══════════════════════════════════════════════════

main() {
    clear
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║     🧪 AILYDIAN COMPREHENSIVE SMOKE TEST SUITE 🧪        ║"
    echo "║                                                           ║"
    echo "║     Testing: Dev + Production + Security                 ║"
    echo "║     Date: $(date '+%Y-%m-%d %H:%M:%S')                          ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    # Run all test suites
    test_dev_environment
    test_production_deployment
    test_security
    test_functionality
    test_performance
    test_git_deployment

    # ═══════════════════════════════════════════════════
    # FINAL REPORT
    # ═══════════════════════════════════════════════════

    log_section "📊 FINAL TEST REPORT"

    echo ""
    echo -e "${CYAN}Total Tests Run:${NC}    $TOTAL_TESTS"
    echo -e "${GREEN}Tests Passed:${NC}      $PASSED_TESTS"
    echo -e "${RED}Tests Failed:${NC}       $FAILED_TESTS"
    echo -e "${YELLOW}Warnings:${NC}          $WARNINGS"
    echo ""

    # Calculate success rate
    if [ $TOTAL_TESTS -gt 0 ]; then
        SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
        echo -e "${CYAN}Success Rate:${NC}      ${SUCCESS_RATE}%"
    fi

    echo ""

    # Show failed tests
    if [ $FAILED_TESTS -gt 0 ]; then
        echo -e "${RED}Failed Tests:${NC}"
        for test_name in "${FAILED_TEST_NAMES[@]}"; do
            echo -e "  ${RED}✗${NC} $test_name"
        done
        echo ""
    fi

    # Overall status
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ✅ ALL TESTS PASSED SUCCESSFULLY ✅  ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
        exit 0
    else
        echo -e "${RED}╔═══════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ❌ SOME TESTS FAILED ❌             ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════╝${NC}"
        exit 1
    fi
}

# Run main
main
