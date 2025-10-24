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

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "⚠️  .env dosyası bulunamadı. Örnek dosyayı aşağıdaki komutla kopyalayın:"
  echo "    cp .env.example .env"
fi

export HOST="${HOST:-127.0.0.1}"
export PORT="${PORT:-3100}"

echo "🚀 Sunucu başlatılıyor → http://${HOST}:${PORT}"
echo "👉 Çıkmak için Ctrl+C"

pnpm dev
