#!/bin/bash
###############################################################################
# AI MODEL NAME OBFUSCATION SCRIPT
# Replaces all AI provider/model names in HTML/JS files
# SECURITY: Protects trade secrets and competitive advantage
###############################################################################

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🔒 AI Model Name Obfuscation Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Project Root: $PROJECT_ROOT"
echo ""

# Backup directory
BACKUP_DIR="$PROJECT_ROOT/ops/backups/pre-obfuscation-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backups in: $BACKUP_DIR"

# Find all HTML and JS files (excluding node_modules, backups, vendor)
FILES=$(find "$PROJECT_ROOT/public" -type f \( -name "*.html" -o -name "*.js" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/backups/*" \
  ! -path "*/vendor/*" \
  ! -path "*/.git/*")

FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo "📊 Found $FILE_COUNT files to process"
echo ""

# Counter
PROCESSED=0
MODIFIED=0

# Process each file
while IFS= read -r file; do
  if [ -f "$file" ]; then
    # Create backup
    RELATIVE_PATH="${file#$PROJECT_ROOT/}"
    BACKUP_FILE="$BACKUP_DIR/$RELATIVE_PATH"
    mkdir -p "$(dirname "$BACKUP_FILE")"
    cp "$file" "$BACKUP_FILE"

    # Check if file contains AI model names
    if grep -q -i -E 'claude|anthropic|openai|chatgpt|gpt-4|gpt-3|gemini|groq|llama|meta ai' "$file"; then
      echo "✏️  Processing: $RELATIVE_PATH"

      # Create temp file
      TEMP_FILE="${file}.tmp"

      # Perform replacements (case-insensitive)
      sed -E \
        -e 's/\bClaude\b/Neural-Alpha/gI' \
        -e 's/\bclaude-3-opus\b/neural-alpha-pro/gI' \
        -e 's/\bclaude-3-sonnet\b/neural-alpha-standard/gI' \
        -e 's/\bclaude-3-haiku\b/neural-alpha-lite/gI' \
        -e 's/\bclaude-3\b/neural-alpha-3/gI' \
        -e 's/\bclaude-2\b/neural-alpha-2/gI' \
        -e 's/\bAnthropic\b/LyDian AI Systems/gI' \
        -e 's/\banthropic\b/lydian-ai-systems/gI' \
        -e 's/\bOpenAI\b/Neural Provider/gI' \
        -e 's/\bopenai\b/neural-provider/gI' \
        -e 's/\bChatGPT\b/LyDian Chat/gI' \
        -e 's/\bchatgpt\b/lydian-chat/gI' \
        -e 's/\bGPT-4o\b/Advanced-X4-Optimized/gI' \
        -e 's/\bgpt-4o\b/advanced-x4-optimized/gI' \
        -e 's/\bGPT-4 Turbo\b/Advanced-X4-Turbo/gI' \
        -e 's/\bgpt-4-turbo\b/advanced-x4-turbo/gI' \
        -e 's/\bGPT-4\b/Advanced-X4/gI' \
        -e 's/\bgpt-4\b/advanced-x4/gI' \
        -e 's/\bGPT-3\.5\b/Standard-X3/gI' \
        -e 's/\bgpt-3\.5\b/standard-x3/gI' \
        -e 's/\bGPT-3\b/Standard-X3/gI' \
        -e 's/\bgpt-3\b/standard-x3/gI' \
        -e 's/\bGemini Pro\b/Neural-G-Pro/gI' \
        -e 's/\bgemini-pro\b/neural-g-pro/gI' \
        -e 's/\bGemini\b/Neural-G/gI' \
        -e 's/\bgemini\b/neural-g/gI' \
        -e 's/\bGroq\b/Inference-Engine-Q/gI' \
        -e 's/\bgroq\b/inference-engine-q/gI' \
        -e 's/\bLLaMA 3\b/Open-Model-L3/gI' \
        -e 's/\bllama-3\b/open-model-l3/gI' \
        -e 's/\bLlama 3\b/Open-Model-L3/gI' \
        -e 's/\bLLaMA\b/Open-Model-L/gI' \
        -e 's/\bllama\b/open-model-l/gI' \
        -e 's/\bLlama\b/Open-Model-L/gI' \
        -e 's/\bMeta AI\b/Neural Provider M/gI' \
        -e 's/\bmeta-ai\b/neural-provider-m/gI' \
        -e 's/\bMistral\b/Neural-M/gI' \
        -e 's/\bmistral\b/neural-m/gI' \
        -e 's/\bDALL-E\b/Image-Model-E/gI' \
        -e 's/\bdall-e\b/image-model-e/gI' \
        -e 's/\bWhisper\b/Audio-Model-W/gI' \
        -e 's/\bwhisper\b/audio-model-w/gI' \
        -e 's/\bBard\b/LyDian Assistant/gI' \
        -e 's/\bbard\b/lydian-assistant/gI' \
        "$file" > "$TEMP_FILE"

      # Replace original file
      mv "$TEMP_FILE" "$file"

      MODIFIED=$((MODIFIED + 1))
      echo "   ✅ Modified"
    fi

    PROCESSED=$((PROCESSED + 1))
  fi
done <<< "$FILES"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ OBFUSCATION COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Files processed: $PROCESSED"
echo "✏️  Files modified: $MODIFIED"
echo "💾 Backups saved to: $BACKUP_DIR"
echo ""
echo "🔍 Verification:"
echo "   Run: grep -r 'Claude\|OpenAI\|GPT-4' public/ --include='*.html' --include='*.js' | wc -l"
echo "   Expected: 0 (or very few in comments/strings)"
echo ""
