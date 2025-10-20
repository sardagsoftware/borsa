#!/usr/bin/env bash
# ============================================================================
# DNS VALIDATION SCRIPT
# ============================================================================
# Usage: ./ops/validate.sh ailydian.com travel.ailydian.com ...
# Purpose: Validate DNS, TLS, health for all domains
# ============================================================================

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

domains=("$@")

if [ ${#domains[@]} -eq 0 ]; then
    domains=(
        "ailydian.com"
        "travel.ailydian.com"
        "blockchain.ailydian.com"
        "borsa.ailydian.com"
        "video.ailydian.com"
        "newsai.earth"
    )
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  DNS VALIDATION - AILYDIAN DOMAINS                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

for d in "${domains[@]}"; do
    echo -e "${BLUE}━━━ $d ━━━${NC}"

    # DNS Resolution
    echo -n "DNS (CNAME): "
    cname=$(dig +short CNAME "$d" 2>/dev/null | head -1 || echo "")
    if [ -n "$cname" ]; then
        echo -e "${GREEN}$cname${NC}"
    else
        a_record=$(dig +short A "$d" 2>/dev/null | head -1 || echo "")
        if [ -n "$a_record" ]; then
            echo -e "${BLUE}$a_record (A record - apex olabilir)${NC}"
        else
            echo -e "${RED}NOT RESOLVED${NC}"
        fi
    fi

    # TXT Verification
    echo -n "TXT (_dnsauth): "
    txt=$(nslookup -type=txt "_dnsauth.$d" 2>/dev/null | grep "text =" | head -1 || echo "")
    if [ -n "$txt" ]; then
        echo -e "${GREEN}FOUND${NC}"
    else
        echo -e "${RED}NOT FOUND${NC}"
    fi

    # HTTPS Headers
    echo "Headers:"
    headers=$(curl -sSI "https://$d" 2>/dev/null | sed -n '1,10p' || echo "FAILED")
    if echo "$headers" | grep -qi "azure\|x-azure-ref"; then
        echo -e "${GREEN}✓ Azure detected${NC}"
    else
        echo -e "${RED}✗ Azure not detected${NC}"
    fi
    echo "$headers" | grep -E "^(HTTP|server|x-azure-ref|x-cache|x-apim)" | sed 's/^/  /'

    # Health Check
    echo -n "Health: "
    if curl -sf "https://$d/api/health" >/dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAIL${NC}"
    fi

    # Latency
    latency=$(curl -s -o /dev/null -w "HTTP:%{http_code} Time:%{time_total}s\n" "https://$d" 2>/dev/null || echo "HTTP:000 Time:0")
    echo "Response: $latency"

    echo ""
done

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  VALIDATION COMPLETE                                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
