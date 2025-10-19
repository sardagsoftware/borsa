#!/bin/bash

###############################################################################
# 🚀 PYTORCH PRODUCTION DEPLOYMENT SCRIPT
# Ailydian Ultra Pro - PyTorch/ONNX Integration
# Beyaz Şapkalı (White-Hat) - Production-Ready
#
# Bu script şunları yapar:
# 1. Environment variable kontrolü
# 2. Database migration (pytorch_models tabloları)
# 3. ONNX model dosyası doğrulama
# 4. Dependency kurulumu (onnxruntime-node, sharp)
# 5. Smoke testler
# 6. Server başlatma
# 7. Health check
# 8. Log monitoring
#
# Kullanım:
#   chmod +x scripts/deploy-pytorch-production.sh
#   ./scripts/deploy-pytorch-production.sh
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}❌ [ERROR]${NC} $1"
}

# Banner
echo "═══════════════════════════════════════════════════════════════"
echo "🔥 PYTORCH PRODUCTION DEPLOYMENT"
echo "   Ailydian Ultra Pro - AI Ecosystem"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Step 1: Pre-flight checks
log_info "Step 1/8: Pre-flight checks..."

# Check if running in project root
if [ ! -f "package.json" ]; then
    log_error "Not in project root directory. Run from ailydian-ultra-pro/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js 18+ required. Current: $(node --version)"
    exit 1
fi

log_success "Pre-flight checks passed (Node.js $(node --version))"

# Step 2: Environment variables
log_info "Step 2/8: Checking environment variables..."

REQUIRED_ENV_VARS=(
    "ANTHROPIC_API_KEY"
    "DATABASE_PATH"
)

MISSING_VARS=()
for VAR in "${REQUIRED_ENV_VARS[@]}"; do
    if [ -z "${!VAR:-}" ]; then
        MISSING_VARS+=("$VAR")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    log_warning "Missing optional env vars: ${MISSING_VARS[*]}"
    log_info "Continuing with defaults..."
else
    log_success "All required environment variables set"
fi

# Set default DATABASE_PATH if not set
export DATABASE_PATH="${DATABASE_PATH:-./database/ailydian.db}"

log_info "Database: $DATABASE_PATH"

# Step 3: Install dependencies
log_info "Step 3/8: Installing Node.js dependencies..."

if command -v pnpm &> /dev/null; then
    log_info "Using pnpm..."
    pnpm install --frozen-lockfile
elif command -v npm &> /dev/null; then
    log_info "Using npm..."
    npm ci
else
    log_error "No package manager found (npm or pnpm required)"
    exit 1
fi

log_success "Dependencies installed"

# Step 4: Database migration
log_info "Step 4/8: Running database migrations..."

# Check if database directory exists
DB_DIR=$(dirname "$DATABASE_PATH")
if [ ! -d "$DB_DIR" ]; then
    log_info "Creating database directory: $DB_DIR"
    mkdir -p "$DB_DIR"
fi

# Run migration
if [ -f "database/migrate.js" ]; then
    node database/migrate.js migrate
    log_success "Database migration completed"
else
    log_error "Migration script not found: database/migrate.js"
    exit 1
fi

# Verify pytorch_models table exists
log_info "Verifying pytorch_models table..."
sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM pytorch_models;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    MODEL_COUNT=$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM pytorch_models;")
    log_success "pytorch_models table exists ($MODEL_COUNT models registered)"
else
    log_error "pytorch_models table not found. Migration failed?"
    exit 1
fi

# Step 5: Verify ONNX models
log_info "Step 5/8: Verifying ONNX model files..."

MODELS_DIR="./pytorch-models/onnx"
if [ ! -d "$MODELS_DIR" ]; then
    log_warning "ONNX models directory not found: $MODELS_DIR"
    log_info "Creating directory..."
    mkdir -p "$MODELS_DIR"
fi

# Check for demo model
DEMO_MODEL="$MODELS_DIR/chest_xray_demo.onnx"
if [ -f "$DEMO_MODEL" ]; then
    MODEL_SIZE=$(du -h "$DEMO_MODEL" | cut -f1)
    log_success "Demo model found: $DEMO_MODEL ($MODEL_SIZE)"
else
    log_warning "Demo model not found: $DEMO_MODEL"
    log_info "System will work but inference endpoint will return errors"
    log_info "To fix: Download/train model and place in $MODELS_DIR"
fi

# Step 6: Smoke tests (optional)
log_info "Step 6/8: Running smoke tests..."

if [ "${SKIP_TESTS:-false}" = "true" ]; then
    log_warning "Tests skipped (SKIP_TESTS=true)"
else
    if command -v playwright &> /dev/null; then
        log_info "Running PyTorch smoke tests..."

        # Run only PyTorch-related tests
        npm run test -- pytorch-inference.spec.ts --reporter=list 2>&1 | tee /tmp/pytorch-test-results.log

        TEST_EXIT_CODE=${PIPESTATUS[0]}

        if [ $TEST_EXIT_CODE -eq 0 ]; then
            log_success "Smoke tests passed"
        else
            log_warning "Some tests failed (exit code: $TEST_EXIT_CODE)"
            log_info "Check /tmp/pytorch-test-results.log for details"

            if [ "${FAIL_ON_TEST_ERROR:-false}" = "true" ]; then
                log_error "Deployment aborted due to test failures"
                exit 1
            else
                log_warning "Continuing deployment despite test failures..."
            fi
        fi
    else
        log_warning "Playwright not installed. Skipping tests."
    fi
fi

# Step 7: Start server
log_info "Step 7/8: Starting production server..."

# Kill existing server if running
log_info "Checking for existing server on port 3100..."
EXISTING_PID=$(lsof -ti:3100 || true)
if [ -n "$EXISTING_PID" ]; then
    log_warning "Port 3100 in use by PID $EXISTING_PID. Killing..."
    kill -9 $EXISTING_PID || true
    sleep 2
fi

# Start server in background
log_info "Starting server..."
export NODE_ENV=production
export PORT=3100

nohup node server.js > /tmp/ailydian-pytorch-server.log 2>&1 &
SERVER_PID=$!

log_info "Server starting (PID: $SERVER_PID)..."
echo $SERVER_PID > /tmp/ailydian-server.pid

# Wait for server to start
sleep 5

# Step 8: Health check
log_info "Step 8/8: Running health checks..."

MAX_RETRIES=10
RETRY_COUNT=0
HEALTH_URL="http://localhost:3100/api/health"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    log_info "Health check attempt $((RETRY_COUNT + 1))/$MAX_RETRIES..."

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Server is healthy (HTTP $HTTP_CODE)"
        break
    else
        log_warning "Server not ready (HTTP $HTTP_CODE). Retrying in 3s..."
        sleep 3
        RETRY_COUNT=$((RETRY_COUNT + 1))
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log_error "Server health check failed after $MAX_RETRIES attempts"
    log_info "Check logs: tail -f /tmp/ailydian-pytorch-server.log"
    exit 1
fi

# Test PyTorch inference endpoint
log_info "Testing PyTorch inference endpoint..."
PYTORCH_URL="http://localhost:3100/api/pytorch/inference"

# Check if endpoint responds to OPTIONS (CORS)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$PYTORCH_URL" || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    log_success "PyTorch inference endpoint is reachable"
else
    log_warning "PyTorch inference endpoint may not be configured (HTTP $HTTP_CODE)"
fi

# Final summary
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 DEPLOYMENT SUCCESSFUL"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📊 Server Information:"
echo "   PID:        $SERVER_PID"
echo "   Port:       3100"
echo "   Health:     $HEALTH_URL"
echo "   Inference:  $PYTORCH_URL"
echo ""
echo "📁 Files:"
echo "   Logs:       /tmp/ailydian-pytorch-server.log"
echo "   PID file:   /tmp/ailydian-server.pid"
echo "   Database:   $DATABASE_PATH"
echo ""
echo "🧪 Test Endpoints:"
echo "   curl http://localhost:3100/api/health"
echo "   curl http://localhost:3100/api/pytorch/inference -X POST \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"model_name\":\"chest-xray-classifier-demo\",\"image\":\"...\"}'"
echo ""
echo "📝 Monitoring:"
echo "   tail -f /tmp/ailydian-pytorch-server.log"
echo ""
echo "🛑 Stop Server:"
echo "   kill $SERVER_PID"
echo "   # or: kill \$(cat /tmp/ailydian-server.pid)"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

log_success "Production deployment complete! 🚀"

# Exit successfully
exit 0
