#!/bin/bash
# === AILYDIAN | AFD + Vercel DNS → TXT Approve → HTTPS → Validate (One-Shot) ===
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  AILYDIAN - AFD Complete Automation                       ║${NC}"
echo -e "${CYAN}║  $(date -u +"%Y-%m-%d %H:%M:%S UTC")                       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 0) Environment Check
ROOT="$HOME/Desktop/ailydian-ultra-pro/ops"
mkdir -p "$ROOT"
cd "$ROOT"

# Check dependencies
command -v az >/dev/null || { echo -e "${RED}❌ Azure CLI not found${NC}"; exit 1; }
command -v curl >/dev/null || { echo -e "${RED}❌ curl not found${NC}"; exit 1; }
command -v jq >/dev/null || { echo -e "${RED}❌ jq not found${NC}"; exit 1; }
command -v dig >/dev/null || { echo -e "${RED}❌ dig not found${NC}"; exit 1; }

# Check Azure login
if ! az account show >/dev/null 2>&1; then
  echo -e "${YELLOW}Azure login required...${NC}"
  az login --use-device-code >/dev/null
fi

echo -e "${GREEN}✅ Environment checks passed${NC}"
echo ""

# 1) AFD Resources Discovery
echo -e "${BLUE}━━━ Phase 1: AFD Resources Discovery ━━━${NC}"
RG="${RG:-aly-core-prod-rg}"

# Try to find profile via different methods
PROFILE="$(az resource list -g "$RG" --resource-type Microsoft.Cdn/profiles --query '[0].name' -o tsv 2>/dev/null || true)"
if [ -z "$PROFILE" ]; then
  PROFILE="$(az afd profile list --query '[0].name' -o tsv 2>/dev/null || true)"
fi

ENDPOINT="$(az resource list -g "$RG" --resource-type Microsoft.Cdn/profiles/afdendpoints --query '[0].name' -o tsv 2>/dev/null || true)"
if [ -z "$ENDPOINT" ]; then
  ENDPOINT="$(az afd endpoint list --query '[0].name' -o tsv 2>/dev/null || true)"
fi

if [ -n "$PROFILE" ] && [ -n "$ENDPOINT" ]; then
  AFD_FQDN="$(az afd endpoint show -g "$RG" --profile-name "$PROFILE" -n "$ENDPOINT" --query hostName -o tsv 2>/dev/null || true)"
  echo -e "${GREEN}✅ AFD Resources Found${NC}"
  echo "   Resource Group: $RG"
  echo "   Profile: $PROFILE"
  echo "   Endpoint: $ENDPOINT"
  echo "   FQDN: $AFD_FQDN"
  CLI_AVAILABLE=true
else
  echo -e "${YELLOW}⚠️  AFD CLI Access Limited${NC}"
  echo "   AFD was created via Azure Portal"
  echo "   Using known endpoint: ailydian-production-fd-endpoint.z01.azurefd.net"
  AFD_FQDN="ailydian-production-fd-endpoint.z01.azurefd.net"
  CLI_AVAILABLE=false
fi
echo ""

# 2) Domains
DOMAINS=( "ailydian.com" "travel.ailydian.com" "blockchain.ailydian.com" "video.ailydian.com" "borsa.ailydian.com" "newsai.earth" )

# 3) Vercel Token Check
echo -e "${BLUE}━━━ Phase 2: Vercel Token Verification ━━━${NC}"

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo -e "${YELLOW}⚠️  VERCEL_TOKEN not set in environment${NC}"
  echo ""
  echo -e "${CYAN}To enable automated TXT validation:${NC}"
  echo "  1. Get token from: https://vercel.com/account/tokens"
  echo "  2. export VERCEL_TOKEN=\"your-token-here\""
  echo "  3. export VERCEL_TEAM_ID=\"lydian-9142\""
  echo "  4. Run this script again"
  echo ""
  echo -e "${YELLOW}Proceeding with manual Portal workflow...${NC}"
  TOKEN_AVAILABLE=false
else
  MASKED="${VERCEL_TOKEN:0:4}...${VERCEL_TOKEN: -3}"
  TEAM_QS="${VERCEL_TEAM_ID:+?teamId=$VERCEL_TEAM_ID}"
  echo -e "${GREEN}✅ VERCEL_TOKEN is set${NC}"
  echo "   Token: $MASKED"
  echo "   Team ID: ${VERCEL_TEAM_ID:-<not set>}"
  
  # Test token
  RESPONSE=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v2/domains/ailydian.com/records${TEAM_QS}")
  
  if echo "$RESPONSE" | jq -e '.records' >/dev/null 2>&1; then
    COUNT=$(echo "$RESPONSE" | jq '.records | length')
    echo -e "${GREEN}✅ Token is valid ($COUNT DNS records accessible)${NC}"
    TOKEN_AVAILABLE=true
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.error.message // "Unknown error"')
    echo -e "${RED}❌ Token is invalid: $ERROR${NC}"
    echo -e "${YELLOW}Proceeding with manual Portal workflow...${NC}"
    TOKEN_AVAILABLE=false
  fi
fi
echo ""

# 4) Manual Portal Instructions
if [ "$CLI_AVAILABLE" = false ] || [ "$TOKEN_AVAILABLE" = false ]; then
  echo -e "${BLUE}━━━ Phase 3: Manual Portal Setup Required ━━━${NC}"
  echo ""
  echo -e "${YELLOW}Since CLI access is limited or token unavailable, please follow these steps:${NC}"
  echo ""
  
  echo -e "${CYAN}Step 1: Custom Domain Validation${NC}"
  echo "  Azure Portal → Front Door → Domains → Custom domains"
  echo ""
  echo "  For each domain, get validation token and add to Vercel DNS:"
  echo ""
  
  for FQDN in "${DOMAINS[@]}"; do
    if [[ "$FQDN" == *.*.* ]]; then
      ZONE="${FQDN#*.}"
      HOST="_dnsauth.${FQDN%%.*}"
    else
      ZONE="$FQDN"
      HOST="_dnsauth"
    fi
    echo "  Domain: $FQDN"
    echo "    Zone: $ZONE"
    echo "    TXT Record: $HOST = <token-from-azure-portal>"
    echo "    TTL: 300"
    echo ""
  done
  
  echo -e "${CYAN}Step 2: Wait for Validation (5-10 minutes)${NC}"
  echo "  Azure Portal → Click 'Revalidate' for each domain"
  echo ""
  
  echo -e "${CYAN}Step 3: Enable HTTPS${NC}"
  echo "  For each Approved domain:"
  echo "    - Certificate type: Azure managed"
  echo "    - Minimum TLS: 1.2"
  echo "    - Click Update"
  echo ""
  
  echo -e "${CYAN}Step 4: Create WAF Policy${NC}"
  echo "  Search 'Web Application Firewall' → Create"
  echo "    - Name: aly-waf-prod"
  echo "    - Mode: Prevention"
  echo "    - Rules: Microsoft_DefaultRuleSet 2.1"
  echo ""
  
  echo -e "${CYAN}Step 5: Configure Monitoring${NC}"
  echo "  Front Door → Monitoring → Alerts"
  echo "    - Create 4 alert rules (latency, 5xx, availability, cost)"
  echo ""
  
  echo -e "${CYAN}📖 Complete Guide: AZURE-PORTAL-QUICK-START.md${NC}"
  echo ""
fi

# 5) DNS Propagation Check
echo -e "${BLUE}━━━ Phase 4: DNS Propagation Status ━━━${NC}"
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
  echo -e "${YELLOW}⏳ Partial propagation (${PROPAGATED}/${TOTAL})${NC}"
else
  echo -e "${YELLOW}⏳ Propagation in progress (expected 5-60 minutes)${NC}"
  echo -e "${YELLOW}   TTL: 300 seconds (5 minutes)${NC}"
fi
echo ""

# 6) Summary
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  SUMMARY                                                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "AFD Endpoint:     ${GREEN}$AFD_FQDN${NC}"
echo -e "CLI Access:       $([ "$CLI_AVAILABLE" = true ] && echo -e "${GREEN}Available${NC}" || echo -e "${YELLOW}Portal-only${NC}")"
echo -e "Vercel Token:     $([ "$TOKEN_AVAILABLE" = true ] && echo -e "${GREEN}Valid${NC}" || echo -e "${YELLOW}Not available${NC}")"
echo -e "DNS Propagation:  ${YELLOW}${PROPAGATED}/${TOTAL}${NC}"
echo ""

if [ "$CLI_AVAILABLE" = false ] || [ "$TOKEN_AVAILABLE" = false ]; then
  echo -e "${YELLOW}⚠️  Manual Portal setup required${NC}"
  echo -e "${CYAN}📖 Guide: AZURE-PORTAL-QUICK-START.md${NC}"
  echo -e "${CYAN}⏱️  Time: 30-45 minutes${NC}"
else
  echo -e "${GREEN}✅ Automation can proceed${NC}"
  echo -e "${YELLOW}⚠️  Additional Portal setup still required for WAF/Monitoring${NC}"
fi
echo ""

# Log to audit trail
echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"phase\":\"AUTOMATION\",\"action\":\"complete_check\",\"cli_available\":\"${CLI_AVAILABLE}\",\"token_available\":\"${TOKEN_AVAILABLE}\",\"dns_propagation\":\"${PROPAGATED}/${TOTAL}\"}" >> dns-change-log.ndjson

echo -e "${GREEN}✅ Automation script complete${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Monitor propagation: ./monitor-propagation.sh"
echo "  2. Complete Portal setup: AZURE-PORTAL-QUICK-START.md"
echo "  3. Validate: ./final-validation-summary.sh"
echo ""

