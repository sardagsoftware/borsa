#!/bin/bash

# LyDian Branding Update Script
# Updates all HTML files to use "LyDian" branding consistently
# Preserves URLs, API endpoints, and file names

set -e

cd "$(dirname "$0")"

# Counter for statistics
total_files=0
updated_files=0
total_replacements=0

# Righteous font snippet to add if missing
RIGHTEOUS_FONT='        @font-face {
            font-family: '\''Righteous'\'';
            font-style: normal;
            font-weight: 400;
            font-display: block;
            src: url(https://fonts.gstatic.com/s/righteous/v14/1cXxaUPXBpj2rGoU7C9WhnGFucE.woff2) format('\''woff2'\'');
        }'

echo "Starting LyDian branding update..."
echo "=================================="

# Find all HTML files (excluding backups and old files)
for file in $(find . -name "*.html" -type f ! -name "*backup*" ! -name "*BACKUP*" ! -name "*old*" ! -name "*OLD*" | sort); do
    total_files=$((total_files + 1))

    # Check if file contains "Ailydian" (case insensitive but preserve case)
    if grep -qi "Ailydian" "$file"; then
        echo ""
        echo "Processing: $file"

        # Create backup
        cp "$file" "${file}.bak"

        # Count replacements before
        before_count=$(grep -oi "Ailydian\|ailydian\|AILYDIAN" "$file" | wc -l)

        # Perform replacements (excluding URLs)
        # Title tags
        sed -i.tmp 's/<title>Ailydian/<title>LyDian/g' "$file"
        sed -i.tmp 's/<title>ailydian/<title>LyDian/g' "$file"
        sed -i.tmp 's/<title>AILYDIAN/<title>LyDian/g' "$file"

        # Visible text content (not in URLs or meta tags with URLs)
        sed -i.tmp 's/\([^/]\)Ailydian AI/\1LyDian AI/g' "$file"
        sed -i.tmp 's/>Ailydian</>\LyDian</g' "$file"

        # Comments
        sed -i.tmp 's/<!-- Ailydian/<!-- LyDian/g' "$file"
        sed -i.tmp 's/AILYDIAN/LYDIAN/g' "$file"

        # LocalStorage keys
        sed -i.tmp "s/ailydian_/lydian_/g" "$file"

        # CSS class names and comments
        sed -i.tmp 's/ailydian-orbit/lydian-orbit/g' "$file"

        # Count replacements after
        after_count=$(grep -oi "Ailydian\|ailydian\|AILYDIAN" "$file" | wc -l)

        replacements=$((before_count - after_count))

        if [ "$replacements" -gt 0 ]; then
            updated_files=$((updated_files + 1))
            total_replacements=$((total_replacements + replacements))
            echo "  ✓ Made $replacements replacements"
        else
            echo "  - No non-URL instances found"
        fi

        # Clean up temp files
        rm -f "${file}.tmp"
    fi
done

echo ""
echo "=================================="
echo "Update Complete!"
echo "=================================="
echo "Total HTML files scanned: $total_files"
echo "Files updated: $updated_files"
echo "Total replacements: $total_replacements"
echo ""
echo "Backups created with .bak extension"
