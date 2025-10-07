#!/bin/bash
# 🌍 AILYDIAN i18n QUICK SMOKE TEST
# Hızlı sistem kontrolü - timeout sorunlarını önler

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌍 AILYDIAN i18n QUICK SMOKE TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="http://localhost:3100"
PASS=0
FAIL=0

# === PHASE A: SERVER HEALTH ===
echo "📊 PHASE A: Server Health Check"
STATUS=$(curl -s $BASE_URL/api/health | jq -r '.status' 2>/dev/null || echo "ERROR")
if [ "$STATUS" = "OK" ]; then
    echo "✅ Server UP"
    ((PASS++))
else
    echo "❌ Server DOWN"
    ((FAIL++))
fi

MODELS=$(curl -s $BASE_URL/api/health | jq -r '.models_count' 2>/dev/null || echo "0")
if [ "$MODELS" -gt 0 ]; then
    echo "✅ Models loaded: $MODELS"
    ((PASS++))
else
    echo "❌ No models loaded"
    ((FAIL++))
fi

echo ""

# === PHASE B: TRANSLATION FILES ===
echo "📁 PHASE B: Translation Files"
TR=$(curl -s $BASE_URL/i18n/legal-translations.json | jq -r '.tr.welcomeTitle' 2>/dev/null || echo "ERROR")
if [[ "$TR" == *"LyDian"* ]]; then
    echo "✅ TR translations: $TR"
    ((PASS++))
else
    echo "❌ TR translations missing"
    ((FAIL++))
fi

EN=$(curl -s $BASE_URL/i18n/legal-translations.json | jq -r '.en.welcomeTitle' 2>/dev/null || echo "ERROR")
if [[ "$EN" == *"LyDian"* ]]; then
    echo "✅ EN translations: $EN"
    ((PASS++))
else
    echo "❌ EN translations missing"
    ((FAIL++))
fi

DE=$(curl -s $BASE_URL/i18n/legal-translations.json | jq -r '.de.welcomeTitle' 2>/dev/null || echo "ERROR")
if [[ "$DE" == *"LyDian"* ]]; then
    echo "✅ DE translations: $DE"
    ((PASS++))
else
    echo "❌ DE translations missing"
    ((FAIL++))
fi

echo ""

# === PHASE C: HTML i18n ===
echo "🏷️ PHASE C: HTML i18n Attributes"
I18N_COUNT=$(curl -s $BASE_URL/lydian-legal-search.html | grep -c 'data-i18n=' 2>/dev/null || echo "0")
if [ "$I18N_COUNT" -gt 10 ]; then
    echo "✅ i18n attributes found: $I18N_COUNT"
    ((PASS++))
else
    echo "❌ i18n attributes missing"
    ((FAIL++))
fi

TRANS_FN=$(curl -s $BASE_URL/lydian-legal-search.html | grep -c 'applyTranslations' 2>/dev/null || echo "0")
if [ "$TRANS_FN" -gt 0 ]; then
    echo "✅ Translation functions found"
    ((PASS++))
else
    echo "❌ Translation functions missing"
    ((FAIL++))
fi

echo ""

# === PHASE D: PERFORMANCE ===
echo "⚡ PHASE D: Performance Check"
START=$(date +%s%N)
curl -s $BASE_URL/lydian-legal-search.html > /dev/null
END=$(date +%s%N)
LATENCY=$(( (END - START) / 1000000 ))

echo "🔍 Page load: $LATENCY ms"
if [ $LATENCY -lt 1000 ]; then
    echo "✅ Performance OK (< 1000ms)"
    ((PASS++))
else
    echo "⚠️ Performance slow (> 1000ms)"
fi

echo ""

# === SUMMARY ===
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ PASS:  $PASS"
echo "❌ FAIL:  $FAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAIL -eq 0 ]; then
    echo "✅ ALL TESTS PASSED - i18n System READY"
    exit 0
else
    echo "⚠️ $FAIL test(s) failed - Review required"
    exit 1
fi
