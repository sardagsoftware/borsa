#!/bin/bash

# ========================================
# LyDian IQ Page - Comprehensive Smoke Test
# Version: 1.0.0 - Sardag Edition
# ========================================

echo "========================================"
echo "  LyDian IQ Page - Smoke Test"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_element() {
    local test_name=$1
    local command=$2

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $test_name"
        ((TESTS_FAILED++))
    fi
}

echo "1. Testing HTML File..."
test_element "HTML file exists" "[ -f /Users/sardag/Desktop/ailydian-ultra-pro/public/lydian-iq.html ]"
test_element "HTML contains LyDian IQ title" "grep -q 'LyDian IQ' /Users/sardag/Desktop/ailydian-ultra-pro/public/lydian-iq.html"
test_element "HTML contains brain SVG icon" "grep -q 'brain-icon' /Users/sardag/Desktop/ailydian-ultra-pro/public/lydian-iq.html"
test_element "No emoji in page title" "! grep '<title>' /Users/sardag/Desktop/ailydian-ultra-pro/public/lydian-iq.html | grep -q '🧠'"
test_element "HTML has modern navbar" "grep -q 'nav-container' /Users/sardag/Desktop/ailydian-ultra-pro/public/lydian-iq.html"
test_element "HTML has footer" "grep -q 'footer-deepseek' /Users/sardag/Desktop/ailydian-ultra-pro/public/lydian-iq.html"

echo ""
echo "2. Testing CSS File..."
test_element "CSS file exists" "[ -f /Users/sardag/Desktop/ailydian-ultra-pro/public/css/lydian-iq.css ]"
test_element "CSS has brain icon styles" "grep -q 'brain-icon' /Users/sardag/Desktop/ailydian-ultra-pro/public/css/lydian-iq.css"
test_element "CSS has button styles" "grep -q 'btn-primary' /Users/sardag/Desktop/ailydian-ultra-pro/public/css/lydian-iq.css"
test_element "CSS has footer grid" "grep -q 'footer-content' /Users/sardag/Desktop/ailydian-ultra-pro/public/css/lydian-iq.css"
test_element "CSS has responsive design" "grep -q '@media (max-width' /Users/sardag/Desktop/ailydian-ultra-pro/public/css/lydian-iq.css"
test_element "CSS uses system colors" "grep -q '#10A37F' /Users/sardag/Desktop/ailydian-ultra-pro/public/css/lydian-iq.css"

echo ""
echo "3. Testing JavaScript File..."
test_element "JS file exists" "[ -f /Users/sardag/Desktop/ailydian-ultra-pro/public/js/lydian-iq.js ]"
test_element "JS contains LyDian IQ references" "grep -q 'LyDian IQ' /Users/sardag/Desktop/ailydian-ultra-pro/public/js/lydian-iq.js"
test_element "JS has API endpoint" "grep -q 'lydian-iq' /Users/sardag/Desktop/ailydian-ultra-pro/public/js/lydian-iq.js"

echo ""
echo "4. Testing API File..."
test_element "API file exists" "[ -f /Users/sardag/Desktop/ailydian-ultra-pro/api/lydian-iq/solve.js ]"
test_element "API contains LyDian IQ branding" "grep -q 'LyDian IQ' /Users/sardag/Desktop/ailydian-ultra-pro/api/lydian-iq/solve.js"
test_element "API has domain capabilities" "grep -q 'DOMAIN_CAPABILITIES' /Users/sardag/Desktop/ailydian-ultra-pro/api/lydian-iq/solve.js"

echo ""
echo "5. Testing Page Components..."

# Check if server is running
if curl -s http://localhost:5001/lydian-iq.html > /dev/null; then
    echo -e "${GREEN}✓${NC} Server is running on port 5001"
    ((TESTS_PASSED++))

    # Test page load
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/lydian-iq.html)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓${NC} Page loads successfully (HTTP 200)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} Page load failed (HTTP $HTTP_CODE)"
        ((TESTS_FAILED++))
    fi

    # Test CSS loads
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/css/lydian-iq.css)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓${NC} CSS loads successfully"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} CSS load failed"
        ((TESTS_FAILED++))
    fi

    # Test JS loads
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/js/lydian-iq.js)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓${NC} JavaScript loads successfully"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} JavaScript load failed"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}✗${NC} Server not running on port 5001"
    ((TESTS_FAILED++))
fi

echo ""
echo "6. Testing Design Elements..."
test_element "Navbar has gradient logo" "grep -q 'linearGradient' /Users/sardag/Desktop/ailydian-ultra-pro/public/lydian-iq.html"
test_element "Hero has animated brain SVG" "grep -q 'animate attributeName' /Users/sardag/Desktop/ailydian-ultra-pro/public/lydian-iq.html"
test_element "Buttons have hover effects" "grep -q 'btn-primary::before' /Users/sardag/Desktop/ailydian-ultra-pro/public/css/lydian-iq.css"
test_element "Footer has proper grid layout" "grep -q '1.5fr 1fr 1fr 1fr' /Users/sardag/Desktop/ailydian-ultra-pro/public/css/lydian-iq.css"

echo ""
echo "7. Testing Capability Buttons..."
test_element "HTML has btn-capability class" "grep -q 'btn-capability' /Users/sardag/Desktop/ailydian-ultra-pro/public/lydian-iq.html"
test_element "CSS has btn-capability styles" "grep -q '.btn-capability' /Users/sardag/Desktop/ailydian-ultra-pro/public/css/lydian-iq.css"
test_element "Capability buttons have ripple effect" "grep -q 'btn-capability::before' /Users/sardag/Desktop/ailydian-ultra-pro/public/css/lydian-iq.css"
test_element "Capability buttons have icon animation" "grep -q 'btn-capability:hover i' /Users/sardag/Desktop/ailydian-ultra-pro/public/css/lydian-iq.css"
test_element "All 5 capability cards have buttons" "[ \$(grep -c 'btn-capability' /Users/sardag/Desktop/ailydian-ultra-pro/public/lydian-iq.html) -eq 5 ]"

echo ""
echo "========================================"
echo "  Test Results Summary"
echo "========================================"
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED tests"
echo -e "${RED}Failed:${NC} $TESTS_FAILED tests"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! (100%)${NC}"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed ($PASS_RATE% pass rate)${NC}"
    echo ""
    exit 1
fi
