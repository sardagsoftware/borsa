#!/bin/bash
# Script to replace CORS wildcards with secure CORS handler
# Fixes HIGH severity security vulnerability across all API endpoints

set -e

echo "🔧 CORS Wildcard Security Fix Script"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
FIXED=0
SKIPPED=0
ERRORS=0

# Backup directory
BACKUP_DIR="/home/lydian/Desktop/ailydian-ultra-pro/.cors-backups-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Backups will be saved to: $BACKUP_DIR"
echo ""

# Find all files with wildcard CORS
FILES=$(grep -rl "setHeader.*Access-Control-Allow-Origin.*\*" /home/lydian/Desktop/ailydian-ultra-pro/api/ 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "${GREEN}✓ No CORS wildcards found! System is secure.${NC}"
  exit 0
fi

echo "Found $(echo "$FILES" | wc -l) files with wildcard CORS"
echo ""

for FILE in $FILES; do
  echo "Processing: $FILE"

  # Skip if already uses handleCORS
  if grep -q "handleCORS" "$FILE"; then
    echo "  ${YELLOW}⊙ Already uses secure CORS handler - SKIPPED${NC}"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Create backup
  BACKUP_FILE="$BACKUP_DIR/$(basename "$FILE").bak"
  cp "$FILE" "$BACKUP_FILE"

  # Create temporary file
  TEMP_FILE=$(mktemp)

  # Check if file already imports cors-handler
  HAS_IMPORT=$(grep -c "require.*cors-handler" "$FILE" || echo "0")

  # Add import at the top if not present
  if [ "$HAS_IMPORT" = "0" ]; then
    # Find the right place to add import (after other requires)
    awk '
      BEGIN { imported = 0 }
      /^const.*require.*\(/ {
        print
        if (!imported) {
          print "const { handleCORS } = require('"'"'../middleware/cors-handler'"'"');"
          imported = 1
        }
        next
      }
      { print }
    ' "$FILE" > "$TEMP_FILE.1"
  else
    cp "$FILE" "$TEMP_FILE.1"
  fi

  # Replace wildcard CORS with secure handler
  sed -E '
    # Remove old wildcard CORS headers
    /res\.setHeader\('"'"'Access-Control-Allow-Origin'"'"',.*\*.*\)/d
    /res\.setHeader\('"'"'Access-Control-Allow-Methods'"'"'/d
    /res\.setHeader\('"'"'Access-Control-Allow-Headers'"'"'/d
    /res\.setHeader\('"'"'Access-Control-Allow-Credentials'"'"'/d

    # Replace OPTIONS handling
    s/if \(req\.method === '"'"'OPTIONS'"'"'\) \{/if (handleCORS(req, res)) return;/g
  ' "$TEMP_FILE.1" > "$TEMP_FILE"

  # Verify the temp file is not empty
  if [ ! -s "$TEMP_FILE" ]; then
    echo "  ${RED}✗ ERROR: Generated file is empty - SKIPPED${NC}"
    ERRORS=$((ERRORS + 1))
    rm -f "$TEMP_FILE" "$TEMP_FILE.1"
    continue
  fi

  # Apply changes
  mv "$TEMP_FILE" "$FILE"
  rm -f "$TEMP_FILE.1"

  echo "  ${GREEN}✓ FIXED${NC}"
  FIXED=$((FIXED + 1))
done

echo ""
echo "===================================="
echo "📊 SUMMARY"
echo "===================================="
echo "${GREEN}✓ Fixed:${NC}   $FIXED files"
echo "${YELLOW}⊙ Skipped:${NC} $SKIPPED files (already secure)"
echo "${RED}✗ Errors:${NC}  $ERRORS files"
echo ""
echo "📦 Backups saved to: $BACKUP_DIR"
echo ""

if [ $FIXED -gt 0 ]; then
  echo "${GREEN}✓ CORS security fixes applied successfully!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Review changes: git diff"
  echo "2. Test endpoints: npm test"
  echo "3. Commit changes: git add . && git commit -m 'security: Fix CORS wildcard vulnerabilities'"
  echo "4. Deploy to production"
else
  echo "${YELLOW}⊙ No changes needed - system already secure${NC}"
fi
