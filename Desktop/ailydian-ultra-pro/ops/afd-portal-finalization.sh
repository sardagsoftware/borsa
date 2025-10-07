#!/bin/bash
# AILYDIAN - AFD Portal Finalization (No Vercel API Required)
# Provides TXT validation tokens for manual Vercel DNS entry

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

RG="${RG:-aly-core-prod-rg}"
AFD_FQDN="ailydian-production-fd-endpoint.z01.azurefd.net"
DOMAINS=( "ailydian.com" "travel.ailydian.com" "blockchain.ailydian.com" "video.ailydian.com" "borsa.ailydian.com" "newsai.earth" )

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  AILYDIAN - AFD PORTAL FINALIZATION GUIDE                  ║${NC}"
echo -e "${CYAN}║  $(date -u +"%Y-%m-%d %H:%M:%S UTC")                       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# PHASE 1: Discover Azure Resources
# =============================================================================
echo -e "${BLUE}━━━ PHASE 1: Azure Resource Discovery ━━━${NC}"
echo ""

# Try to find AFD profile via CLI
PROFILE="$(az resource list -g "$RG" --resource-type Microsoft.Cdn/profiles --query '[0].name' -o tsv 2>/dev/null || true)"
if [ -z "$PROFILE" ]; then
  PROFILE="$(az afd profile list --query '[0].name' -o tsv 2>/dev/null || true)"
fi

ENDPOINT="$(az resource list -g "$RG" --resource-type Microsoft.Cdn/profiles/afdendpoints --query '[0].name' -o tsv 2>/dev/null || true)"
if [ -z "$ENDPOINT" ]; then
  ENDPOINT="$(az afd endpoint list --query '[0].name' -o tsv 2>/dev/null || true)"
fi

if [ -n "$PROFILE" ] && [ -n "$ENDPOINT" ]; then
  echo -e "${GREEN}✅ Azure Resources Found via CLI${NC}"
  echo "   Resource Group: $RG"
  echo "   AFD Profile: $PROFILE"
  echo "   AFD Endpoint: $ENDPOINT"
  CLI_AVAILABLE=true
else
  echo -e "${YELLOW}⚠️  Azure CLI Limited Access${NC}"
  echo "   AFD was created via Azure Portal"
  echo "   Manual Portal verification required"
  CLI_AVAILABLE=false
fi
echo ""

# =============================================================================
# PHASE 2: Generate TXT Validation Instructions
# =============================================================================
echo -e "${BLUE}━━━ PHASE 2: TXT Validation Records ━━━${NC}"
echo ""

if [ "$CLI_AVAILABLE" = true ]; then
  echo -e "${YELLOW}Fetching validation tokens from Azure...${NC}"
  echo ""
  
  for FQDN in "${DOMAINS[@]}"; do
    CD="cd-$(echo "$FQDN" | tr '.' '-')"
    
    # Try to get validation token
    TOKEN="$(az afd custom-domain show -g "$RG" --profile-name "$PROFILE" --endpoint-name "$ENDPOINT" \
             --custom-domain-name "$CD" --query 'validationProperties.validationToken' -o tsv 2>/dev/null || echo '')"
    
    STATUS="$(az afd custom-domain show -g "$RG" --profile-name "$PROFILE" --endpoint-name "$ENDPOINT" \
             --custom-domain-name "$CD" --query 'validationProperties.validationState' -o tsv 2>/dev/null || echo 'Unknown')"
    
    if [ -n "$TOKEN" ]; then
      # Determine zone and host
      if [[ "$FQDN" == *.*.* ]]; then
        ZONE="${FQDN#*.}"
        HOST="_dnsauth.${FQDN%%.*}"
      else
        ZONE="$FQDN"
        HOST="_dnsauth"
      fi
      
      echo -e "${CYAN}Domain: $FQDN${NC}"
      echo "   Status: $STATUS"
      if [ "$STATUS" != "Approved" ]; then
        echo -e "   ${YELLOW}Action Required:${NC}"
        echo "   1. Go to Vercel Dashboard → $ZONE → DNS"
        echo "   2. Add TXT record:"
        echo "      Type: TXT"
        echo "      Name: $HOST"
        echo "      Value: $TOKEN"
        echo "      TTL: 300"
      else
        echo -e "   ${GREEN}Already Approved ✅${NC}"
      fi
      echo ""
    fi
  done
else
  echo -e "${YELLOW}Manual Portal Steps Required:${NC}"
  echo ""
  echo "1. Go to: Azure Portal → Front Door and CDN profiles → Your AFD"
  echo "2. Navigate: Domains → Custom domains"
  echo "3. For each domain that is NOT 'Approved':"
  echo "   a. Click domain name"
  echo "   b. Copy the validation token"
  echo "   c. Go to Vercel Dashboard → Domain DNS"
  echo "   d. Add TXT record: _dnsauth.<domain> = <token>"
  echo "   e. Wait 5-10 minutes"
  echo "   f. Return to Azure Portal and click 'Revalidate'"
  echo ""
fi

# =============================================================================
# PHASE 3: HTTPS Enablement Instructions
# =============================================================================
echo -e "${BLUE}━━━ PHASE 3: HTTPS Certificate Enablement ━━━${NC}"
echo ""

echo -e "${YELLOW}For each 'Approved' domain:${NC}"
echo ""
echo "1. Azure Portal → Front Door → Domains → Custom domains"
echo "2. Click domain name"
echo "3. HTTPS Configuration:"
echo "   - Certificate type: Azure managed"
echo "   - Minimum TLS version: 1.2"
echo "   - Click 'Update'"
echo ""
echo "4. Wait for provisioning (10-15 minutes per domain)"
echo ""

if [ "$CLI_AVAILABLE" = true ]; then
  echo -e "${YELLOW}Checking current HTTPS status...${NC}"
  echo ""
  
  for FQDN in "${DOMAINS[@]}"; do
    CD="cd-$(echo "$FQDN" | tr '.' '-')"
    
    HTTPS_STATUS="$(az afd custom-domain show -g "$RG" --profile-name "$PROFILE" --endpoint-name "$ENDPOINT" \
                    --custom-domain-name "$CD" --query 'tlsSettings.certificateType' -o tsv 2>/dev/null || echo 'None')"
    
    VALIDATION_STATUS="$(az afd custom-domain show -g "$RG" --profile-name "$PROFILE" --endpoint-name "$ENDPOINT" \
                         --custom-domain-name "$CD" --query 'validationProperties.validationState' -o tsv 2>/dev/null || echo 'Unknown')"
    
    echo -e "${CYAN}$FQDN${NC}"
    echo "   Validation: $VALIDATION_STATUS"
    echo "   HTTPS: $HTTPS_STATUS"
    
    if [ "$VALIDATION_STATUS" = "Approved" ] && [ "$HTTPS_STATUS" = "None" ]; then
      echo -e "   ${YELLOW}⚠️  Ready for HTTPS enablement${NC}"
    elif [ "$HTTPS_STATUS" != "None" ]; then
      echo -e "   ${GREEN}✅ HTTPS configured${NC}"
    fi
    echo ""
  done
fi

# =============================================================================
# PHASE 4: DNS Propagation Check
# =============================================================================
echo -e "${BLUE}━━━ PHASE 4: DNS Propagation Status ━━━${NC}"
echo ""

PROPAGATED=0
TOTAL=${#DOMAINS[@]}

for domain in "${DOMAINS[@]}"; do
  echo -e "${YELLOW}Checking: $domain${NC}"
  
  # DNS resolution
  LOCAL_IP=$(dig +short "$domain" 2>/dev/null | head -1 || echo "N/A")
  echo "   IP: $LOCAL_IP"
  
  # HTTPS headers
  if timeout 5 curl -sSI "https://$domain" 2>&1 | grep -q "x-azure-ref"; then
    echo -e "   ${GREEN}✅ Azure Front Door active${NC}"
    PROPAGATED=$((PROPAGATED + 1))
  else
    echo -e "   ${YELLOW}⏳ Still propagating to AFD${NC}"
  fi
  echo ""
done

echo -e "${BLUE}Propagation: ${PROPAGATED}/${TOTAL} domains${NC}"
if [ $PROPAGATED -eq $TOTAL ]; then
  echo -e "${GREEN}✅ All domains fully propagated${NC}"
elif [ $PROPAGATED -gt 0 ]; then
  echo -e "${YELLOW}⏳ Partial propagation${NC}"
else
  echo -e "${YELLOW}⏳ Propagation in progress (expected 5-60 minutes)${NC}"
fi
echo ""

# =============================================================================
# PHASE 5: Next Steps Summary
# =============================================================================
echo -e "${BLUE}━━━ PHASE 5: Next Steps ━━━${NC}"
echo ""

echo -e "${YELLOW}Immediate Actions:${NC}"
echo "1. Complete TXT validation for unapproved domains"
echo "2. Enable HTTPS for all approved domains"
echo "3. Monitor DNS propagation: ./monitor-propagation.sh"
echo ""

echo -e "${YELLOW}Azure Portal Setup (Remaining):${NC}"
echo "4. Create WAF policy: aly-waf-prod"
echo "5. Configure monitoring alerts (4 rules)"
echo "6. Enable diagnostic logging"
echo ""

echo -e "${CYAN}📖 Complete Guide: AZURE-PORTAL-QUICK-START.md${NC}"
echo -e "${CYAN}⏱️  Estimated time: 30-45 minutes${NC}"
echo ""

# =============================================================================
# FINAL SUMMARY
# =============================================================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  SUMMARY                                                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "AFD Endpoint:    ${GREEN}$AFD_FQDN${NC}"
echo -e "DNS Propagation: ${YELLOW}${PROPAGATED}/${TOTAL}${NC}"
echo -e "Portal Access:   ${YELLOW}Required for remaining setup${NC}"
echo ""

echo -e "${GREEN}✅ Finalization guide complete${NC}"
echo -e "${YELLOW}⚠️  Manual Portal steps required (see above)${NC}"
echo ""

# Log to audit trail
echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"phase\":\"PORTAL_FINALIZATION\",\"action\":\"guide_generated\",\"dns_propagation\":\"${PROPAGATED}/${TOTAL}\",\"cli_available\":\"${CLI_AVAILABLE}\"}" >> dns-change-log.ndjson

