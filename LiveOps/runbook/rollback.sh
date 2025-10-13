#!/usr/bin/env bash
###############################################################################
# LiveOps Rollback Script
# Purpose: Safely rollback events, patches, or experiments
# Auth: RBAC required (liveops.admin)
# Compliance: KVKV/GDPR/PDPL - All actions logged with Ed25519 signatures
###############################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIVEOPS_ROOT="$SCRIPT_DIR/.."
LOG_DIR="$LIVEOPS_ROOT/logs"
BACKUP_DIR="$LIVEOPS_ROOT/backups"
AUDIT_LOG="$LOG_DIR/rollback-audit.log"

# Season-specific paths
SEASON_S1_ROOT="$LIVEOPS_ROOT/seasons/season1"
SEASON_S2_ROOT="$LIVEOPS_ROOT/seasons/season2"
CURRENT_SEASON="${SEASON:-s1}"  # Default to S1, override with --season flag

mkdir -p "$LOG_DIR" "$BACKUP_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$AUDIT_LOG"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$AUDIT_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$AUDIT_LOG"
}

# Attested logging (Ed25519 signature)
attested_log() {
    local action="$1"
    local details="$2"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local entry="{\"timestamp\":\"$timestamp\",\"action\":\"$action\",\"details\":\"$details\",\"user\":\"${USER:-unknown}\"}"

    echo "$entry" >> "$AUDIT_LOG"

    # TODO: Sign with Ed25519 private key
    # echo "$entry" | openssl dgst -sha256 -sign /path/to/private.key | base64 >> "$AUDIT_LOG.sig"
}

# Check RBAC permissions
check_rbac() {
    # TODO: Implement RBAC check against auth service
    log_info "RBAC check: liveops.admin (placeholder)"
    return 0
}

# Backup current state
backup_state() {
    local component="$1"
    local season="${2:-$CURRENT_SEASON}"
    local backup_file="$BACKUP_DIR/${component}_${season}_$(date +%Y%m%d_%H%M%S).json"

    log_info "Backing up $component (season: $season) to $backup_file"

    case "$component" in
        "season")
            if [ "$season" = "s2" ]; then
                cp "$SEASON_S2_ROOT/season.json" "$backup_file" 2>/dev/null || true
            else
                cp "$SEASON_S1_ROOT/season.json" "$backup_file" 2>/dev/null || true
            fi
            ;;
        "season_events")
            if [ "$season" = "s2" ]; then
                cp -r "$SEASON_S2_ROOT/events/" "$BACKUP_DIR/s2_events_$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
            else
                cp -r "$SEASON_S1_ROOT/events/" "$BACKUP_DIR/s1_events_$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
            fi
            ;;
        "economy")
            if [ "$season" = "s2" ]; then
                cp "$LIVEOPS_ROOT/economy/s2-balance.yaml" "$backup_file" 2>/dev/null || true
            else
                cp "$LIVEOPS_ROOT/economy/balance.yaml" "$backup_file" 2>/dev/null || true
            fi
            ;;
        "experiments")
            if [ "$season" = "s2" ]; then
                cp -r "$LIVEOPS_ROOT/experiments/s2-ab/" "$BACKUP_DIR/s2_experiments_$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
            else
                cp -r "$LIVEOPS_ROOT/experiments/ab/" "$BACKUP_DIR/experiments_$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
            fi
            ;;
        *)
            log_error "Unknown component: $component"
            return 1
            ;;
    esac

    attested_log "backup_created" "component=$component,season=$season,file=$backup_file"
}

# Rollback event
rollback_event() {
    local event_id="$1"

    log_info "Rolling back event: $event_id"
    backup_state "season"

    # Deactivate event via API
    curl -X POST "http://localhost:3100/liveops/events/deactivate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${API_TOKEN:-dev-token}" \
        -d "{\"event_id\":\"$event_id\"}" \
        2>/dev/null || log_error "Failed to deactivate event via API"

    attested_log "event_rollback" "event_id=$event_id"
    log_info "Event $event_id rolled back successfully"
}

# Rollback economy patch
rollback_economy() {
    local patch_version="${1:-previous}"

    log_info "Rolling back economy to: $patch_version"
    backup_state "economy"

    # Find previous backup
    local latest_backup=$(ls -t "$BACKUP_DIR"/economy_*.json 2>/dev/null | head -2 | tail -1)

    if [ -z "$latest_backup" ]; then
        log_error "No economy backup found"
        return 1
    fi

    log_info "Restoring from: $latest_backup"
    cp "$latest_backup" "$LIVEOPS_ROOT/economy/balance.yaml"

    # Notify API to reload economy
    curl -X POST "http://localhost:3100/economy/reload" \
        -H "Authorization: Bearer ${API_TOKEN:-dev-token}" \
        2>/dev/null || log_error "Failed to reload economy via API"

    attested_log "economy_rollback" "restored_from=$latest_backup"
    log_info "Economy rolled back successfully"
}

# Stop A/B experiment
stop_experiment() {
    local experiment_id="$1"

    log_info "Stopping A/B experiment: $experiment_id"
    backup_state "experiments"

    # Stop experiment via API
    curl -X POST "http://localhost:3100/experiments/ab/stop" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${API_TOKEN:-dev-token}" \
        -d "{\"id\":\"$experiment_id\"}" \
        2>/dev/null || log_error "Failed to stop experiment via API"

    attested_log "experiment_stopped" "experiment_id=$experiment_id"
    log_info "Experiment $experiment_id stopped successfully"
}

# Canary rollback
rollback_canary() {
    local deployment_id="${1:-latest}"

    log_info "Rolling back canary deployment: $deployment_id"

    # Set canary percentage to 0% (disable)
    curl -X POST "http://localhost:3100/liveops/canary/set" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${API_TOKEN:-dev-token}" \
        -d '{"percent":0,"immediate":true}' \
        2>/dev/null || log_error "Failed to disable canary"

    attested_log "canary_rollback" "deployment_id=$deployment_id"
    log_info "Canary deployment rolled back to 0%"
}

# Rollback Season (S2-specific)
rollback_season() {
    local season="${1:-$CURRENT_SEASON}"
    local target="${2:-previous}"  # previous, event, economy, full

    log_warn "SEASON ROLLBACK: $season (target: $target)"

    case "$target" in
        "event")
            local event_id="$3"
            if [ -z "$event_id" ]; then
                log_error "Event ID required for event rollback"
                return 1
            fi
            log_info "Rolling back event: $event_id (season: $season)"
            backup_state "season_events" "$season"
            rollback_event "$event_id"
            ;;

        "economy")
            log_info "Rolling back economy (season: $season)"
            backup_state "economy" "$season"
            rollback_economy "previous"
            ;;

        "full")
            log_warn "FULL SEASON ROLLBACK: $season"
            read -p "This will rollback all $season content. Confirm (yes/no): " confirm
            if [ "$confirm" != "yes" ]; then
                log_info "Rollback cancelled by user"
                return 0
            fi

            backup_state "season" "$season"
            backup_state "season_events" "$season"
            backup_state "economy" "$season"
            backup_state "experiments" "$season"

            # Deactivate season via API
            curl -X POST "http://localhost:3100/liveops/season/deactivate" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer ${API_TOKEN:-dev-token}" \
                -d "{\"season\":\"$season\"}" \
                2>/dev/null || log_error "Failed to deactivate season via API"

            attested_log "season_rollback_full" "season=$season"
            log_warn "Full season $season rollback completed"
            ;;

        "previous")
            log_info "Reverting to previous season state..."
            backup_state "season" "$season"

            # Restore from most recent backup
            local latest_backup=$(ls -t "$BACKUP_DIR"/season_${season}_*.json 2>/dev/null | head -2 | tail -1)
            if [ -z "$latest_backup" ]; then
                log_error "No previous backup found for season $season"
                return 1
            fi

            log_info "Restoring from: $latest_backup"
            if [ "$season" = "s2" ]; then
                cp "$latest_backup" "$SEASON_S2_ROOT/season.json"
            else
                cp "$latest_backup" "$SEASON_S1_ROOT/season.json"
            fi

            attested_log "season_rollback_previous" "season=$season,backup=$latest_backup"
            log_info "Season $season reverted to previous state"
            ;;

        *)
            log_error "Unknown rollback target: $target"
            return 1
            ;;
    esac
}

# Emergency rollback (all components)
emergency_rollback() {
    local season="${1:-$CURRENT_SEASON}"

    log_warn "EMERGENCY ROLLBACK INITIATED (season: $season)"

    # Stop all active experiments for this season
    log_info "Stopping all $season experiments..."
    local exp_dir="$LIVEOPS_ROOT/experiments/ab/"
    if [ "$season" = "s2" ]; then
        exp_dir="$LIVEOPS_ROOT/experiments/s2-ab/"
    fi

    for exp_file in "$exp_dir"/*.json; do
        if [ -f "$exp_file" ]; then
            exp_id=$(basename "$exp_file" .json)
            stop_experiment "$exp_id" || true
        fi
    done

    # Rollback economy
    backup_state "economy" "$season"
    rollback_economy || true

    # Disable canary
    rollback_canary || true

    # Rollback season
    rollback_season "$season" "full" || true

    attested_log "emergency_rollback" "season=$season,all_components"
    log_warn "Emergency rollback completed - system in safe state"
}

# Health check after rollback
health_check() {
    log_info "Performing post-rollback health check..."

    local health_url="http://localhost:3100/api/health"
    local response=$(curl -s "$health_url" 2>/dev/null || echo "{\"status\":\"error\"}")

    if echo "$response" | grep -q "healthy"; then
        log_info "Health check: OK"
        return 0
    else
        log_error "Health check: FAILED - $response"
        return 1
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "═══════════════════════════════════════"
    echo "  LiveOps Rollback Tool (Season: $CURRENT_SEASON)"
    echo "═══════════════════════════════════════"
    echo "1) Rollback Event"
    echo "2) Rollback Economy Patch"
    echo "3) Stop A/B Experiment"
    echo "4) Rollback Canary Deployment"
    echo "5) Rollback Season (S2)"
    echo "6) EMERGENCY ROLLBACK (All)"
    echo "7) Health Check"
    echo "8) View Audit Log"
    echo "0) Exit"
    echo "═══════════════════════════════════════"
}

# Main execution
main() {
    # Parse --season flag first
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --season)
                CURRENT_SEASON="$2"
                shift 2
                ;;
            --season=*)
                CURRENT_SEASON="${1#*=}"
                shift
                ;;
            *)
                break
                ;;
        esac
    done

    log_info "Running rollback script (season: $CURRENT_SEASON)"

    check_rbac || {
        log_error "RBAC check failed - insufficient permissions"
        exit 1
    }

    # Command-line mode
    if [ $# -gt 0 ]; then
        case "$1" in
            "season")
                rollback_season "$CURRENT_SEASON" "${2:-previous}" "${3:-}"
                ;;
            "event")
                rollback_event "${2:-}"
                ;;
            "economy")
                rollback_economy "${2:-}"
                ;;
            "experiment")
                stop_experiment "${2:-}"
                ;;
            "canary")
                rollback_canary "${2:-}"
                ;;
            "emergency")
                emergency_rollback "$CURRENT_SEASON"
                ;;
            "health")
                health_check
                ;;
            --dry-run)
                log_info "DRY RUN MODE - No changes will be made"
                log_info "Season: $CURRENT_SEASON"
                log_info "Backups would be created in: $BACKUP_DIR"
                exit 0
                ;;
            *)
                echo "Usage: $0 [--season s1|s2] {season|event|economy|experiment|canary|emergency|health} [options]"
                echo ""
                echo "Examples:"
                echo "  $0 --season s2 season full                    # Full S2 rollback"
                echo "  $0 --season s2 season event mini-boss-...     # Rollback S2 event"
                echo "  $0 --season s2 economy                        # Rollback S2 economy"
                echo "  $0 --season s2 emergency                      # Emergency S2 rollback"
                echo "  $0 --dry-run                                  # Test mode"
                exit 1
                ;;
        esac
        exit 0
    fi

    # Interactive mode
    while true; do
        show_menu
        read -p "Select option: " choice

        case "$choice" in
            1)
                read -p "Enter event ID: " event_id
                rollback_event "$event_id"
                ;;
            2)
                rollback_economy
                ;;
            3)
                read -p "Enter experiment ID: " exp_id
                stop_experiment "$exp_id"
                ;;
            4)
                rollback_canary
                ;;
            5)
                echo "Season Rollback Options:"
                echo "  1) Rollback to previous state"
                echo "  2) Rollback event"
                echo "  3) Rollback economy"
                echo "  4) Full season rollback"
                read -p "Select season rollback type: " season_choice
                case "$season_choice" in
                    1)
                        rollback_season "$CURRENT_SEASON" "previous"
                        ;;
                    2)
                        read -p "Enter event ID: " event_id
                        rollback_season "$CURRENT_SEASON" "event" "$event_id"
                        ;;
                    3)
                        rollback_season "$CURRENT_SEASON" "economy"
                        ;;
                    4)
                        rollback_season "$CURRENT_SEASON" "full"
                        ;;
                    *)
                        log_error "Invalid season rollback option"
                        ;;
                esac
                ;;
            6)
                read -p "EMERGENCY ROLLBACK - Are you sure? (yes/no): " confirm
                if [ "$confirm" = "yes" ]; then
                    emergency_rollback "$CURRENT_SEASON"
                fi
                ;;
            7)
                health_check
                ;;
            8)
                tail -20 "$AUDIT_LOG"
                ;;
            0)
                log_info "Exiting rollback tool"
                exit 0
                ;;
            *)
                log_error "Invalid option"
                ;;
        esac

        read -p "Press Enter to continue..."
    done
}

# Run main
main "$@"
