#!/bin/bash

# ===================================================================
# 🚀 AILYDIAN NGROK RATE LIMITING STARTER
# ===================================================================
#
# This script starts ngrok with rate limiting enabled for Groq API protection
#
# Usage:
#   ./scripts/start-ngrok-with-ratelimit.sh
#   ./scripts/start-ngrok-with-ratelimit.sh ailydian-api.ngrok.app
#   ./scripts/start-ngrok-with-ratelimit.sh ailydian-api.ngrok.app 3000
#
# Prerequisites:
#   - ngrok installed (brew install ngrok)
#   - ngrok account with custom domain
#   - Server running on PORT (default: 3000)
#
# ===================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 AILYDIAN NGROK RATE LIMITING STARTER                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
DOMAIN="${1:-ailydian-api.ngrok.app}"
PORT="${2:-3000}"
RATE_LIMIT_FILE="rate-limit.yml"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ Error: ngrok is not installed${NC}"
    echo -e "${YELLOW}Install with: brew install ngrok${NC}"
    exit 1
fi

# Check if rate-limit.yml exists
if [ ! -f "$RATE_LIMIT_FILE" ]; then
    echo -e "${RED}❌ Error: $RATE_LIMIT_FILE not found${NC}"
    echo -e "${YELLOW}Run this script from project root directory${NC}"
    exit 1
fi

# Check if server is running on PORT
if ! nc -z localhost $PORT 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: No server detected on port $PORT${NC}"
    echo -e "${YELLOW}   Start your server first: PORT=$PORT npm start${NC}"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ Configuration:${NC}"
echo -e "   Domain: ${BLUE}$DOMAIN${NC}"
echo -e "   Port:   ${BLUE}$PORT${NC}"
echo -e "   Policy: ${BLUE}$RATE_LIMIT_FILE${NC}"
echo ""

echo -e "${GREEN}📊 Rate Limits:${NC}"
echo -e "   General API:       ${BLUE}100 req/min${NC}"
echo -e "   Groq Endpoints:    ${BLUE}50 req/min${NC}"
echo -e "   Heavy Operations:  ${BLUE}30 req/min${NC}"
echo ""

echo -e "${YELLOW}🔄 Starting ngrok tunnel...${NC}"
echo ""

# Start ngrok with rate limiting
ngrok http $PORT \
  --domain "$DOMAIN" \
  --traffic-policy-file "$RATE_LIMIT_FILE" \
  --log stdout \
  --log-level info

# This line will only execute if ngrok exits
echo ""
echo -e "${YELLOW}⚠️  Ngrok tunnel closed${NC}"
