#!/usr/bin/env bash
# ===========================
# Azure Quick Setup
# Simple & Fast | Manual Flow
# ===========================
set -euo pipefail

echo "🔐 Azure'a giriş yapılıyor..."
az login

echo "📋 Abonelik seçiliyor..."
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "✅ Subscription: $SUBSCRIPTION_ID"

az account set --subscription "$SUBSCRIPTION_ID"

echo "🏗️ App Registration oluşturuluyor..."
APP_NAME="MyAilydianApp"

# Check if exists
EXISTING_APP=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [ -n "$EXISTING_APP" ]; then
  echo "ℹ️ App zaten mevcut: $APP_NAME"
  APP_ID="$EXISTING_APP"
else
  az ad app create \
    --display-name "$APP_NAME" \
    --sign-in-audience AzureADMyOrg >/dev/null

  APP_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv)
  echo "✅ App oluşturuldu: $APP_NAME"
fi

echo "🔑 Client Secret oluşturuluyor (2 yıl)..."
SECRET=$(az ad app credential reset \
  --id "$APP_ID" \
  --append \
  --display-name "MySecret" \
  --years 2 \
  --query password -o tsv)

echo "✅ Tamamlandı!"
echo ""
echo "================================================"
echo "AZURE_CLIENT_ID=$APP_ID"
echo "AZURE_CLIENT_SECRET=$SECRET"
echo "AZURE_TENANT_ID=$(az account show --query tenantId -o tsv)"
echo "AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID"
echo "================================================"
echo ""
echo "⚠️ Bu bilgileri .env dosyanıza kaydedin!"

# Optional: Add Graph API permission
echo ""
echo "🧩 (Opsiyonel) Graph API User.Read izni eklemek ister misiniz? (y/n)"
read -r ADD_PERMISSION

if [ "$ADD_PERMISSION" = "y" ]; then
  echo "🔧 İzin ekleniyor..."
  az ad app permission add \
    --id "$APP_ID" \
    --api 00000003-0000-0000-c000-000000000000 \
    --api-permissions 741f803b-c850-494e-b5df-cde7c675a1ca=Scope >/dev/null || true

  echo "🔏 Admin consent deneniyor..."
  az ad app permission admin-consent --id "$APP_ID" >/dev/null 2>&1 && \
    echo "✅ Admin consent verildi!" || \
    echo "⚠️ Admin consent verilemedi. Portal'dan manuel onaylayın."
fi

echo ""
echo "✅ Kurulum tamamlandı!"
