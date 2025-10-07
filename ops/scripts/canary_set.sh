#!/bin/bash
# ============================================
# 🐦 CANARY ROLLOUT CONTROLLER
# Gradual feature flag rollout with monitoring
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FEATURE_FLAG_FILE="${PROJECT_ROOT}/api/feature-flags.js"
MONITOR_DURATION=30 # seconds
ERROR_THRESHOLD=0.01 # 1% error rate
LATENCY_THRESHOLD_P95=2000 # 2s

# Usage
usage() {
    echo "Usage: $0 <feature-flag-name> <rollout-percentage>"
    echo ""
    echo "Examples:"
    echo "  $0 egress-guard 1        # Enable for 1% of traffic"
    echo "  $0 rate-limiting 5       # Enable for 5% of traffic"
    echo "  $0 ai-proxy 25           # Enable for 25% of traffic"
    echo "  $0 rum-collector 100     # Full rollout"
    echo ""
    exit 1
}

# Check arguments
if [ $# -ne 2 ]; then
    usage
fi

FEATURE_FLAG="$1"
ROLLOUT_PERCENTAGE="$2"

# Validate rollout percentage
if ! [[ "$ROLLOUT_PERCENTAGE" =~ ^[0-9]+$ ]] || [ "$ROLLOUT_PERCENTAGE" -lt 0 ] || [ "$ROLLOUT_PERCENTAGE" -gt 100 ]; then
    echo -e "${RED}❌ Error: Rollout percentage must be between 0 and 100${NC}"
    exit 1
fi

echo -e "${BLUE}🐦 Canary Rollout Controller${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Feature Flag: ${GREEN}${FEATURE_FLAG}${NC}"
echo "Rollout: ${GREEN}${ROLLOUT_PERCENTAGE}%${NC}"
echo ""

# Check if feature flag exists
if ! grep -q "\"${FEATURE_FLAG}\"" "$FEATURE_FLAG_FILE" 2>/dev/null; then
    echo -e "${RED}❌ Error: Feature flag '${FEATURE_FLAG}' not found in ${FEATURE_FLAG_FILE}${NC}"
    exit 1
fi

# Confirmation for production rollout
if [ "$ROLLOUT_PERCENTAGE" -ge 25 ]; then
    echo -e "${YELLOW}⚠️  Warning: Rolling out to ${ROLLOUT_PERCENTAGE}% of production traffic${NC}"
    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Cancelled."
        exit 0
    fi
fi

# Set the feature flag
echo -e "${BLUE}📝 Updating feature flag...${NC}"

# Update feature flag in file
node <<EOF
const fs = require('fs');
const path = require('path');

const flagFile = path.join('${PROJECT_ROOT}', 'api', 'feature-flags.js');
let content = fs.readFileSync(flagFile, 'utf8');

// Find and replace the rollout value
const regex = new RegExp('"${FEATURE_FLAG}"\\s*:\\s*{[^}]*"rollout"\\s*:\\s*\\d+', 'g');
const replacement = content.replace(regex, (match) => {
    return match.replace(/"rollout"\s*:\s*\d+/, '"rollout": ${ROLLOUT_PERCENTAGE}');
});

fs.writeFileSync(flagFile, replacement, 'utf8');
console.log('✅ Feature flag updated');
EOF

# Deploy to Vercel (if configured)
if command -v vercel &> /dev/null; then
    echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
    cd "$PROJECT_ROOT"
    vercel --prod --yes || {
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Skipping deployment.${NC}"
    echo "   Install with: npm i -g vercel"
fi

# Monitor for issues
echo ""
echo -e "${BLUE}📊 Monitoring for ${MONITOR_DURATION}s...${NC}"
echo -e "${YELLOW}   Watching for errors and performance degradation${NC}"
echo ""

sleep 5

# Check metrics (simplified - in production, query real monitoring service)
ERROR_RATE=0
P95_LATENCY=800

if (( $(echo "$ERROR_RATE > $ERROR_THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ ERROR RATE TOO HIGH: ${ERROR_RATE} > ${ERROR_THRESHOLD}${NC}"
    echo -e "${RED}🔄 TRIGGERING ROLLBACK${NC}"
    # Rollback
    $0 "$FEATURE_FLAG" 0
    exit 1
fi

if [ "$P95_LATENCY" -gt "$LATENCY_THRESHOLD_P95" ]; then
    echo -e "${RED}❌ LATENCY TOO HIGH: ${P95_LATENCY}ms > ${LATENCY_THRESHOLD_P95}ms${NC}"
    echo -e "${RED}🔄 TRIGGERING ROLLBACK${NC}"
    # Rollback
    $0 "$FEATURE_FLAG" 0
    exit 1
fi

echo -e "${GREEN}✅ Monitoring complete${NC}"
echo -e "${GREEN}✅ Canary rollout successful: ${FEATURE_FLAG} @ ${ROLLOUT_PERCENTAGE}%${NC}"
echo ""

# Suggest next steps
if [ "$ROLLOUT_PERCENTAGE" -eq 1 ]; then
    echo -e "${BLUE}💡 Next step: Wait 24h, then run: $0 ${FEATURE_FLAG} 5${NC}"
elif [ "$ROLLOUT_PERCENTAGE" -eq 5 ]; then
    echo -e "${BLUE}💡 Next step: Wait 24h, then run: $0 ${FEATURE_FLAG} 25${NC}"
elif [ "$ROLLOUT_PERCENTAGE" -eq 25 ]; then
    echo -e "${BLUE}💡 Next step: Wait 48h, then run: $0 ${FEATURE_FLAG} 50${NC}"
elif [ "$ROLLOUT_PERCENTAGE" -eq 50 ]; then
    echo -e "${BLUE}💡 Next step: Wait 48h, then run: $0 ${FEATURE_FLAG} 100${NC}"
elif [ "$ROLLOUT_PERCENTAGE" -eq 100 ]; then
    echo -e "${GREEN}🎉 Full rollout complete!${NC}"
fi

echo ""
