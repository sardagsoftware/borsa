#!/bin/bash

###############################################################################
# 🛡️ LyDian AI Platform - Vulnerability Fix Script
#
# Fixes npm dependency vulnerabilities found in penetration testing
# - Updates apollo-server-express (breaking change but secure)
# - Re-audits dependencies
# - Optionally re-deploys to Vercel
#
# Usage: ./scripts/fix-vulnerabilities.sh [--deploy]
###############################################################################

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🛡️ LyDian Vulnerability Fix Script                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Current vulnerabilities
echo "📊 Current Vulnerabilities:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm audit --production | grep "vulnerabilities"
echo ""

# Backup package.json
echo "💾 Backing up package.json..."
cp package.json package.json.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup created"
echo ""

# Fix 1: Update Apollo Server (breaking change)
echo "🔧 Fix 1: Updating apollo-server-express..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm install apollo-server-express@3.13.0 --legacy-peer-deps --save

if [ $? -eq 0 ]; then
    echo "✅ Apollo server updated successfully"
else
    echo "❌ Apollo server update failed"
    exit 1
fi
echo ""

# Fix 2: Update busboy
echo "🔧 Fix 2: Updating busboy..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm install busboy@latest --legacy-peer-deps --save

if [ $? -eq 0 ]; then
    echo "✅ Busboy updated successfully"
else
    echo "⚠️  Busboy update had warnings (may be transitive dependency)"
fi
echo ""

# Fix 3: Update multer
echo "🔧 Fix 3: Updating multer..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm install multer@latest --legacy-peer-deps --save

if [ $? -eq 0 ]; then
    echo "✅ Multer updated successfully"
else
    echo "⚠️  Multer update had warnings"
fi
echo ""

# Re-audit
echo "🔍 Re-auditing dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm audit --production | grep "vulnerabilities"
echo ""

# Check if deploy flag is set
if [ "$1" == "--deploy" ]; then
    echo "🚀 Deploying to Vercel production..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    vercel --prod --yes

    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful"
        echo ""
        echo "Test the deployment:"
        echo "  curl https://ailydian-ps8euyp0x-emrahsardag-yandexcoms-projects.vercel.app/api/health-check"
    else
        echo "❌ Deployment failed"
        exit 1
    fi
else
    echo "💡 To deploy to Vercel, run:"
    echo "   ./scripts/fix-vulnerabilities.sh --deploy"
    echo ""
    echo "   OR manually:"
    echo "   vercel --prod"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ✅ VULNERABILITY FIX COMPLETED                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Summary:"
echo "  - Apollo server upgraded to 3.13.0"
echo "  - Busboy updated to latest"
echo "  - Multer updated to latest"
echo "  - Re-audit completed"
echo ""
echo "Next steps:"
echo "  1. Test locally: PORT=3100 node server.js"
echo "  2. Deploy: vercel --prod"
echo "  3. Test API: curl https://.../api/health-check"
echo ""
