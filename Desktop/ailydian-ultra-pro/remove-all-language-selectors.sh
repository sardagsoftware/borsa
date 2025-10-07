#!/bin/bash

# Nuclear option: Remove ALL language selector code from ALL HTML files

echo "🔥 NUCLEAR OPTION: Removing ALL language selector code..."

cd /Users/sardag/Desktop/ailydian-ultra-pro/public

# Remove language selector HTML blocks
for file in *.html; do
    if [ -f "$file" ]; then
        echo "  Processing: $file"

        # Remove language selector div and all its content (multi-line)
        perl -i -0pe 's/<!-- Language Selector Dropdown -->.*?<\/div>\s*<\/div>//gs' "$file"
        perl -i -0pe 's/<div class="language-selector".*?<\/div>\s*<\/div>//gs' "$file"

        # Remove language toggle button references
        sed -i '' 's/id="languageToggle"//g' "$file"
        sed -i '' 's/id="languageSelector"//g' "$file"
        sed -i '' 's/id="languageMenu"//g' "$file"
        sed -i '' 's/id="currentFlag"//g' "$file"
        sed -i '' 's/id="currentCode"//g' "$file"

        # Remove data-i18n attributes
        sed -i '' 's/data-i18n="[^"]*"//g' "$file"

        echo "    ✅ Cleaned: $file"
    fi
done

echo ""
echo "✅ ALL language selector code removed from ALL HTML files!"
echo "🔄 Reload your browser now!"
