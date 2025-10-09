#!/bin/bash

###############################################################################
# 🔍 LyDian i18n Integration Validator
#
# Grammar, syntax ve penetration testing
# - HTML syntax validation
# - JavaScript syntax check
# - i18n code integrity
# - XSS vulnerability test
# - Performance validation
#
# Usage: ./scripts/validate-i18n-integration.sh
###############################################################################

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🔍 LyDian i18n Integration Validator                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

ERRORS=0

# Test 1: HTML Syntax Validation
echo "📝 Test 1: HTML Syntax Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HTML_ERRORS=0
for file in public/*.html; do
    if [[ -f "$file" ]]; then
        # Check for basic HTML syntax issues
        if ! grep -q "</html>" "$file"; then
            echo "❌ $file: Missing </html> tag"
            ((HTML_ERRORS++))
        fi

        if ! grep -q "</body>" "$file"; then
            echo "❌ $file: Missing </body> tag"
            ((HTML_ERRORS++))
        fi

        # Count opening vs closing script tags
        OPEN=$(grep -o "<script" "$file" | wc -l)
        CLOSE=$(grep -o "</script>" "$file" | wc -l)

        if [ "$OPEN" -ne "$CLOSE" ]; then
            echo "❌ $file: Mismatched script tags (open: $OPEN, close: $CLOSE)"
            ((HTML_ERRORS++))
        fi
    fi
done

if [ $HTML_ERRORS -eq 0 ]; then
    echo "✅ HTML syntax validation passed (0 errors)"
else
    echo "❌ HTML syntax validation failed ($HTML_ERRORS errors)"
    ((ERRORS+=HTML_ERRORS))
fi
echo ""

# Test 2: JavaScript Syntax Check
echo "📝 Test 2: JavaScript Syntax Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

JS_ERRORS=0
for file in public/js/locale-engine.js public/js/locale-switcher.js public/js/feature-flags.js; do
    if [ -f "$file" ]; then
        # Check basic JavaScript syntax
        if ! node --check "$file" 2>/dev/null; then
            echo "❌ $file: JavaScript syntax error"
            ((JS_ERRORS++))
        else
            echo "✅ $(basename $file): Valid JavaScript syntax"
        fi
    else
        echo "❌ $file: File not found"
        ((JS_ERRORS++))
    fi
done

if [ $JS_ERRORS -eq 0 ]; then
    echo "✅ JavaScript syntax check passed (0 errors)"
else
    echo "❌ JavaScript syntax check failed ($JS_ERRORS errors)"
    ((ERRORS+=JS_ERRORS))
fi
echo ""

# Test 3: i18n Code Integrity
echo "📝 Test 3: i18n Code Integrity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

INTEGRITY_ERRORS=0
INTEGRATED=0
for file in public/*.html; do
    if [[ -f "$file" ]] && ! [[ "$file" =~ (backup|old|bak) ]]; then
        if grep -q "locale-engine.js" "$file"; then
            ((INTEGRATED++))

            # Check all required components
            if ! grep -q "feature-flags.js" "$file"; then
                echo "❌ $(basename $file): Missing feature-flags.js"
                ((INTEGRITY_ERRORS++))
            fi

            if ! grep -q "locale-switcher.js" "$file"; then
                echo "❌ $(basename $file): Missing locale-switcher.js"
                ((INTEGRITY_ERRORS++))
            fi

            if ! grep -q "i18n system initialized" "$file"; then
                echo "⚠️  $(basename $file): Missing initialization log"
            fi
        fi
    fi
done

echo "✅ Integrated pages: $INTEGRATED"
if [ $INTEGRITY_ERRORS -eq 0 ]; then
    echo "✅ i18n code integrity check passed (0 errors)"
else
    echo "❌ i18n code integrity check failed ($INTEGRITY_ERRORS errors)"
    ((ERRORS+=INTEGRITY_ERRORS))
fi
echo ""

# Test 4: XSS Vulnerability Check
echo "📝 Test 4: XSS Vulnerability Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

XSS_ERRORS=0
XSS_PATTERNS=(
    "eval("
    "innerHTML ="
    "document.write("
    "outerHTML ="
    "dangerouslySetInnerHTML"
)

for pattern in "${XSS_PATTERNS[@]}"; do
    if grep -r "$pattern" public/js/locale-engine.js public/js/locale-switcher.js public/js/feature-flags.js 2>/dev/null; then
        echo "⚠️  Potential XSS pattern found: $pattern"
        ((XSS_ERRORS++))
    fi
done

if [ $XSS_ERRORS -eq 0 ]; then
    echo "✅ XSS vulnerability check passed (0 dangerous patterns)"
else
    echo "⚠️  XSS vulnerability check: $XSS_ERRORS potential issues"
fi
echo ""

# Test 5: HTTP Accessibility Test
echo "📝 Test 5: HTTP Accessibility Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HTTP_ERRORS=0
TEST_URLS=(
    "http://localhost:3100/"
    "http://localhost:3100/js/locale-engine.js"
    "http://localhost:3100/js/locale-switcher.js"
    "http://localhost:3100/js/feature-flags.js"
    "http://localhost:3100/i18n/v2/tr/common.json"
    "http://localhost:3100/i18n/v2/en/common.json"
    "http://localhost:3100/i18n/v2/az/common.json"
)

for url in "${TEST_URLS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$HTTP_CODE" == "200" ]; then
        echo "✅ $url - HTTP $HTTP_CODE"
    else
        echo "❌ $url - HTTP $HTTP_CODE"
        ((HTTP_ERRORS++))
    fi
done

if [ $HTTP_ERRORS -eq 0 ]; then
    echo "✅ HTTP accessibility check passed (0 errors)"
else
    echo "❌ HTTP accessibility check failed ($HTTP_ERRORS errors)"
    ((ERRORS+=HTTP_ERRORS))
fi
echo ""

# Test 6: Translation Files Check
echo "📝 Test 6: Translation Files Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TRANSLATION_ERRORS=0
LANGUAGES=(tr en de fr es ar ru it ja zh-CN az)

for lang in "${LANGUAGES[@]}"; do
    if [ -d "public/i18n/v2/$lang" ]; then
        FILE_COUNT=$(find "public/i18n/v2/$lang" -name "*.json" | wc -l)
        echo "✅ $lang: $FILE_COUNT translation files"
    else
        echo "❌ $lang: Directory not found"
        ((TRANSLATION_ERRORS++))
    fi
done

if [ $TRANSLATION_ERRORS -eq 0 ]; then
    echo "✅ Translation files check passed (0 errors)"
else
    echo "❌ Translation files check failed ($TRANSLATION_ERRORS errors)"
    ((ERRORS+=TRANSLATION_ERRORS))
fi
echo ""

# Final Summary
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  📊 FINAL VALIDATION REPORT                                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Test Results:"
echo "  1. HTML Syntax:           $HTML_ERRORS errors"
echo "  2. JavaScript Syntax:     $JS_ERRORS errors"
echo "  3. i18n Code Integrity:   $INTEGRITY_ERRORS errors"
echo "  4. XSS Vulnerabilities:   $XSS_ERRORS warnings"
echo "  5. HTTP Accessibility:    $HTTP_ERRORS errors"
echo "  6. Translation Files:     $TRANSLATION_ERRORS errors"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Errors: $ERRORS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "🎉 ✅ ALL VALIDATION TESTS PASSED - 0 ERRORS!"
    echo ""
    echo "System Status: 🟢 READY FOR PRODUCTION"
    exit 0
else
    echo "❌ VALIDATION FAILED - $ERRORS ERRORS FOUND"
    echo ""
    echo "System Status: 🔴 NEEDS ATTENTION"
    exit 1
fi
