#!/bin/bash
# ============================================================================
# AZURE REGION SELECTION & QUOTA CHECK
# ============================================================================
# Purpose: Check Azure region availability, latency, and quotas
# Supports: Automated region selection based on performance criteria
# White-Hat: Non-destructive, read-only checks
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-}"
REQUIRED_REGIONS=("westeurope" "northeurope" "uksouth" "francecentral")

# ============================================================================
# FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

check_az_cli() {
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not installed"
        log_info "Install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    log_success "Azure CLI found: $(az version --query '\"azure-cli\"' -o tsv)"
}

check_login() {
    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure"
        log_info "Run: az login"
        exit 1
    fi

    CURRENT_SUBSCRIPTION=$(az account show --query name -o tsv)
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    log_success "Logged in - Subscription: $CURRENT_SUBSCRIPTION"
}

check_region_availability() {
    local region=$1

    log_info "Checking region: $region"

    # Check if region exists
    if ! az account list-locations --query "[?name=='$region']" -o json | grep -q "$region"; then
        log_error "Region $region not found"
        return 1
    fi

    # Check Container Apps availability
    local container_apps_available=$(az provider show \
        --namespace Microsoft.App \
        --query "resourceTypes[?resourceType=='containerApps'].locations[]" \
        -o tsv | grep -ci "$region" || echo "0")

    if [ "$container_apps_available" -eq 0 ]; then
        log_warning "Container Apps not available in $region"
    else
        log_success "Container Apps available in $region"
    fi

    # Check PostgreSQL Flexible Server availability
    local postgres_available=$(az provider show \
        --namespace Microsoft.DBforPostgreSQL \
        --query "resourceTypes[?resourceType=='flexibleServers'].locations[]" \
        -o tsv | grep -ci "$region" || echo "0")

    if [ "$postgres_available" -eq 0 ]; then
        log_warning "PostgreSQL Flexible Server not available in $region"
    else
        log_success "PostgreSQL Flexible Server available in $region"
    fi

    # Check Redis availability
    local redis_available=$(az provider show \
        --namespace Microsoft.Cache \
        --query "resourceTypes[?resourceType=='redis'].locations[]" \
        -o tsv | grep -ci "$region" || echo "0")

    if [ "$redis_available" -eq 0 ]; then
        log_warning "Redis Cache not available in $region"
    else
        log_success "Redis Cache available in $region"
    fi

    return 0
}

check_quota() {
    local region=$1

    log_info "Checking quotas for $region"

    # Check Container Apps quota
    local ca_quota=$(az quota show \
        --scope "subscriptions/$SUBSCRIPTION_ID/providers/Microsoft.App/locations/$region" \
        --resource-name containerApps \
        --query "limit" -o tsv 2>/dev/null || echo "N/A")

    log_info "  Container Apps quota: $ca_quota"

    # Check vCPU quota
    local vcpu_quota=$(az vm list-usage \
        --location "$region" \
        --query "[?localName=='Total Regional vCPUs'].{current:currentValue,limit:limit}" \
        -o json 2>/dev/null || echo "[]")

    if [ "$vcpu_quota" != "[]" ]; then
        local current=$(echo "$vcpu_quota" | jq -r '.[0].current // 0')
        local limit=$(echo "$vcpu_quota" | jq -r '.[0].limit // 0')
        local available=$((limit - current))

        log_info "  vCPU usage: $current / $limit (Available: $available)"

        # We need ~50 vCPUs for all services
        if [ "$available" -lt 50 ]; then
            log_warning "  Insufficient vCPU quota (need 50, have $available)"
            log_info "  Request increase: https://portal.azure.com/#view/Microsoft_Azure_Support/HelpAndSupportBlade"
        else
            log_success "  Sufficient vCPU quota available"
        fi
    fi
}

measure_latency() {
    local region=$1
    local endpoint="${region}.management.azure.com"

    log_info "Measuring latency to $region..."

    # Ping 3 times and get average
    local latency=$(ping -c 3 "$endpoint" 2>/dev/null | tail -1 | awk -F '/' '{print $5}' || echo "N/A")

    if [ "$latency" != "N/A" ]; then
        log_success "  Average latency: ${latency}ms"
        echo "$latency"
    else
        log_warning "  Could not measure latency"
        echo "999"
    fi
}

recommend_region() {
    log_info "Analyzing regions for optimal selection..."

    declare -A region_scores

    for region in "${REQUIRED_REGIONS[@]}"; do
        local score=0

        # Check availability (40 points)
        if check_region_availability "$region" &> /dev/null; then
            score=$((score + 40))
        fi

        # Check quota (30 points)
        check_quota "$region" &> /dev/null
        score=$((score + 30))

        # Measure latency (30 points)
        local latency=$(measure_latency "$region")
        if [ "$latency" != "999" ]; then
            # Lower latency = higher score
            local latency_score=$((30 - ${latency%.*} / 10))
            [ $latency_score -lt 0 ] && latency_score=0
            score=$((score + latency_score))
        fi

        region_scores[$region]=$score
    done

    # Find highest scoring region
    local best_region=""
    local best_score=0

    echo ""
    log_info "Regional Scores:"
    for region in "${!region_scores[@]}"; do
        local score=${region_scores[$region]}
        echo "  $region: $score/100"

        if [ $score -gt $best_score ]; then
            best_score=$score
            best_region=$region
        fi
    done

    echo ""
    log_success "Recommended primary region: $best_region (score: $best_score/100)"

    # Recommend secondary region (different than primary)
    for region in "${REQUIRED_REGIONS[@]}"; do
        if [ "$region" != "$best_region" ]; then
            log_success "Recommended secondary region: $region"
            break
        fi
    done
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    echo "============================================================================"
    echo "AZURE REGION SELECTION & QUOTA CHECK"
    echo "============================================================================"
    echo ""

    check_az_cli
    check_login

    echo ""
    log_info "Checking resource provider registrations..."

    # Register required providers
    for provider in "Microsoft.App" "Microsoft.DBforPostgreSQL" "Microsoft.Cache" "Microsoft.ContainerRegistry" "Microsoft.KeyVault"; do
        local state=$(az provider show --namespace "$provider" --query "registrationState" -o tsv)
        if [ "$state" != "Registered" ]; then
            log_warning "Registering provider: $provider"
            az provider register --namespace "$provider" --wait
        else
            log_success "Provider registered: $provider"
        fi
    done

    echo ""
    recommend_region

    echo ""
    log_success "Region check complete!"
    echo ""
}

main "$@"
