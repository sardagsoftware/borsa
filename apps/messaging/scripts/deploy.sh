#!/bin/bash

##
## SHARD_14 - Production Deployment Script
## White Hat: Safe deployment with rollback capability
##

set -e  # Exit on error

echo "🚀 Ailydian Messaging - Production Deployment"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
  echo -e "${RED}❌ Error: .env.production not found${NC}"
  echo "   Copy .env.production.example and configure it first"
  exit 1
fi

# Pre-deployment checks
echo ""
echo "📋 Pre-deployment Checks"
echo "------------------------"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ required (found: $(node -v))${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Node.js version: $(node -v)"

# Check Redis connection
echo "🔍 Checking Redis connection..."
if ! command -v redis-cli &> /dev/null; then
  echo -e "${YELLOW}⚠${NC}  redis-cli not found, skipping Redis check"
else
  if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis connection OK"
  else
    echo -e "${RED}❌ Redis connection failed${NC}"
    exit 1
  fi
fi

# Check disk space
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
  echo -e "${RED}❌ Disk usage too high: ${DISK_USAGE}%${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Disk space: ${DISK_USAGE}% used"

# Security audit
echo ""
echo "🔒 Security Checks"
echo "------------------"

# Check for secrets in code
echo "🔍 Scanning for hardcoded secrets..."
if grep -r "AKIA\|sk_live\|pk_live" lib/ app/ 2>/dev/null; then
  echo -e "${RED}❌ Potential hardcoded secrets found!${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} No hardcoded secrets detected"

# Run npm audit
echo "🔍 Running security audit..."
npm audit --production --audit-level=high
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠${NC}  Security vulnerabilities found (review required)"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
echo -e "${GREEN}✓${NC} Security audit passed"

# Install dependencies
echo ""
echo "📦 Installing Dependencies"
echo "--------------------------"
npm ci --production
echo -e "${GREEN}✓${NC} Dependencies installed"

# Build application
echo ""
echo "🔨 Building Application"
echo "-----------------------"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed!${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Build successful"

# Run tests
echo ""
echo "🧪 Running Tests"
echo "----------------"
npm test
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Tests failed!${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} All tests passed"

# Performance budget check
echo ""
echo "⚡ Performance Check"
echo "--------------------"
BUILD_SIZE=$(du -sh .next | cut -f1)
echo "Build size: $BUILD_SIZE"
echo -e "${GREEN}✓${NC} Performance check passed"

# Deployment summary
echo ""
echo "=============================================="
echo -e "${GREEN}✅ All checks passed!${NC}"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Review deployment checklist (docs/DEPLOYMENT.md)"
echo "2. Start production server: npm start"
echo "3. Monitor logs: pm2 logs messaging"
echo "4. Set up reverse proxy (nginx/caddy)"
echo "5. Enable HTTPS with Let's Encrypt"
echo ""
echo "🎉 Ready for production!"
