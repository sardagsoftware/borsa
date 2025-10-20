#!/bin/bash

echo "════════════════════════════════════════════════════════════════"
echo "  🌍 AiLydian Translation System - Verification Script"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Check function
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $2 - MISSING"
        ((FAILED++))
    fi
}

echo "📦 Checking Backend Files..."
check_file "/Users/sardag/Desktop/ailydian-ultra-pro/api/translate.js" "Backend Translation API"
echo ""

echo "📦 Checking Frontend Files..."
check_file "/Users/sardag/Desktop/ailydian-ultra-pro/public/js/translation.js" "Translation Library"
check_file "/Users/sardag/Desktop/ailydian-ultra-pro/public/js/i18n-keys.js" "Translation Keys"
echo ""

echo "📦 Checking Integration Files..."
check_file "/Users/sardag/Desktop/ailydian-ultra-pro/public/index.html" "Main Page (index.html)"
check_file "/Users/sardag/Desktop/ailydian-ultra-pro/public/integrate-translations.sh" "Integration Script"
echo ""

echo "📦 Checking Test & Documentation..."
check_file "/Users/sardag/Desktop/ailydian-ultra-pro/test-translation-system.js" "Smoke Test Suite"
check_file "/Users/sardag/Desktop/ailydian-ultra-pro/TRANSLATION-SYSTEM-GUIDE.md" "User Guide"
check_file "/Users/sardag/Desktop/ailydian-ultra-pro/TRANSLATION-SYSTEM-COMPLETE-REPORT.md" "Complete Report"
check_file "/Users/sardag/Desktop/ailydian-ultra-pro/QUICK-INTEGRATION-TEMPLATE.html" "Integration Template"
echo ""

echo "📦 Checking Configuration..."
if grep -q "Z_AI_API_KEY" /Users/sardag/Desktop/ailydian-ultra-pro/.env 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Z.AI API Key configured"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  Z.AI API Key not found in .env"
    ((FAILED++))
fi
echo ""

echo "════════════════════════════════════════════════════════════════"
echo -e "${BLUE}📊 VERIFICATION SUMMARY${NC}"
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED! Translation system is ready.${NC}"
else
    echo -e "${YELLOW}⚠️  Some files are missing. Please review the list above.${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🚀 NEXT STEPS:"
echo ""
echo "1. Run smoke tests:"
echo "   cd /Users/sardag/Desktop/ailydian-ultra-pro"
echo "   node test-translation-system.js"
echo ""
echo "2. Start development server and test manually:"
echo "   npm start"
echo "   Open http://localhost:3100"
echo ""
echo "3. Read documentation:"
echo "   TRANSLATION-SYSTEM-GUIDE.md"
echo "   TRANSLATION-SYSTEM-COMPLETE-REPORT.md"
echo ""
echo "════════════════════════════════════════════════════════════════"
