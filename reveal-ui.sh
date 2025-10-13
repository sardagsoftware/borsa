#!/usr/bin/env bash
set -euo pipefail
echo "🔎 Lydian • Reveal UI (Characters & Console) — Fix & Verify"

ROOT="${ROOT:-$(pwd)}"
CONSOLE_DIR="$ROOT/apps/console"
GATEWAY_DIR="$ROOT/services/gateway"
LOG_DIR="$ROOT/logs"; mkdir -p "$LOG_DIR"

export NODE_OPTIONS="--max-old-space-size=8192"
export NEXT_PUBLIC_API_BASE_URL="http://localhost:3101"   # API ayrı port
export PROXY_API_PORT=3101
export PORT_CONSOLE=3100
export PORT_API=3101

echo "🧹 Eski süreçleri kapatıyorum…"
pkill -f "next dev -p $PORT_CONSOLE" 2>/dev/null || true
pkill -f "node.*$PORT_CONSOLE" 2>/dev/null || true
pkill -f "node.*$PORT_API" 2>/dev/null || true
lsof -ti :$PORT_CONSOLE | xargs kill -9 2>/dev/null || true
lsof -ti :$PORT_API     | xargs kill -9 2>/dev/null || true

echo "🔧 Gateway 3101…"
cd "$GATEWAY_DIR"
if command -v pnpm >/dev/null 2>&1; then pnpm i || pnpm i --no-frozen-lockfile; else npm i; fi
(PORT=$PORT_API node index.js) > "$LOG_DIR/gateway-$PORT_API.log" 2>&1 &

echo "🏗️  Console 3100 build…"
cd "$CONSOLE_DIR"
# Next rewrites (API -> 3101) garanti olsun
cat > next.config.js <<'JS'
/** @type {import('next').NextConfig} */
const API_PORT = process.env.PROXY_API_PORT || '3101';
module.exports = {
  reactStrictMode: true,
  images: { unoptimized: true },
  async rewrites() {
    return [
      { source: '/liveops/:path*',    destination: `http://localhost:${API_PORT}/liveops/:path*` },
      { source: '/kpis/:path*',       destination: `http://localhost:${API_PORT}/kpis/:path*` },
      { source: '/economy/:path*',    destination: `http://localhost:${API_PORT}/economy/:path*` },
      { source: '/experiments/:path*',destination: `http://localhost:${API_PORT}/experiments/:path*` },
      { source: '/lydian/:path*',     destination: `http://localhost:${API_PORT}/lydian/:path*` },
      { source: '/ops/:path*',        destination: `http://localhost:${API_PORT}/ops/:path*` },
    ];
  },
};
JS

if command -v pnpm >/dev/null 2>&1; then pnpm i || pnpm i --no-frozen-lockfile; else npm i; fi
pnpm -w build || pnpm build || npm run build

echo "🟢 Next dev ($PORT_CONSOLE)…"
(pnpm dev --port $PORT_CONSOLE || npm run dev -- --port $PORT_CONSOLE) > "$LOG_DIR/console-$PORT_CONSOLE.log" 2>&1 &
sleep 3

echo "⏳ Sağlık kontrolü…"
# Sağlık bekleme
for i in {1..60}; do
  sleep 1
  c=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT_CONSOLE/ || echo 000)
  a=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT_API/lydian/auth/exchange -X OPTIONS || echo 000)
  [ "$c" = "200" ] && [ "$a" != "000" ] && break
done

printf "ROOT (/)               : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT_CONSOLE/ || echo 000)"
printf "/console/characters    : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT_CONSOLE/console/characters?lang=tr&nocache=$(date +%s)" || echo 000)"
printf "/console/story         : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT_CONSOLE/console/story?lang=tr&nocache=$(date +%s)" || echo 000)"
printf "/console/liveops/s2    : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT_CONSOLE/console/liveops/s2?lang=tr&nocache=$(date +%s)" || echo 000)"
printf "/console/kpis          : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT_CONSOLE/console/kpis?lang=tr&nocache=$(date +%s)" || echo 000)"

echo "🔍 /story veri dosyaları kontrol ediliyor…"
STORY_ROOT="$ROOT/story"
missing=0
for f in story-bible.md story-timeline.json characters.json themes.json dialogue-samples.md aesthetic-palette.json telemetry-tags.yaml; do
  if [ ! -f "$STORY_ROOT/$f" ]; then echo "❌ Eksik: $f"; missing=$((missing+1)); else echo "✅ Var:   $f"; fi
done
if [ $missing -gt 0 ]; then
  echo "⚠️  Yukarıdaki eksikleri /story altına ekleyin; Story/Characters ekranları boş görünebilir."
fi

# i18n kontrol (TR zorunlu, AR/RTL önerilir)
I18N1="$CONSOLE_DIR/public/i18n/tr/common.json"
I18N2="$CONSOLE_DIR/public/i18n/ar/common.json"
[ -f "$I18N1" ] && echo "✅ i18n TR hazır" || echo "⚠️ i18n TR common.json eksik (UI bazı metinleri boş gösterebilir)."
[ -f "$I18N2" ] && echo "✅ i18n AR (RTL) hazır" || echo "ℹ️ i18n AR opsiyonel"

# Tarayıcıyı cache-bypass ile aç (Service Worker etkisini kırmak için)
URL_ROOT="http://localhost:$PORT_CONSOLE/?nocache=$(date +%s)"
URL_CHAR="http://localhost:$PORT_CONSOLE/console/characters?lang=tr&nocache=$(date +%s)"
URL_STOR="http://localhost:$PORT_CONSOLE/console/story?lang=tr&nocache=$(date +%s)"
echo "🔗 Açılıyor: $URL_ROOT"
case "$OSTYPE" in
  darwin*) open "$URL_ROOT" >/dev/null 2>&1 || true; open "$URL_CHAR" >/dev/null 2>&1 || true; open "$URL_STOR" >/dev/null 2>&1 || true ;;
  linux*) xdg-open "$URL_ROOT" >/dev/null 2>&1 || true ;;
  msys*)  start "" "$URL_ROOT" ;;
esac

echo "📄 Loglar:"
echo "  • $LOG_DIR/console-$PORT_CONSOLE.log"
echo "  • $LOG_DIR/gateway-$PORT_API.log"
echo "✅ Reveal UI tamam. Root=3100, API=3101. Oyun panelleri /console/* altında ayrıldı."
