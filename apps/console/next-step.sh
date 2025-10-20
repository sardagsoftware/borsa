#!/usr/bin/env bash
set -euo pipefail
echo "🚀 Next Step Runner — console build + dev + health"

export NODE_OPTIONS="--max-old-space-size=8192"
export NEXT_PUBLIC_API_BASE_URL="http://localhost:3100"

# 1) Already in correct directory (apps/console)
echo "📂 Working directory: $(pwd)"

# 2) Bağımlılıklar
echo "📦 Installing dependencies..."
if command -v pnpm >/dev/null 2>&1; then 
  pnpm i || pnpm i --no-frozen-lockfile
else 
  npm i
fi

# 3) TypeScript için hızlı tip kontrolü (hata satırını görmek için)
echo "🔍 Running TypeScript check..."
pnpm dlx tsc --noEmit || true

# 4) Build
echo "🏗️  Building application..."
pnpm build || npm run build || exit 1

# 5) 3100'u boşalt ve dev'i başlat
echo "🧹 Cleaning port 3100..."
pkill -f "next dev -p 3100" 2>/dev/null || true
lsof -ti :3100 | xargs kill -9 2>/dev/null || true

echo "🚀 Starting dev server..."
(pnpm dev --port 3100 || npm run dev -- --port 3100) > /tmp/console-dev.log 2>&1 &

# 6) Sağlık kontrolü
echo "⏳ Server ayağa kalkıyor…"
for i in {1..60}; do
  sleep 1
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/ 2>/dev/null || echo 000)
  if [ "$code" = "200" ]; then
    echo "✅ Server ready!"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "❌ Timeout waiting for server"
    exit 1
  fi
done

echo ""
echo "📊 Health Check Results:"
printf "ROOT (/)           : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/ 2>/dev/null || echo 000)"
printf "/console/characters: %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/console/characters 2>/dev/null || echo 000)"
printf "/console/story     : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/console/story 2>/dev/null || echo 000)"
printf "/console/liveops/s2: %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/console/liveops/s2 2>/dev/null || echo 000)"
printf "/console/kpis      : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/console/kpis 2>/dev/null || echo 000)"

echo ""
echo "✅ Bitti. Tarayıcıdan: http://localhost:3100"
