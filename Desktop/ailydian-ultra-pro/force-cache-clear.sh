#!/bin/bash

# Force cache clear by adding timestamp comment to all HTML files
# This changes the file modification time and forces browser to reload

echo "🔄 Force clearing browser cache by updating HTML files..."

cd /Users/sardag/Desktop/ailydian-ultra-pro/public

# Add timestamp comment to force cache invalidation
TIMESTAMP=$(date +%s)

for file in *.html; do
    if [ -f "$file" ]; then
        # Add a timestamp comment at the very top
        echo "<!-- Cache-Buster: $TIMESTAMP -->" | cat - "$file" > temp && mv temp "$file"
        echo "  ✅ Updated: $file"
    fi
done

echo ""
echo "✅ All HTML files updated with cache-buster timestamp: $TIMESTAMP"
echo ""
echo "🔄 Now restart your browser or do a HARD REFRESH:"
echo "   - Chrome/Edge: Cmd+Shift+R"
echo "   - Safari: Cmd+Option+E (clear cache), then Cmd+R"
echo "   - Firefox: Cmd+Shift+R"
