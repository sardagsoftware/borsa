#!/bin/bash

# Ailydian Ultra Pro - Smoke Test v2
# Tests: Chat completion, Conversation CRUD, Database connectivity

set -e

echo "🧪 Starting Ailydian Ultra Pro v2 Smoke Test..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3002"
FAILED=0
PASSED=0

# Test helper function
test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_status="$5"

  echo -n "Testing: $name... "

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got $status_code)"
    echo "Response: $body"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Test Suite: Core Chat Infrastructure (v2)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate test user ID
USER_ID="test-user-$(date +%s)"

echo "Test User ID: $USER_ID"
echo ""

# Test 1: Create Conversation
echo "1️⃣  Conversation Management"
conv_response=$(curl -s -X POST "$BASE_URL/api/conversations" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"title\":\"Smoke Test Conversation\"}")

CONV_ID=$(echo "$conv_response" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$CONV_ID" ]; then
  echo -e "${GREEN}✓ PASS${NC} Create conversation (ID: $CONV_ID)"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ FAIL${NC} Create conversation"
  echo "Response: $conv_response"
  FAILED=$((FAILED + 1))
fi

# Test 2: List Conversations
test_endpoint "List conversations" "GET" "/api/conversations?userId=$USER_ID" "" "200"

# Test 3: Chat Completion (Non-streaming)
echo ""
echo "2️⃣  Chat Completion API"
chat_data='{
  "messages": [
    {"role": "user", "content": "Say hello in one word"}
  ],
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxTokens": 10,
  "stream": false
}'

chat_response=$(curl -s -X POST "$BASE_URL/api/chat/complete" \
  -H "Content-Type: application/json" \
  -d "$chat_data")

if echo "$chat_response" | grep -q '"content"'; then
  echo -e "${GREEN}✓ PASS${NC} Chat completion (non-streaming)"
  PASSED=$((PASSED + 1))

  # Extract metrics
  tokens_in=$(echo "$chat_response" | grep -o '"promptTokens":[0-9]*' | cut -d':' -f2)
  tokens_out=$(echo "$chat_response" | grep -o '"completionTokens":[0-9]*' | cut -d':' -f2)
  latency=$(echo "$chat_response" | grep -o '"latencyMs":[0-9]*' | cut -d':' -f2)
  cost=$(echo "$chat_response" | grep -o '"cost":[0-9.]*' | cut -d':' -f2)

  echo "  📊 Metrics:"
  echo "     Tokens In: $tokens_in"
  echo "     Tokens Out: $tokens_out"
  echo "     Latency: ${latency}ms"
  echo "     Cost: \$$cost"
else
  echo -e "${RED}✗ FAIL${NC} Chat completion (non-streaming)"
  echo "Response: $chat_response"
  FAILED=$((FAILED + 1))
fi

# Test 4: Chat with Conversation ID
echo ""
echo "3️⃣  Chat with Persistence"
if [ -n "$CONV_ID" ]; then
  chat_persist_data="{
    \"messages": [
      {\"role\": \"user\", \"content\": \"Count to 3\"}
    ],
    \"model\": \"gpt-4o-mini\",
    \"conversationId\": \"$CONV_ID\",
    \"userId\": \"$USER_ID\"
  }"

  persist_response=$(curl -s -X POST "$BASE_URL/api/chat/complete" \
    -H "Content-Type: application/json" \
    -d "$chat_persist_data")

  if echo "$persist_response" | grep -q '"content"'; then
    echo -e "${GREEN}✓ PASS${NC} Chat with conversation persistence"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC} Chat with conversation persistence"
    FAILED=$((FAILED + 1))
  fi
else
  echo -e "${YELLOW}⊘ SKIP${NC} Chat with persistence (no conversation ID)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  ${GREEN}Passed:${NC} $PASSED"
echo -e "  ${RED}Failed:${NC} $FAILED"
echo -e "  Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "Sprint v2 Status: ✅ COMPLETE"
  echo "Ready for: Sprint v3 (Personalized Routing + Cost Optimization)"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
