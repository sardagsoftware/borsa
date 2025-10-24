#!/usr/bin/env bash
# Kolay kullanım: Z.AI monitor betiğini tek komutla çalıştırır.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

if [[ -z "${Z_AI_API_KEY:-}" ]]; then
  if [[ -f ".env.local" ]]; then
    source .env.local
  elif [[ -f ".env" ]]; then
    source .env
  fi
fi

if [[ -z "${Z_AI_API_KEY:-}" ]]; then
  echo "⚠️  Z_AI_API_KEY tanımlı değil. Anahtarı terminalde export edin veya .env dosyasına ekleyin."
fi

pnpm install --frozen-lockfile >/dev/null 2>&1 || true
node scripts/zai-monitor.js
