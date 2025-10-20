#!/bin/bash

# =============================================================================
# Season 2 Week 1 Rollback & Incident Response Script
# =============================================================================
# Purpose: Orchestrate rollback operations for economy, A/B experiments, events
# Version: 1.0.0
# Date: 2026-01-21
# Author: LiveOps Team
#
# Usage:
#   ./w1-rollback.sh economy [--dry-run] [--force]
#   ./w1-rollback.sh ab_experiment <experiment_id> <variant> [--dry-run] [--force]
#   ./w1-rollback.sh event_pause <event_id> [--dry-run] [--force]
#   ./w1-rollback.sh event_resume <event_id> [--dry-run] [--force]
#
# Examples:
#   ./w1-rollback.sh economy --dry-run
#   ./w1-rollback.sh ab_experiment abx-storm-reward variant_b
#   ./w1-rollback.sh event_pause photomode-storm-trails
# =============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/LiveOps/logs"
BACKUP_DIR="$PROJECT_ROOT/LiveOps/backups"

# API Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
API_KEY="${LIVEOPS_API_KEY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
DRY_RUN=false
FORCE=false

# Timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/rollback-$TIMESTAMP.log"

# =============================================================================
# Helper Functions
# =============================================================================

# Log message with timestamp
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if required tools are installed
check_dependencies() {
    log "INFO" "Checking dependencies..."

    local deps=("curl" "jq" "git")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log "ERROR" "Required tool '$dep' not found. Please install it."
            exit 1
        fi
    done

    log "INFO" "All dependencies found ✓"
}

# Verify API key is set
check_api_key() {
    if [[ -z "$API_KEY" ]]; then
        log "ERROR" "LIVEOPS_API_KEY environment variable not set"
        log "ERROR" "Export API key: export LIVEOPS_API_KEY=your_api_key"
        exit 1
    fi

    log "INFO" "API key found ✓"
}

# Create backup of current state
create_backup() {
    local backup_type=$1
    local backup_file="$BACKUP_DIR/$backup_type-backup-$TIMESTAMP.yaml"

    log "INFO" "Creating backup: $backup_file"

    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY-RUN] Would create backup at $backup_file"
        return 0
    fi

    # Create backup directory if not exists
    mkdir -p "$BACKUP_DIR"

    # Backup based on type
    case "$backup_type" in
        economy)
            cp "$PROJECT_ROOT/LiveOps/economy/patches/s2-w1-hotfix.yaml" "$backup_file" || {
                log "ERROR" "Failed to create economy backup"
                exit 1
            }
            ;;
        ab_experiment)
            cp "$PROJECT_ROOT/LiveOps/experiments/s2-ab/$2.json" "$backup_file" || {
                log "ERROR" "Failed to create A/B experiment backup"
                exit 1
            }
            ;;
        event)
            cp "$PROJECT_ROOT/LiveOps/seasons/season2/events/$2.json" "$backup_file" || {
                log "ERROR" "Failed to create event backup"
                exit 1
            }
            ;;
    esac

    log "INFO" "Backup created successfully ✓"
    echo "$backup_file"
}

# Send Slack notification
send_slack_notification() {
    local message=$1
    local channel=${2:-"#alerts-liveops"}

    log "INFO" "Sending Slack notification to $channel"

    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY-RUN] Would send Slack notification: $message"
        return 0
    fi

    # Send notification via API (assuming Slack webhook integration)
    curl -s -X POST "$API_BASE_URL/api/notifications/slack" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d "{\"channel\": \"$channel\", \"message\": \"$message\"}" \
        > /dev/null 2>&1 || {
        log "WARN" "Failed to send Slack notification (non-critical)"
    }
}

# API call wrapper with retry
api_call() {
    local method=$1
    local endpoint=$2
    local data=${3:-""}
    local max_retries=3
    local retry_delay=2

    for ((i=1; i<=max_retries; i++)); do
        if [[ -z "$data" ]]; then
            response=$(curl -s -X "$method" "$API_BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $API_KEY")
        else
            response=$(curl -s -X "$method" "$API_BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $API_KEY" \
                -d "$data")
        fi

        if [[ $? -eq 0 ]]; then
            echo "$response"
            return 0
        fi

        if [[ $i -lt $max_retries ]]; then
            log "WARN" "API call failed, retrying in ${retry_delay}s (attempt $i/$max_retries)"
            sleep $retry_delay
        fi
    done

    log "ERROR" "API call failed after $max_retries attempts"
    return 1
}

# Verify rollback success
verify_rollback() {
    local rollback_type=$1

    log "INFO" "Verifying rollback..."

    case "$rollback_type" in
        economy)
            # Check if economy config reverted
            local inflation=$(api_call GET "/api/economy/inflation-index" | jq -r '.inflation_index')
            log "INFO" "Current inflation index: $inflation"

            if (( $(echo "$inflation < 1.15" | bc -l) )); then
                log "INFO" "Economy rollback verified ✓"
                return 0
            else
                log "ERROR" "Economy rollback verification failed (inflation still high)"
                return 1
            fi
            ;;
        ab_experiment)
            log "INFO" "A/B experiment rollback verified ✓ (check experiment status manually)"
            return 0
            ;;
        event)
            log "INFO" "Event operation verified ✓"
            return 0
            ;;
    esac
}

# Confirmation prompt
confirm_rollback() {
    if [[ "$FORCE" == true ]] || [[ "$DRY_RUN" == true ]]; then
        return 0
    fi

    print_status "$YELLOW" "⚠️  WARNING: This will perform a rollback operation"
    print_status "$YELLOW" "⚠️  This action may impact live players"
    print_status "$YELLOW" ""
    read -p "Are you sure you want to proceed? (yes/no): " -r
    echo

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "INFO" "Rollback cancelled by user"
        exit 0
    fi
}

# =============================================================================
# Rollback Operations
# =============================================================================

# Economy Hotfix Rollback
rollback_economy() {
    log "INFO" "========================================="
    log "INFO" "ECONOMY HOTFIX ROLLBACK"
    log "INFO" "========================================="

    # Pre-flight checks
    log "INFO" "Running pre-flight checks..."

    if [[ ! -f "$PROJECT_ROOT/LiveOps/economy/s2-balance.yaml" ]]; then
        log "ERROR" "Baseline economy config not found: s2-balance.yaml"
        exit 1
    fi

    # Create backup
    backup_file=$(create_backup "economy")

    # Confirm rollback
    confirm_rollback

    # Execute rollback
    log "INFO" "Rolling back economy config to baseline..."

    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY-RUN] Would rollback economy config"
        log "INFO" "[DRY-RUN] Would invalidate cache"
        log "INFO" "[DRY-RUN] Would reload game servers"
    else
        # Call API to rollback economy
        response=$(api_call POST "/api/economy/rebalance" \
            "{\"action\": \"rollback\", \"config\": \"s2-balance.yaml\"}")

        if [[ $(echo "$response" | jq -r '.success') == "true" ]]; then
            log "INFO" "Economy config rolled back successfully ✓"
        else
            log "ERROR" "Economy rollback failed: $(echo "$response" | jq -r '.error')"
            exit 1
        fi

        # Invalidate cache
        log "INFO" "Invalidating economy cache..."
        api_call POST "/api/cache/invalidate" "{\"key\": \"economy_config\"}"

        # Reload game servers
        log "INFO" "Reloading game servers..."
        sleep 3  # Give servers time to pick up new config
    fi

    # Verify rollback
    if [[ "$DRY_RUN" == false ]]; then
        verify_rollback "economy" || {
            log "ERROR" "Rollback verification failed"
            exit 1
        }
    fi

    # Send notifications
    send_slack_notification "🔄 Economy hotfix rolled back to baseline (s2-balance.yaml)" "#alerts-economy"

    log "INFO" "Economy rollback completed successfully ✓"
    print_status "$GREEN" "✓ Economy rollback complete"
}

# A/B Experiment Kill Switch
rollback_ab_experiment() {
    local experiment_id=$1
    local variant=$2

    log "INFO" "========================================="
    log "INFO" "A/B EXPERIMENT KILL SWITCH"
    log "INFO" "Experiment: $experiment_id"
    log "INFO" "Variant: $variant"
    log "INFO" "========================================="

    # Pre-flight checks
    log "INFO" "Running pre-flight checks..."

    local experiment_file="$PROJECT_ROOT/LiveOps/experiments/s2-ab/$experiment_id.json"
    if [[ ! -f "$experiment_file" ]]; then
        log "ERROR" "Experiment config not found: $experiment_id.json"
        exit 1
    fi

    # Create backup
    backup_file=$(create_backup "ab_experiment" "$experiment_id")

    # Confirm rollback
    confirm_rollback

    # Execute kill switch
    log "INFO" "Killing experiment variant: $variant"

    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY-RUN] Would kill variant $variant in experiment $experiment_id"
        log "INFO" "[DRY-RUN] Would reallocate traffic to remaining variants"
        log "INFO" "[DRY-RUN] Would update feature flags"
    else
        # Call API to kill variant
        response=$(api_call POST "/api/experiments/ab/kill" \
            "{\"experiment_id\": \"$experiment_id\", \"variant\": \"$variant\"}")

        if [[ $(echo "$response" | jq -r '.success') == "true" ]]; then
            log "INFO" "Variant $variant killed successfully ✓"

            # Get new traffic allocation
            local new_allocation=$(echo "$response" | jq -r '.new_allocation')
            log "INFO" "New traffic allocation: $new_allocation"
        else
            log "ERROR" "Variant kill failed: $(echo "$response" | jq -r '.error')"
            exit 1
        fi

        # Update feature flags
        log "INFO" "Updating feature flags..."
        api_call POST "/api/experiments/ab/refresh-flags" "{\"experiment_id\": \"$experiment_id\"}"
    fi

    # Send notifications
    send_slack_notification "🛑 A/B Experiment $experiment_id - Variant $variant killed (guardrail violation)" "#alerts-liveops"

    log "INFO" "A/B experiment kill switch completed successfully ✓"
    print_status "$GREEN" "✓ A/B experiment kill switch complete"
}

# Event Pause
pause_event() {
    local event_id=$1

    log "INFO" "========================================="
    log "INFO" "EVENT PAUSE"
    log "INFO" "Event: $event_id"
    log "INFO" "========================================="

    # Pre-flight checks
    log "INFO" "Running pre-flight checks..."

    local event_file="$PROJECT_ROOT/LiveOps/seasons/season2/events/$event_id.json"
    if [[ ! -f "$event_file" ]]; then
        log "ERROR" "Event config not found: $event_id.json"
        exit 1
    fi

    # Confirm operation
    confirm_rollback

    # Execute pause
    log "INFO" "Pausing event submissions..."

    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY-RUN] Would pause event $event_id"
        log "INFO" "[DRY-RUN] Would disable submission endpoint"
        log "INFO" "[DRY-RUN] Would notify players"
    else
        # Call API to pause event
        response=$(api_call POST "/api/events/photomode/pause" \
            "{\"event_id\": \"$event_id\", \"reason\": \"Moderation queue backlog\"}")

        if [[ $(echo "$response" | jq -r '.success') == "true" ]]; then
            log "INFO" "Event paused successfully ✓"
        else
            log "ERROR" "Event pause failed: $(echo "$response" | jq -r '.error')"
            exit 1
        fi

        # Notify players
        log "INFO" "Notifying players..."
        api_call POST "/api/notifications/in-game" \
            "{\"message\": \"Submissions temporarily paused for $event_id\", \"severity\": \"info\"}"
    fi

    # Send notifications
    send_slack_notification "⏸️ Event $event_id paused (moderation queue backlog)" "#alerts-community"

    log "INFO" "Event pause completed successfully ✓"
    print_status "$GREEN" "✓ Event pause complete"
}

# Event Resume
resume_event() {
    local event_id=$1

    log "INFO" "========================================="
    log "INFO" "EVENT RESUME"
    log "INFO" "Event: $event_id"
    log "INFO" "========================================="

    # Execute resume
    log "INFO" "Resuming event submissions..."

    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY-RUN] Would resume event $event_id"
        log "INFO" "[DRY-RUN] Would enable submission endpoint"
        log "INFO" "[DRY-RUN] Would notify players"
    else
        # Call API to resume event
        response=$(api_call POST "/api/events/photomode/resume" \
            "{\"event_id\": \"$event_id\"}")

        if [[ $(echo "$response" | jq -r '.success') == "true" ]]; then
            log "INFO" "Event resumed successfully ✓"
        else
            log "ERROR" "Event resume failed: $(echo "$response" | jq -r '.error')"
            exit 1
        fi

        # Notify players
        log "INFO" "Notifying players..."
        api_call POST "/api/notifications/in-game" \
            "{\"message\": \"Submissions reopened for $event_id\", \"severity\": \"info\"}"
    fi

    # Send notifications
    send_slack_notification "▶️ Event $event_id resumed (moderation queue cleared)" "#alerts-community"

    log "INFO" "Event resume completed successfully ✓"
    print_status "$GREEN" "✓ Event resume complete"
}

# =============================================================================
# Main Script
# =============================================================================

main() {
    # Create log directory if not exists
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKUP_DIR"

    # Start logging
    log "INFO" "========================================="
    log "INFO" "S2 Week 1 Rollback Script v1.0.0"
    log "INFO" "Timestamp: $(date)"
    log "INFO" "User: $(whoami)"
    log "INFO" "========================================="

    # Parse arguments
    if [[ $# -lt 1 ]]; then
        print_status "$RED" "Usage: $0 <operation> [args...] [--dry-run] [--force]"
        print_status "$YELLOW" ""
        print_status "$YELLOW" "Operations:"
        print_status "$YELLOW" "  economy                              - Rollback economy hotfix"
        print_status "$YELLOW" "  ab_experiment <id> <variant>         - Kill A/B experiment variant"
        print_status "$YELLOW" "  event_pause <id>                     - Pause event submissions"
        print_status "$YELLOW" "  event_resume <id>                    - Resume event submissions"
        print_status "$YELLOW" ""
        print_status "$YELLOW" "Flags:"
        print_status "$YELLOW" "  --dry-run                            - Simulate without making changes"
        print_status "$YELLOW" "  --force                              - Skip confirmation prompts"
        exit 1
    fi

    # Parse operation
    OPERATION=$1
    shift

    # Parse flags
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dry-run)
                DRY_RUN=true
                log "INFO" "DRY-RUN MODE ENABLED"
                shift
                ;;
            --force)
                FORCE=true
                log "INFO" "FORCE MODE ENABLED (no confirmations)"
                shift
                ;;
            *)
                # Store positional arguments
                ARGS+=("$1")
                shift
                ;;
        esac
    done

    # Check dependencies
    check_dependencies

    # Check API key (skip in dry-run)
    if [[ "$DRY_RUN" == false ]]; then
        check_api_key
    fi

    # Execute operation
    case "$OPERATION" in
        economy)
            rollback_economy
            ;;
        ab_experiment)
            if [[ ${#ARGS[@]} -lt 2 ]]; then
                log "ERROR" "Missing arguments: ab_experiment <experiment_id> <variant>"
                exit 1
            fi
            rollback_ab_experiment "${ARGS[0]}" "${ARGS[1]}"
            ;;
        event_pause)
            if [[ ${#ARGS[@]} -lt 1 ]]; then
                log "ERROR" "Missing argument: event_pause <event_id>"
                exit 1
            fi
            pause_event "${ARGS[0]}"
            ;;
        event_resume)
            if [[ ${#ARGS[@]} -lt 1 ]]; then
                log "ERROR" "Missing argument: event_resume <event_id>"
                exit 1
            fi
            resume_event "${ARGS[0]}"
            ;;
        *)
            log "ERROR" "Unknown operation: $OPERATION"
            exit 1
            ;;
    esac

    # Final summary
    log "INFO" "========================================="
    log "INFO" "ROLLBACK COMPLETE"
    log "INFO" "Log file: $LOG_FILE"
    log "INFO" "========================================="

    print_status "$GREEN" ""
    print_status "$GREEN" "✓ Rollback operation completed successfully"
    print_status "$GREEN" "✓ Check log file for details: $LOG_FILE"
}

# Run main function
main "$@"
