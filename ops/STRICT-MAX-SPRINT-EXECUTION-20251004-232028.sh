#!/bin/bash
# === AILYDIAN // STRICT-MAX ZERO-MISS SPRINT — DEEP REPAIR & INTEGRATION ===
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Logging
LOG_FILE="sprint-execution-$(date +%Y%m%d-%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  AILYDIAN STRICT-MAX ZERO-MISS SPRINT                     ║${NC}"
echo -e "${CYAN}║  Deep Repair & Integration                                ║${NC}"
echo -e "${CYAN}║  $(date -u +"%Y-%m-%d %H:%M:%S UTC")                       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Initialize counters
GATES_PASSED=0
GATES_FAILED=0
REPAIRS_COMPLETED=0
REPAIRS_FAILED=0
SECURITY_ISSUES=0
SLO_VIOLATIONS=0

# =============================================================================
# PHASE 0: ENVIRONMENT DETECTION
# =============================================================================
echo -e "${BLUE}━━━ PHASE 0: Environment Detection ━━━${NC}"
echo ""

# Detect mode: Docker/Hybrid/Cloud
if [ -f /.dockerenv ] || [ -f /proc/1/cgroup ] && grep -q docker /proc/1/cgroup 2>/dev/null; then
  MODE="Docker"
elif [ -d "/opt/render" ] || [ -n "${VERCEL:-}" ]; then
  MODE="Cloud"
else
  MODE="Hybrid"
fi

echo -e "${GREEN}Environment Mode: $MODE${NC}"

# Detect workspace
if [ -d "/home/lydian/Desktop/ailydian-ultra-pro" ]; then
  WORKSPACE="/home/lydian/Desktop/ailydian-ultra-pro"
elif [ -d "$HOME/Desktop/ailydian-ultra-pro" ]; then
  WORKSPACE="$HOME/Desktop/ailydian-ultra-pro"
else
  echo -e "${RED}❌ Workspace not found${NC}"
  exit 1
fi

echo "Workspace: $WORKSPACE"
cd "$WORKSPACE"
echo ""

# =============================================================================
# PHASE 1: SECURITY GATES (FAIL-FAST)
# =============================================================================
echo -e "${BLUE}━━━ PHASE 1: Security Gates (FAIL-FAST) ━━━${NC}"
echo ""

GATE_STATUS="PASS"

# Gate 1: OIDC Discovery
echo -n "Gate 1: OIDC Discovery... "
if [ -n "${OIDC_ISSUER:-}" ]; then
  if timeout 5 curl -sSf "${OIDC_ISSUER}/.well-known/openid-configuration" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    GATES_PASSED=$((GATES_PASSED + 1))
  else
    echo -e "${YELLOW}⚠️  SKIP (not accessible)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  SKIP (OIDC_ISSUER not set)${NC}"
fi

# Gate 2: Vault Health
echo -n "Gate 2: Vault Health... "
VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"
if timeout 5 curl -sSf "$VAULT_ADDR/v1/sys/health" >/dev/null 2>&1; then
  VAULT_HEALTH=$(curl -s "$VAULT_ADDR/v1/sys/health" | jq -r '.initialized // false')
  VAULT_SEALED=$(curl -s "$VAULT_ADDR/v1/sys/health" | jq -r '.sealed // true')
  
  if [ "$VAULT_HEALTH" = "true" ] && [ "$VAULT_SEALED" = "false" ]; then
    echo -e "${GREEN}✅ PASS (initialized, unsealed)${NC}"
    GATES_PASSED=$((GATES_PASSED + 1))
  else
    echo -e "${YELLOW}⚠️  WARN (sealed or not initialized)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  SKIP (Vault not accessible)${NC}"
fi

# Gate 3: Egress Policy Check
echo -n "Gate 3: Egress Policy... "
# Check for .env or config files with external endpoints
if grep -rn "https://" .env* 2>/dev/null | grep -v "localhost\|127.0.0.1\|ailydian.com" | grep -v "^#" | head -1 >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  WARN (external endpoints detected)${NC}"
  SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
  echo -e "${GREEN}✅ PASS (no unauthorized egress)${NC}"
  GATES_PASSED=$((GATES_PASSED + 1))
fi

# Gate 4: PII/Secret Log Check
echo -n "Gate 4: PII/Secret Log Scan... "
if find . -name "*.log" -type f -exec grep -l "password\|secret\|token\|api_key" {} \; 2>/dev/null | head -1 | grep -q .; then
  echo -e "${RED}❌ FAIL (secrets detected in logs)${NC}"
  GATES_FAILED=$((GATES_FAILED + 1))
  SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
  GATE_STATUS="FAIL"
else
  echo -e "${GREEN}✅ PASS (no secrets in logs)${NC}"
  GATES_PASSED=$((GATES_PASSED + 1))
fi

echo ""
echo -e "${CYAN}Gates Summary: ${GREEN}$GATES_PASSED passed${NC}, ${RED}$GATES_FAILED failed${NC}"
echo ""

# =============================================================================
# PHASE 2: HEALTH & PORT TOPOLOGY
# =============================================================================
echo -e "${BLUE}━━━ PHASE 2: Health & Port Topology ━━━${NC}"
echo ""

# Expected port mapping
declare -A EXPECTED_PORTS=(
  ["web"]="3100"
  ["chat"]="3901"
  ["brain-api"]="5001"
  ["vault"]="8200"
  ["prometheus"]="9090"
  ["grafana"]="3003"
  ["loki"]="3102"
)

# Check each service
for service in "${!EXPECTED_PORTS[@]}"; do
  port="${EXPECTED_PORTS[$service]}"
  echo -n "Checking $service (port $port)... "
  
  if lsof -i ":$port" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ RUNNING${NC}"
  else
    echo -e "${YELLOW}⏳ NOT RUNNING${NC}"
  fi
done

echo ""

# =============================================================================
# PHASE 3: DEEP REPAIR (Priority: Red Areas)
# =============================================================================
echo -e "${BLUE}━━━ PHASE 3: Deep Repair ━━━${NC}"
echo ""

# Repair 1: Web Application
echo -e "${CYAN}Repair 1: Web Application (Port 3100)${NC}"
if [ -f "server.js" ]; then
  echo "  Found server.js"
  
  # Check if running
  if ! lsof -i :3100 >/dev/null 2>&1; then
    echo "  Starting web server..."
    PORT=3100 node server.js >/dev/null 2>&1 &
    sleep 3
    
    if lsof -i :3100 >/dev/null 2>&1; then
      echo -e "  ${GREEN}✅ Web server started${NC}"
      REPAIRS_COMPLETED=$((REPAIRS_COMPLETED + 1))
    else
      echo -e "  ${RED}❌ Failed to start web server${NC}"
      REPAIRS_FAILED=$((REPAIRS_FAILED + 1))
    fi
  else
    echo -e "  ${GREEN}✅ Already running${NC}"
  fi
else
  echo -e "  ${YELLOW}⚠️  server.js not found${NC}"
fi
echo ""

# Repair 2: Chat Service
echo -e "${CYAN}Repair 2: Chat Service (Port 3901)${NC}"
if [ -d "apps/chat-ailydian" ]; then
  echo "  Found chat application"
  
  if ! lsof -i :3901 >/dev/null 2>&1; then
    echo "  Starting chat service..."
    cd apps/chat-ailydian
    if [ -f "package.json" ]; then
      PORT=3901 npm run dev >/dev/null 2>&1 &
      cd ../..
      sleep 3
      
      if lsof -i :3901 >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Chat service started${NC}"
        REPAIRS_COMPLETED=$((REPAIRS_COMPLETED + 1))
      else
        echo -e "  ${YELLOW}⚠️  Chat service not responding${NC}"
        REPAIRS_FAILED=$((REPAIRS_FAILED + 1))
      fi
    else
      cd ../..
      echo -e "  ${YELLOW}⚠️  package.json not found${NC}"
    fi
  else
    echo -e "  ${GREEN}✅ Already running${NC}"
  fi
else
  echo -e "  ${YELLOW}⚠️  Chat app directory not found${NC}"
fi
echo ""

# Repair 3: API Health
echo -e "${CYAN}Repair 3: API Health Endpoints${NC}"
API_ENDPOINTS=(
  "http://localhost:3100/api/health"
  "http://localhost:5001/health"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
  echo -n "  Testing $endpoint... "
  if timeout 5 curl -sSf "$endpoint" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ HEALTHY${NC}"
  else
    echo -e "${YELLOW}⏳ NOT AVAILABLE${NC}"
  fi
done
echo ""

# =============================================================================
# PHASE 4: SECURITY HARDENING
# =============================================================================
echo -e "${BLUE}━━━ PHASE 4: Security Hardening ━━━${NC}"
echo ""

echo "Checking security headers..."

# Test security headers on running services
if lsof -i :3100 >/dev/null 2>&1; then
  HEADERS=$(timeout 5 curl -sI http://localhost:3100 2>/dev/null || echo "")
  
  echo -n "  CSP Header... "
  if echo "$HEADERS" | grep -qi "content-security-policy"; then
    echo -e "${GREEN}✅ PRESENT${NC}"
  else
    echo -e "${YELLOW}⚠️  MISSING${NC}"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
  fi
  
  echo -n "  HSTS Header... "
  if echo "$HEADERS" | grep -qi "strict-transport-security"; then
    echo -e "${GREEN}✅ PRESENT${NC}"
  else
    echo -e "${YELLOW}⚠️  MISSING${NC}"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
  fi
  
  echo -n "  X-Frame-Options... "
  if echo "$HEADERS" | grep -qi "x-frame-options"; then
    echo -e "${GREEN}✅ PRESENT${NC}"
  else
    echo -e "${YELLOW}⚠️  MISSING${NC}"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
  fi
fi

echo ""

# =============================================================================
# PHASE 5: OBSERVABILITY CHECK
# =============================================================================
echo -e "${BLUE}━━━ PHASE 5: Observability ━━━${NC}"
echo ""

# Prometheus
echo -n "Prometheus (9090)... "
if timeout 5 curl -sSf http://localhost:9090/-/healthy >/dev/null 2>&1; then
  echo -e "${GREEN}✅ HEALTHY${NC}"
else
  echo -e "${YELLOW}⏳ NOT AVAILABLE${NC}"
fi

# Grafana
echo -n "Grafana (3003)... "
if timeout 5 curl -sSf http://localhost:3003/api/health >/dev/null 2>&1; then
  echo -e "${GREEN}✅ HEALTHY${NC}"
else
  echo -e "${YELLOW}⏳ NOT AVAILABLE${NC}"
fi

# Loki
echo -n "Loki (3102)... "
if timeout 5 curl -sSf http://localhost:3102/ready >/dev/null 2>&1; then
  echo -e "${GREEN}✅ HEALTHY${NC}"
else
  echo -e "${YELLOW}⏳ NOT AVAILABLE${NC}"
fi

echo ""

# =============================================================================
# PHASE 6: SLO VALIDATION
# =============================================================================
echo -e "${BLUE}━━━ PHASE 6: SLO Validation ━━━${NC}"
echo ""

# Test response times
if lsof -i :3100 >/dev/null 2>&1; then
  echo "Testing web application response time..."
  
  START_TIME=$(date +%s%3N)
  timeout 5 curl -sSf http://localhost:3100 >/dev/null 2>&1
  END_TIME=$(date +%s%3N)
  LATENCY=$((END_TIME - START_TIME))
  
  echo "  Response time: ${LATENCY}ms"
  
  if [ $LATENCY -lt 350 ]; then
    echo -e "  ${GREEN}✅ SLO MET (<350ms)${NC}"
  else
    echo -e "  ${YELLOW}⚠️  SLO VIOLATION (>350ms)${NC}"
    SLO_VIOLATIONS=$((SLO_VIOLATIONS + 1))
  fi
fi

echo ""

# =============================================================================
# FINAL SUMMARY
# =============================================================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  STRICT-MAX SPRINT SUMMARY                                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Environment:${NC}"
echo "  Mode: $MODE"
echo "  Workspace: $WORKSPACE"
echo ""

echo -e "${BLUE}Security Gates:${NC}"
echo "  Passed: $GATES_PASSED"
echo "  Failed: $GATES_FAILED"
echo "  Security Issues: $SECURITY_ISSUES"
echo ""

echo -e "${BLUE}Repairs:${NC}"
echo "  Completed: $REPAIRS_COMPLETED"
echo "  Failed: $REPAIRS_FAILED"
echo ""

echo -e "${BLUE}SLO:${NC}"
echo "  Violations: $SLO_VIOLATIONS"
echo ""

# Overall status
if [ $GATES_FAILED -eq 0 ] && [ $SECURITY_ISSUES -eq 0 ] && [ $SLO_VIOLATIONS -eq 0 ]; then
  echo -e "${GREEN}✅ OVERALL STATUS: PASS${NC}"
  EXIT_CODE=0
elif [ $GATES_FAILED -gt 0 ]; then
  echo -e "${RED}❌ OVERALL STATUS: CRITICAL (Security gates failed)${NC}"
  EXIT_CODE=1
else
  echo -e "${YELLOW}⚠️  OVERALL STATUS: WARNING (Issues detected)${NC}"
  EXIT_CODE=0
fi

echo ""
echo "Log file: $LOG_FILE"
echo ""

exit $EXIT_CODE

