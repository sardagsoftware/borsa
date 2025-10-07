#!/bin/bash
set -euo pipefail

RG="aly-core-prod-rg"
LOC="westeurope"
PROFILE="aly-fd-prod"
ENDPOINT="aly-fd-endpoint"
ORIGIN_GRP="orig-ui"
ORIGIN_HOST="ailydian.vercel.app"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 AILYDIAN AFD Creation (Verbose)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. RG
echo "1/6 Creating Resource Group..."
az group create -n "$RG" -l "$LOC" --tags project=ailydian -o table

# 2. Profile
echo ""
echo "2/6 Creating AFD Profile (Premium)..."
az afd profile create -g "$RG" -n "$PROFILE" --sku Premium_AzureFrontDoor -o table

# 3. Endpoint
echo ""
echo "3/6 Creating AFD Endpoint..."
az afd endpoint create -g "$RG" --profile-name "$PROFILE" -n "$ENDPOINT" -o table

# 4. Origin Group
echo ""
echo "4/6 Creating Origin Group..."
az afd origin-group create -g "$RG" --profile-name "$PROFILE" -n "$ORIGIN_GRP" \
  --probe-request-type GET --probe-protocol Https --probe-interval-in-seconds 60 -o table

# 5. Origin
echo ""
echo "5/6 Creating Origin..."
az afd origin create -g "$RG" --profile-name "$PROFILE" \
  --origin-group-name "$ORIGIN_GRP" -n ui-origin \
  --host-name "$ORIGIN_HOST" --https-port 443 \
  --origin-host-header "$ORIGIN_HOST" --priority 1 --weight 1000 -o table

# 6. Route
echo ""
echo "6/6 Creating Route..."
az afd route create -g "$RG" --profile-name "$PROFILE" \
  --endpoint-name "$ENDPOINT" -n route-root \
  --origin-group "$ORIGIN_GRP" \
  --supported-protocols Https Http \
  --link-to-default-domain Enabled \
  --https-redirect Enabled \
  --forwarding-protocol HttpsOnly -o table

# Get FQDN
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
AFD_FQDN=$(az afd endpoint show -g "$RG" --profile-name "$PROFILE" -n "$ENDPOINT" --query hostName -o tsv)
echo "✅ AFD Ready: $AFD_FQDN"
echo "$AFD_FQDN" > afd.txt
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
