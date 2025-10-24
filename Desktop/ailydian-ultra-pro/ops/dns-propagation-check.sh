#!/bin/bash
AFD_FQDN="ailydian-production-fd-endpoint.z01.azurefd.net"
DOMAINS=("ailydian.com" "travel.ailydian.com" "blockchain.ailydian.com" "video.ailydian.com" "borsa.ailydian.com" "newsai.earth")

echo "DNS PROPAGATION STATUS - $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "══════════════════════════════════════════════════"

for domain in "${DOMAINS[@]}"; do
  echo -n "$domain: "
  
  # Check for Azure headers
  if curl -sSI "https://$domain" 2>&1 | grep -qi "x-azure-ref"; then
    echo "✅ AZURE AFD (propagated)"
  else
    # Check CNAME/A record
    DNS=$(dig +short "$domain" | head -1)
    echo "⏳ Vercel ($DNS) - propagating..."
  fi
done

echo ""
echo "Note: DNS propagation typically takes 5-60 minutes"
