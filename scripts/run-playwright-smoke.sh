#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm bulunamadı. Lütfen https://pnpm.io/installation adresinden yükleyin."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "📦 Bağımlılıklar kuruluyor..."
  pnpm install
fi

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3100}"
SERVER_LOG="${ROOT_DIR}/.tmp/playwright-smoke.log"

mkdir -p "$(dirname "$SERVER_LOG")"

if curl -s "http://${HOST}:${PORT}/api/health" >/dev/null 2>&1; then
  echo "❌ ${HOST}:${PORT} adresinde zaten bir servis çalışıyor. Portu boşaltıp tekrar deneyin."
  exit 1
fi

cleanup() {
  if [ -n "${SERVER_PID:-}" ] && ps -p "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "🚀 Sunucu arkaplanda başlatılıyor → http://${HOST}:${PORT}"
HOST="$HOST" PORT="$PORT" node server.js >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

echo -n "⏳ Sunucunun hazır olmasını bekliyorum"
for _ in $(seq 1 40); do
  if curl -s "http://${HOST}:${PORT}/api/health" >/dev/null 2>&1; then
    echo ""
    echo "✅ Sunucu hazır."
    break
  fi
  sleep 2
  echo -n "."
done

if ! curl -s "http://${HOST}:${PORT}/api/health" >/dev/null 2>&1; then
  echo ""
  echo "❌ Sunucu 80 saniye içinde ayağa kalkmadı. Günlükler:"
  echo "---- server.log ----"
  cat "$SERVER_LOG"
  exit 1
fi

echo "🎯 Playwright smoke senaryoları çalıştırılıyor..."
pnpm test:smoke

echo "🧹 Sunucu durduruluyor..."
