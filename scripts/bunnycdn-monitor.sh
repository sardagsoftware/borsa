#!/bin/bash
# BunnyCDN Continuous Monitoring Script
# Usage: ./bunnycdn-monitor.sh [interval_seconds] [duration_minutes]

DOMAIN="${1:-www.ailydian.com}"
INTERVAL="${2:-60}"  # Check every 60 seconds
DURATION="${3:-15}"  # Monitor for 15 minutes
ALERT_EMAIL="${4:-admin@ailydian.com}"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="bunnycdn-monitor-${TIMESTAMP}.log"
ALERT_FILE="bunnycdn-alerts-${TIMESTAMP}.txt"

# Thresholds
TTFB_THRESHOLD=200  # ms
ERROR_THRESHOLD=3   # consecutive errors trigger alert
CACHE_HIT_THRESHOLD=70  # percent

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 BunnyCDN Continuous Monitor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Domain: $DOMAIN"
echo "Interval: ${INTERVAL}s"
echo "Duration: ${DURATION} minutes"
echo "Log: $LOG_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Initialize log
echo "BunnyCDN Monitoring Log - $DOMAIN" > "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "Interval: ${INTERVAL}s, Duration: ${DURATION}min" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Initialize counters
TOTAL_CHECKS=0
SUCCESSFUL_CHECKS=0
FAILED_CHECKS=0
TOTAL_TTFB=0
CACHE_HITS=0
CACHE_MISSES=0
CONSECUTIVE_ERRORS=0

# Calculate end time
END_TIME=$(($(date +%s) + (DURATION * 60)))

echo ""
echo "🔄 Monitoring started (Ctrl+C to stop)..."
echo ""

# Monitoring loop
while [ $(date +%s) -lt $END_TIME ]; do
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    CHECK_TIME=$(date "+%Y-%m-%d %H:%M:%S")

    # Check HTTP status
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" 2>/dev/null)

    # Check TTFB
    TTFB=$(curl -w "%{time_starttransfer}" -o /dev/null -s "https://$DOMAIN" 2>/dev/null)
    TTFB_MS=$(echo "$TTFB * 1000" | bc | cut -d. -f1)

    # Check cache status
    CACHE_STATUS=$(curl -I "https://$DOMAIN" 2>/dev/null | grep -i "x-cache:" | cut -d: -f2 | tr -d '[:space:]')

    # Update cache statistics
    if [[ "$CACHE_STATUS" == *"HIT"* ]]; then
        CACHE_HITS=$((CACHE_HITS + 1))
    elif [[ "$CACHE_STATUS" == *"MISS"* ]]; then
        CACHE_MISSES=$((CACHE_MISSES + 1))
    fi

    # Calculate metrics
    TOTAL_TTFB=$(echo "$TOTAL_TTFB + $TTFB_MS" | bc)
    AVG_TTFB=$(echo "scale=0; $TOTAL_TTFB / $TOTAL_CHECKS" | bc)

    TOTAL_CACHE_REQUESTS=$((CACHE_HITS + CACHE_MISSES))
    if [ $TOTAL_CACHE_REQUESTS -gt 0 ]; then
        CACHE_HIT_RATE=$(echo "scale=1; $CACHE_HITS * 100 / $TOTAL_CACHE_REQUESTS" | bc)
    else
        CACHE_HIT_RATE=0
    fi

    # Status indicator
    STATUS="✅"
    ALERT=""

    # Check for errors
    if [ "$HTTP_STATUS" != "200" ]; then
        STATUS="❌"
        ALERT="HTTP $HTTP_STATUS"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        CONSECUTIVE_ERRORS=$((CONSECUTIVE_ERRORS + 1))
    elif [ "$TTFB_MS" -gt "$TTFB_THRESHOLD" ]; then
        STATUS="⚠️ "
        ALERT="Slow TTFB: ${TTFB_MS}ms"
        CONSECUTIVE_ERRORS=$((CONSECUTIVE_ERRORS + 1))
    else
        SUCCESSFUL_CHECKS=$((SUCCESSFUL_CHECKS + 1))
        CONSECUTIVE_ERRORS=0
    fi

    # Log entry
    LOG_ENTRY="$CHECK_TIME | $STATUS | HTTP:$HTTP_STATUS | TTFB:${TTFB_MS}ms | Cache:$CACHE_STATUS | $ALERT"
    echo "$LOG_ENTRY" >> "$LOG_FILE"

    # Display progress
    printf "\r[%03d/%03d] TTFB:%3dms Avg:%3dms Cache:%5.1f%% Status:%3s Errors:%d   " \
        $TOTAL_CHECKS $((DURATION * 60 / INTERVAL)) $TTFB_MS $AVG_TTFB $CACHE_HIT_RATE $HTTP_STATUS $CONSECUTIVE_ERRORS

    # Alert on consecutive errors
    if [ $CONSECUTIVE_ERRORS -ge $ERROR_THRESHOLD ]; then
        ALERT_MSG="🚨 ALERT: $CONSECUTIVE_ERRORS consecutive errors detected!"
        echo "" >> "$ALERT_FILE"
        echo "$CHECK_TIME - $ALERT_MSG" >> "$ALERT_FILE"
        echo "$LOG_ENTRY" >> "$ALERT_FILE"
        echo ""
        echo ""
        echo "$ALERT_MSG"
        echo "Last status: $LOG_ENTRY"
        echo ""

        # Could send email here if configured
        # echo "$ALERT_MSG" | mail -s "BunnyCDN Alert - $DOMAIN" "$ALERT_EMAIL"
    fi

    # Sleep until next check
    sleep "$INTERVAL"
done

# Final report
echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 MONITORING SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Domain: $DOMAIN"
echo "Duration: ${DURATION} minutes"
echo ""
echo "Total Checks: $TOTAL_CHECKS"
echo "✅ Successful: $SUCCESSFUL_CHECKS"
echo "❌ Failed: $FAILED_CHECKS"
echo ""
echo "Performance:"
echo "  Average TTFB: ${AVG_TTFB}ms"
if [ $AVG_TTFB -lt 100 ]; then
    echo "  ✅ Excellent (< 100ms)"
elif [ $AVG_TTFB -lt 200 ]; then
    echo "  ✅ Good (< 200ms)"
else
    echo "  ⚠️  Needs improvement (> 200ms)"
fi
echo ""
echo "Cache Statistics:"
echo "  Hits: $CACHE_HITS"
echo "  Misses: $CACHE_MISSES"
echo "  Hit Rate: ${CACHE_HIT_RATE}%"
if (( $(echo "$CACHE_HIT_RATE >= 80" | bc -l) )); then
    echo "  ✅ Excellent (>80%)"
elif (( $(echo "$CACHE_HIT_RATE >= 70" | bc -l) )); then
    echo "  ✅ Good (>70%)"
else
    echo "  ⚠️  Needs optimization (<70%)"
fi
echo ""
echo "Uptime: $(echo "scale=2; $SUCCESSFUL_CHECKS * 100 / $TOTAL_CHECKS" | bc)%"
echo ""
echo "Full log: $LOG_FILE"
if [ -f "$ALERT_FILE" ]; then
    echo "Alerts: $ALERT_FILE"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Save summary
echo "" >> "$LOG_FILE"
echo "SUMMARY" >> "$LOG_FILE"
echo "Total Checks: $TOTAL_CHECKS" >> "$LOG_FILE"
echo "Successful: $SUCCESSFUL_CHECKS" >> "$LOG_FILE"
echo "Failed: $FAILED_CHECKS" >> "$LOG_FILE"
echo "Average TTFB: ${AVG_TTFB}ms" >> "$LOG_FILE"
echo "Cache Hit Rate: ${CACHE_HIT_RATE}%" >> "$LOG_FILE"
echo "Uptime: $(echo "scale=2; $SUCCESSFUL_CHECKS * 100 / $TOTAL_CHECKS" | bc)%" >> "$LOG_FILE"
echo "Completed: $(date)" >> "$LOG_FILE"

exit 0
