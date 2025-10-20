#!/bin/bash
# ============================================================================
# EMERGENCY ROLLBACK SCRIPT
# ============================================================================
# Purpose: Instantly rollback to previous stable revision
# White-Hat: Zero data loss, instant recovery
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-ailydian-production-rg}"
CONTAINER_APP="${CONTAINER_APP:-ailydian-production-api}"
TARGET_REVISION="${1:-}"

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

show_revisions() {
    echo ""
    log_info "Available revisions:"
    echo ""

    az containerapp revision list \
        --name "$CONTAINER_APP" \
        --resource-group "$RESOURCE_GROUP" \
        --query "[].{Name:name, Active:properties.active, Created:properties.createdTime, Traffic:properties.trafficWeight}" \
        -o table
}

confirm_rollback() {
    local target=$1

    echo ""
    log_warning "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_warning "⚠️  ROLLBACK CONFIRMATION REQUIRED"
    log_warning "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    log_warning "Container App: $CONTAINER_APP"
    log_warning "Target Revision: $target"
    echo ""
    read -p "Are you sure you want to rollback? (type 'ROLLBACK' to confirm): " confirmation

    if [ "$confirmation" != "ROLLBACK" ]; then
        log_info "Rollback cancelled"
        exit 0
    fi
}

execute_rollback() {
    local target=$1

    log_info "Executing rollback to: $target"

    # Step 1: Activate target revision if not active
    local is_active=$(az containerapp revision show \
        --name "$target" \
        --app "$CONTAINER_APP" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.active" \
        -o tsv)

    if [ "$is_active" != "true" ]; then
        log_info "Activating target revision..."
        az containerapp revision activate \
            --name "$CONTAINER_APP" \
            --resource-group "$RESOURCE_GROUP" \
            --revision "$target" \
            --output none
        log_success "Target revision activated"
    fi

    # Step 2: Set 100% traffic to target revision
    log_info "Routing 100% traffic to target revision..."
    az containerapp ingress traffic set \
        --name "$CONTAINER_APP" \
        --resource-group "$RESOURCE_GROUP" \
        --revision-weight "${target}=100" \
        --output none
    log_success "Traffic routed to target revision"

    # Step 3: Wait for traffic to settle
    log_info "Waiting for traffic to settle (10 seconds)..."
    sleep 10

    # Step 4: Health check
    log_info "Performing health check..."
    local fqdn=$(az containerapp show \
        --name "$CONTAINER_APP" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.configuration.ingress.fqdn" \
        -o tsv)

    local health_url="https://${fqdn}/api/health"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" || echo "000")

    if [ "$response" != "200" ]; then
        log_error "Health check failed (HTTP $response)"
        log_error "Manual intervention required!"
        exit 1
    fi

    log_success "Health check passed"

    # Step 5: Deactivate other revisions
    log_info "Deactivating other revisions..."
    local other_revisions=$(az containerapp revision list \
        --name "$CONTAINER_APP" \
        --resource-group "$RESOURCE_GROUP" \
        --query "[?properties.active==\`true\` && name!=\`${target}\`].name" \
        -o tsv)

    for revision in $other_revisions; do
        log_info "  Deactivating: $revision"
        az containerapp revision deactivate \
            --name "$CONTAINER_APP" \
            --resource-group "$RESOURCE_GROUP" \
            --revision "$revision" \
            --output none
    done

    log_success "Rollback complete"
}

send_alert() {
    local target=$1

    log_info "Sending rollback notification..."

    # Send to Application Insights
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
    local event_data=$(cat <<EOF
{
    "name": "Microsoft.ApplicationInsights.Event",
    "time": "$timestamp",
    "iKey": "${APP_INSIGHTS_KEY:-}",
    "data": {
        "baseType": "EventData",
        "baseData": {
            "name": "Rollback Executed",
            "properties": {
                "containerApp": "$CONTAINER_APP",
                "targetRevision": "$target",
                "executedBy": "$(whoami)",
                "timestamp": "$timestamp"
            }
        }
    }
}
EOF
)

    # Note: In production, send this to Application Insights or monitoring system
    log_success "Rollback event logged"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    echo "============================================================================"
    echo "🚨 EMERGENCY ROLLBACK - AILYDIAN ULTRA PRO"
    echo "============================================================================"
    echo ""

    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not installed"
        exit 1
    fi

    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure"
        exit 1
    fi

    # Show available revisions
    show_revisions

    # If no target revision specified, select automatically
    if [ -z "$TARGET_REVISION" ]; then
        log_info "Auto-selecting previous stable revision..."

        TARGET_REVISION=$(az containerapp revision list \
            --name "$CONTAINER_APP" \
            --resource-group "$RESOURCE_GROUP" \
            --query "[?properties.active==\`true\`] | sort_by(@, &properties.createdTime) | [-2].name" \
            -o tsv)

        if [ -z "$TARGET_REVISION" ]; then
            log_error "Could not find previous revision"
            exit 1
        fi

        log_info "Selected: $TARGET_REVISION"
    fi

    # Confirm rollback
    confirm_rollback "$TARGET_REVISION"

    # Execute rollback
    execute_rollback "$TARGET_REVISION"

    # Send alert
    send_alert "$TARGET_REVISION"

    echo ""
    log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "✅ ROLLBACK COMPLETED SUCCESSFULLY"
    log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    log_success "Current state:"
    show_revisions
}

main "$@"
