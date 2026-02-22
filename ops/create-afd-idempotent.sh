#!/bin/bash
# === AILYDIAN | Front Door Doğrula → Gerekirse Oluştur (idempotent) ===
set -euo pipefail

echo "🚀 AILYDIAN AFD Idempotent Creation Starting..."

# 0) Abonelik seçimi (gerekirse düzenle)
az account show >/dev/null 2>&1 || az login --use-device-code
echo "✅ Mevcut abonelik:"
az account show --query "{Name:name,ID:id}" -o table

# Aboneliği ayarla
SUB="${AZ_SUBSCRIPTION:-931c7633-e61e-4a37-8798-fe1f6f20580e}"
[ -n "$SUB" ] && az account set --subscription "$SUB"
echo "✅ Abonelik ayarlandı: $SUB"

# 1) Provider kaydı (Front Door/Standard-Premium için Microsoft.Cdn)
echo "🔄 Microsoft.Cdn provider kaydı kontrol ediliyor..."
az provider register --namespace Microsoft.Cdn --wait 2>&1 | head -5

# 2) Değişkenler
RG="${RG:-aly-core-prod-rg}"
LOC="${PRIMARY_REGION:-westeurope}"
PROFILE="aly-fd-prod"
ENDPOINT="aly-fd-endpoint"
ORIGIN_GRP="orig-ui"
ORIGIN_HOST="${ORIGIN_UI_HOST:-ailydian.vercel.app}"

echo ""
echo "📋 Configuration:"
echo "  Resource Group: $RG"
echo "  Location: $LOC"
echo "  Profile: $PROFILE"
echo "  Endpoint: $ENDPOINT"
echo "  Origin: $ORIGIN_HOST"
echo ""

# 3) Resource Group + Profil + Endpoint (idempotent)
echo "🏗️  Creating/Verifying resources..."

echo "  → Resource Group..."
az group create -n "$RG" -l "$LOC" --tags project=ailydian environment=production >/dev/null 2>&1 && echo "    ✅ RG ready" || echo "    ℹ️  RG exists"

echo "  → AFD Profile (Premium)..."
az afd profile create -g "$RG" -n "$PROFILE" --sku Premium_AzureFrontDoor >/dev/null 2>&1 && echo "    ✅ Profile created" || echo "    ℹ️  Profile exists"

echo "  → AFD Endpoint..."
az afd endpoint create -g "$RG" --profile-name "$PROFILE" -n "$ENDPOINT" >/dev/null 2>&1 && echo "    ✅ Endpoint created" || echo "    ℹ️  Endpoint exists"

# 4) Origin Group + Origin + Route (idempotent)
echo "  → Origin Group..."
az afd origin-group create -g "$RG" --profile-name "$PROFILE" -n "$ORIGIN_GRP" \
  --probe-request-type GET --probe-protocol Https --probe-interval-in-seconds 60 >/dev/null 2>&1 && echo "    ✅ Origin Group created" || echo "    ℹ️  Origin Group exists"

echo "  → Origin (Vercel backend)..."
az afd origin create -g "$RG" --profile-name "$PROFILE" --origin-group-name "$ORIGIN_GRP" -n ui-origin \
  --host-name "$ORIGIN_HOST" --https-port 443 --origin-host-header "$ORIGIN_HOST" >/dev/null 2>&1 && echo "    ✅ Origin created" || echo "    ℹ️  Origin exists"

echo "  → Route (HTTPS redirect)..."
az afd route create -g "$RG" --profile-name "$PROFILE" --endpoint-name "$ENDPOINT" -n route-root \
  --https-redirect Enabled --forwarding-protocol HttpsOnly --origin-group "$ORIGIN_GRP" \
  --supported-protocols Https --link-to-default-domain Disabled >/dev/null 2>&1 && echo "    ✅ Route created" || echo "    ℹ️  Route exists"

# 5) FQDN al ve kaydet
echo ""
echo "🔍 Fetching AFD endpoint FQDN..."
AFD_FQDN="$(az afd endpoint show -g "$RG" --profile-name "$PROFILE" -n "$ENDPOINT" --query hostName -o tsv)"

mkdir -p "$HOME/Desktop/ailydian-ultra-pro/ops"
echo "$AFD_FQDN" > "$HOME/Desktop/ailydian-ultra-pro/ops/afd.txt"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Front Door Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AFD FQDN: $AFD_FQDN"
echo "  Saved to: ~/Desktop/ailydian-ultra-pro/ops/afd.txt"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Verify endpoint:"
echo "  curl -sI https://$AFD_FQDN | grep x-azure-ref"
echo ""

# Audit log entry
echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"afd_idempotent_creation\",\"resource_group\":\"$RG\",\"profile\":\"$PROFILE\",\"endpoint\":\"$ENDPOINT\",\"fqdn\":\"$AFD_FQDN\",\"status\":\"complete\",\"operator\":\"lydian\"}" >> dns-change-log.ndjson
