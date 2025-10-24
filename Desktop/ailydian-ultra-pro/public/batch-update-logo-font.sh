#!/bin/bash

# Batch update script to add Righteous font to remaining HTML files
# Files to update: medical-ai.html, files.html, changelog.html, forgot-password.html,
# lydian-hukukai.html, lydian-hukukai-pro.html, reset-password.html,
# lydian-hukukai-v2.html, index-new.html, enterprise-index.html

cd /Users/sardag/Desktop/ailydian-ultra-pro/public

FONT_FACE='        \/* Righteous font for Logo - Inline for instant load *\/\
        @font-face {\
            font-family: '\''Righteous'\'';\
            font-style: normal;\
            font-weight: 400;\
            font-display: block;\
            src: url(https:\/\/fonts.gstatic.com\/s\/righteous\/v13\/1cXxaUPXBpj2rGoU7C9mj3uEicG01A.woff2) format('\''woff2'\'');\
        }'

FILES=(
  "medical-ai.html"
  "files.html"
  "changelog.html"
  "forgot-password.html"
  "lydian-hukukai.html"
  "lydian-hukukai-pro.html"
  "reset-password.html"
  "lydian-hukukai-v2.html"
  "index-new.html"
  "enterprise-index.html"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Check if file already has Righteous @font-face
    if ! grep -q "@font-face.*Righteous\|Righteous.*@font-face" "$file"; then
      # Find the first <style> tag and add @font-face after it
      # This is a placeholder - actual implementation would need file-specific handling
      echo "  - Needs @font-face addition for $file"
    fi

    # Check if .logo has font-family
    if grep -q "\.logo {" "$file"; then
      if ! grep -A 5 "\.logo {" "$file" | grep -q "font-family.*Righteous"; then
        echo "  - Needs font-family addition to .logo in $file"
      fi
    fi
  fi
done

echo "Analysis complete. Manual updates recommended for precise control."
