#!/bin/bash

echo "🧪 LyDian AI - Legal AI Services Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: System Status
echo "📊 Test 1: System Status"
curl -s -X GET "http://localhost:3100/api/legal-ai/status" | jq -r '.services.translator.languages.total // "API not loaded"'
echo ""

# Test 2: Language Detection
echo "🔍 Test 2: Language Detection"
curl -s -X POST "http://localhost:3100/api/legal-ai/translate/detect" \
  -H "Content-Type: application/json" \
  -d '{"text": "Bu bir Türkçe yasal metindir."}' | jq '.language // "API not loaded"'
echo ""

# Test 3: Translation (Turkish → English)
echo "🌍 Test 3: Translation (TR → EN)"
curl -s -X POST "http://localhost:3100/api/legal-ai/translate" \
  -H "Content-Type: application/json" \
  -d '{"text": "mahkeme kararı", "targetLanguage": "en"}' | jq '.translatedText // "API not loaded"'
echo ""

# Test 4: GDPR Compliance Check
echo "🛡️ Test 4: GDPR Compliance Check"
curl -s -X POST "http://localhost:3100/api/legal-ai/legal-systems/eu/gdpr/check" \
  -H "Content-Type: application/json" \
  -d '{"dataProcessingActivity": {"legalBasis": "consent", "purposes": ["marketing"], "dataTypes": ["email", "name"]}}' | jq '.complianceScore // "API not loaded"'
echo ""

# Test 5: Blockchain Document Registration
echo "🔗 Test 5: Blockchain Document Registration"
curl -s -X POST "http://localhost:3100/api/legal-ai/blockchain/register" \
  -H "Content-Type: application/json" \
  -d '{"document": {"title": "Test Contract", "content": "This is a test contract"}, "metadata": {"documentType": "contract", "parties": ["Alice", "Bob"]}}' | jq '.documentHash // "API not loaded"'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Legal AI Services Test Complete"
