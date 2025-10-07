#!/bin/bash
# CLEANUP DEMO CODE - NO-MOCK COMPLIANCE
# Removes all demo/mock/placeholder code from codebase
# Part of Phase A: Discovery & Freeze

set -euo pipefail

REPO_ROOT="/Users/sardag/Desktop/ailydian-ultra-pro"
cd "$REPO_ROOT"

echo "🧹 AILYDIAN NO-MOCK CLEANUP AUTOMATION"
echo "======================================"
echo ""

# Create backup
BACKUP_DIR="$REPO_ROOT/.cleanup-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Creating backup at: $BACKUP_DIR"

# 1. DELETE DEMO FILES
echo ""
echo "🔴 Step 1: Deleting demo files..."

if [ -f "api/chat-demo.js" ]; then
    cp "api/chat-demo.js" "$BACKUP_DIR/"
    rm "api/chat-demo.js"
    echo "   ✅ Deleted: api/chat-demo.js"
else
    echo "   ℹ️  Already removed: api/chat-demo.js"
fi

# 2. REMOVE MOCK FALLBACKS
echo ""
echo "🟡 Step 2: Removing mock fallbacks..."

# Remove mock data fallback from azure-metrics.js
if [ -f "api/azure-metrics.js" ]; then
    cp "api/azure-metrics.js" "$BACKUP_DIR/"
    # Remove mock fallback lines
    sed -i.bak '/mock data/d; /source.*mock/d' "api/azure-metrics.js"
    rm "api/azure-metrics.js.bak"
    echo "   ✅ Cleaned: api/azure-metrics.js (mock fallbacks removed)"
fi

# Remove demo fallback from lydian-iq/solve.js
if [ -f "api/lydian-iq/solve.js" ]; then
    cp "api/lydian-iq/solve.js" "$BACKUP_DIR/"
    # Comment out demo fallback function
    sed -i.bak '/Generate fallback demo response/,/mode.*demo/s/^/\/\/ REMOVED: /' "api/lydian-iq/solve.js"
    rm "api/lydian-iq/solve.js.bak"
    echo "   ✅ Cleaned: api/lydian-iq/solve.js (demo fallback commented)"
fi

# 3. REMOVE OR IMPLEMENT PLACEHOLDERS
echo ""
echo "🔵 Step 3: Handling placeholders..."

# OAuth placeholder - add fail-fast
if [ -f "api/auth/oauth.js" ]; then
    cp "api/auth/oauth.js" "$BACKUP_DIR/"
    # Add fail-fast at top
    sed -i.bak '1a\
// PRODUCTION REQUIREMENT: Azure AD SDK required\
if (!process.env.AZURE_AD_CLIENT_ID) {\
  throw new Error("AZURE_AD_CLIENT_ID required - no placeholder mode");\
}
' "api/auth/oauth.js"
    rm "api/auth/oauth.js.bak"
    echo "   ✅ Hardened: api/auth/oauth.js (fail-fast added)"
fi

# Admin roles placeholder - add fail-fast
if [ -f "api/admin/roles.js" ]; then
    cp "api/admin/roles.js" "$BACKUP_DIR/"
    sed -i.bak '1a\
// PRODUCTION REQUIREMENT: Azure App Insights required\
if (!process.env.AZURE_APP_INSIGHTS_KEY) {\
  throw new Error("AZURE_APP_INSIGHTS_KEY required - no placeholder mode");\
}
' "api/admin/roles.js"
    rm "api/admin/roles.js.bak"
    echo "   ✅ Hardened: api/admin/roles.js (fail-fast added)"
fi

# 4. VERIFY NO DEMO CODE REMAINS
echo ""
echo "🔍 Step 4: Verification..."

DEMO_COUNT=$(grep -r "demo\|Demo\|DEMO\|mock\|Mock\|MOCK\|placeholder\|Placeholder" api/ --include="*.js" | grep -v node_modules | grep -v ".cleanup-backup" | wc -l | tr -d ' ')

echo "   Demo/mock references found: $DEMO_COUNT"

if [ "$DEMO_COUNT" -eq "0" ]; then
    echo "   ✅ CLEAN - No demo/mock code detected"
    echo ""
    echo "🎉 CLEANUP COMPLETE"
    echo ""
    echo "📋 Summary:"
    echo "   - Deleted: api/chat-demo.js"
    echo "   - Cleaned: api/azure-metrics.js"
    echo "   - Cleaned: api/lydian-iq/solve.js"
    echo "   - Hardened: api/auth/oauth.js"
    echo "   - Hardened: api/admin/roles.js"
    echo "   - Backup: $BACKUP_DIR"
    echo ""
    echo "✅ NO-MOCK COMPLIANCE: ACHIEVED"
    echo ""
    echo "⚠️  NEXT STEPS:"
    echo "   1. Set ENV variables (AZURE_*, GOOGLE_AI_KEY, etc.)"
    echo "   2. Run: npm test"
    echo "   3. Proceed to Phase B"
    exit 0
else
    echo "   ⚠️  WARNING: $DEMO_COUNT demo/mock references still exist"
    echo ""
    echo "   Remaining references:"
    grep -r "demo\|Demo\|DEMO\|mock\|Mock\|MOCK\|placeholder\|Placeholder" api/ --include="*.js" | grep -v node_modules | grep -v ".cleanup-backup" | head -10
    echo ""
    echo "❌ MANUAL REVIEW REQUIRED"
    exit 1
fi
