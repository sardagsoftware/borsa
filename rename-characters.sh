#!/usr/bin/env bash
set -euo pipefail
echo "📝 Rename Characters: Elif Aras → Elif Melisa Sarı, Ferhat Demir → Melih Sarı"

ROOT="${ROOT:-$(pwd)}"
STORY="$ROOT/story"
APP="$ROOT/apps/console"
LOG="$ROOT/logs/rename-characters.log"
mkdir -p logs

# ---- 0) Kontrol & yedek ----
if ! command -v jq >/dev/null 2>&1; then echo "❌ jq gerekli (JSON için)"; exit 1; fi
[ -f "$STORY/characters.json" ] || { echo "❌ $STORY/characters.json bulunamadı"; exit 1; }
cp "$STORY/characters.json" "$STORY/characters.json.bak.$(date +%Y%m%d-%H%M)" || true

# ---- 1) characters.json içinde isimleri değiştir ----
# Destek: dizi veya {characters:[...]} olabilir → normalize ederek güncelle
TMP="$STORY/.characters.tmp.json"
jq '
  def rename(nameOld; nameNew):
    if type=="array" then
      map( if (.name == nameOld) then .name = nameNew else . end )
    else
      if has("characters") and (.characters|type=="object")
      then .characters = (.characters | to_entries | map(.value | if (.name == nameOld) then .name = nameNew else . end) | from_entries)
      else .
      end
    end;

  . as $root
  | ($root | rename("Elif Aras"; "Elif Melisa Sarı")
                | rename("Ferhat Demir"; "Melih Sarı"))
' "$STORY/characters.json" > "$TMP" && mv "$TMP" "$STORY/characters.json"

echo "✅ characters.json güncellendi" | tee -a "$LOG"

# ---- 2) Dokümanlarda (story-bible.md, dialogue-samples.md) isimleri değiştir ----
for f in "story-bible.md" "dialogue-samples.md"; do
  [ -f "$STORY/$f" ] || continue
  cp "$STORY/$f" "$STORY/$f.bak.$(date +%Y%m%d-%H%M)" || true
  # dikkat: yalnız tam ad eşleşmeleri
  sed -i '' -e 's/\bElif Aras\b/Elif Melisa Sarı/g' "$STORY/$f" 2>/dev/null || \
  sed -i -e 's/\bElif Aras\b/Elif Melisa Sarı/g' "$STORY/$f"
  sed -i '' -e 's/\bFerhat Demir\b/Melih Sarı/g' "$STORY/$f" 2>/dev/null || \
  sed -i -e 's/\bFerhat Demir\b/Melih Sarı/g' "$STORY/$f"
done
echo "✅ story-bible.md / dialogue-samples.md güncellendi (varsa)" | tee -a "$LOG"

echo "✅ İsim değişikliği tamam — Elif: 'Elif Melisa Sarı', Ferhat: 'Melih Sarı'."
echo "ℹ️ Geri almak için: characters.json.bak.* dosyasını geri kopyalayabilirsin."
