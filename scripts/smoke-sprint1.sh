#!/bin/bash
# ========================================
# SPRINT 1 - SMOKE TESTS
# TR Commerce Core - Trendyol + Hepsiburada
# ========================================

set -e

echo "🧪 SPRINT 1 - SMOKE TESTS"
echo "======================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# ========== Test 1: Push Sample Catalog (Trendyol) ==========
echo "📦 [1/5] Testing Trendyol product.sync..."

RESPONSE=$(curl -s -X POST http://localhost:3100/api/actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "product.sync",
    "payload": {
      "products": [
        {"barcode": "TEST001", "title": "Test Product 1", "price": 100},
        {"barcode": "TEST002", "title": "Test Product 2", "price": 200}
      ]
    },
    "scopes": ["trendyol:catalog:write"]
  }' 2>/dev/null)

SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)

if [ "$SUCCESS" = "true" ]; then
  SYNCED=$(echo "$RESPONSE" | jq -r '.data.synced' 2>/dev/null)
  echo -e "${GREEN}✅ Trendyol product.sync: $SYNCED products synced${NC}"
else
  echo -e "${RED}❌ Trendyol product.sync failed${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# ========== Test 2: Pull Orders (Trendyol) ==========
echo "📋 [2/5] Testing Trendyol order.list..."

RESPONSE=$(curl -s -X POST http://localhost:3100/api/actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "order.list",
    "payload": {
      "page": 1,
      "size": 10
    },
    "scopes": ["trendyol:orders:read"]
  }' 2>/dev/null)

SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)

if [ "$SUCCESS" = "true" ]; then
  TOTAL=$(echo "$RESPONSE" | jq -r '.data.total' 2>/dev/null)
  echo -e "${GREEN}✅ Trendyol order.list: $TOTAL total orders${NC}"
else
  echo -e "${RED}❌ Trendyol order.list failed${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# ========== Test 3: Update Inventory (Trendyol) ==========
echo "📊 [3/5] Testing Trendyol inventory.update..."

RESPONSE=$(curl -s -X POST http://localhost:3100/api/actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "inventory.update",
    "payload": {
      "items": [
        {"barcode": "TEST001", "quantity": 100, "salePrice": 95},
        {"barcode": "TEST002", "quantity": 50, "salePrice": 190}
      ]
    },
    "scopes": ["trendyol:inventory:write"]
  }' 2>/dev/null)

SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)

if [ "$SUCCESS" = "true" ]; then
  UPDATED=$(echo "$RESPONSE" | jq -r '.data.updated' 2>/dev/null)
  echo -e "${GREEN}✅ Trendyol inventory.update: $UPDATED items updated${NC}"
else
  echo -e "${RED}❌ Trendyol inventory.update failed${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# ========== Test 4: Push Sample Catalog (Hepsiburada) ==========
echo "📦 [4/5] Testing Hepsiburada product.sync..."

RESPONSE=$(curl -s -X POST http://localhost:3100/api/actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "product.sync",
    "payload": {
      "products": [
        {"merchantSku": "HB001", "title": "Test Product HB1", "price": 150},
        {"merchantSku": "HB002", "title": "Test Product HB2", "price": 250}
      ]
    },
    "scopes": ["hepsiburada:catalog:write"]
  }' 2>/dev/null)

SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)

if [ "$SUCCESS" = "true" ]; then
  SYNCED=$(echo "$RESPONSE" | jq -r '.data.synced' 2>/dev/null)
  echo -e "${GREEN}✅ Hepsiburada product.sync: $SYNCED products synced${NC}"
else
  echo -e "${RED}❌ Hepsiburada product.sync failed${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# ========== Test 5: Pull Orders (Hepsiburada) ==========
echo "📋 [5/5] Testing Hepsiburada order.list..."

RESPONSE=$(curl -s -X POST http://localhost:3100/api/actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "order.list",
    "payload": {
      "offset": 0,
      "limit": 10
    },
    "scopes": ["hepsiburada:orders:read"]
  }' 2>/dev/null)

SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)

if [ "$SUCCESS" = "true" ]; then
  TOTAL=$(echo "$RESPONSE" | jq -r '.data.total' 2>/dev/null)
  echo -e "${GREEN}✅ Hepsiburada order.list: $TOTAL total orders${NC}"
else
  echo -e "${RED}❌ Hepsiburada order.list failed${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# ========== Summary ==========
echo "======================================"
echo "📊 SPRINT 1 - SMOKE TEST RESULTS"
echo "======================================"

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ ALL SMOKE TESTS PASSED (5/5)${NC}"
  echo ""
  echo "TR Commerce Core SMOKE Criteria:"
  echo "  ✅ Trendyol product.sync → 200"
  echo "  ✅ Trendyol order.list → ≥0 orders"
  echo "  ✅ Trendyol inventory.update → 200"
  echo "  ✅ Hepsiburada product.sync → 200"
  echo "  ✅ Hepsiburada order.list → ≥0 orders"
  echo ""
  echo "🎉 SPRINT 1 SMOKE TESTS COMPLETE"
  exit 0
else
  echo -e "${RED}❌ SMOKE TESTS FAILED${NC}"
  echo ""
  echo "Failures: $ERRORS/5"
  echo ""
  echo "Please fix the issues above before proceeding."
  exit 1
fi
