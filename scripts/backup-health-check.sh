#!/bin/bash
###############################################################################
# 🏥 BACKUP HEALTH CHECK SYSTEM
###############################################################################

set -e

BACKUP_DIR="/Users/sardag/Desktop/ailydian-backups"
ENCRYPTION_KEY="${BACKUP_DIR}/.backup_encryption.key"
HEALTH_LOG="${BACKUP_DIR}/health-check.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_health() {
    echo "[$(date)] $1" >> "$HEALTH_LOG"
}

echo "🏥 BACKUP HEALTH CHECK"
echo "====================="
echo ""

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Check 1: Backup directory exists
echo -n "1. Backup directory exists... "
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if [ -d "$BACKUP_DIR" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    log_health "✅ Backup directory exists"
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    log_health "❌ Backup directory not found"
fi

# Check 2: Encryption key exists
echo -n "2. Encryption key exists... "
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if [ -f "$ENCRYPTION_KEY" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    log_health "✅ Encryption key exists"
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    log_health "❌ Encryption key not found"
fi

# Check 3: Encryption key permissions
echo -n "3. Encryption key permissions... "
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if [ -f "$ENCRYPTION_KEY" ]; then
    PERMS=$(stat -f "%Lp" "$ENCRYPTION_KEY" 2>/dev/null || stat -c "%a" "$ENCRYPTION_KEY" 2>/dev/null)
    if [ "$PERMS" = "600" ]; then
        echo -e "${GREEN}✅ PASS (600)${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        log_health "✅ Key permissions correct (600)"
    else
        echo -e "${YELLOW}⚠️ WARNING ($PERMS)${NC}"
        log_health "⚠️ Key permissions: $PERMS (should be 600)"
    fi
else
    echo -e "${RED}❌ SKIP${NC}"
fi

# Check 4: Recent backups exist
echo -n "4. Recent backups (last 7 days)... "
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
RECENT_BACKUPS=$(find "$BACKUP_DIR" -name "*.enc" -mtime -7 2>/dev/null | wc -l)
if [ "$RECENT_BACKUPS" -gt 0 ]; then
    echo -e "${GREEN}✅ PASS ($RECENT_BACKUPS backups)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    log_health "✅ Recent backups: $RECENT_BACKUPS"
else
    echo -e "${YELLOW}⚠️ WARNING (no recent backups)${NC}"
    log_health "⚠️ No backups in last 7 days"
fi

# Check 5: Disk space
echo -n "5. Disk space available... "
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
AVAILABLE_GB=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}' | sed 's/Gi*//')
if [ "${AVAILABLE_GB%.*}" -gt 10 ]; then
    echo -e "${GREEN}✅ PASS (${AVAILABLE_GB}GB)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    log_health "✅ Disk space: ${AVAILABLE_GB}GB"
else
    echo -e "${YELLOW}⚠️ WARNING (${AVAILABLE_GB}GB)${NC}"
    log_health "⚠️ Low disk space: ${AVAILABLE_GB}GB"
fi

# Check 6: Backup script exists
echo -n "6. Backup script exists... "
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
BACKUP_SCRIPT="/Users/sardag/Desktop/ailydian-ultra-pro/ailydian-from-github/scripts/automated-encrypted-backup.sh"
if [ -x "$BACKUP_SCRIPT" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    log_health "✅ Backup script executable"
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    log_health "❌ Backup script not executable"
fi

# Check 7: Latest backup integrity
echo -n "7. Latest backup integrity... "
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.enc 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ] && [ -f "$ENCRYPTION_KEY" ]; then
    if openssl enc -aes-256-cbc -d -in "$LATEST_BACKUP" -pass file:"$ENCRYPTION_KEY" -out /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        log_health "✅ Latest backup integrity verified"
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        log_health "❌ Latest backup integrity check failed"
    fi
else
    echo -e "${YELLOW}⚠️ SKIP${NC}"
    log_health "⚠️ No backup to verify"
fi

# Check 8: Post-commit hook
echo -n "8. Post-commit hook installed... "
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
POST_COMMIT_HOOK="/Users/sardag/Desktop/ailydian-ultra-pro/ailydian-from-github/.git/hooks/post-commit"
if [ -x "$POST_COMMIT_HOOK" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    log_health "✅ Post-commit hook installed"
else
    echo -e "${YELLOW}⚠️ WARNING${NC}"
    log_health "⚠️ Post-commit hook not installed"
fi

# Summary
echo ""
echo "═══════════════════════════════════"
echo "HEALTH CHECK SUMMARY"
echo "═══════════════════════════════════"
echo "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
echo ""

HEALTH_PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

if [ "$HEALTH_PERCENTAGE" -ge 80 ]; then
    echo -e "Overall Health: ${GREEN}$HEALTH_PERCENTAGE% - HEALTHY${NC}"
    log_health "✅ Overall health: $HEALTH_PERCENTAGE%"
    exit 0
elif [ "$HEALTH_PERCENTAGE" -ge 60 ]; then
    echo -e "Overall Health: ${YELLOW}$HEALTH_PERCENTAGE% - NEEDS ATTENTION${NC}"
    log_health "⚠️ Overall health: $HEALTH_PERCENTAGE%"
    exit 1
else
    echo -e "Overall Health: ${RED}$HEALTH_PERCENTAGE% - CRITICAL${NC}"
    log_health "❌ Overall health: $HEALTH_PERCENTAGE%"
    exit 2
fi
