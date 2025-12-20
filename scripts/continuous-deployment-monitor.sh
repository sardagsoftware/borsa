#!/bin/bash
# 🚀 CONTINUOUS DEPLOYMENT MONITOR
# Deployment tamamlanana kadar sürekli kontrol eder

LOG_FILE="/tmp/deployment-monitor.log"
MAX_ATTEMPTS=100
ATTEMPT=0
DEPLOYED=0

echo "🚀 CONTINUOUS DEPLOYMENT MONITOR STARTED" | tee -a $LOG_FILE
echo "=======================================" | tee -a $LOG_FILE
echo "Target: www.ailydian.com" | tee -a $LOG_FILE
echo "Max attempts: $MAX_ATTEMPTS" | tee -a $LOG_FILE
echo "Started: $(date)" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

while [ $ATTEMPT -lt $MAX_ATTEMPTS ] && [ $DEPLOYED -eq 0 ]; do
  ATTEMPT=$((ATTEMPT + 1))

  echo "=== Check #$ATTEMPT ($(date +%H:%M:%S)) ===" | tee -a $LOG_FILE

  # Check premium SEO marker
  PREMIUM=$(curl -s https://www.ailydian.com 2>/dev/null | grep -c "🏆 Premium SEO" || echo "0")

  # Check schema type
  SOFTWARE_APP=$(curl -s https://www.ailydian.com 2>/dev/null | grep -c '"@type": "SoftwareApplication"' || echo "0")

  # Check image paths
  IMAGE_PATHS=$(curl -s https://www.ailydian.com 2>/dev/null | grep -c '/images/gallery/' || echo "0")

  # Check description
  DESC=$(curl -s https://www.ailydian.com 2>/dev/null | grep -c "Yapay zeka ekosistemi" || echo "0")

  echo "  Premium marker: $PREMIUM" | tee -a $LOG_FILE
  echo "  SoftwareApp: $SOFTWARE_APP" | tee -a $LOG_FILE
  echo "  Image paths: $IMAGE_PATHS" | tee -a $LOG_FILE
  echo "  Description: $DESC" | tee -a $LOG_FILE

  # Check if deployed
  if [ "$PREMIUM" -gt "0" ] && [ "$SOFTWARE_APP" -gt "0" ] && [ "$IMAGE_PATHS" -gt "0" ]; then
    echo "  ✅ NEW VERSION DEPLOYED SUCCESSFULLY!" | tee -a $LOG_FILE
    DEPLOYED=1

    # Verification
    echo "" | tee -a $LOG_FILE
    echo "🎉 DEPLOYMENT VERIFICATION:" | tee -a $LOG_FILE
    TOTAL_SCHEMAS=$(curl -s https://www.ailydian.com 2>/dev/null | grep -c '"@type":' || echo "0")
    echo "  Total schemas: $TOTAL_SCHEMAS" | tee -a $LOG_FILE
    echo "  Premium SEO: Active" | tee -a $LOG_FILE
    echo "  URL-based images: Active" | tee -a $LOG_FILE
    echo "  Deployment time: $(date)" | tee -a $LOG_FILE

  else
    echo "  ⏳ Still deploying (attempt $ATTEMPT/$MAX_ATTEMPTS)..." | tee -a $LOG_FILE

    # Every 10 attempts, try to trigger re-deploy
    if [ $((ATTEMPT % 10)) -eq 0 ]; then
      echo "  🔄 Triggering re-check..." | tee -a $LOG_FILE
    fi
  fi

  echo "" | tee -a $LOG_FILE

  # Wait before next check
  if [ $DEPLOYED -eq 0 ] && [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    sleep 30
  fi
done

if [ $DEPLOYED -eq 1 ]; then
  echo "✅ DEPLOYMENT COMPLETE!" | tee -a $LOG_FILE
  echo "Total attempts: $ATTEMPT" | tee -a $LOG_FILE
  echo "Completed: $(date)" | tee -a $LOG_FILE
  exit 0
else
  echo "⚠️  Max attempts reached. Deployment may need manual verification." | tee -a $LOG_FILE
  exit 1
fi
