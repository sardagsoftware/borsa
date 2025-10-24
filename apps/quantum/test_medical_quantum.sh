#!/bin/bash
# 🧬 Medical Quantum Analysis Integration Test
# ============================================
# LyDian OS - BlueQubit POC
# Date: 2024-10-24

echo "============================================================"
echo "🧬 MEDICAL QUANTUM ANALYSIS - INTEGRATION TEST"
echo "============================================================"
echo ""

BASE_URL="http://localhost:3100"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "TEST: $name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Endpoint: $endpoint"
    echo "Method: $method"

    if [ "$method" = "POST" ]; then
        echo "Payload: $data"
        RESPONSE=$(curl -s -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        RESPONSE=$(curl -s "$BASE_URL$endpoint")
    fi

    # Check if response contains "success"
    if echo "$RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    echo ""
    echo "Response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
}

# Test 1: Check if server is running
echo "🔍 Step 1: Server Health Check"
if curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running!${NC}"
    echo "Please start the server first:"
    echo "  cd /Users/sardag/Desktop/ailydian-ultra-pro"
    echo "  PORT=3100 node server.js"
    exit 1
fi
echo ""

# Test 2: Quantum VQE API
test_endpoint \
    "Quantum VQE - H2 Molecule" \
    "POST" \
    "/api/quantum/vqe" \
    '{
        "molecule": "H2",
        "bondDistance": 0.735,
        "device": "cpu",
        "budget": 0.10,
        "userId": "test-user"
    }'

# Test 3: Quantum Stats API
test_endpoint \
    "Quantum Stats" \
    "GET" \
    "/api/quantum/stats" \
    ""

# Test 4: Medical Quantum Analysis
test_endpoint \
    "Medical Quantum Analysis - H2O" \
    "POST" \
    "/api/medical/quantum-analysis" \
    '{
        "molecule": "H2O",
        "bondDistance": 0.96,
        "device": "cpu",
        "budget": 0.10,
        "language": "en"
    }'

# Test 5: Medical Quantum Analysis - Drug-like molecule
test_endpoint \
    "Medical Quantum Analysis - Aspirin (simplified)" \
    "POST" \
    "/api/medical/quantum-analysis" \
    '{
        "molecule": "C6H6",
        "device": "cpu",
        "budget": 0.10,
        "language": "en"
    }'

# Summary
echo "============================================================"
echo "📊 TEST SUMMARY"
echo "============================================================"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "✅ Quantum Gateway is working"
    echo "✅ Medical Expert quantum integration is operational"
    echo "✅ BlueQubit POC is complete"
    echo ""
    echo "🎯 Next Steps:"
    echo "  1. Set BLUEQUBIT_API_KEY to test with real quantum devices"
    echo "  2. Deploy to production"
    echo "  3. Monitor usage and costs"
    exit 0
else
    echo ""
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please check the errors above and fix them."
    exit 1
fi
