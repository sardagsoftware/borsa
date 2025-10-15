#!/bin/bash

# Fix Remaining CORS Wildcards
# Automated security fix for remaining 35 files

set -e

echo "🔍 Finding files with wildcard CORS..."

# Find all files with wildcard CORS
FILES=$(grep -r "res.setHeader('Access-Control-Allow-Origin', '\*')" api/ --include="*.js" -l)

if [ -z "$FILES" ]; then
  echo "✅ No wildcard CORS found!"
  exit 0
fi

COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo "📋 Found $COUNT files with wildcard CORS"

FIXED=0
SKIPPED=0

for FILE in $FILES; do
  echo ""
  echo "📝 Processing: $FILE"

  # Check if already using handleCORS
  if grep -q "handleCORS" "$FILE"; then
    echo "   ⏭️  Already uses handleCORS - SKIP"
    ((SKIPPED++))
    continue
  fi

  # Create backup
  cp "$FILE" "$FILE.bak-cors-$(date +%s)"

  # Check if it's a simple CORS pattern
  if grep -q "res.setHeader('Access-Control-Allow-Origin', '\*');" "$FILE" && \
     grep -q "res.setHeader('Access-Control-Allow-Methods'," "$FILE"; then

    # Calculate relative path to security/cors-config
    DEPTH=$(echo "$FILE" | grep -o "/" | wc -l)
    REL_PATH=$(printf '../%.0s' $(seq 1 $DEPTH))
    REL_PATH="${REL_PATH}security/cors-config"

    # Add import at top (after existing requires)
    sed -i '' '/^const .* = require/a\
const { handleCORS } = require('"'$REL_PATH'"');
' "$FILE" 2>/dev/null || {
      # If no requires, add after module comment
      sed -i '' '/^\*\//a\
\
const { handleCORS } = require('"'$REL_PATH'"');
' "$FILE"
    }

    # Replace CORS block with handleCORS
    sed -i '' '/res\.setHeader.*Access-Control-Allow-Origin.*\*/,/if (req\.method === .OPTIONS.)/c\
  // 🔒 SECURE CORS - Whitelist-based\
  if (handleCORS(req, res)) return;
' "$FILE"

    echo "   ✅ Fixed!"
    ((FIXED++))
  else
    echo "   ⚠️  Complex pattern - manual review needed"
    ((SKIPPED++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total files:  $COUNT"
echo "Fixed:        $FIXED"
echo "Skipped:      $SKIPPED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verify
REMAINING=$(grep -r "res.setHeader('Access-Control-Allow-Origin', '\*')" api/ --include="*.js" -l 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "🔍 Remaining wildcard CORS: $REMAINING files"

if [ "$REMAINING" -eq 0 ]; then
  echo "🎉 ALL CORS WILDCARDS FIXED!"
else
  echo "⚠️  $REMAINING files still need manual review"
fi
