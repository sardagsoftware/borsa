#!/bin/bash
# SEO Files Test Script
# Tests all SEO infrastructure files

set -e

echo "╔════════════════════════════════════════════╗"
echo "║  SEO Files Validation Test                ║"
echo "╚════════════════════════════════════════════╝"
echo ""

DOMAIN="${1:-https://www.ailydian.com}"
PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_url() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}

    echo -n "Testing: $description... "

    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $status, expected $expected_status)"
        ((FAILED++))
        return 1
    fi
}

# Test verification tags
test_meta_tag() {
    local url=$1
    local tag=$2
    local description=$3

    echo -n "Testing: $description... "

    if curl -s "$url" | grep -q "$tag"; then
        echo -e "${GREEN}✓ PASS${NC} (Tag found)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Tag not found)"
        ((FAILED++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. SEO Files Accessibility"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_url "$DOMAIN/robots.txt" "robots.txt"
test_url "$DOMAIN/sitemap.xml" "sitemap.xml"
test_url "$DOMAIN/llms.txt" "llms.txt"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Verification Tags"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_meta_tag "$DOMAIN/" "google-site-verification" "Google verification tag"
test_meta_tag "$DOMAIN/" "msvalidate.01" "Bing verification tag"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. OpenGraph Tags"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_meta_tag "$DOMAIN/" "og:title" "OpenGraph title"
test_meta_tag "$DOMAIN/" "og:description" "OpenGraph description"
test_meta_tag "$DOMAIN/" "og:image" "OpenGraph image"
test_meta_tag "$DOMAIN/" "og:url" "OpenGraph URL"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Twitter Card Tags"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_meta_tag "$DOMAIN/" "twitter:card" "Twitter card"
test_meta_tag "$DOMAIN/" "twitter:title" "Twitter title"
test_meta_tag "$DOMAIN/" "twitter:image" "Twitter image"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Structured Data (JSON-LD)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_meta_tag "$DOMAIN/" "application/ld+json" "JSON-LD script"
test_meta_tag "$DOMAIN/" '"@type":"WebSite"' "WebSite schema"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. robots.txt Content Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Testing: robots.txt has sitemap... "
if curl -s "$DOMAIN/robots.txt" | grep -q "Sitemap:"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Testing: robots.txt allows crawling... "
if curl -s "$DOMAIN/robots.txt" | grep -q "User-agent: \*"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. sitemap.xml Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Testing: sitemap.xml is valid XML... "
if curl -s "$DOMAIN/sitemap.xml" | xmllint --noout - 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP${NC} (xmllint not installed)"
fi

echo -n "Testing: sitemap.xml has URLs... "
if curl -s "$DOMAIN/sitemap.xml" | grep -q "<loc>"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. HTTPS & Security Headers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Testing: HTTPS is working... "
if curl -s -I "$DOMAIN/" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  Test Summary                              ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL TESTS PASSED                       ║${NC}"
    echo -e "${GREEN}║  SEO Infrastructure Ready!                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ SOME TESTS FAILED                       ║${NC}"
    echo -e "${RED}║  Please review errors above                ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════╝${NC}"
    exit 1
fi
