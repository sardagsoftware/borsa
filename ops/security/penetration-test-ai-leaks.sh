#!/bin/bash

#===============================================================================
# LYDIAN ULTRA PRO - AI PROVIDER LEAK PENETRATION TEST
#===============================================================================
# Purpose: White-hat penetration testing to detect AI provider name exposure
# Security Level: MAXIMUM
# Compliance: OWASP, NIST, CIS
#===============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Report file
REPORT_FILE="ops/reports/ai-leak-penetration-test-$(date +%Y%m%d-%H%M%S).json"
SUMMARY_FILE="ops/reports/ai-leak-penetration-summary-$(date +%Y%m%d-%H%M%S).md"

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0
LOW_ISSUES=0

# Target URL (change for production)
TARGET_URL="${TARGET_URL:-http://localhost:3000}"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   LYDIAN AI PROVIDER LEAK PENETRATION TEST${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Target:${NC} $TARGET_URL"
echo -e "${YELLOW}Start Time:${NC} $(date)"
echo ""

# Create reports directory
mkdir -p ops/reports

#===============================================================================
# TEST 1: HTTP Response Header Analysis
#===============================================================================
echo -e "${MAGENTA}[TEST 1/12]${NC} Checking HTTP Response Headers..."
TOTAL_TESTS=$((TOTAL_TESTS+1))

# Check main page headers
HEADERS=$(curl -sI "$TARGET_URL" 2>/dev/null || echo "")

if echo "$HEADERS" | grep -iq "anthropic\|claude\|openai\|gpt-\|perplexity\|gemini"; then
    echo -e "${RED}✗ CRITICAL: AI provider names found in headers${NC}"
    echo "$HEADERS" | grep -i "anthropic\|claude\|openai\|gpt-\|perplexity\|gemini"
    FAILED_TESTS=$((FAILED_TESTS+1))
    CRITICAL_ISSUES=$((CRITICAL_ISSUES+1))
else
    echo -e "${GREEN}✓ PASS: No AI provider names in headers${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
fi

#===============================================================================
# TEST 2: API Endpoint Response Analysis
#===============================================================================
echo -e "${MAGENTA}[TEST 2/12]${NC} Testing API endpoints for provider leaks..."
TOTAL_TESTS=$((TOTAL_TESTS+1))

# Test chat endpoint
API_RESPONSE=$(curl -s -X POST "$TARGET_URL/api/chat-claude" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","model":"strategic-reasoning"}' 2>/dev/null || echo "")

if echo "$API_RESPONSE" | grep -iq "anthropic\|claude-3\|openai\|gpt-4\|perplexity"; then
    echo -e "${RED}✗ HIGH: AI provider names found in API response${NC}"
    echo "$API_RESPONSE" | grep -io "anthropic\|claude-3[^ ]*\|openai\|gpt-4[^ ]*\|perplexity" | head -5
    FAILED_TESTS=$((FAILED_TESTS+1))
    HIGH_ISSUES=$((HIGH_ISSUES+1))
else
    echo -e "${GREEN}✓ PASS: API responses are obfuscated${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
fi

#===============================================================================
# TEST 3: Error Message Analysis
#===============================================================================
echo -e "${MAGENTA}[TEST 3/12]${NC} Testing error message sanitization..."
TOTAL_TESTS=$((TOTAL_TESTS+1))

# Force an error by sending invalid request
ERROR_RESPONSE=$(curl -s -X POST "$TARGET_URL/api/chat-claude" \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}' 2>/dev/null || echo "")

if echo "$ERROR_RESPONSE" | grep -iq "anthropic api\|claude api\|openai api\|gpt api"; then
    echo -e "${RED}✗ HIGH: Provider names in error messages${NC}"
    echo "$ERROR_RESPONSE" | grep -io "[a-z]* api" | head -3
    FAILED_TESTS=$((FAILED_TESTS+1))
    HIGH_ISSUES=$((HIGH_ISSUES+1))
else
    echo -e "${GREEN}✓ PASS: Error messages are sanitized${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
fi

#===============================================================================
# TEST 4: JavaScript Source Code Exposure
#===============================================================================
echo -e "${MAGENTA}[TEST 4/12]${NC} Scanning JavaScript files for hardcoded names..."
TOTAL_TESTS=$((TOTAL_TESTS+1))

# Check public JS files
JS_LEAKS=$(grep -r -i "anthropic\|claude-3\|openai\|gpt-4\|perplexity" \
  public/js/*.js 2>/dev/null | wc -l | tr -d ' ')

if [ "$JS_LEAKS" -gt 0 ]; then
    echo -e "${RED}✗ CRITICAL: $JS_LEAKS AI provider references in public JS${NC}"
    FAILED_TESTS=$((FAILED_TESTS+1))
    CRITICAL_ISSUES=$((CRITICAL_ISSUES+1))
else
    echo -e "${GREEN}✓ PASS: No provider names in public JavaScript${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
fi

#===============================================================================
# TEST 5: HTML Meta Tags Analysis
#===============================================================================
echo -e "${MAGENTA}[TEST 5/12]${NC} Checking HTML meta tags..."
TOTAL_TESTS=$((TOTAL_TESTS+1))

# Fetch homepage and check meta tags
HTML_CONTENT=$(curl -s "$TARGET_URL" 2>/dev/null || echo "")

if echo "$HTML_CONTENT" | grep -iq "<meta.*claude\|<meta.*anthropic\|<meta.*openai\|<meta.*gpt"; then
    echo -e "${RED}✗ MEDIUM: AI provider names in meta tags${NC}"
    FAILED_TESTS=$((FAILED_TESTS+1))
    MEDIUM_ISSUES=$((MEDIUM_ISSUES+1))
else
    echo -e "${GREEN}✓ PASS: Meta tags are clean${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
fi

#===============================================================================
# TEST 6: robots.txt and sitemap.xml
#===============================================================================
echo -e "${MAGENTA}[TEST 6/12]${NC} Checking robots.txt and sitemap.xml..."
TOTAL_TESTS=$((TOTAL_TESTS+1))

ROBOTS=$(curl -s "$TARGET_URL/robots.txt" 2>/dev/null || echo "")
SITEMAP=$(curl -s "$TARGET_URL/sitemap.xml" 2>/dev/null || echo "")

if echo "$ROBOTS$SITEMAP" | grep -iq "claude\|anthropic\|openai\|gpt"; then
    echo -e "${RED}✗ LOW: Provider names in SEO files${NC}"
    FAILED_TESTS=$((FAILED_TESTS+1))
    LOW_ISSUES=$((LOW_ISSUES+1))
else
    echo -e "${GREEN}✓ PASS: SEO files are clean${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
fi

#===============================================================================
# TEST 7: Environment Variable Exposure
#===============================================================================
echo -e "${MAGENTA}[TEST 7/12]${NC} Checking for environment variable leaks..."
TOTAL_TESTS=$((TOTAL_TESTS+1))

# Test if env vars are exposed via common endpoints
ENV_LEAK=$(curl -s "$TARGET_URL/.env" "$TARGET_URL/api/env" "$TARGET_URL/config" 2>/dev/null || echo "")

if echo "$ENV_LEAK" | grep -iq "ANTHROPIC_API_KEY\|OPENAI_API_KEY\|api.*key"; then
    echo -e "${RED}✗ CRITICAL: Environment variables exposed${NC}"
    FAILED_TESTS=$((FAILED_TESTS+1))
    CRITICAL_ISSUES=$((CRITICAL_ISSUES+1))
else
    echo -e "${GREEN}✓ PASS: Environment variables protected${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
fi

#===============================================================================
# TEST 8: API Model Listing Endpoint
#===============================================================================
echo -e "${MAGENTA}[TEST 8/12]${NC} Testing model listing endpoint..."
TOTAL_TESTS=$((TOTAL_TESTS+1))

MODELS_RESPONSE=$(curl -s "$TARGET_URL/api/models" 2>/dev/null || echo "")

if echo "$MODELS_RESPONSE" | grep -iq "\"claude-3\|\"gpt-4\|anthropic"; then
    echo -e "${RED}✗ HIGH: Real model names exposed in /api/models${NC}"
    FAILED_TESTS=$((FAILED_TESTS+1))
    HIGH_ISSUES=$((HIGH_ISSUES+1))
else
    echo -e "${GREEN}✓ PASS: Model names are obfuscated${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
fi

#===============================================================================
# TEST 9: Console Log Analysis
#===============================================================================
echo -e "${MAGENTA}[TEST 9/12]${NC} Checking for console.log leaks in source..."
TOTAL_TESTS=$((TOTAL_TESTS+1))

# Check if source files have console.log with provider names
CONSOLE_LEAKS=$(grep -r "console\.log.*claude\|console\.log.*anthropic\|console\.log.*openai" \
  api/*.js public/js/*.js 2>/dev/null | wc -l | tr -d ' ')

if [ "$CONSOLE_LEAKS" -gt 5 ]; then
    echo -e "${YELLOW}✗ MEDIUM: $CONSOLE_LEAKS console.log statements with provider names${NC}"
    FAILED_TESTS=$((FAILED_TESTS+1))
    MEDIUM_ISSUES=$((MEDIUM_ISSUES+1))
else
    echo -e "${GREEN}✓ PASS: Console logs are minimal/obfuscated${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
fi

#===============================================================================
# TEST 10: Source Map Exposure
#===============================================================================
echo -e "${MAGENTA}[TEST 10/12]${NC} Checking for source map exposure..."
TOTAL_TESTS=$((TOTAL_TESTS+1))

SOURCEMAP=$(curl -s "$TARGET_URL/static/js/main.js.map" 2>/dev/null || echo "")

if [ -n "$SOURCEMAP" ] && echo "$SOURCEMAP" | grep -iq "claude\|anthropic"; then
    echo -e "${RED}✗ MEDIUM: Source maps exposed with provider names${NC}"
    FAILED_TESTS=$((FAILED_TESTS+1))
    MEDIUM_ISSUES=$((MEDIUM_ISSUES+1))
else
    echo -e "${GREEN}✓ PASS: Source maps not exposed or clean${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
fi

#===============================================================================
# TEST 11: CSP Header Analysis
#===============================================================================
echo -e "${MAGENTA}[TEST 11/12]${NC} Analyzing Content Security Policy..."
TOTAL_TESTS=$((TOTAL_TESTS+1))

CSP_HEADER=$(curl -sI "$TARGET_URL" | grep -i "content-security-policy" || echo "")

if echo "$CSP_HEADER" | grep -iq "anthropic\|openai"; then
    echo -e "${RED}✗ LOW: Provider domains in CSP${NC}"
    FAILED_TESTS=$((FAILED_TESTS+1))
    LOW_ISSUES=$((LOW_ISSUES+1))
else
    echo -e "${GREEN}✓ PASS: CSP does not expose provider names${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
fi

#===============================================================================
# TEST 12: Rate Limit Headers
#===============================================================================
echo -e "${MAGENTA}[TEST 12/12]${NC} Checking rate limit header exposure..."
TOTAL_TESTS=$((TOTAL_TESTS+1))

RATE_HEADERS=$(curl -sI "$TARGET_URL/api/chat-claude" 2>/dev/null || echo "")

if echo "$RATE_HEADERS" | grep -iq "x-ratelimit.*anthropic\|x-ratelimit.*openai"; then
    echo -e "${RED}✗ LOW: Provider info in rate limit headers${NC}"
    FAILED_TESTS=$((FAILED_TESTS+1))
    LOW_ISSUES=$((LOW_ISSUES+1))
else
    echo -e "${GREEN}✓ PASS: Rate limit headers are generic${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
fi

#===============================================================================
# GENERATE REPORT
#===============================================================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   PENETRATION TEST RESULTS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
echo -e "${RED}Failed:${NC} $FAILED_TESTS"
echo ""
echo -e "${RED}Critical Issues:${NC} $CRITICAL_ISSUES"
echo -e "${RED}High Issues:${NC} $HIGH_ISSUES"
echo -e "${YELLOW}Medium Issues:${NC} $MEDIUM_ISSUES"
echo -e "${CYAN}Low Issues:${NC} $LOW_ISSUES"
echo ""

# Calculate score
SCORE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

if [ "$SCORE" -ge 90 ]; then
    echo -e "${GREEN}Security Score: $SCORE% - EXCELLENT${NC}"
elif [ "$SCORE" -ge 75 ]; then
    echo -e "${YELLOW}Security Score: $SCORE% - GOOD${NC}"
elif [ "$SCORE" -ge 50 ]; then
    echo -e "${RED}Security Score: $SCORE% - NEEDS IMPROVEMENT${NC}"
else
    echo -e "${RED}Security Score: $SCORE% - CRITICAL${NC}"
fi

echo ""
echo -e "${YELLOW}Report saved to:${NC} $REPORT_FILE"
echo -e "${YELLOW}Summary saved to:${NC} $SUMMARY_FILE"
echo ""

# Generate JSON report
cat > "$REPORT_FILE" <<EOF
{
  "test_date": "$(date -Iseconds)",
  "target": "$TARGET_URL",
  "total_tests": $TOTAL_TESTS,
  "passed": $PASSED_TESTS,
  "failed": $FAILED_TESTS,
  "score": $SCORE,
  "issues": {
    "critical": $CRITICAL_ISSUES,
    "high": $HIGH_ISSUES,
    "medium": $MEDIUM_ISSUES,
    "low": $LOW_ISSUES
  },
  "recommendation": "$([ $CRITICAL_ISSUES -eq 0 ] && echo 'Ready for production' || echo 'Fix critical issues before deployment')"
}
EOF

# Generate Markdown summary
cat > "$SUMMARY_FILE" <<EOF
# AI Provider Leak Penetration Test Summary

**Date:** $(date)
**Target:** $TARGET_URL
**Security Score:** $SCORE%

## Test Results

| Metric | Count |
|--------|-------|
| Total Tests | $TOTAL_TESTS |
| Passed | $PASSED_TESTS |
| Failed | $FAILED_TESTS |

## Issues by Severity

| Severity | Count |
|----------|-------|
| 🔴 Critical | $CRITICAL_ISSUES |
| 🟠 High | $HIGH_ISSUES |
| 🟡 Medium | $MEDIUM_ISSUES |
| 🔵 Low | $LOW_ISSUES |

## Recommendation

$([ $CRITICAL_ISSUES -eq 0 ] && echo "✅ **System is secure.** Ready for production deployment." || echo "⚠️ **Fix critical issues** before deploying to production.")

## Next Steps

1. Review detailed findings above
2. Fix any critical and high severity issues
3. Re-run penetration test
4. Deploy to production when score >= 90%

---
*Generated by Lydian AI Security Framework*
EOF

echo -e "${GREEN}✓ Penetration test complete${NC}"

# Exit with error if critical issues found
if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    exit 1
fi

exit 0
