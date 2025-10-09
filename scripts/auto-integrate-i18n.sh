#!/bin/bash

###############################################################################
# 🌍 LyDian i18n Auto-Integration Script
#
# Tüm HTML sayfalarına otomatik i18n sistemi entegre eder
# - Locale Engine
# - Feature Flags
# - Locale Switcher
# - Otomatik dil tespiti
#
# Usage: ./scripts/auto-integrate-i18n.sh
###############################################################################

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🌍 LyDian i18n Auto-Integration                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Counters
TOTAL=0
SUCCESS=0
SKIPPED=0
FAILED=0

# I18n initialization code
read -r -d '' I18N_INIT << 'EOF' || true
    <!-- 🌍 LyDian i18n System - Auto-integrated -->
    <script src="/js/feature-flags.js"></script>
    <script src="/js/locale-engine.js"></script>
    <script src="/js/locale-switcher.js"></script>
    <script>
        (async function() {
            try {
                // 1. Initialize feature flags
                const flags = new FeatureFlags();
                await flags.init();

                // 2. Check if i18n is enabled
                if (flags.isEnabled('i18n_system_enabled')) {
                    // 3. Initialize locale engine
                    const i18n = new LocaleEngine({ defaultLocale: 'tr' });
                    await i18n.init();

                    // 4. Make available globally
                    window.i18n = i18n;

                    console.log('✅ i18n system initialized:', i18n.getCurrentLocale());
                }
            } catch (error) {
                console.warn('⚠️ i18n initialization failed:', error);
            }
        })();
    </script>
EOF

echo "📁 Scanning HTML files..."
echo ""

# Find all HTML files (excluding backups)
find public -name "*.html" -type f \
    ! -name "*backup*" \
    ! -name "*old*" \
    ! -name "*bak*" \
    ! -name "*BACKUP*" \
    ! -name "*OLD*" \
    ! -name "*demo*" | while read -r file; do

    TOTAL=$((TOTAL + 1))
    filename=$(basename "$file")

    # Skip if already has i18n
    if grep -q "locale-engine.js" "$file"; then
        echo -e "${YELLOW}⊘ $filename - Already integrated${NC}"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    # Skip if no </body> tag
    if ! grep -q "</body>" "$file"; then
        echo -e "${YELLOW}⊘ $filename - No </body> tag found${NC}"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    # Create backup
    cp "$file" "${file}.bak-i18n-$(date +%Y%m%d-%H%M%S)"

    # Insert i18n code before </body>
    awk -v i18n="$I18N_INIT" '
        /<\/body>/ {
            print i18n
        }
        { print }
    ' "$file" > "${file}.tmp"

    # Check if awk succeeded
    if [ $? -eq 0 ] && [ -s "${file}.tmp" ]; then
        mv "${file}.tmp" "$file"
        echo -e "${GREEN}✅ $filename - i18n integrated${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}❌ $filename - Integration failed${NC}"
        rm -f "${file}.tmp"
        # Restore backup
        mv "${file}.bak-i18n-"* "$file" 2>/dev/null || true
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Total files scanned: $TOTAL"
echo -e "${GREEN}✅ Successfully integrated: $SUCCESS${NC}"
echo -e "${YELLOW}⊘ Skipped: $SKIPPED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Auto-integration completed with 0 errors!${NC}"
    exit 0
else
    echo -e "${RED}⚠️ Auto-integration completed with $FAILED errors${NC}"
    exit 1
fi
