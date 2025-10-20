#!/bin/bash
echo "🔒 Testing AI Rate Limiting (30 req/15min)..."
echo ""

for i in {1..5}; do
  echo -n "Request $i: "
  response=$(curl -s -X POST http://localhost:3100/api/legal-ai \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"test query $i\"}")

  success=$(echo "$response" | jq -r '.success' 2>/dev/null)
  error=$(echo "$response" | jq -r '.error' 2>/dev/null)

  if [ "$success" = "true" ]; then
    echo "✅ Success"
  elif [ "$error" != "null" ]; then
    echo "❌ $error"
  else
    echo "⚠️  Unknown response"
  fi

  sleep 0.3
done

echo ""
echo "✅ Rate limiting test complete"
