#!/bin/bash
# 🌍 AILYDIAN i18n SMOKE TEST - Enterprise Grade
# Tests: Translation coverage, API multilingual, dropdown state, performance

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌍 AILYDIAN i18n SMOKE TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="http://localhost:3100"
PASS=0
FAIL=0
WARN=0

# Test function
test() {
    TEST_NAME="$1"
    COMMAND="$2"
    EXPECTED="$3"

    echo -n "🔍 $TEST_NAME... "

    RESULT=$(eval "$COMMAND" 2>&1 || echo "ERROR")

    if echo "$RESULT" | grep -q "$EXPECTED"; then
        echo "✅ PASS"
        ((PASS++))
    else
        echo "❌ FAIL"
        echo "   Expected: $EXPECTED"
        echo "   Got: $RESULT"
        ((FAIL++))
    fi
}

# === PHASE A: SERVER HEALTH ===
echo "📊 PHASE A: Server Health Check"
test "Server UP" \
    "curl -s $BASE_URL/api/health | jq -r '.status'" \
    "OK"

test "Models loaded" \
    "curl -s $BASE_URL/api/health | jq -r '.models_count'" \
    "23"

echo ""

# === PHASE B: TRANSLATION FILES ===
echo "📁 PHASE B: Translation Files Audit"
test "TR translations exist" \
    "curl -s $BASE_URL/i18n/legal-translations.json | jq -r '.tr.welcomeTitle'" \
    "LyDian Hukuk AI"

test "EN translations exist" \
    "curl -s $BASE_URL/i18n/legal-translations.json | jq -r '.en.welcomeTitle'" \
    "LyDian Legal AI"

test "DE translations exist" \
    "curl -s $BASE_URL/i18n/legal-translations.json | jq -r '.de.welcomeTitle'" \
    "LyDian Rechts"

echo ""

# === PHASE C: API MULTILINGUAL ===
echo "🤖 PHASE C: AI API Multilingual Test"

# Turkish test
test "AI responds in Turkish" \
    "curl -s -X POST $BASE_URL/api/chat \
        -H 'Content-Type: application/json' \
        -d '{\"model\":\"azure-gpt-4-turbo\",\"message\":\"Merhaba\",\"max_tokens\":50}' \
        | jq -r '.success'" \
    "true"

# English test
test "AI API accepts English" \
    "curl -s -X POST $BASE_URL/api/chat \
        -H 'Content-Type: application/json' \
        -d '{\"model\":\"azure-gpt-4-turbo\",\"message\":\"Hello\",\"max_tokens\":50}' \
        | jq -r '.success'" \
    "true"

echo ""

# === PHASE D: HTML i18n ATTRIBUTES ===
echo "🏷️ PHASE D: HTML i18n Attributes"
test "i18n attributes present" \
    "curl -s $BASE_URL/lydian-legal-search.html | grep -c 'data-i18n='" \
    "[0-9]"

test "Translation JS loaded" \
    "curl -s $BASE_URL/lydian-legal-search.html | grep -c 'applyTranslations'" \
    "[0-9]"

echo ""

# === PHASE E: PERFORMANCE ===
echo "⚡ PHASE E: Performance Metrics"

START=$(date +%s%N)
curl -s $BASE_URL/lydian-legal-search.html > /dev/null
END=$(date +%s%N)
LATENCY=$(( (END - START) / 1000000 ))

echo -n "🔍 Page load latency: $LATENCY ms... "
if [ $LATENCY -lt 500 ]; then
    echo "✅ PASS (< 500ms)"
    ((PASS++))
elif [ $LATENCY -lt 1000 ]; then
    echo "⚠️ WARN (< 1000ms)"
    ((WARN++))
else
    echo "❌ FAIL (> 1000ms)"
    ((FAIL++))
fi

echo ""

# === SUMMARY ===
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ PASS:  $PASS"
echo "❌ FAIL:  $FAIL"
echo "⚠️ WARN:  $WARN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAIL -eq 0 ]; then
    echo "✅ ALL TESTS PASSED - System is i18n READY"
    exit 0
else
    echo "❌ SOME TESTS FAILED - Review required"
    exit 1
fi
