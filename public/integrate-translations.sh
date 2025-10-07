#!/bin/bash

# AiLydian Ultra Pro - Translation Integration Script
# This script adds translation.js to all HTML pages

echo "🌍 Starting translation system integration..."
echo ""

# Array of HTML files to integrate
HTML_FILES=(
    "index.html"
    "chat.html"
    "about.html"
    "models.html"
    "developers.html"
    "docs.html"
    "pricing.html"
    "dashboard.html"
    "settings.html"
    "auth.html"
    "api.html"
)

# Counter
INTEGRATED=0
SKIPPED=0

# Loop through each file
for file in "${HTML_FILES[@]}"; do
    filepath="/Users/sardag/Desktop/ailydian-ultra-pro/public/$file"

    if [ ! -f "$filepath" ]; then
        echo "⚠️  Skipping $file (not found)"
        ((SKIPPED++))
        continue
    fi

    # Check if translation.js is already included
    if grep -q "translation.js" "$filepath"; then
        echo "✓  $file already has translation.js"
        ((INTEGRATED++))
        continue
    fi

    # Add translation.js before </body>
    # Create backup first
    cp "$filepath" "${filepath}.backup"

    # Add script tag before </body>
    sed -i '' 's|</body>|    <script src="/js/translation.js"></script>\n</body>|' "$filepath"

    echo "✅ Integrated translation.js into $file"
    ((INTEGRATED++))
done

echo ""
echo "================================================"
echo "Integration Summary:"
echo "  ✅ Integrated: $INTEGRATED files"
echo "  ⚠️  Skipped: $SKIPPED files"
echo "================================================"
echo ""
echo "🎉 Translation system integration complete!"
echo ""
echo "Next steps:"
echo "1. Add data-i18n attributes to translatable text"
echo "2. Test with different languages"
echo "3. Run smoke tests"
