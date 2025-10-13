#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)"
pass=0; fail=0
ok(){ echo "✅ $1"; pass=$((pass+1)); }
ko(){ echo "❌ $1"; fail=$((fail+1)); }

echo "🔎 Lydian Phase Audit v2"
echo "📁 $ROOT"

has(){ [ -e "$1" ] || ls $1 >/dev/null 2>&1; }

# Proje tipi algıla
MODE="web"
has "GameProject.uproject" && MODE="game"
echo "🧭 MODE=$MODE"

# 3100 servis kontrolü (web)
srv_up=0
if [ "$MODE" = "web" ]; then
  if curl -s -m 2 http://localhost:3100/api/health >/dev/null; then srv_up=1; fi
fi

echo "— Docs —"
has docs/LICENSES.md && ok "Lisans dosyaları" || ko "Lisans dosyaları (docs/LICENSES.md)"
has docs/CERT-CHECKLISTS.md && ok "Sertifikasyon checklistleri" || ko "Sertifikasyon checklistleri (docs/CERT-CHECKLISTS.md)"

if [ "$MODE" = "web" ]; then
  echo "— Web Sağlık —"
  if [ $srv_up -eq 1 ]; then
    curl -fsS -m 3 http://localhost:3100/api/health >/dev/null && ok "API health 200" || ko "API health"
    curl -fsS -m 3 http://localhost:3100/ops/canary/feature-flags.json >/dev/null && ok "Feature flags 200" || ko "Feature flags"
    curl -fsS -m 3 http://localhost:3100/i18n/tr/common.json >/dev/null && ok "i18n TR bundle" || ko "i18n TR bundle"
  else
    echo "ℹ️  3100 kapalı, sağlık kontrolleri atlandı."
  fi
  echo "— i18n —"
  has apps/console/src/i18n/locales/tr/common.json && ok "TR locale" || ko "TR locale yok"
  has apps/console/src/i18n/locales/ar/common.json && ok "AR locale (RTL)" || ko "AR locale yok"
else
  echo "— Game Artefacts —"
  has Build/CI || ko "CI klasörü (Build/CI/)"
  has Content/Levels || ko "Levels klasörü (Content/Levels)"
  has Plugins/LydianSDK || ko "LydianSDK plugin"
fi

echo "— Sonuç —"
echo "PASS=$pass  FAIL=$fail"
[ $fail -le 2 ] && echo "➡️ FAZ İLERLEME: UYGUN" || echo "➡️ DÜZELTME GEREK"
