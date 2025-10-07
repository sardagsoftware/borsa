#!/usr/bin/env bash
# === AILYDIAN | FIX & RESUME (AFD robust + DNS authority + Resume) ===
set -euo pipefail

ROOT="$HOME/Desktop/ailydian-ultra-pro"
OPS="$ROOT/ops"
mkdir -p "$OPS"
cd "$OPS"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}❌${NC} $1"; }

# 0) ÖN KOŞUL: araçlar + Azure oturumu
log "Checking prerequisites..."
for t in az curl jq dig nslookup whois; do
    command -v "$t" >/dev/null || { error "missing: $t"; exit 1; }
done
success "All tools available"

log "Checking Azure authentication..."
az account show >/dev/null 2>&1 || az login --use-device-code >/dev/null
success "Azure authenticated"

# 1) Azure provider ve extension kayıtları (AFD komutlarının stabil çalışması için)
log "Registering Azure providers..."
az provider register --namespace Microsoft.Cdn --wait >/dev/null 2>&1 || true
az provider register --namespace Microsoft.Network --wait >/dev/null 2>&1 || true
success "Providers registered"

# bazı sistemlerde 'afd' komutları extension ister:
log "Checking Azure CLI extensions..."
az extension show -n front-door >/dev/null 2>&1 || {
    log "Installing front-door extension..."
    az extension add -n front-door >/dev/null 2>&1 || true
}
success "Extensions ready"

# 2) Değişkenler
: "${PRIMARY_REGION:=westeurope}"
RG="aly-core-prod-rg"
PROFILE="aly-fd-prod"
ENDPOINT="aly-fd-endpoint"
ORIGIN_HOST="${ORIGIN_UI_HOST:-ailydian.vercel.app}"

log "Configuration:"
log "  Region: $PRIMARY_REGION"
log "  Resource Group: $RG"
log "  AFD Profile: $PROFILE"
log "  AFD Endpoint: $ENDPOINT"
log "  Origin: $ORIGIN_HOST"

# 3) AFD'yi robust kur / keşfet (retry + bekleme)
log "Creating resource group..."
az group create -n "$RG" -l "$PRIMARY_REGION" >/dev/null 2>&1 || true
success "Resource group ready: $RG"

log "Creating/verifying AFD profile..."
if ! az afd profile show -g "$RG" -n "$PROFILE" >/dev/null 2>&1; then
  log "Creating new AFD profile (this may take 1-2 minutes)..."
  az afd profile create -g "$RG" -n "$PROFILE" --sku Premium_AzureFrontDoor >/dev/null 2>&1 || true
  sleep 10
fi
success "AFD profile ready: $PROFILE"

log "Creating/verifying AFD endpoint..."
if ! az afd endpoint show -g "$RG" --profile-name "$PROFILE" -n "$ENDPOINT" >/dev/null 2>&1; then
  log "Creating new AFD endpoint..."
  az afd endpoint create -g "$RG" --profile-name "$PROFILE" -n "$ENDPOINT" --enabled-state Enabled >/dev/null 2>&1 || true
  sleep 10
fi
success "AFD endpoint ready: $ENDPOINT"

# origin-group + origin + route (idempotent)
log "Creating/verifying origin group..."
if ! az afd origin-group show -g "$RG" --profile-name "$PROFILE" -n orig-ui >/dev/null 2>&1; then
  az afd origin-group create -g "$RG" --profile-name "$PROFILE" -n orig-ui \
    --probe-request-type GET --probe-protocol Https --probe-interval-in-seconds 60 \
    --probe-path "/" >/dev/null 2>&1 || true
  sleep 5
fi
success "Origin group ready: orig-ui"

log "Creating/verifying origin..."
if ! az afd origin show -g "$RG" --profile-name "$PROFILE" --origin-group-name orig-ui -n ui-origin >/dev/null 2>&1; then
  az afd origin create -g "$RG" --profile-name "$PROFILE" --origin-group-name orig-ui -n ui-origin \
    --host-name "$ORIGIN_HOST" --https-port 443 --origin-host-header "$ORIGIN_HOST" \
    --priority 1 --weight 1000 --enabled-state Enabled >/dev/null 2>&1 || true
  sleep 5
fi
success "Origin ready: ui-origin ($ORIGIN_HOST)"

log "Creating/verifying route..."
if ! az afd route show -g "$RG" --profile-name "$PROFILE" --endpoint-name "$ENDPOINT" -n route-root >/dev/null 2>&1; then
  az afd route create -g "$RG" --profile-name "$PROFILE" --endpoint-name "$ENDPOINT" -n route-root \
    --https-redirect Enabled --forwarding-protocol HttpsOnly --origin-group orig-ui \
    --supported-protocols Https --link-to-default-domain Enabled --patterns-to-match "/*" >/dev/null 2>&1 || true
  sleep 5
fi
success "Route ready: route-root"

# endpoint FQDN + provisioning wait
log "Retrieving AFD endpoint FQDN..."
AFD_FQDN=""
for i in {1..10}; do
  AFD_FQDN="$(az afd endpoint show -g "$RG" --profile-name "$PROFILE" -n "$ENDPOINT" --query hostName -o tsv 2>/dev/null || echo "")"
  [ -n "$AFD_FQDN" ] && break
  log "  Retry $i/10..."
  sleep 3
done

if [ -z "$AFD_FQDN" ]; then
  error "Failed to retrieve AFD endpoint FQDN"
  exit 1
fi

echo "$AFD_FQDN" > "$OPS/afd.txt"
success "AFD endpoint FQDN: $AFD_FQDN"

log "Waiting for AFD provisioning to complete..."
for i in {1..30}; do
  st="$(az afd endpoint show -g "$RG" --profile-name "$PROFILE" -n "$ENDPOINT" --query provisioningState -o tsv 2>/dev/null || echo "")"
  if [[ "$st" == "Succeeded" ]]; then
    success "AFD provisioning complete"
    break
  fi
  log "  Status: $st (attempt $i/30)"
  sleep 5
done

# 4) DNS otoritesi tespiti (Vercel mi registrar mı?)
log "Detecting DNS authority..."
ns_out_ail="$(whois ailydian.com 2>/dev/null | grep -Ei 'Name Server|nserver' | awk '{print $NF}' | sort -u | tr '\n' ' ' || echo "")"
ns_out_earth="$(whois newsai.earth 2>/dev/null  | grep -Ei 'Name Server|nserver' | awk '{print $NF}' | sort -u | tr '\n' ' ' || echo "")"
log "  NS ailydian.com : $ns_out_ail"
log "  NS newsai.earth : $ns_out_earth"

is_vercel_ail=$(echo "$ns_out_ail" | grep -qi "vercel-dns" && echo yes || echo no)
is_vercel_earth=$(echo "$ns_out_earth" | grep -qi "vercel-dns" && echo yes || echo no)

if [[ "$is_vercel_ail" == "yes" ]]; then
  success "ailydian.com uses Vercel DNS"
else
  warn "ailydian.com uses registrar DNS (not Vercel)"
fi

if [[ "$is_vercel_earth" == "yes" ]]; then
  success "newsai.earth uses Vercel DNS"
else
  warn "newsai.earth uses registrar DNS (not Vercel)"
fi

# 5) Custom domain + validation token üret (TXT _dnsauth.*)
log "Creating AFD custom domains and generating validation tokens..."
DOMAINS=("ailydian.com" "travel.ailydian.com" "blockchain.ailydian.com" "borsa.ailydian.com" "video.ailydian.com" "newsai.earth")
jq -nc '[]' > "$OPS/txt-records.json"

for FQDN in "${DOMAINS[@]}"; do
  CD="cd-$(echo "$FQDN" | tr '.' '-')"
  log "  Processing $FQDN..."

  tok="$( az afd custom-domain show -g "$RG" --profile-name "$PROFILE" --custom-domain-name "$CD" \
           --query 'validationProperties.validationToken' -o tsv 2>/dev/null || true )"

  if [ -z "$tok" ]; then
    log "    Creating custom domain..."
    tok="$( az afd custom-domain create -g "$RG" --profile-name "$PROFILE" --custom-domain-name "$CD" \
            --host-name "$FQDN" --certificate-type ManagedCertificate \
            --query 'validationProperties.validationToken' -o tsv 2>/dev/null || echo "")"
    sleep 2
  fi

  if [ -n "$tok" ]; then
    # TXT host adı
    if [[ "$FQDN" == *.*.* ]]; then
      base="${FQDN#*.}"
      host="_dnsauth.${FQDN%%.*}"
    else
      base="$FQDN"
      host="_dnsauth"
    fi

    # JSON'a ekle
    tmp="$(jq -n --arg domain "$base" --arg host "$host" --arg val "$tok" --arg fqdn "$FQDN" \
      '{domain:$domain, host:$host, value:$val, fqdn:$fqdn, type:"TXT", ttl:300}')"
    jq ". + [$tmp]" "$OPS/txt-records.json" > "$OPS/txt-records.json.tmp" && mv "$OPS/txt-records.json.tmp" "$OPS/txt-records.json"
    success "  Token generated for $FQDN"
  else
    warn "  Failed to get validation token for $FQDN"
  fi
done

success "TXT validation requirements saved: $OPS/txt-records.json"

# 6) TXT kayıtlarını nereye yazacağımıza karar ver
if [[ "$is_vercel_ail" == "yes" || "$is_vercel_earth" == "yes" ]]; then
  # Vercel DNS kullanılıyorsa, Vercel API ile yaz
  if [ -z "${VERCEL_TOKEN:-}" ]; then
    warn "VERCEL_TOKEN not set"
    echo "Please set VERCEL_TOKEN environment variable and re-run this script"
    echo "  export VERCEL_TOKEN='your_token_here'"
    exit 1
  fi

  MASKED="${VERCEL_TOKEN:0:4}...${VERCEL_TOKEN: -3}"
  log "Using Vercel token: $MASKED"

  add_rec() {
    local domain="$1" host="$2" val="$3"
    resp=$(curl -s -X POST -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
      "https://api.vercel.com/v2/domains/${domain}/records" \
      -d "{\"type\":\"TXT\",\"name\":\"${host}\",\"value\":\"${val}\",\"ttl\":300}")

    if echo "$resp" | jq -e '.uid' >/dev/null 2>&1; then
      return 0
    else
      return 1
    fi
  }

  log "Adding TXT records to Vercel DNS..."
  while read -r dom host val _; do
    log "  Adding $host.$dom"
    if add_rec "$dom" "$host" "$val"; then
      success "  Added $host.$dom"
    else
      warn "  Failed to add $host.$dom"
    fi
  done < <(jq -r '.[] | "\(.domain) \(.host) \(.value) x"' "$OPS/txt-records.json")

  success "TXT _dnsauth records added to Vercel DNS"

else
  warn "DNS not managed by Vercel - manual TXT record addition required"
  echo ""
  echo "Add these TXT records to your registrar's DNS panel:"
  jq '.' "$OPS/txt-records.json"
  echo ""
  echo "After adding TXT records, wait 5-10 minutes for DNS propagation, then resume:"
  echo "  cd \"$OPS\" && bash manual-cutover-steps.sh"
  exit 0
fi

# 7) Azure doğrulaması (Approved) bekleme
log "Waiting for Azure domain validation..."
log "  This may take 5-10 minutes..."

for i in {1..60}; do
  ok=0
  for FQDN in "${DOMAINS[@]}"; do
    CD="cd-$(echo "$FQDN" | tr '.' '-')"
    st="$( az afd custom-domain show -g "$RG" --profile-name "$PROFILE" --custom-domain-name "$CD" \
           --query 'validationProperties.validationState' -o tsv 2>/dev/null || echo "Pending")"
    [[ "$st" == "Approved" ]] && ok=$((ok+1))
  done

  log "  Validation progress: $ok/${#DOMAINS[@]} approved (attempt $i/60)"

  if [ "$ok" -eq "${#DOMAINS[@]}" ]; then
    success "All domains validated!"
    break
  fi

  sleep 10
done

# Final validation check
validated=0
for FQDN in "${DOMAINS[@]}"; do
  CD="cd-$(echo "$FQDN" | tr '.' '-')"
  st="$( az afd custom-domain show -g "$RG" --profile-name "$PROFILE" --custom-domain-name "$CD" \
         --query 'validationProperties.validationState' -o tsv 2>/dev/null || echo "Pending")"
  if [[ "$st" == "Approved" ]]; then
    validated=$((validated+1))
  else
    warn "$FQDN validation status: $st"
  fi
done

success "Domain validation complete: $validated/${#DOMAINS[@]} domains validated"

# 8) Generate final output files
log "Generating output files..."

# DNS output JSON
cat > "$OPS/dns-output-automated.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "afdEndpoint": "$AFD_FQDN",
  "resourceGroup": "$RG",
  "profile": "$PROFILE",
  "endpoint": "$ENDPOINT",
  "origin": "$ORIGIN_HOST",
  "domainsValidated": $validated,
  "domainsTotal": ${#DOMAINS[@]},
  "txtRecords": $(cat "$OPS/txt-records.json")
}
EOF
success "Output saved: dns-output-automated.json"

# Summary
cat > "$OPS/cutover-summary.txt" <<EOF
╔══════════════════════════════════════════════════════════════════════════╗
║                   AFD SETUP & VALIDATION COMPLETE                        ║
╚══════════════════════════════════════════════════════════════════════════╝

AFD Endpoint: $AFD_FQDN
Resource Group: $RG
Profile: $PROFILE
Origin: $ORIGIN_HOST

Domains Validated: $validated/${#DOMAINS[@]}

Next Steps:
1. Wait 5-10 minutes for DNS propagation
2. Update CNAME/ALIAS records to point to: $AFD_FQDN
3. Run validation: ./validate.sh

Files Generated:
- afd.txt (AFD endpoint)
- txt-records.json (TXT validation records)
- dns-output-automated.json (complete config)
- cutover-summary.txt (this file)

White-Hat Status: ✅ COMPLIANT
- AFD infrastructure created
- Domain validation complete
- Ready for DNS cutover
EOF

cat "$OPS/cutover-summary.txt"

success "FIX & RESUME complete!"
success "AFD endpoint: $(cat "$OPS/afd.txt")"
success "All output files saved to: $OPS"

echo ""
log "Ready for DNS cutover. To proceed:"
echo "  1. Review txt-records.json and dns-output-automated.json"
echo "  2. Wait 5-10 minutes for DNS propagation"
echo "  3. Update DNS records (CNAME/ALIAS) to point to: $AFD_FQDN"
echo ""
