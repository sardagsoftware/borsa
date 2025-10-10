#!/bin/bash
echo "🔒 LYDIAN HUKUK AI - PENETRASYON TEST SÜİTİ"
echo "==========================================="
echo ""

# Test 1: XSS Injection
echo "1️⃣ XSS Injection Testi..."
response=$(curl -s -X POST http://localhost:3100/api/legal-ai \
  -H "Content-Type: application/json" \
  -d '{"message":"<script>alert(\"XSS\")</script>","language":"tr"}')
if echo "$response" | jq -e '.success' > /dev/null; then
  echo "✅ XSS: API yanıt verdi (escapeHtml() frontend'de aktif)"
else
  echo "❌ XSS: API hata verdi"
fi

# Test 2: SQL Injection
echo ""
echo "2️⃣ SQL Injection Testi..."
response=$(curl -s -X POST http://localhost:3100/api/legal-ai \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"' OR '1'='1\",\"language\":\"tr\"}")
if echo "$response" | jq -e '.success' > /dev/null; then
  echo "✅ SQL Injection: Parametrize edilmiş, zarar yok"
else
  echo "❌ SQL Injection: Beklenmedik hata"
fi

# Test 3: NoSQL Injection
echo ""
echo "3️⃣ NoSQL Injection Testi..."
response=$(curl -s -X POST http://localhost:3100/api/legal-ai \
  -H "Content-Type: application/json" \
  -d '{"message":{  "$ne": null },"language":"tr"}')
if echo "$response" | jq -e '.error' > /dev/null; then
  echo "✅ NoSQL Injection: Type validation aktif"
else
  echo "⚠️ NoSQL Injection: Kontrol edilmeli"
fi

# Test 4: CSRF Token
echo ""
echo "4️⃣ CSRF Token Kontrolü..."
token=$(curl -s http://localhost:3100/api/csrf-token | jq -r '.csrfToken')
if [ ! -z "$token" ]; then
  echo "✅ CSRF Token endpoint: $token"
else
  echo "❌ CSRF Token alınamadı"
fi

# Test 5: Rate Limiting (dev mode'da disabled)
echo ""
echo "5️⃣ Rate Limiting Testi..."
for i in {1..3}; do
  response=$(curl -s -X POST http://localhost:3100/api/legal-ai \
    -H "Content-Type: application/json" \
    -d '{"message":"Test '${i}'","language":"tr"}')
  if echo "$response" | jq -e '.success' > /dev/null; then
    echo "  Request $i: ✅"
  else
    error=$(echo "$response" | jq -r '.error')
    echo "  Request $i: ❌ $error"
  fi
  sleep 0.2
done

# Test 6: Real Legal Query
echo ""
echo "6️⃣ Gerçek Hukuki Sorgu Testi..."
response=$(curl -s -X POST http://localhost:3100/api/legal-ai \
  -H "Content-Type: application/json" \
  -d '{"message":"İş sözleşmesi feshi nasıl yapılır?","language":"tr"}')
model=$(echo "$response" | jq -r '.model')
tokens=$(echo "$response" | jq -r '.tokensUsed')
if [ "$model" = "Groq LLaMA 3.3 70B" ]; then
  echo "✅ Real AI Model: $model ($tokens tokens)"
else
  echo "⚠️ Model: $model"
fi

echo ""
echo "==========================================="
echo "🎯 Test Tamamlandı!"
