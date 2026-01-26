#!/bin/bash

# ========================================
# AILYDIAN IMPROVEMENTS SCRIPT
# ========================================
# 1. travel.ailydian.com → holiday.ailydian.com
# 2. Add ade.ailydian.com
# 3. Add vet.ailydian.com
# 4. Obfuscate AI model names
# ========================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC_DIR="$PROJECT_DIR/public"

echo "🚀 Starting AILYDIAN improvements..."
echo "📁 Project directory: $PROJECT_DIR"

# Backup
echo "📦 Creating backup..."
cp "$PUBLIC_DIR/index.html" "$PUBLIC_DIR/index.html.backup-$(date +%Y%m%d-%H%M%S)"

# 1. Change travel.ailydian.com → holiday.ailydian.com
echo "🔄 Changing travel.ailydian.com → holiday.ailydian.com..."
sed -i '' 's|https://travel\.ailydian\.com|https://holiday.ailydian.com|g' "$PUBLIC_DIR/index.html"
sed -i '' 's|Travel AI Assistant|Holiday AI Assistant|g' "$PUBLIC_DIR/index.html"
sed -i '' 's|Akıllı seyahat planlama|Tatil planlama \& rezervasyon|g' "$PUBLIC_DIR/index.html"

echo "✅ Improvements applied successfully!"
echo ""
echo "📋 Changes made:"
echo "  ✓ travel.ailydian.com → holiday.ailydian.com"
echo "  ✓ Backup created: index.html.backup-*"
echo ""
echo "⚠️  Next steps:"
echo "  1. Review changes: git diff public/index.html"
echo "  2. Test locally: npm run dev"
echo "  3. Commit: git add . && git commit -m 'feat: update menu items'"
