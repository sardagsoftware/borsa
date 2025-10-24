#!/bin/bash

##############################################################################
# AI MODEL NAME OBFUSCATION SCRIPT
# White-Hat Security: Active
# Purpose: Hide AI model names from frontend source code
##############################################################################

echo "🔒 AI Model Name Obfuscation Script"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

# Backup directory
BACKUP_DIR="backups/model-obfuscation-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup in: $BACKUP_DIR"
cp -r public/*.html "$BACKUP_DIR/" 2>/dev/null || true

echo ""
echo "🔍 Replacing AI model names..."
echo ""

# Replacement mapping (case-insensitive)
declare -A REPLACEMENTS=(
    ["Claude"]="Enterprise AI"
    ["claude"]="enterprise-ai"
    ["Anthropic"]="Advanced AI Platform"
    ["anthropic"]="advanced-ai"
    ["Claude 3.5 Sonnet"]="Ultra Intelligence Model"
    ["Claude 3 Opus"]="Premium Intelligence Model"
    ["Claude 3 Sonnet"]="Advanced Intelligence Model"
    ["Claude 3 Haiku"]="Efficient Intelligence Model"
    ["claude-3-5-sonnet"]="ultra-intelligence-v3"
    ["claude-3-opus"]="premium-intelligence-v2"
    ["claude-3-sonnet"]="advanced-intelligence-v2"
    ["claude-3-haiku"]="efficient-intelligence-v1"
    ["Powered by Claude"]="Powered by LyDian AI"
    ["powered by Claude"]="powered by LyDian AI"
    ["Using Claude"]="Using Advanced AI"
    ["uses Claude"]="uses Advanced AI"
)

# Process all HTML files
for file in public/*.html; do
    if [ -f "$file" ]; then
        echo "  Processing: $(basename "$file")"

        # Create temporary file
        temp_file="${file}.tmp"
        cp "$file" "$temp_file"

        # Apply replacements (case-sensitive for exact matches)
        sed -i '' \
            -e 's/Claude 3\.5 Sonnet/Ultra Intelligence Model/g' \
            -e 's/Claude 3 Opus/Premium Intelligence Model/g' \
            -e 's/Claude 3 Sonnet/Advanced Intelligence Model/g' \
            -e 's/Claude 3 Haiku/Efficient Intelligence Model/g' \
            -e 's/claude-3-5-sonnet/ultra-intelligence-v3/g' \
            -e 's/claude-3-opus/premium-intelligence-v2/g' \
            -e 's/claude-3-sonnet/advanced-intelligence-v2/g' \
            -e 's/claude-3-haiku/efficient-intelligence-v1/g' \
            -e 's/Powered by Claude/Powered by LyDian AI/g' \
            -e 's/powered by Claude/powered by LyDian AI/g' \
            -e 's/Using Claude/Using Advanced AI/g' \
            -e 's/uses Claude/uses Advanced AI/g' \
            -e 's/Anthropic/Advanced AI Platform/g' \
            -e 's/anthropic/advanced-ai-platform/g' \
            -e 's/Claude Code/LyDian Development Assistant/g' \
            -e 's/Claude AI/LyDian AI/g' \
            -e 's/Claude/Enterprise AI/g' \
            -e 's/claude/enterprise-ai/g' \
            "$temp_file"

        # Move temporary file back
        mv "$temp_file" "$file"
    fi
done

echo ""
echo "🔐 Obfuscating model references in JavaScript..."
echo ""

# Process JavaScript files
for file in public/js/*.js; do
    if [ -f "$file" ]; then
        echo "  Processing: $(basename "$file")"

        temp_file="${file}.tmp"
        cp "$file" "$temp_file"

        sed -i '' \
            -e 's/"claude-3-5-sonnet"/"ultra-intelligence-v3"/g' \
            -e 's/"claude-3-opus"/"premium-intelligence-v2"/g' \
            -e 's/"claude-3-sonnet"/"advanced-intelligence-v2"/g' \
            -e 's/"claude-3-haiku"/"efficient-intelligence-v1"/g' \
            -e "s/'claude-3-5-sonnet'/'ultra-intelligence-v3'/g" \
            -e "s/'claude-3-opus'/'premium-intelligence-v2'/g" \
            -e "s/'claude-3-sonnet'/'advanced-intelligence-v2'/g" \
            -e "s/'claude-3-haiku'/'efficient-intelligence-v1'/g" \
            -e 's/Claude/EnterpriseAI/g' \
            -e 's/Anthropic/AdvancedAIPlatform/g' \
            "$temp_file"

        mv "$temp_file" "$file"
    fi
done

echo ""
echo "✅ Obfuscation Complete!"
echo ""
echo "📊 Summary:"
echo "  • Backup created: $BACKUP_DIR"
echo "  • HTML files processed"
echo "  • JavaScript files processed"
echo "  • Model names hidden from public view"
echo ""
echo "🔍 Verification:"
remaining=$(grep -r "Claude\|Anthropic" public/*.html 2>/dev/null | grep -v "LyDian" | wc -l)
echo "  • Remaining visible references: $remaining"

if [ "$remaining" -gt 0 ]; then
    echo ""
    echo "⚠️  Warning: Some references may still be visible"
    echo "  Manual review recommended for:"
    grep -r "Claude\|Anthropic" public/*.html 2>/dev/null | grep -v "LyDian" | head -5
else
    echo "  ✅ All references successfully obfuscated!"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🎯 Security Enhancement Complete"
