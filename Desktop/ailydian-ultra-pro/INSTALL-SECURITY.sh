#!/bin/bash

###############################################################################
# ENTERPRISE SECURITY INSTALLATION SCRIPT
# Medical AI - HIPAA Compliant Security Implementation
###############################################################################

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  AILYDIAN MEDICAL AI - ENTERPRISE SECURITY INSTALLATION       ║"
echo "║  HIPAA Compliant Security Stack                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "  Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found:${NC} $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm found:${NC} $(npm --version)"

###############################################################################
# STEP 1: INSTALL DEPENDENCIES
###############################################################################

echo ""
echo -e "${BLUE}[1/5] Installing security dependencies...${NC}"
echo ""

npm install --save \
  joi \
  isomorphic-dompurify \
  validator \
  rate-limiter-flexible \
  ioredis \
  express-session \
  connect-redis \
  jsonwebtoken \
  bcrypt \
  cookie-parser \
  helmet \
  axios

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

###############################################################################
# STEP 2: CHECK FOR .env FILE
###############################################################################

echo ""
echo -e "${BLUE}[2/5] Checking environment configuration...${NC}"
echo ""

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo "  Creating .env from .env.example..."

    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ .env file created${NC}"
        echo -e "${YELLOW}⚠ IMPORTANT: You must configure the following in .env:${NC}"
        echo "  - JWT_SECRET (required)"
        echo "  - JWT_REFRESH_SECRET (required)"
        echo "  - SESSION_SECRET (required)"
        echo "  - REDIS_URL (recommended for production)"
        echo "  - Azure AD credentials (optional)"
    else
        echo -e "${RED}✗ .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Check for required secrets
echo ""
echo "Validating critical environment variables..."

HAS_ERRORS=0

if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=YOUR_VALUE_HERE" .env || grep -q "JWT_SECRET=your-" .env; then
    echo -e "${RED}✗ JWT_SECRET not configured${NC}"
    HAS_ERRORS=1
fi

if ! grep -q "JWT_REFRESH_SECRET=" .env; then
    echo -e "${RED}✗ JWT_REFRESH_SECRET not configured${NC}"
    HAS_ERRORS=1
fi

if ! grep -q "SESSION_SECRET=" .env; then
    echo -e "${RED}✗ SESSION_SECRET not configured${NC}"
    HAS_ERRORS=1
fi

if [ $HAS_ERRORS -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}⚠ WARNING: Critical secrets not configured${NC}"
    echo "  Generate secure secrets with:"
    echo "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    echo ""
fi

###############################################################################
# STEP 3: VERIFY FILE STRUCTURE
###############################################################################

echo ""
echo -e "${BLUE}[3/5] Verifying file structure...${NC}"
echo ""

FILES=(
    "api/auth/oauth.js"
    "middleware/csrf.js"
    "middleware/rate-limit.js"
    "middleware/input-validation.js"
    "middleware/rbac.js"
)

MISSING_FILES=0

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file ${YELLOW}(missing)${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo ""
    echo -e "${RED}✗ $MISSING_FILES security files are missing${NC}"
    echo "  Please ensure all security files are in place."
    exit 1
fi

echo -e "${GREEN}✓ All security files present${NC}"

###############################################################################
# STEP 4: CHECK FOR REDIS (OPTIONAL)
###############################################################################

echo ""
echo -e "${BLUE}[4/5] Checking Redis availability...${NC}"
echo ""

if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis is running${NC}"
        echo "  Rate limiting and sessions will use Redis (distributed mode)"
    else
        echo -e "${YELLOW}⚠ Redis is installed but not running${NC}"
        echo "  Start Redis with: redis-server"
        echo "  Or rate limiting will use in-memory store (single-instance)"
    fi
else
    echo -e "${YELLOW}⚠ Redis not found${NC}"
    echo "  Install Redis for production deployments:"
    echo "  - macOS: brew install redis"
    echo "  - Ubuntu: sudo apt-get install redis-server"
    echo "  - Docker: docker run -d -p 6379:6379 redis:alpine"
    echo ""
    echo "  Without Redis, rate limiting will use in-memory store"
    echo "  (not recommended for multi-server deployments)"
fi

###############################################################################
# STEP 5: RUN SECURITY AUDIT
###############################################################################

echo ""
echo -e "${BLUE}[5/5] Running security audit...${NC}"
echo ""

npm audit

AUDIT_EXIT_CODE=$?

if [ $AUDIT_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ No vulnerabilities found${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠ Vulnerabilities detected${NC}"
    echo "  Run 'npm audit fix' to fix them automatically"
    echo "  Or review with 'npm audit' for details"
fi

###############################################################################
# INSTALLATION COMPLETE
###############################################################################

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  INSTALLATION COMPLETE                                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}Security Stack Installed:${NC}"
echo "  ✓ OAuth 2.0 Authentication (Azure AD B2C)"
echo "  ✓ JWT Token Management (15-min access + 7-day refresh)"
echo "  ✓ CSRF Protection (256-bit tokens)"
echo "  ✓ Rate Limiting (7 tiers with burst protection)"
echo "  ✓ Input Validation (Joi schemas + sanitization)"
echo "  ✓ RBAC (10 medical roles with PHI access control)"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "  1. Configure environment variables in .env:"
echo "     ${YELLOW}Required:${NC}"
echo "       - JWT_SECRET"
echo "       - JWT_REFRESH_SECRET"
echo "       - SESSION_SECRET"
echo ""
echo "     ${BLUE}Optional (but recommended):${NC}"
echo "       - REDIS_URL"
echo "       - AZURE_AD_CLIENT_ID"
echo "       - AZURE_AD_CLIENT_SECRET"
echo "       - AZURE_AD_TENANT_ID"
echo ""
echo "  2. Update server.js with security middleware:"
echo "     See: SECURITY-IMPLEMENTATION-SUMMARY.md"
echo ""
echo "  3. Review documentation:"
echo "     - MEDICAL-AI-SECURITY-DOCUMENTATION.md (full guide)"
echo "     - SECURITY-IMPLEMENTATION-SUMMARY.md (quick reference)"
echo ""
echo "  4. Test security features:"
echo "     npm run dev"
echo "     curl http://localhost:3100/api/csrf-token"
echo ""
echo "  5. Run security scan before production:"
echo "     npm audit"
echo "     npm audit fix"
echo ""

if [ $HAS_ERRORS -eq 1 ]; then
    echo -e "${YELLOW}⚠ WARNING: Please configure JWT secrets before running in production${NC}"
    echo ""
fi

echo -e "${GREEN}Installation successful!${NC}"
echo ""
echo "Support: security@ailydian.com"
echo "Docs: https://docs.ailydian.com/security"
echo ""
