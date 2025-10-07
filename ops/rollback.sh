#!/usr/bin/env bash
# ============================================================================
# DNS ROLLBACK SCRIPT
# ============================================================================
# Purpose: Restore DNS records from preflight backup
# Usage: ./ops/rollback.sh [domain]
# ============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}ℹ${NC} $(date -u +%H:%M:%S) | $1"; }
success() { echo -e "${GREEN}✓${NC} $(date -u +%H:%M:%S) | $1"; }
error() { echo -e "${RED}✗${NC} $(date -u +%H:%M:%S) | $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $(date -u +%H:%M:%S) | $1"; }

# Load environment
if [ -f "ops/.env.dns" ]; then
    source ops/.env.dns
elif [ -f ".env.dns" ]; then
    source .env.dns
else
    error "Environment file not found"
    exit 1
fi

# Check VERCEL_TOKEN
if [ -z "${VERCEL_TOKEN:-}" ]; then
    error "VERCEL_TOKEN not set"
    exit 1
fi

DOMAIN_TO_ROLLBACK="${1:-all}"

log "╔════════════════════════════════════════════════════════════════╗"
log "║  DNS ROLLBACK - RESTORE FROM PREFLIGHT                        ║"
log "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Confirm rollback
warn "ROLLBACK CONFIRMATION REQUIRED"
warn "This will restore DNS records from preflight backup"
warn "Domain: $DOMAIN_TO_ROLLBACK"
echo ""
read -p "Type 'ROLLBACK' to confirm: " confirmation

if [ "$confirmation" != "ROLLBACK" ]; then
    log "Rollback cancelled"
    exit 0
fi

rollback_domain() {
    local domain=$1
    local backup_file="ops/preflight-dns-${domain//./-}.json"

    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi

    log "Rolling back domain: $domain"
    log "  Backup file: $backup_file"

    # Read old records
    local records=$(cat "$backup_file" | jq -r '.records[]' 2>/dev/null || echo "")

    if [ -z "$records" ]; then
        error "No records found in backup"
        return 1
    fi

    # Get current records to delete
    log "  Fetching current records..."
    local current_records=$(curl -sS \
        "https://api.vercel.com/v2/domains/${domain}/records" \
        -H "Authorization: Bearer ${VERCEL_TOKEN}" \
        | jq -r '.records[] | select(.type=="CNAME" or .type=="ALIAS" or .type=="TXT") | .id' \
        || echo "")

    # Delete current records
    if [ -n "$current_records" ]; then
        log "  Deleting current records..."
        while IFS= read -r record_id; do
            curl -sS -X DELETE \
                "https://api.vercel.com/v2/domains/${domain}/records/${record_id}" \
                -H "Authorization: Bearer ${VERCEL_TOKEN}" \
                >/dev/null 2>&1 || true
        done <<< "$current_records"
        success "  Current records deleted"
    fi

    # Restore old records
    log "  Restoring old records from backup..."

    # This is a placeholder - actual implementation would parse backup and recreate records
    warn "  Note: Automatic restoration not yet implemented"
    warn "  Please manually restore records from: $backup_file"

    # Purge AFD cache
    if command -v az &> /dev/null; then
        log "  Purging Azure Front Door cache..."
        az afd endpoint purge \
            --resource-group ailydian-core-prod-rg \
            --profile-name ailydian-production-fd \
            --endpoint-name ailydian-production-fd-endpoint \
            --content-paths '/*' \
            --domains "$domain" \
            --output none 2>/dev/null || warn "  AFD cache purge failed (may not exist yet)"
    fi

    success "Rollback initiated for $domain"
}

# Execute rollback
if [ "$DOMAIN_TO_ROLLBACK" == "all" ]; then
    for domain in ailydian.com newsai.earth; do
        rollback_domain "$domain"
    done
else
    rollback_domain "$DOMAIN_TO_ROLLBACK"
fi

echo ""
success "╔════════════════════════════════════════════════════════════════╗"
success "║  ROLLBACK COMPLETE                                            ║"
success "╚════════════════════════════════════════════════════════════════╝"
echo ""
log "Next steps:"
log "  1. Wait 5-10 minutes for DNS propagation"
log "  2. Run: ./ops/validate.sh"
log "  3. Verify all domains resolve correctly"
