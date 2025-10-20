#!/bin/bash
# 🔍 DROPDOWN VISIBILITY VERIFICATION
# Checks if user dropdown elements exist and are properly styled

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 USER DROPDOWN VISIBILITY CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="http://localhost:3100"
HTML_FILE="lydian-legal-search.html"

# === CHECK 1: HTML Elements Exist ===
echo "📄 CHECK 1: HTML Elements"
echo "─────────────────────────────────"

# Check for sidebar-footer
SIDEBAR_FOOTER=$(curl -s $BASE_URL/$HTML_FILE | grep -c 'class="sidebar-footer"' || echo "0")
if [ "$SIDEBAR_FOOTER" -gt 0 ]; then
    echo "✅ .sidebar-footer found: $SIDEBAR_FOOTER instance(s)"
else
    echo "❌ .sidebar-footer NOT FOUND"
fi

# Check for user-menu-btn
USER_BTN=$(curl -s $BASE_URL/$HTML_FILE | grep -c 'id="userMenuBtn"' || echo "0")
if [ "$USER_BTN" -gt 0 ]; then
    echo "✅ #userMenuBtn found: $USER_BTN instance(s)"
else
    echo "❌ #userMenuBtn NOT FOUND"
fi

# Check for user-dropdown
USER_DD=$(curl -s $BASE_URL/$HTML_FILE | grep -c 'id="userDropdown"' || echo "0")
if [ "$USER_DD" -gt 0 ]; then
    echo "✅ #userDropdown found: $USER_DD instance(s)"
else
    echo "❌ #userDropdown NOT FOUND"
fi

echo ""

# === CHECK 2: CSS Styles ===
echo "🎨 CHECK 2: CSS Styles"
echo "─────────────────────────────────"

# Check for .sidebar-footer CSS
SF_CSS=$(curl -s $BASE_URL/$HTML_FILE | grep -c '\.sidebar-footer' || echo "0")
if [ "$SF_CSS" -gt 0 ]; then
    echo "✅ .sidebar-footer CSS found: $SF_CSS rule(s)"
else
    echo "❌ .sidebar-footer CSS NOT FOUND"
fi

# Check for .user-menu-btn CSS
UMB_CSS=$(curl -s $BASE_URL/$HTML_FILE | grep -c '\.user-menu-btn' || echo "0")
if [ "$UMB_CSS" -gt 0 ]; then
    echo "✅ .user-menu-btn CSS found: $UMB_CSS rule(s)"
else
    echo "❌ .user-menu-btn CSS NOT FOUND"
fi

# Check for .user-dropdown CSS
UD_CSS=$(curl -s $BASE_URL/$HTML_FILE | grep -c '\.user-dropdown' || echo "0")
if [ "$UD_CSS" -gt 0 ]; then
    echo "✅ .user-dropdown CSS found: $UD_CSS rule(s)"
else
    echo "❌ .user-dropdown CSS NOT FOUND"
fi

echo ""

# === CHECK 3: Event Listeners ===
echo "🎧 CHECK 3: Event Listeners"
echo "─────────────────────────────────"

# Check for userMenuBtn click listener
CLICK_LISTENER=$(curl -s $BASE_URL/$HTML_FILE | grep -c "getElementById('userMenuBtn')" || echo "0")
if [ "$CLICK_LISTENER" -gt 0 ]; then
    echo "✅ userMenuBtn event listener found: $CLICK_LISTENER reference(s)"
else
    echo "❌ userMenuBtn event listener NOT FOUND"
fi

# Check for toggle functions
TOGGLE=$(curl -s $BASE_URL/$HTML_FILE | grep -c "\.classList\.toggle('active')" || echo "0")
if [ "$TOGGLE" -gt 0 ]; then
    echo "✅ .toggle('active') found: $TOGGLE call(s)"
else
    echo "❌ Toggle logic NOT FOUND"
fi

echo ""

# === CHECK 4: Extract CSS Rules ===
echo "📋 CHECK 4: CSS Rule Details"
echo "─────────────────────────────────"

echo ""
echo "🔍 .sidebar-footer rules:"
curl -s $BASE_URL/$HTML_FILE | grep -A 5 '\.sidebar-footer {' | head -6

echo ""
echo "🔍 .user-menu-btn rules:"
curl -s $BASE_URL/$HTML_FILE | grep -A 10 '\.user-menu-btn {' | head -11

echo ""
echo "🔍 .user-dropdown rules:"
curl -s $BASE_URL/$HTML_FILE | grep -A 10 '\.user-dropdown {' | head -11

echo ""

# === SUMMARY ===
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VISIBILITY DIAGNOSIS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL_CHECKS=$((SIDEBAR_FOOTER + USER_BTN + USER_DD + SF_CSS + UMB_CSS + UD_CSS))

if [ $TOTAL_CHECKS -ge 6 ]; then
    echo "✅ ALL ELEMENTS PRESENT - Issue is likely:"
    echo ""
    echo "   1. Browser cache not refreshed (Cmd+Shift+R required)"
    echo "   2. CSS display/visibility override somewhere"
    echo "   3. Parent container overflow:hidden"
    echo "   4. Z-index conflict"
    echo ""
    echo "📌 RECOMMENDED ACTION:"
    echo "   1. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
    echo "   2. Open DevTools > Elements > Find #userMenuBtn"
    echo "   3. Check computed styles for display, visibility, opacity"
    echo "   4. Check parent .sidebar-footer for overflow or height issues"
else
    echo "❌ MISSING ELEMENTS DETECTED"
    echo ""
    echo "   Missing: $((6 - TOTAL_CHECKS)) critical components"
    echo ""
    echo "📌 RECOMMENDED ACTION:"
    echo "   1. Check if lydian-legal-search.html was saved properly"
    echo "   2. Restart server to reload latest HTML"
    echo "   3. Verify file at /public/lydian-legal-search.html"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
