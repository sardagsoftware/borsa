#!/bin/bash
#
# LyDian AI - Live Indexer Cron Setup
# Schedule: Daily at 03:00 UTC
#

set -e

echo "🔧 Setting up Live Indexer cron job..."

# Paths
SCRIPT_PATH="/Users/sardag/Desktop/ailydian-ultra-pro/ops/indexing/live_indexer.py"
LOG_PATH="/Users/sardag/Desktop/ailydian-ultra-pro/ops/artifacts/cron.log"

# Verify script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Error: $SCRIPT_PATH not found"
    exit 1
fi

# Make script executable
chmod +x "$SCRIPT_PATH"

# Create cron entry
# Format: minute hour day month weekday command
# Schedule: 03:00 UTC daily
CRON_SCHEDULE="0 3 * * * cd /Users/sardag/Desktop/ailydian-ultra-pro && /usr/bin/python3 $SCRIPT_PATH >> $LOG_PATH 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "live_indexer.py"; then
    echo "⚠️  Cron job already exists"
    echo ""
    echo "Current cron jobs:"
    crontab -l | grep "live_indexer.py"
    echo ""
    read -p "Replace existing cron job? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted"
        exit 1
    fi

    # Remove old entry
    crontab -l | grep -v "live_indexer.py" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_SCHEDULE") | crontab -

echo "✅ Cron job installed successfully!"
echo ""
echo "📅 Schedule: Daily at 03:00 UTC"
echo "📄 Log file: $LOG_PATH"
echo ""
echo "To view cron jobs:"
echo "  crontab -l"
echo ""
echo "To remove cron job:"
echo "  crontab -e  # then delete the line with 'live_indexer.py'"
echo ""
echo "To test immediately:"
echo "  python3 $SCRIPT_PATH"
