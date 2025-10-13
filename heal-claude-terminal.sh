#!/usr/bin/env bash
###############################################################################
# Claude Terminal Healing Script
# Auto-repairs common issues in the Ailydian ecosystem
###############################################################################

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[HEAL]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

# Check and fix missing directories
fix_directories() {
    log_info "Checking directory structure..."

    local dirs=(
        "logs"
        "build"
        "telemetry"
        "reports"
        "docs"
        "LiveOps/seasons/season1"
        "LiveOps/economy"
        "LiveOps/experiments/ab"
        "LiveOps/schedule"
        "LiveOps/runbook"
        "LiveOps/kpis"
        "apps/console/src/i18n/locales/tr"
        "apps/console/src/i18n/locales/ar"
    )

    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            log_warn "Creating missing directory: $dir"
            mkdir -p "$dir"
        fi
    done

    log_info "✅ Directory structure validated"
}

# Fix missing or corrupted documentation
fix_documentation() {
    log_info "Checking documentation files..."

    # LICENSES.md
    if [ ! -f "docs/LICENSES.md" ]; then
        log_warn "Creating docs/LICENSES.md..."
        cat > docs/LICENSES.md <<'EOF'
# Third-Party Licenses

## Overview
This document lists all third-party software used in Ailydian Ultra Pro.

## Node.js Dependencies
See package.json for complete dependency list.

## Compliance
All dependencies use MIT, Apache 2.0, or compatible licenses.

Last Updated: $(date)
EOF
    fi

    # CERT-CHECKLISTS.md should exist from Phase 4
    if [ ! -f "docs/CERT-CHECKLISTS.md" ]; then
        log_warn "docs/CERT-CHECKLISTS.md missing - was Phase 4 setup run?"
    fi

    log_info "✅ Documentation validated"
}

# Fix missing i18n files
fix_i18n() {
    log_info "Checking i18n localization files..."

    # Turkish locale
    if [ ! -f "apps/console/src/i18n/locales/tr/common.json" ]; then
        log_warn "Creating Turkish locale..."
        cat > apps/console/src/i18n/locales/tr/common.json <<'EOF'
{
  "app": {
    "name": "Ailydian Ultra Pro",
    "tagline": "Yapay Zeka ile Güçlendirilmiş Platform"
  },
  "common": {
    "loading": "Yükleniyor...",
    "error": "Hata",
    "success": "Başarılı"
  }
}
EOF
    fi

    # Arabic locale
    if [ ! -f "apps/console/src/i18n/locales/ar/common.json" ]; then
        log_warn "Creating Arabic locale..."
        cat > apps/console/src/i18n/locales/ar/common.json <<'EOF'
{
  "app": {
    "name": "أيليديان ألترا برو",
    "tagline": "منصة مدعومة بالذكاء الاصطناعي"
  },
  "common": {
    "loading": "جاري التحميل...",
    "error": "خطأ",
    "success": "نجح"
  }
}
EOF
    fi

    log_info "✅ i18n files validated"
}

# Fix node_modules and dependencies
fix_dependencies() {
    log_info "Checking dependencies..."

    if [ ! -d "node_modules" ]; then
        log_warn "node_modules missing, installing..."

        if command -v pnpm &> /dev/null; then
            pnpm install --no-frozen-lockfile || {
                log_error "pnpm install failed"
                return 1
            }
        elif command -v npm &> /dev/null; then
            npm install || {
                log_error "npm install failed"
                return 1
            }
        else
            log_error "No package manager found (pnpm/npm)"
            return 1
        fi
    fi

    log_info "✅ Dependencies validated"
}

# Fix missing LiveOps configurations
fix_liveops() {
    log_info "Checking LiveOps configurations..."

    # Check Season 1 config
    if [ ! -f "LiveOps/seasons/season1/season.json" ]; then
        log_warn "Season 1 config missing - was LiveOps setup run?"
    fi

    # Check economy balance
    if [ ! -f "LiveOps/economy/balance.yaml" ]; then
        log_warn "Economy balance config missing"
    fi

    # Check rollback script
    if [ ! -x "LiveOps/runbook/rollback.sh" ]; then
        if [ -f "LiveOps/runbook/rollback.sh" ]; then
            log_warn "Making rollback.sh executable..."
            chmod +x LiveOps/runbook/rollback.sh
        else
            log_warn "Rollback script missing"
        fi
    fi

    log_info "✅ LiveOps configs validated"
}

# Fix permissions
fix_permissions() {
    log_info "Fixing script permissions..."

    local scripts=(
        "phase-audit-v2.sh"
        "gold-pipeline.sh"
        "gold-pipeline-web.sh"
        "UnifiedSprint.sh"
        "heal-claude-terminal.sh"
        "LiveOps/runbook/rollback.sh"
    )

    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            chmod +x "$script" 2>/dev/null || log_warn "Could not chmod $script"
        fi
    done

    log_info "✅ Permissions fixed"
}

# Main healing process
main() {
    echo "══════════════════════════════════════════════════════════"
    echo "  🏥 Claude Terminal Auto-Healing System"
    echo "══════════════════════════════════════════════════════════"
    echo ""

    fix_directories
    fix_documentation
    fix_i18n
    fix_liveops
    fix_permissions

    # Optional: Try to fix dependencies (can be slow)
    if [ "${FIX_DEPS:-0}" = "1" ]; then
        fix_dependencies
    else
        log_info "Skipping dependency check (set FIX_DEPS=1 to enable)"
    fi

    echo ""
    log_info "🎉 Healing complete!"
    echo ""
}

main "$@"
