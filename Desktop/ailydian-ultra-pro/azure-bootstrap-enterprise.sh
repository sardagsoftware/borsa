#!/usr/bin/env bash
# ============================================
# Ailydian | Azure API Bootstrap (Org + Borsa)
# Mod: White-Hat | 0-Error | Idempotent | Non-Interactive (min)
# ============================================
set -euo pipefail

### 0) Guardrails
command -v az >/dev/null 2>&1 || { echo "❌ Azure CLI yüklü değil."; exit 1; }
echo "🔐 Azure'a giriş başlatılıyor (device code)..."
az login --use-device-code >/dev/null

### 1) Abonelik ve bölge
SUBSCRIPTION_ID="$(az account show --query id -o tsv)"
TENANT_ID="$(az account show --query tenantId -o tsv)"
LOCATION="westeurope"
RG="Ailydian-RG"

az account set --subscription "$SUBSCRIPTION_ID"
az group show -n "$RG" >/dev/null 2>&1 || az group create -n "$RG" -l "$LOCATION" >/dev/null
echo "✅ Subscription: $SUBSCRIPTION_ID | Tenant: $TENANT_ID | RG: $RG | Region: $LOCATION"

### 2) App Registration + Service Principal (Ailydian-Gateway)
APP_NAME="Ailydian-Gateway"
EXIST_APP_ID="$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv || true)"
if [[ -z "${EXIST_APP_ID:-}" ]]; then
  echo "🏗️ App Registration oluşturuluyor: $APP_NAME"
  az ad app create \
    --display-name "$APP_NAME" \
    --sign-in-audience "AzureADMyOrg" \
    --enable-id-token-issuance true \
    --enable-access-token-issuance true >/dev/null
  APP_ID="$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv)"
else
  APP_ID="$EXIST_APP_ID"
  echo "ℹ️ App zaten mevcut: $APP_NAME ($APP_ID)"
fi

# Service Principal (kurumsal nesne) — idempotent
EXIST_SP="$(az ad sp list --filter "appId eq '$APP_ID'" --query "[0].appId" -o tsv || true)"
if [[ -z "${EXIST_SP:-}" ]]; then
  echo "🔑 Service Principal oluşturuluyor…"
  az ad sp create --id "$APP_ID" >/dev/null
else
  echo "ℹ️ Service Principal zaten mevcut."
fi

### 3) Client Secret (2 yıl)
echo "🔐 Client Secret üretiliyor (2 yıl)…"
SECRET_VALUE="$(az ad app credential reset \
  --id "$APP_ID" \
  --append \
  --display-name "Ailydian-Secret" \
  --years 2 --query password -o tsv)"

### 4) İzinler (Microsoft Graph: User.Read – delegated)
# Not: Delegated scope için admin consent gerekebilir (global admin).
GRAPH_APP_ID="00000003-0000-0000-c000-000000000000"   # Microsoft Graph
USER_READ_SCOPE="741f803b-c850-494e-b5df-cde7c675a1ca" # User.Read
echo "🧩 Graph izinleri ekleniyor…"
az ad app permission add --id "$APP_ID" --api "$GRAPH_APP_ID" --api-permissions "${USER_READ_SCOPE}=Scope" >/dev/null || true

# Kurumda admin onayı—admin yetkisi yoksa bu adım skip olur, portalden onaylanabilir.
echo "🔏 Admin consent deneniyor (yetki yoksa atlanır)…"
az ad app permission admin-consent --id "$APP_ID" >/dev/null || echo "⚠️ Admin consent verilemedi. Portal'dan onaylayın: Entra ID → App registrations → $APP_NAME → API permissions."

### 5) Azure OpenAI (opsiyonel) — varsa anahtar/endpoint çek, yoksa SKIP
echo "🧠 Azure OpenAI kontrol ediliyor…"
az extension add -n cognitiveservices -y >/dev/null 2>&1 || az extension update -n cognitiveservices >/dev/null 2>&1 || true
OPENAI_ACCOUNT_NAME="Ailydian-OpenAI"
OPENAI_EXISTS="$(az cognitiveservices account show -g "$RG" -n "$OPENAI_ACCOUNT_NAME" --query "name" -o tsv 2>/dev/null || true)"

if [[ -z "${OPENAI_EXISTS:-}" ]]; then
  echo "ℹ️ Azure OpenAI kaynağı bulunamadı. Kurumsal erişiminiz yoksa oluşturma başarısız olabilir; bu adımı SKIP'liyoruz."
  AZURE_OPENAI_ENDPOINT=""
  AZURE_OPENAI_KEY=""
else
  AZURE_OPENAI_ENDPOINT="$(az cognitiveservices account show -g "$RG" -n "$OPENAI_ACCOUNT_NAME" --query "properties.endpoint" -o tsv)"
  AZURE_OPENAI_KEY="$(az cognitiveservices account keys list -g "$RG" -n "$OPENAI_ACCOUNT_NAME" --query key1 -o tsv)"
  echo "✅ OpenAI endpoint ve key alındı."
fi

### 6) Borsa mikroservis uçları (organizasyonel standardizasyon)
BORSA_MARKET_API="https://api.borsa.ailydian.com"
BORSA_TRADING_ENDPOINT="$BORSA_MARKET_API/trading"
BORSA_SIGNAL_ENDPOINT="$BORSA_MARKET_API/signals"

### 7) Çıktı: ENV + JSON manifest
cat > .env.borsa <<EOF
# === Azure Core ===
AZURE_TENANT_ID=$TENANT_ID
AZURE_CLIENT_ID=$APP_ID
AZURE_CLIENT_SECRET=$SECRET_VALUE
AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID
AZURE_REGION=$LOCATION
AZURE_RESOURCE_GROUP=$RG

# === Azure OpenAI (opsiyonel, yoksa boş) ===
AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_KEY=$AZURE_OPENAI_KEY

# === Borsa Microservices ===
BORSA_MARKET_API=$BORSA_MARKET_API
BORSA_TRADING_ENDPOINT=$BORSA_TRADING_ENDPOINT
BORSA_SIGNAL_ENDPOINT=$BORSA_SIGNAL_ENDPOINT
EOF

cat > azure_bootstrap_manifest.json <<EOF
{
  "tenantId": "$TENANT_ID",
  "subscriptionId": "$SUBSCRIPTION_ID",
  "resourceGroup": "$RG",
  "region": "$LOCATION",
  "app": {
    "name": "$APP_NAME",
    "clientId": "$APP_ID",
    "secretRef": "AZURE_CLIENT_SECRET",
    "graphPermissions": ["User.Read (delegated)"],
    "adminConsent": "required_if_not_granted"
  },
  "openai": {
    "accountName": "$OPENAI_ACCOUNT_NAME",
    "endpoint": "$AZURE_OPENAI_ENDPOINT",
    "keyRef": "AZURE_OPENAI_KEY"
  },
  "borsa": {
    "marketApi": "$BORSA_MARKET_API",
    "tradingEndpoint": "$BORSA_TRADING_ENDPOINT",
    "signalEndpoint": "$BORSA_SIGNAL_ENDPOINT"
  }
}
EOF

echo "✅ Kurulum tamam. Dosyalar oluşturuldu:"
echo "   - .env.borsa"
echo "   - azure_bootstrap_manifest.json"

### 8) Hızlı doğrulama çıktısı
echo "---- SUMMARY -------------------------"
echo "Tenant:        $TENANT_ID"
echo "Subscription:  $SUBSCRIPTION_ID"
echo "App (ClientID): $APP_ID"
echo "Secret:        (ENV'de)"
echo "OpenAI:        ${AZURE_OPENAI_ENDPOINT:-<yok>}"
echo "--------------------------------------"

# Yol gösterimi (portal linkleri hazırlık — kopyala/yapıştır)
echo
echo "🔎 Portal adımları (gerekirse admin onayı):"
echo "Entra ID → App registrations → $APP_NAME → API permissions → Grant admin consent"
