#!/bin/bash
# Canary Deployment Script
PERCENTAGE=${1:-5}

echo "🐤 CANARY DEPLOYMENT: ${PERCENTAGE}%"
echo "⚠️ Manual setup required:"
echo "1. Configure AFD/CDN routing rules"
echo "2. Set traffic split: ${PERCENTAGE}% to new, $(( 100 - PERCENTAGE ))% to old"
echo "3. Monitor metrics for 10 minutes"
echo "4. If p95<120ms && 5xx<0.5%, proceed to next stage"
