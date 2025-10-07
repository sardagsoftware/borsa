#!/bin/bash
# ============================================================================
# CANARY DEPLOYMENT SCRIPT
# ============================================================================
# Purpose: Gradually shift traffic from old to new deployment
# Strategy: 10% → 25% → 50% → 75% → 100%
# White-Hat: Zero downtime, automatic rollback on errors
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
NEW_REVISION=""
OLD_REVISION=""
CANARY_STEPS=(10 25 50 75 100)
WAIT_TIME=300 # 5 minutes between steps
ERROR_THRESHOLD=1.0 # 1% error rate threshold
LATENCY_THRESHOLD=200 # 200ms p95 threshold

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

check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not installed"
        exit 1
    fi

    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure"
        exit 1
    fi

    log_success "Prerequisites OK"
}

get_revisions() {
    log_info "Getting container app revisions..."

    # Get all active revisions
    local revisions=$(az containerapp revision list \
        --name "$CONTAINER_APP" \
        --resource-group "$RESOURCE_GROUP" \
        --query "[?properties.active==\`true\`].name" \
        -o tsv)

    local revision_count=$(echo "$revisions" | wc -l | tr -d ' ')

    if [ "$revision_count" -ne 2 ]; then
        log_error "Expected 2 active revisions, found $revision_count"
        log_info "Active revisions:"
        echo "$revisions"
        exit 1
    fi

    # Get newest and oldest revisions
    NEW_REVISION=$(echo "$revisions" | sort | tail -1)
    OLD_REVISION=$(echo "$revisions" | sort | head -1)

    log_success "Old revision: $OLD_REVISION"
    log_success "New revision: $NEW_REVISION"
}

set_traffic_split() {
    local new_percent=$1
    local old_percent=$((100 - new_percent))

    log_info "Setting traffic split: Old ${old_percent}% → New ${new_percent}%"

    az containerapp ingress traffic set \
        --name "$CONTAINER_APP" \
        --resource-group "$RESOURCE_GROUP" \
        --revision-weight "${OLD_REVISION}=${old_percent}" "${NEW_REVISION}=${new_percent}" \
        --output none

    log_success "Traffic split updated"
}

check_health() {
    local revision=$1

    log_info "Checking health of revision: $revision"

    # Get revision FQDN
    local fqdn=$(az containerapp revision show \
        --name "$revision" \
        --app "$CONTAINER_APP" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.fqdn" \
        -o tsv)

    # Health check
    local health_url="https://${fqdn}/api/health"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" || echo "000")

    if [ "$response" != "200" ]; then
        log_error "Health check failed (HTTP $response)"
        return 1
    fi

    log_success "Health check passed"
    return 0
}

check_metrics() {
    local revision=$1
    local duration=$2

    log_info "Checking metrics for last ${duration} seconds..."

    # Get Application Insights metrics
    local app_insights=$(az containerapp show \
        --name "$CONTAINER_APP" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.configuration.daprAIConnectionString" \
        -o tsv | cut -d';' -f2 | cut -d'=' -f2)

    # Query error rate
    local error_rate=$(az monitor app-insights metrics show \
        --app "$app_insights" \
        --metric "requests/failed" \
        --interval PT1M \
        --aggregation avg \
        --start-time "$(date -u -d "${duration} seconds ago" +%Y-%m-%dT%H:%M:%S)" \
        --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
        --query "value.segments[0].avg" \
        -o tsv 2>/dev/null || echo "0")

    # Query p95 latency
    local latency=$(az monitor app-insights metrics show \
        --app "$app_insights" \
        --metric "requests/duration" \
        --interval PT1M \
        --aggregation percentile \
        --filter "cloud/roleName eq '$CONTAINER_APP'" \
        --start-time "$(date -u -d "${duration} seconds ago" +%Y-%m-%dT%H:%M:%S)" \
        --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
        --query "value.segments[0]['percentile.95']" \
        -o tsv 2>/dev/null || echo "0")

    log_info "  Error rate: ${error_rate}%"
    log_info "  P95 latency: ${latency}ms"

    # Check thresholds
    if (( $(echo "$error_rate > $ERROR_THRESHOLD" | bc -l) )); then
        log_error "Error rate exceeded threshold (${error_rate}% > ${ERROR_THRESHOLD}%)"
        return 1
    fi

    if (( $(echo "$latency > $LATENCY_THRESHOLD" | bc -l) )); then
        log_error "Latency exceeded threshold (${latency}ms > ${LATENCY_THRESHOLD}ms)"
        return 1
    fi

    log_success "Metrics within acceptable range"
    return 0
}

rollback() {
    log_error "Rolling back to old revision..."

    set_traffic_split 0

    # Deactivate new revision
    az containerapp revision deactivate \
        --name "$CONTAINER_APP" \
        --resource-group "$RESOURCE_GROUP" \
        --revision "$NEW_REVISION" \
        --output none

    log_success "Rollback complete - 100% traffic to old revision"
    exit 1
}

cleanup_old_revision() {
    log_info "Deactivating old revision: $OLD_REVISION"

    az containerapp revision deactivate \
        --name "$CONTAINER_APP" \
        --resource-group "$RESOURCE_GROUP" \
        --revision "$OLD_REVISION" \
        --output none

    log_success "Old revision deactivated"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    echo "============================================================================"
    echo "CANARY DEPLOYMENT - AILYDIAN ULTRA PRO"
    echo "============================================================================"
    echo ""

    check_prerequisites
    get_revisions

    # Initial health check on new revision
    if ! check_health "$NEW_REVISION"; then
        log_error "New revision failed initial health check"
        exit 1
    fi

    # Canary deployment steps
    for percent in "${CANARY_STEPS[@]}"; do
        echo ""
        log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_info "CANARY STEP: ${percent}% traffic to new revision"
        log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        # Set traffic split
        set_traffic_split "$percent"

        if [ "$percent" -eq 100 ]; then
            log_success "🎉 Canary deployment complete!"
            cleanup_old_revision
            break
        fi

        # Wait for traffic to settle
        log_info "Waiting ${WAIT_TIME} seconds for traffic to settle..."
        sleep "$WAIT_TIME"

        # Check health
        if ! check_health "$NEW_REVISION"; then
            rollback
        fi

        # Check metrics
        if ! check_metrics "$NEW_REVISION" "$WAIT_TIME"; then
            rollback
        fi

        log_success "Step ${percent}% completed successfully"
    done

    echo ""
    log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "✅ CANARY DEPLOYMENT SUCCESSFUL"
    log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

main "$@"
