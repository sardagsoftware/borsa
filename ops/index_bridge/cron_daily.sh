#!/bin/bash
#
# LyDian AI - Daily Automation Cron Job
# ITERATION 2: Complete Automation Suite
#
# Purpose: Daily automated monitoring, updates, and validation
# Schedule: Run daily at 03:00 UTC
#
# Components:
#   - Index monitoring (search engines)
#   - Feed updates (HuggingFace)
#   - Feed validation
#   - Performance monitoring
#   - Rate limit tracking
#   - Security audit
#   - Notification alerts
#
# Setup:
#   1. Make executable: chmod +x cron_daily.sh
#   2. Test manually: ./cron_daily.sh
#   3. Add to crontab: crontab -e
#   4. Add line: 0 3 * * * /path/to/cron_daily.sh >> /path/to/logs/cron.log 2>&1
#

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_DIR="${SCRIPT_DIR}/../../logs"
OUTPUT_DIR="${SCRIPT_DIR}/../artifacts"

# Create log directory
mkdir -p "${LOG_DIR}"
mkdir -p "${OUTPUT_DIR}"

# Load environment variables
if [ -f ~/.env ]; then
    source ~/.env
fi

# Log start
echo "========================================"
echo "LyDian AI - Daily Automation Suite"
echo "ITERATION 2: Complete Automation"
echo "Started: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "========================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 not found"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$GOOGLE_SERVICE_ACCOUNT_JSON" ]; then
    echo "[WARN] GOOGLE_SERVICE_ACCOUNT_JSON not set"
fi

if [ -z "$BING_WEBMASTER_API_KEY" ]; then
    echo "[WARN] BING_WEBMASTER_API_KEY not set"
fi

if [ -z "$YANDEX_WEBMASTER_TOKEN" ]; then
    echo "[WARN] YANDEX_WEBMASTER_TOKEN not set"
fi

# Monitor all platforms
echo ""
echo "Step 1: Monitoring all platforms..."
python3 "${SCRIPT_DIR}/index_monitor.py" --platform all --output-dir "${OUTPUT_DIR}"

# Generate comprehensive report
echo ""
echo "Step 2: Generating comprehensive report..."
python3 "${SCRIPT_DIR}/index_monitor.py" --generate-report --output-dir "${OUTPUT_DIR}"

# Check if report was generated
if [ -f "${SCRIPT_DIR}/../artifacts/INDEX_BRIDGE_REPORT.json" ]; then
    echo "[SUCCESS] Report generated successfully"

    # Display summary
    echo ""
    echo "Summary:"
    python3 -c "
import json
with open('${SCRIPT_DIR}/../artifacts/INDEX_BRIDGE_REPORT.json') as f:
    data = json.load(f)
    summary = data.get('summary', {})
    print(f\"  Platforms: {summary.get('total_platforms', 0)}\")
    print(f\"  URLs Monitored: {summary.get('total_urls_monitored', 0)}\")
    print(f\"  Indexed: {summary.get('total_indexed', 0)}\")
    print(f\"  Not Indexed: {summary.get('total_not_indexed', 0)}\")
    print(f\"  Index Rate: {summary.get('average_indexed_rate', 0):.1f}%\")
"
else
    echo "[WARN] Report not generated"
fi

# Step 3: Update feeds from HuggingFace
echo ""
echo "Step 3: Updating AI model feeds..."
cd "${SCRIPT_DIR}/.."
python3 feed_updater.py --max-models 5 || echo "[WARN] Feed update failed or no new models"

# Step 4: Validate all feeds
echo ""
echo "Step 4: Validating feeds..."
python3 feed_validator.py --feed all || echo "[ERROR] Feed validation failed"

# Step 5: Run security audit
echo ""
echo "Step 5: Running security audit..."
python3 security_audit.py || echo "[ERROR] Security audit failed"

# Step 6: Monitor performance
echo ""
echo "Step 6: Monitoring performance..."
python3 performance_monitor.py --samples 3 --alerts || echo "[WARN] Performance monitoring failed"

# Step 7: Check rate limits
echo ""
echo "Step 7: Checking API rate limits..."
python3 rate_limit_tracker.py --check --alerts || echo "[WARN] Rate limit check failed"

# Step 8: Send daily summary notification
echo ""
echo "Step 8: Sending daily summary..."
python3 notification_system.py --title "LyDian Daily Automation Complete" \
  --message "Daily automation completed successfully at $(date -u '+%Y-%m-%d %H:%M:%S UTC')" \
  --level info || echo "[WARN] Notification failed"

# Log end
echo ""
echo "========================================"
echo "Daily Automation Suite Complete"
echo "Completed: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "========================================"
echo ""
echo "Generated Reports:"
echo "  - Index Bridge: ${OUTPUT_DIR}/INDEX_BRIDGE_REPORT.json"
echo "  - Feed Update: ${OUTPUT_DIR}/feed_update_report.json"
echo "  - Feed Validation: ${OUTPUT_DIR}/feed_validation_report.json"
echo "  - Security Audit: ${OUTPUT_DIR}/SECURITY_AUDIT_REPORT.json"
echo "  - Performance: ${OUTPUT_DIR}/performance_report.json"
echo "  - Rate Limits: ${OUTPUT_DIR}/rate_limit_report.json"
