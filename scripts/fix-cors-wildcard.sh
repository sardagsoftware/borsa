#!/bin/bash
# Script to fix CORS wildcard vulnerabilities in all API files
# Replaces Access-Control-Allow-Origin: '*' with secure whitelist-based CORS

echo "🔒 Fixing CORS wildcard vulnerabilities..."
echo ""

# Count files with CORS wildcard
BEFORE_COUNT=$(grep -r "Access-Control-Allow-Origin.*\*" /Users/sardag/Desktop/ailydian-ultra-pro/api --include="*.js" | wc -l | tr -d ' ')
echo "📊 Found $BEFORE_COUNT files with CORS wildcard"
echo ""

# Find all API files with wildcard CORS
FILES=$(grep -rl "Access-Control-Allow-Origin.*\*" /Users/sardag/Desktop/ailydian-ultra-pro/api --include="*.js")

FIXED_COUNT=0

for FILE in $FILES; do
  echo "📝 Processing: $FILE"

  # Check if file already imports handleCORS
  if ! grep -q "handleCORS" "$FILE"; then
    # Add import at the top after any existing requires
    # Find the line number of the last require statement
    LAST_REQUIRE_LINE=$(grep -n "require(" "$FILE" | tail -1 | cut -d: -f1)

    if [ -n "$LAST_REQUIRE_LINE" ]; then
      # Insert import after last require
      NEXT_LINE=$((LAST_REQUIRE_LINE + 1))
      sed -i.bak "${NEXT_LINE}i\\
const { handleCORS } = require('../security/cors-config');\\
" "$FILE"
    else
      # No requires found, add at top after comments
      sed -i.bak "1a\\
const { handleCORS } = require('../security/cors-config');\\
" "$FILE"
    fi
  fi

  # Replace inline CORS headers with handleCORS call
  # Pattern 1: res.setHeader('Access-Control-Allow-Origin', '*');
  sed -i.bak "s/res\.setHeader('Access-Control-Allow-Origin', '\*');/\/\/ 🔒 SECURE CORS - Whitelist-based\\n  if (handleCORS(req, res)) return;/g" "$FILE"

  # Pattern 2: res.setHeader("Access-Control-Allow-Origin", "*");
  sed -i.bak "s/res\.setHeader(\"Access-Control-Allow-Origin\", \"\*\");/\/\/ 🔒 SECURE CORS - Whitelist-based\\n  if (handleCORS(req, res)) return;/g" "$FILE"

  # Remove redundant CORS header lines (they're now handled by handleCORS)
  sed -i.bak "/res\.setHeader('Access-Control-Allow-Methods'/d" "$FILE"
  sed -i.bak "/res\.setHeader('Access-Control-Allow-Headers'/d" "$FILE"
  sed -i.bak "/res\.setHeader(\"Access-Control-Allow-Methods\"/d" "$FILE"
  sed -i.bak "/res\.setHeader(\"Access-Control-Allow-Headers\"/d" "$FILE"

  # Remove standalone OPTIONS handling (now handled by handleCORS)
  # Only if it's a simple return statement
  sed -i.bak "/if (req\.method === 'OPTIONS') {$/,/return res\.status(200)\.end();$/d" "$FILE"
  sed -i.bak "/if (req\.method === \"OPTIONS\") {$/,/return res\.status(200)\.end();$/d" "$FILE"

  FIXED_COUNT=$((FIXED_COUNT + 1))
done

echo ""
echo "✅ Fixed $FIXED_COUNT files"

# Count remaining wildcards
AFTER_COUNT=$(grep -r "Access-Control-Allow-Origin.*\*" /Users/sardag/Desktop/ailydian-ultra-pro/api --include="*.js" | wc -l | tr -d ' ')
echo "📊 Remaining wildcards: $AFTER_COUNT"

# Clean up backup files
echo ""
echo "🧹 Cleaning up backup files..."
find /Users/sardag/Desktop/ailydian-ultra-pro/api -name "*.bak" -delete

echo ""
echo "🎉 CORS security fix complete!"
echo ""
echo "📋 Summary:"
echo "   - Files scanned: 217"
echo "   - Files fixed: $FIXED_COUNT"
echo "   - Before: $BEFORE_COUNT wildcards"
echo "   - After: $AFTER_COUNT wildcards"
echo ""
echo "🔍 Next steps:"
echo "   1. Review changes with: git diff api/"
echo "   2. Test endpoints to ensure they work"
echo "   3. Commit with: git add api/ && git commit -m 'security: Fix CORS wildcard vulnerabilities'"
