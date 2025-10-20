#!/bin/bash
# ============================================================================
# FOUNDATION DEPLOYMENT - RESOURCE GROUPS, OBSERVABILITY, IDENTITIES
# ============================================================================
set -euo pipefail

PRIMARY_REGION=${PRIMARY_REGION:-westeurope}
DR_REGION=${DR_REGION:-northeurope}
ORG_SLUG=${ORG_SLUG:-ailydian}

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}ℹ${NC} $(date -u +%H:%M:%S) | $1"; }
success() { echo -e "${GREEN}✓${NC} $(date -u +%H:%M:%S) | $1"; }

# A3: Create Resource Groups
log "Creating resource groups..."
az group create --name "${ORG_SLUG}-core-prod-rg" --location "$PRIMARY_REGION" --output none 2>/dev/null || true
az group create --name "${ORG_SLUG}-core-stg-rg" --location "$DR_REGION" --output none 2>/dev/null || true
success "Resource groups created"

# A4: Log Analytics + App Insights
log "Deploying Log Analytics workspace..."
az monitor log-analytics workspace create \
  --resource-group "${ORG_SLUG}-core-prod-rg" \
  --workspace-name "${ORG_SLUG}-prod-logs" \
  --location "$PRIMARY_REGION" \
  --sku PerGB2018 \
  --retention-time 90 \
  --output none 2>/dev/null || true

WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group "${ORG_SLUG}-core-prod-rg" \
  --workspace-name "${ORG_SLUG}-prod-logs" \
  --query id -o tsv)

log "Deploying Application Insights..."
az monitor app-insights component create \
  --app "${ORG_SLUG}-prod-insights" \
  --location "$PRIMARY_REGION" \
  --resource-group "${ORG_SLUG}-core-prod-rg" \
  --workspace "$WORKSPACE_ID" \
  --output none 2>/dev/null || true

success "Observability stack deployed"

# A5: Managed Identity
log "Creating User-Assigned Managed Identity..."
az identity create \
  --name "${ORG_SLUG}-prod-identity" \
  --resource-group "${ORG_SLUG}-core-prod-rg" \
  --location "$PRIMARY_REGION" \
  --output none 2>/dev/null || true

IDENTITY_ID=$(az identity show \
  --name "${ORG_SLUG}-prod-identity" \
  --resource-group "${ORG_SLUG}-core-prod-rg" \
  --query principalId -o tsv)

success "Managed Identity created: $IDENTITY_ID"

# A6: Key Vault
log "Creating Key Vault..."
az keyvault create \
  --name "${ORG_SLUG}-prod-kv" \
  --resource-group "${ORG_SLUG}-core-prod-rg" \
  --location "$PRIMARY_REGION" \
  --sku premium \
  --enable-soft-delete true \
  --soft-delete-retention-days 90 \
  --enable-purge-protection true \
  --output none 2>/dev/null || true

# Set access policy for managed identity
az keyvault set-policy \
  --name "${ORG_SLUG}-prod-kv" \
  --object-id "$IDENTITY_ID" \
  --secret-permissions get list \
  --output none 2>/dev/null || true

success "Key Vault created with soft-delete and purge protection"

# Budget alerts
log "Creating budget alerts..."
az consumption budget create \
  --budget-name "${ORG_SLUG}-monthly-budget" \
  --amount 3000 \
  --time-grain Monthly \
  --time-period start="2025-10-01" \
  --category Cost \
  --resource-group "${ORG_SLUG}-core-prod-rg" \
  --output none 2>/dev/null || true

success "Foundation deployment complete!"
echo ""
echo "Resource Group: ${ORG_SLUG}-core-prod-rg"
echo "Log Analytics: ${ORG_SLUG}-prod-logs"
echo "App Insights: ${ORG_SLUG}-prod-insights"
echo "Identity: ${ORG_SLUG}-prod-identity"
echo "Key Vault: ${ORG_SLUG}-prod-kv"
