#!/usr/bin/env bash
# DNS Propagation Monitor - Ailydian AFD Cutover
set -euo pipefail

AFD_FQDN="$(cat afd.txt 2>/dev/null || echo 'ailydian-production-fd-endpoint.z01.azurefd.net')"
DOMAINS=("ailydian.com" "travel.ailydian.com" "blockchain.ailydian.com" "video.ailydian.com" "borsa.ailydian.com" "newsai.earth")

echo "═══════════════════════════════════════════════════════════════"
echo "DNS PROPAGATION MONITOR"
echo "AFD: $AFD_FQDN"
echo "Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "═══════════════════════════════════════════════════════════════"
echo

for domain in "${DOMAINS[@]}"; do
  echo "🔍 $domain"
  
  # Check local resolver
  local_ip="$(dig +short "$domain" | head -1)"
  echo "   Local:      $local_ip"
  
  # Check Google DNS
  google_ip="$(dig @8.8.8.8 +short "$domain" | head -1)"
  echo "   Google:     $google_ip"
  
  # Check Cloudflare DNS
  cf_ip="$(dig @1.1.1.1 +short "$domain" | head -1)"
  echo "   Cloudflare: $cf_ip"
  
  # Try HTTPS
  if curl -sSI --max-time 5 "https://$domain" 2>&1 | grep -q "x-azure-ref"; then
    echo "   ✅ Azure headers detected!"
  else
    echo "   ⏳ No Azure headers yet"
  fi
  
  echo
done

echo "═══════════════════════════════════════════════════════════════"
echo "Run this script every 5-10 minutes to track propagation"
echo "Expected: Full propagation within 30-60 minutes"
echo "═══════════════════════════════════════════════════════════════"
