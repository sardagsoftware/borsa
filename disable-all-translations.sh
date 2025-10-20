#!/bin/bash

# Script to disable translation system in all HTML files
# This will comment out translation script includes and replace translation logic

FILES=(
    "test-auto-translate.html"
    "models.html"
    "developers.html"
    "api.html"
    "billing.html"
    "settings.html"
    "contact.html"
    "about.html"
    "docs.html"
    "dashboard.html"
    "chat.html"
    "knowledge-base.html"
    "enterprise-index.html"
    "ai-assistant.html"
)

cd /Users/sardag/Desktop/ailydian-ultra-pro/public

echo "🔧 Disabling translation system in all HTML files..."

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  Processing: $file"

        # Comment out translation script includes
        sed -i.bak 's|<script src="/js/i18n-keys.js"></script>|<!-- <script src="/js/i18n-keys.js"></script> DISABLED -->|g' "$file"
        sed -i.bak 's|<script src="/js/translation.js"></script>|<!-- <script src="/js/translation.js"></script> DISABLED -->|g' "$file"

        # Replace AILYDIAN_LANG calls with console.log
        sed -i.bak 's|window\.AILYDIAN_LANG|console.log("Translation disabled") \&\& false|g' "$file"
        sed -i.bak "s|console\.error('Translation system not loaded')|console.log('🔕 Translation disabled')|g" "$file"

        # Remove the waiting loop pattern (more aggressive)
        sed -i.bak '/Waiting for translation system/d' "$file"
        sed -i.bak '/setTimeout(checkTranslationReady/d' "$file"

        echo "    ✅ $file updated"
    else
        echo "    ⚠️  $file not found"
    fi
done

echo ""
echo "🧹 Cleaning up backup files..."
rm -f *.bak

echo "✅ Translation system disabled in all HTML files!"
echo ""
echo "📋 Summary:"
echo "  - Commented out translation script includes"
echo "  - Disabled AILYDIAN_LANG calls"
echo "  - Removed translation waiting loops"
echo ""
echo "🔄 Please do a hard refresh (Cmd+Shift+R) in your browser!"
