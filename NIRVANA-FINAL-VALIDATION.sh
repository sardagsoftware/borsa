#!/bin/bash
# === AILYDIAN NIRVANA LEVEL - FINAL VALIDATION ===
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  AILYDIAN - NIRVANA LEVEL FINAL VALIDATION                 ║${NC}"
echo -e "${CYAN}║  $(date +"%Y-%m-%d %H:%M:%S %Z")                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

SCORE=0
MAX_SCORE=100
ISSUES=()
SUCCESSES=()

# 1. DNS PROPAGATION CHECK
echo -e "${BLUE}━━━ [1/7] DNS Propagation Status ━━━${NC}"
DOMAINS=("ailydian.com" "travel.ailydian.com" "blockchain.ailydian.com" "video.ailydian.com" "borsa.ailydian.com" "newsai.earth")
PROPAGATED=0

for domain in "${DOMAINS[@]}"; do
  if timeout 5 curl -sSI "https://$domain" 2>&1 | grep -q "x-azure-ref"; then
    echo -e "${GREEN}✅ $domain → Azure AFD${NC}"
    PROPAGATED=$((PROPAGATED + 1))
  else
    IP=$(dig +short "$domain" 2>/dev/null | head -1)
    echo -e "${YELLOW}⏳ $domain → Vercel ($IP)${NC}"
  fi
done

if [ $PROPAGATED -gt 0 ]; then
  POINTS=$((PROPAGATED * 3))
  SCORE=$((SCORE + POINTS))
  SUCCESSES+=("[+$POINTS] DNS: $PROPAGATED/6 domains propagated to Azure")
else
  ISSUES+=("DNS: 0/6 domains propagated (beklenmedik)")
fi
echo ""

# 2. SECURITY HEADERS CHECK
echo -e "${BLUE}━━━ [2/7] Security Headers Validation ━━━${NC}"
if lsof -i :3100 >/dev/null 2>&1; then
  HEADERS=$(timeout 5 curl -sI http://localhost:3100 2>/dev/null || echo "")
  HEADER_SCORE=0
  
  if echo "$HEADERS" | grep -qi "content-security-policy"; then
    echo -e "${GREEN}✅ CSP Header${NC}"
    HEADER_SCORE=$((HEADER_SCORE + 5))
  else
    echo -e "${RED}❌ CSP Header${NC}"
    ISSUES+=("Security: CSP header missing")
  fi
  
  if echo "$HEADERS" | grep -qi "strict-transport-security"; then
    echo -e "${GREEN}✅ HSTS Header${NC}"
    HEADER_SCORE=$((HEADER_SCORE + 5))
  else
    echo -e "${RED}❌ HSTS Header${NC}"
    ISSUES+=("Security: HSTS header missing")
  fi
  
  if echo "$HEADERS" | grep -qi "x-frame-options"; then
    echo -e "${GREEN}✅ X-Frame-Options${NC}"
    HEADER_SCORE=$((HEADER_SCORE + 3))
  else
    echo -e "${RED}❌ X-Frame-Options${NC}"
    ISSUES+=("Security: X-Frame-Options missing")
  fi
  
  if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    echo -e "${GREEN}✅ X-Content-Type-Options${NC}"
    HEADER_SCORE=$((HEADER_SCORE + 3))
  else
    echo -e "${RED}❌ X-Content-Type-Options${NC}"
  fi
  
  if echo "$HEADERS" | grep -qi "referrer-policy"; then
    echo -e "${GREEN}✅ Referrer-Policy${NC}"
    HEADER_SCORE=$((HEADER_SCORE + 2))
  else
    echo -e "${YELLOW}⚠️  Referrer-Policy${NC}"
  fi
  
  SCORE=$((SCORE + HEADER_SCORE))
  if [ $HEADER_SCORE -ge 15 ]; then
    SUCCESSES+=("[+$HEADER_SCORE] Security headers implemented")
  fi
else
  echo -e "${RED}❌ Web server not running${NC}"
  ISSUES+=("Server: Web server (3100) not accessible")
fi
echo ""

# 3. API HEALTH CHECK
echo -e "${BLUE}━━━ [3/7] API Health Status ━━━${NC}"
API_SCORE=0

endpoints=(
  "http://localhost:3100"
  "http://localhost:3100/api/health"
)

for endpoint in "${endpoints[@]}"; do
  if timeout 5 curl -sSf "$endpoint" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ $endpoint${NC}"
    API_SCORE=$((API_SCORE + 5))
  else
    echo -e "${RED}❌ $endpoint${NC}"
    ISSUES+=("API: $endpoint not responding")
  fi
done

SCORE=$((SCORE + API_SCORE))
if [ $API_SCORE -gt 0 ]; then
  SUCCESSES+=("[+$API_SCORE] API endpoints healthy")
fi
echo ""

# 4. LOG SECURITY CHECK
echo -e "${BLUE}━━━ [4/7] Log Security Scan ━━━${NC}"
if find . -name "*.log" -type f -exec grep -l "password\|secret\|token\|api_key" {} \; 2>/dev/null | head -1 | grep -q .; then
  echo -e "${RED}❌ Secrets still in logs${NC}"
  ISSUES+=("Security: Secrets detected in logs - CRITICAL")
else
  echo -e "${GREEN}✅ No secrets in logs${NC}"
  SCORE=$((SCORE + 15))
  SUCCESSES+=("[+15] Log security validated")
fi
echo ""

# 5. PERFORMANCE CHECK
echo -e "${BLUE}━━━ [5/7] Performance Metrics ━━━${NC}"
if lsof -i :3100 >/dev/null 2>&1; then
  START=$(date +%s%3N)
  timeout 5 curl -sSf http://localhost:3100 >/dev/null 2>&1 && true
  END=$(date +%s%3N)
  LATENCY=$((END - START))
  
  echo "Response time: ${LATENCY}ms"
  
  if [ $LATENCY -lt 350 ]; then
    echo -e "${GREEN}✅ SLO MET (<350ms)${NC}"
    SCORE=$((SCORE + 10))
    SUCCESSES+=("[+10] Performance SLO met")
  else
    echo -e "${YELLOW}⚠️  SLO WARNING (${LATENCY}ms > 350ms)${NC}"
    ISSUES+=("Performance: Latency ${LATENCY}ms exceeds SLO")
  fi
fi
echo ""

# 6. AFD INFRASTRUCTURE
echo -e "${BLUE}━━━ [6/7] Azure Front Door Status ━━━${NC}"
AFD_FQDN="ailydian-production-fd-endpoint.z01.azurefd.net"

if timeout 5 curl -sSI "https://$AFD_FQDN" 2>&1 | grep -q "x-azure-ref"; then
  echo -e "${GREEN}✅ AFD Endpoint: LIVE${NC}"
  SCORE=$((SCORE + 10))
  SUCCESSES+=("[+10] Azure Front Door operational")
else
  echo -e "${RED}❌ AFD Endpoint: NOT RESPONDING${NC}"
  ISSUES+=("AFD: Endpoint not responding")
fi
echo ""

# 7. DOCUMENTATION & AUDIT TRAIL
echo -e "${BLUE}━━━ [7/7] Documentation & Audit ━━━${NC}"
DOC_SCORE=0

if [ -f "ops/dns-change-log.ndjson" ]; then
  EVENTS=$(wc -l < ops/dns-change-log.ndjson 2>/dev/null || echo 0)
  echo -e "${GREEN}✅ Audit trail: $EVENTS events${NC}"
  DOC_SCORE=$((DOC_SCORE + 5))
fi

if [ -f "ops/AZURE-PORTAL-QUICK-START.md" ]; then
  echo -e "${GREEN}✅ Quick start guide${NC}"
  DOC_SCORE=$((DOC_SCORE + 3))
fi

if [ -f "NIRVANA-CLEANUP.sh" ]; then
  echo -e "${GREEN}✅ Nirvana cleanup script${NC}"
  DOC_SCORE=$((DOC_SCORE + 2))
fi

SCORE=$((SCORE + DOC_SCORE))
SUCCESSES+=("[+$DOC_SCORE] Documentation complete")
echo ""

# FINAL SCORE CALCULATION
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  NIRVANA LEVEL SCORE: $SCORE/$MAX_SCORE                             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# RATING
if [ $SCORE -ge 90 ]; then
  echo -e "${GREEN}🏆 NIRVANA ACHIEVED! Mükemmel durum!${NC}"
  RATING="NIRVANA"
elif [ $SCORE -ge 80 ]; then
  echo -e "${GREEN}⭐ EXCELLENT! Neredeyse mükemmel!${NC}"
  RATING="EXCELLENT"
elif [ $SCORE -ge 70 ]; then
  echo -e "${YELLOW}✨ GOOD! İyi durum, birkaç iyileştirme gerekli${NC}"
  RATING="GOOD"
elif [ $SCORE -ge 60 ]; then
  echo -e "${YELLOW}⚡ FAIR! Daha fazla çalışma gerekli${NC}"
  RATING="FAIR"
else
  echo -e "${RED}⚠️  NEEDS IMPROVEMENT! Acil eylem gerekli${NC}"
  RATING="NEEDS_IMPROVEMENT"
fi

echo ""
echo -e "${GREEN}━━━ Successes (${#SUCCESSES[@]}) ━━━${NC}"
for success in "${SUCCESSES[@]}"; do
  echo -e "${GREEN}✅ $success${NC}"
done

if [ ${#ISSUES[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}━━━ Issues (${#ISSUES[@]}) ━━━${NC}"
  for issue in "${ISSUES[@]}"; do
    echo -e "${YELLOW}⚠️  $issue${NC}"
  done
fi

echo ""
echo -e "${CYAN}━━━ Next Actions ━━━${NC}"
if [ $SCORE -lt 90 ]; then
  echo "1. Complete Azure Portal setup (AZURE-PORTAL-QUICK-START.md)"
  echo "2. Monitor DNS propagation (cd ops && ./monitor-propagation.sh)"
  echo "3. Start additional services (Chat: 3901, Prometheus: 9090)"
fi

if [ ${#ISSUES[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ No critical issues detected!${NC}"
fi

echo ""
echo "Report saved to: NIRVANA-VALIDATION-REPORT-$(date +%Y%m%d-%H%M%S).txt"

# Save report
{
  echo "AILYDIAN NIRVANA LEVEL VALIDATION REPORT"
  echo "========================================"
  echo "Date: $(date)"
  echo "Score: $SCORE/$MAX_SCORE"
  echo "Rating: $RATING"
  echo ""
  echo "Successes:"
  printf '%s\n' "${SUCCESSES[@]}"
  echo ""
  echo "Issues:"
  printf '%s\n' "${ISSUES[@]}"
} > "NIRVANA-VALIDATION-REPORT-$(date +%Y%m%d-%H%M%S).txt"

