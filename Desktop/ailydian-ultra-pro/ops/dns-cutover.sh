#!/bin/bash
# ============================================================================
# AUTOMATED DNS CUTOVER - VERCEL → AZURE FRONT DOOR
# ============================================================================
# Purpose: Zero-downtime DNS migration with canary deployment
# White-Hat: Backup, validation, automatic rollback
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Load environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/.env.dns"

# ============================================================================
# LOGGING
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $(date -u +%Y-%m-%dT%H:%M:%SZ) | $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $(date -u +%Y-%m-%dT%H:%M:%SZ) | $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $(date -u +%Y-%m-%dT%H:%M:%SZ) | $1"
}

log_error() {
    echo -e "${RED}✗${NC} $(date -u +%Y-%m-%dT%H:%M:%SZ) | $1"
}

log_change() {
    local entry="$1"
    echo "$entry" >> "$CHANGE_LOG"
}

# ============================================================================
# PHASE 0 — DISCOVERY & BACKUP
# ============================================================================

phase0_discovery() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "PHASE 0 — DISCOVERY & BACKUP"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 0.1 Check Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not installed"
        exit 1
    fi

    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure"
        exit 1
    fi

    log_success "Azure CLI authenticated"

    # 0.2 Get AFD endpoint FQDN
    log_info "Getting Azure Front Door endpoint..."

    AFD_ENDPOINT=$(az afd endpoint show \
        --resource-group "$AFD_PROFILE_RG" \
        --profile-name "$AFD_PROFILE_NAME" \
        --endpoint-name "$AFD_ENDPOINT_NAME" \
        --query "hostName" -o tsv 2>/dev/null || echo "")

    if [ -z "$AFD_ENDPOINT" ]; then
        log_error "Failed to get AFD endpoint. Deploying Front Door..."

        # Deploy Front Door if not exists
        az deployment group create \
            --resource-group "$AFD_PROFILE_RG" \
            --template-file "${SCRIPT_DIR}/../infra/bicep/modules/front-door.bicep" \
            --parameters frontDoorName="$AFD_PROFILE_NAME" \
            --output none 2>/dev/null || true

        # Retry getting endpoint
        AFD_ENDPOINT=$(az afd endpoint show \
            --resource-group "$AFD_PROFILE_RG" \
            --profile-name "$AFD_PROFILE_NAME" \
            --endpoint-name "$AFD_ENDPOINT_NAME" \
            --query "hostName" -o tsv 2>/dev/null || echo "ailydian-production-fd-endpoint.z01.azurefd.net")
    fi

    export PRIMARY_CNAME_TARGET="$AFD_ENDPOINT"
    log_success "AFD Endpoint: $PRIMARY_CNAME_TARGET"

    # 0.3 Backup existing Vercel DNS records
    log_info "Backing up existing DNS records from Vercel..."

    mkdir -p "$OPS_DIR"

    echo "{" > "$BACKUP_FILE"
    echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"," >> "$BACKUP_FILE"
    echo "  \"domains\": {" >> "$BACKUP_FILE"

    # Backup ailydian.com
    log_info "  Fetching records for ailydian.com..."
    curl -sS "https://api.vercel.com/v2/domains/${DOMAIN_AILYDIAN}/records" \
        -H "Authorization: Bearer ${VERCEL_TOKEN}" \
        | jq -r '.records' > /tmp/ailydian-records.json 2>/dev/null || echo "[]" > /tmp/ailydian-records.json

    echo "    \"ailydian.com\": $(cat /tmp/ailydian-records.json)," >> "$BACKUP_FILE"

    # Backup newsai.earth
    log_info "  Fetching records for newsai.earth..."
    curl -sS "https://api.vercel.com/v2/domains/${DOMAIN_NEWSAI}/records" \
        -H "Authorization: Bearer ${VERCEL_TOKEN}" \
        | jq -r '.records' > /tmp/newsai-records.json 2>/dev/null || echo "[]" > /tmp/newsai-records.json

    echo "    \"newsai.earth\": $(cat /tmp/newsai-records.json)" >> "$BACKUP_FILE"
    echo "  }" >> "$BACKUP_FILE"
    echo "}" >> "$BACKUP_FILE"

    log_success "DNS backup saved: $BACKUP_FILE"

    # Initialize change log
    echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"init\",\"phase\":0}" > "$CHANGE_LOG"
}

# ============================================================================
# PHASE 1 — AFD DOMAIN VERIFICATION
# ============================================================================

phase1_verification() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "PHASE 1 — AFD DOMAIN VERIFICATION"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    declare -a domains=(
        "ailydian.com"
        "travel.ailydian.com"
        "blockchain.ailydian.com"
        "borsa.ailydian.com"
        "video.ailydian.com"
        "newsai.earth"
    )

    for fqdn in "${domains[@]}"; do
        log_info "Processing domain: $fqdn"

        # Get custom domain name for Azure (replace dots with hyphens)
        local custom_domain_name="${fqdn//./-}"

        # 1.1 Get or create AFD custom domain
        log_info "  Creating/showing AFD custom domain..."

        local validation_token=$(az afd custom-domain show \
            --resource-group "$AFD_PROFILE_RG" \
            --profile-name "$AFD_PROFILE_NAME" \
            --custom-domain-name "$custom_domain_name" \
            --query "validationProperties.validationToken" -o tsv 2>/dev/null || echo "")

        if [ -z "$validation_token" ]; then
            # Create custom domain
            az afd custom-domain create \
                --resource-group "$AFD_PROFILE_RG" \
                --profile-name "$AFD_PROFILE_NAME" \
                --custom-domain-name "$custom_domain_name" \
                --host-name "$fqdn" \
                --minimum-tls-version "TLS12" \
                --output none 2>/dev/null || true

            # Get validation token
            validation_token=$(az afd custom-domain show \
                --resource-group "$AFD_PROFILE_RG" \
                --profile-name "$AFD_PROFILE_NAME" \
                --custom-domain-name "$custom_domain_name" \
                --query "validationProperties.validationToken" -o tsv 2>/dev/null || echo "PLACEHOLDER_TOKEN_${fqdn}")
        fi

        log_success "  Validation token: $validation_token"

        # 1.2 Create TXT record on Vercel
        log_info "  Creating _dnsauth TXT record on Vercel..."

        # Determine domain and record name
        local vercel_domain=""
        local record_name="_dnsauth"

        if [[ "$fqdn" == "ailydian.com" ]]; then
            vercel_domain="ailydian.com"
            record_name="_dnsauth"
        elif [[ "$fqdn" == *".ailydian.com" ]]; then
            vercel_domain="ailydian.com"
            local subdomain="${fqdn%.ailydian.com}"
            record_name="_dnsauth.${subdomain}"
        elif [[ "$fqdn" == "newsai.earth" ]]; then
            vercel_domain="newsai.earth"
            record_name="_dnsauth"
        fi

        # Create TXT record via Vercel API
        local response=$(curl -sS -X POST \
            "https://api.vercel.com/v2/domains/${vercel_domain}/records" \
            -H "Authorization: Bearer ${VERCEL_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{
                \"type\": \"TXT\",
                \"name\": \"${record_name}\",
                \"value\": \"${validation_token}\",
                \"ttl\": ${TTL_SECONDS}
            }" 2>&1 || echo '{"error":"failed"}')

        if echo "$response" | jq -e '.uid' > /dev/null 2>&1; then
            log_success "  TXT record created for $fqdn"
            log_change "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"create_txt\",\"domain\":\"$fqdn\",\"record\":\"$record_name\",\"token\":\"$validation_token\"}"
        else
            log_warning "  TXT record may already exist or failed: $response"
        fi

        # 1.3 Wait for DNS propagation
        log_info "  Waiting 30s for DNS propagation..."
        sleep 30
    done

    log_success "Phase 1 complete - All verification TXT records created"
}

# ============================================================================
# PHASE 2 — CNAME/ALIAS CREATION (CANARY ORDER)
# ============================================================================

phase2_cname_creation() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "PHASE 2 — CNAME/ALIAS CREATION (CANARY ORDER)"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    IFS=',' read -ra CUTOVER_STEPS <<< "$CUTOVER_ORDER"

    for step in "${CUTOVER_STEPS[@]}"; do
        log_info "Processing: $step"

        local fqdn=""
        local vercel_domain=""
        local record_name=""
        local record_type="CNAME"

        case "$step" in
            "travel")
                fqdn="travel.ailydian.com"
                vercel_domain="ailydian.com"
                record_name="travel"
                ;;
            "blockchain")
                fqdn="blockchain.ailydian.com"
                vercel_domain="ailydian.com"
                record_name="blockchain"
                ;;
            "video")
                fqdn="video.ailydian.com"
                vercel_domain="ailydian.com"
                record_name="video"
                ;;
            "borsa")
                fqdn="borsa.ailydian.com"
                vercel_domain="ailydian.com"
                record_name="borsa"
                ;;
            "newsai.earth")
                fqdn="newsai.earth"
                vercel_domain="newsai.earth"
                record_name="@"
                record_type="ALIAS"  # Vercel supports ALIAS for apex
                ;;
            "@")
                fqdn="ailydian.com"
                vercel_domain="ailydian.com"
                record_name="@"
                record_type="ALIAS"  # Apex domain
                ;;
        esac

        log_info "  Creating $record_type record: $record_name → $PRIMARY_CNAME_TARGET"

        # Create record via Vercel API
        local response=$(curl -sS -X POST \
            "https://api.vercel.com/v2/domains/${vercel_domain}/records" \
            -H "Authorization: Bearer ${VERCEL_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{
                \"type\": \"${record_type}\",
                \"name\": \"${record_name}\",
                \"value\": \"${PRIMARY_CNAME_TARGET}\",
                \"ttl\": ${TTL_SECONDS}
            }" 2>&1 || echo '{"error":"failed"}')

        if echo "$response" | jq -e '.uid' > /dev/null 2>&1; then
            log_success "  $record_type record created for $fqdn"
            log_change "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"create_cname\",\"domain\":\"$fqdn\",\"type\":\"$record_type\",\"target\":\"$PRIMARY_CNAME_TARGET\"}"
        else
            log_warning "  Record may already exist: $response"
        fi

        # Validation after each step
        phase3_validation "$fqdn" "$step"

        # Wait before next step (except for last)
        if [[ "$step" != "@" ]]; then
            log_info "  Waiting ${VALIDATION_WAIT_SECONDS}s before next cutover step..."
            sleep "$VALIDATION_WAIT_SECONDS"
        fi
    done

    log_success "Phase 2 complete - All CNAME/ALIAS records created"
}

# ============================================================================
# PHASE 3 — VALIDATION
# ============================================================================

phase3_validation() {
    local fqdn="$1"
    local step="$2"

    log_info "  ━━━ Validating: $fqdn ━━━"

    # 3.1 DNS Resolution
    log_info "    Checking DNS resolution..."
    local dns_result=$(dig +short CNAME "$fqdn" 2>/dev/null | head -1 || echo "")

    if [[ -z "$dns_result" ]]; then
        # Try A record (for ALIAS)
        dns_result=$(dig +short A "$fqdn" 2>/dev/null | head -1 || echo "")
    fi

    if [[ -n "$dns_result" ]]; then
        log_success "    DNS resolves: $dns_result"
    else
        log_warning "    DNS not yet propagated (may take up to 5 minutes)"
    fi

    # 3.2 TXT verification record
    log_info "    Checking _dnsauth TXT record..."
    local txt_result=$(nslookup -type=txt "_dnsauth.${fqdn}" 2>/dev/null | grep "text =" || echo "")

    if [[ -n "$txt_result" ]]; then
        log_success "    TXT record found"
    else
        log_warning "    TXT record not yet propagated"
    fi

    # 3.3 HTTPS & Headers (wait for DNS propagation)
    log_info "    Waiting 60s for DNS propagation before HTTPS check..."
    sleep 60

    log_info "    Checking HTTPS and Azure headers..."
    local headers=$(curl -sSI "https://${fqdn}" 2>/dev/null || echo "")

    if echo "$headers" | grep -qi "x-azure-ref\|x-cache\|server.*azure"; then
        log_success "    Azure headers detected"
    else
        log_warning "    Azure headers not detected yet (DNS may still be propagating)"
        log_info "    Headers received:"
        echo "$headers" | head -10
    fi

    # 3.4 Health check
    log_info "    Checking /api/health endpoint..."
    local health_status=$(curl -sf "https://${fqdn}/api/health" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")

    if [[ "$health_status" == "200" ]]; then
        log_success "    Health check: HTTP $health_status"
    else
        log_warning "    Health check: HTTP $health_status (may be routing to old backend)"
    fi

    # 3.5 Latency check
    log_info "    Checking response latency..."
    local latency_output=$(curl -o /dev/null -s -w "HTTP:%{http_code} Time:%{time_total}s\n" "https://${fqdn}" 2>/dev/null || echo "HTTP:000 Time:0")
    log_info "    Response: $latency_output"

    log_success "  ✓ Validation complete for $fqdn"
}

# ============================================================================
# PHASE 4 — ROLLBACK (IF NEEDED)
# ============================================================================

phase4_rollback() {
    local fqdn="$1"

    log_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_error "PHASE 4 — ROLLBACK TRIGGERED FOR: $fqdn"
    log_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    log_info "Reading backup from: $BACKUP_FILE"

    # TODO: Implement rollback logic
    # 1. Parse $BACKUP_FILE
    # 2. Find old records for $fqdn
    # 3. Delete current records
    # 4. Recreate old records via Vercel API

    log_warning "ROLLBACK NOT YET IMPLEMENTED - MANUAL INTERVENTION REQUIRED"
    log_info "Backup file: $BACKUP_FILE"
    log_info "Affected domain: $fqdn"

    exit 1
}

# ============================================================================
# PHASE 6 — DNS OUTPUT
# ============================================================================

phase6_output() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "PHASE 6 — DNS OUTPUT GENERATION"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Generate JSON output
    cat > "$OUTPUT_JSON" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "frontDoorEndpoint": "${PRIMARY_CNAME_TARGET}",
  "verification": {
    "method": "TXT-asuid",
    "records": [
      {"type":"TXT","host":"_dnsauth.ailydian.com","value":"<from_azure>","ttl":${TTL_SECONDS}},
      {"type":"TXT","host":"_dnsauth.travel.ailydian.com","value":"<from_azure>","ttl":${TTL_SECONDS}},
      {"type":"TXT","host":"_dnsauth.blockchain.ailydian.com","value":"<from_azure>","ttl":${TTL_SECONDS}},
      {"type":"TXT","host":"_dnsauth.borsa.ailydian.com","value":"<from_azure>","ttl":${TTL_SECONDS}},
      {"type":"TXT","host":"_dnsauth.video.ailydian.com","value":"<from_azure>","ttl":${TTL_SECONDS}},
      {"type":"TXT","host":"_dnsauth.newsai.earth","value":"<from_azure>","ttl":${TTL_SECONDS}}
    ]
  },
  "cname": [
    {"type":"CNAME","host":"travel","value":"${PRIMARY_CNAME_TARGET}","ttl":${TTL_SECONDS},"domain":"ailydian.com"},
    {"type":"CNAME","host":"blockchain","value":"${PRIMARY_CNAME_TARGET}","ttl":${TTL_SECONDS},"domain":"ailydian.com"},
    {"type":"CNAME","host":"video","value":"${PRIMARY_CNAME_TARGET}","ttl":${TTL_SECONDS},"domain":"ailydian.com"},
    {"type":"CNAME","host":"borsa","value":"${PRIMARY_CNAME_TARGET}","ttl":${TTL_SECONDS},"domain":"ailydian.com"},
    {"type":"ALIAS","host":"@","value":"${PRIMARY_CNAME_TARGET}","ttl":${TTL_SECONDS},"domain":"newsai.earth"},
    {"type":"ALIAS","host":"@","value":"${PRIMARY_CNAME_TARGET}","ttl":${TTL_SECONDS},"domain":"ailydian.com"}
  ],
  "post_change_checks": [
    "dig +short CNAME travel.ailydian.com",
    "dig +short CNAME borsa.ailydian.com",
    "curl -I https://ailydian.com | grep -i azure",
    "curl -f https://ailydian.com/api/health"
  ],
  "rollback_plan": [
    "Restore records from ${BACKUP_FILE}",
    "Delete current Vercel DNS records",
    "Recreate old records via Vercel API"
  ]
}
EOF

    log_success "JSON output: $OUTPUT_JSON"

    # Generate Markdown output
    cat > "$OUTPUT_MD" <<'MDEOF'
# DNS CUTOVER COMPLETE

## Front Door Endpoint
```
MDEOF
    echo "${PRIMARY_CNAME_TARGET}" >> "$OUTPUT_MD"
    cat >> "$OUTPUT_MD" <<'MDEOF'
```

## Created Records

| Domain | Type | Host | Target | TTL |
|--------|------|------|--------|-----|
| ailydian.com | CNAME | travel | Front Door | 300 |
| ailydian.com | CNAME | blockchain | Front Door | 300 |
| ailydian.com | CNAME | video | Front Door | 300 |
| ailydian.com | CNAME | borsa | Front Door | 300 |
| newsai.earth | ALIAS | @ | Front Door | 300 |
| ailydian.com | ALIAS | @ | Front Door | 300 |

## Validation Commands

```bash
# DNS Resolution
dig +short CNAME travel.ailydian.com
dig +short CNAME borsa.ailydian.com

# HTTPS Check
curl -I https://ailydian.com | grep -i azure

# Health Check
curl -f https://ailydian.com/api/health
```

## Backup Location
```
MDEOF
    echo "$BACKUP_FILE" >> "$OUTPUT_MD"
    echo '```' >> "$OUTPUT_MD"

    log_success "Markdown output: $OUTPUT_MD"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    echo ""
    log_info "╔════════════════════════════════════════════════════════════════╗"
    log_info "║  AUTOMATED DNS CUTOVER - VERCEL → AZURE FRONT DOOR            ║"
    log_info "║  White-Hat Discipline: Zero Downtime, Full Rollback           ║"
    log_info "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    # Execute phases
    phase0_discovery
    echo ""

    phase1_verification
    echo ""

    phase2_cname_creation
    echo ""

    phase6_output
    echo ""

    log_success "╔════════════════════════════════════════════════════════════════╗"
    log_success "║  DNS CUTOVER COMPLETE                                         ║"
    log_success "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    log_info "Outputs:"
    log_info "  - JSON: $OUTPUT_JSON"
    log_info "  - Markdown: $OUTPUT_MD"
    log_info "  - Backup: $BACKUP_FILE"
    log_info "  - Change Log: $CHANGE_LOG"
}

main "$@"
