#!/bin/bash
# Schema.org Validation Script
# Validates all JSON-LD structured data files

set -e

echo "╔════════════════════════════════════════════╗"
echo "║  Schema.org Validation Test               ║"
echo "╚════════════════════════════════════════════╝"
echo ""

DOMAIN="${1:-https://www.ailydian.com}"
PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test JSON-LD validity
test_json_validity() {
    local file=$1
    local description=$2

    echo -n "Testing: $description... "

    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ FAIL${NC} (File not found)"
        ((FAILED++))
        return 1
    fi

    if jq empty "$file" 2>/dev/null; then
        echo -e "${GREEN}✓ PASS${NC} (Valid JSON)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Invalid JSON)"
        ((FAILED++))
        return 1
    fi
}

# Test schema type
test_schema_type() {
    local file=$1
    local expected_type=$2
    local description=$3

    echo -n "Testing: $description... "

    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ FAIL${NC} (File not found)"
        ((FAILED++))
        return 1
    fi

    actual_type=$(jq -r '."@type"' "$file" 2>/dev/null)

    if [ "$actual_type" = "$expected_type" ]; then
        echo -e "${GREEN}✓ PASS${NC} (@type: $actual_type)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_type, Got: $actual_type)"
        ((FAILED++))
        return 1
    fi
}

# Test required fields
test_required_fields() {
    local file=$1
    local field=$2
    local description=$3

    echo -n "Testing: $description... "

    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ FAIL${NC} (File not found)"
        ((FAILED++))
        return 1
    fi

    value=$(jq -r ".$field" "$file" 2>/dev/null)

    if [ "$value" != "null" ] && [ ! -z "$value" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Present)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Missing or null)"
        ((FAILED++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. JSON Syntax Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_json_validity "web/seo/organization.jsonld" "Organization schema JSON syntax"
test_json_validity "web/seo/faq.jsonld" "FAQ schema JSON syntax"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Schema Type Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_schema_type "web/seo/organization.jsonld" "Organization" "Organization @type"
test_schema_type "web/seo/faq.jsonld" "FAQPage" "FAQ @type"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Organization Schema Required Fields"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_required_fields "web/seo/organization.jsonld" "'@context'" "@context field"
test_required_fields "web/seo/organization.jsonld" "name" "name field"
test_required_fields "web/seo/organization.jsonld" "url" "url field"
test_required_fields "web/seo/organization.jsonld" "logo" "logo field"
test_required_fields "web/seo/organization.jsonld" "founder" "founder field"
test_required_fields "web/seo/organization.jsonld" "foundingDate" "foundingDate field"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. FAQ Schema Required Fields"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_required_fields "web/seo/faq.jsonld" "'@context'" "@context field"
test_required_fields "web/seo/faq.jsonld" "mainEntity" "mainEntity field"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Live Website Schema Detection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Testing: WebSite schema in homepage... "
if curl -s "$DOMAIN/" | grep -q '"@type":"WebSite"'; then
    echo -e "${GREEN}✓ PASS${NC} (Found)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Not found)"
    ((FAILED++))
fi

echo -n "Testing: SearchAction schema in homepage... "
if curl -s "$DOMAIN/" | grep -q '"@type":"SearchAction"'; then
    echo -e "${GREEN}✓ PASS${NC} (Found)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Not found)"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Google Rich Results Test (Manual)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${BLUE}ℹ INFO:${NC} To validate with Google:"
echo "  1. Go to: https://search.google.com/test/rich-results"
echo "  2. Enter URL: $DOMAIN/"
echo "  3. Check for Organization and WebSite schemas"
echo ""
echo "  Or test directly:"
echo -e "  ${YELLOW}https://search.google.com/test/rich-results?url=$DOMAIN/${NC}"

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  Validation Summary                        ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL SCHEMA VALIDATIONS PASSED          ║${NC}"
    echo -e "${GREEN}║  Schema.org Ready!                         ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ SOME VALIDATIONS FAILED                 ║${NC}"
    echo -e "${RED}║  Please review errors above                ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════╝${NC}"
    exit 1
fi
