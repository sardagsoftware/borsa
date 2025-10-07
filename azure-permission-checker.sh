#!/usr/bin/env bash
# ===========================
# Azure Permission Checker
# White-Hat | 0-Error | Read-Only
# ===========================
set -euo pipefail

echo "🔐 Azure'a giriş yapılıyor..."
az login --use-device-code >/dev/null

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
USER_ID=$(az ad signed-in-user show --query id -o tsv)
USER_UPN=$(az ad signed-in-user show --query userPrincipalName -o tsv)

echo "✅ Kullanıcı: $USER_UPN"
echo "   Tenant:   $TENANT_ID"
echo "   Sub:      $SUBSCRIPTION_ID"

echo "🔎 Rol atamaları kontrol ediliyor..."
ASSIGNMENTS=$(az role assignment list --assignee $USER_ID --query "[].roleDefinitionName" -o tsv)

echo "Kullanıcı Rolleriniz:"
echo "$ASSIGNMENTS"

echo "-----------------------------"
echo "⚡ Kritik Roller:"
echo "- Application Administrator"
echo "- Cloud Application Administrator"
echo "- Privileged Role Administrator"
echo "- Owner (sub level)"
echo "- Contributor (sub level)"

MISSING=0
for role in "Application Administrator" "Cloud Application Administrator" "Privileged Role Administrator"; do
  if echo "$ASSIGNMENTS" | grep -q "$role"; then
    echo "✅ $role mevcut"
  else
    echo "❌ $role yok"
    MISSING=1
  fi
done

if [ $MISSING -eq 1 ]; then
  echo "⚠️ Eksik roller var. Portal'da global admin / directory admin onayı gerekebilir."
else
  echo "🎉 Tüm gerekli roller var. API Key / App Registration oluşturabilirsin."
fi
