#!/usr/bin/env bash
# === AILYDIAN DNS Propagation Monitor (macOS-friendly) ===
set -euo pipefail

DOMAINS=(
  "ailydian.com"
  "travel.ailydian.com"
  "blockchain.ailydian.com"
  "video.ailydian.com"
  "borsa.ailydian.com"
  "newsai.earth"
)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌍 AILYDIAN DNS Propagation Monitor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

while true; do
  echo "📅 $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  for domain in "${DOMAINS[@]}"; do
    # Check CNAME
    CNAME=$(dig +short CNAME "$domain" 2>/dev/null | head -1 || echo "")
    
    # Check A record
    A_RECORD=$(dig +short A "$domain" 2>/dev/null | head -1 || echo "")
    
    # Check for Azure header
    if timeout 5 curl -sSI "https://$domain" 2>&1 | grep -q "x-azure-ref" 2>/dev/null; then
      STATUS="✅ AZURE AFD"
    elif [ -n "$A_RECORD" ]; then
      STATUS="⏳ Vercel ($A_RECORD)"
    else
      STATUS="❌ No DNS"
    fi
    
    printf "%-30s %s\n" "$domain:" "$STATUS"
    
    if [ -n "$CNAME" ]; then
      printf "%-30s   CNAME → %s\n" "" "$CNAME"
    fi
  done
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⏱️  Next check in 60 seconds... (Ctrl+C to stop)"
  echo ""
  sleep 60
done
