#!/bin/bash

echo "🚀 LyDian Trader - COMPLETE System Smoke Test"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -n "Testing $name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)

    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $response)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $response, expected $expected_status)"
        ((FAILED++))
        return 1
    fi
}

# Check if server is running
echo "📡 Checking server status..."
if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${RED}✗ Server not running on port 3000${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo ""
echo "🌐 Testing Frontend Pages (15 pages)..."
echo "----------------------------------------"
test_endpoint "Home Page" "http://localhost:3000"
test_endpoint "Login Page" "http://localhost:3000/login"
test_endpoint "Dashboard" "http://localhost:3000/dashboard"
test_endpoint "Crypto Page" "http://localhost:3000/crypto"
test_endpoint "Stocks Page" "http://localhost:3000/stocks"
test_endpoint "Portfolio Page" "http://localhost:3000/portfolio"
test_endpoint "Watchlist Page" "http://localhost:3000/watchlist"
test_endpoint "Quantum Pro AI" "http://localhost:3000/quantum-pro"
test_endpoint "AI Trading" "http://localhost:3000/ai-trading"
test_endpoint "Backtesting" "http://localhost:3000/backtesting"
test_endpoint "Risk Management" "http://localhost:3000/risk-management"
test_endpoint "Signals Monitor" "http://localhost:3000/signals"
test_endpoint "Market Analysis" "http://localhost:3000/market-analysis"
test_endpoint "Bot Management" "http://localhost:3000/bot-management"
test_endpoint "Settings" "http://localhost:3000/settings"

echo ""
echo "🔌 Testing Backend APIs (6 APIs)..."
echo "-----------------------------------"
test_endpoint "Market Crypto API" "http://localhost:3000/api/market/crypto"
test_endpoint "Location API" "http://localhost:3000/api/location"
test_endpoint "Quantum Pro Signals" "http://localhost:3000/api/quantum-pro/signals"
test_endpoint "Quantum Pro Monitor" "http://localhost:3000/api/quantum-pro/monitor"
test_endpoint "Quantum Pro Risk Check (GET)" "http://localhost:3000/api/quantum-pro/risk-check"

# Test POST endpoint with curl
echo -n "Testing Quantum Pro Backtest API (POST)... "
backtest_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTC","startDate":"2024-01-01","endDate":"2024-12-31"}' \
  "http://localhost:3000/api/quantum-pro/backtest" 2>/dev/null)

if [ "$backtest_response" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $backtest_response)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (HTTP $backtest_response, expected 200)"
    ((FAILED++))
fi

echo ""
echo "🧪 Testing AI Components..."
echo "---------------------------"
if [ -f "src/services/ai/QuantumProEngine.ts" ]; then
    echo -e "${GREEN}✓${NC} QuantumProEngine.ts exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} QuantumProEngine.ts missing"
    ((FAILED++))
fi

if [ -f "src/services/ai/BacktestingEngine.ts" ]; then
    echo -e "${GREEN}✓${NC} BacktestingEngine.ts exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} BacktestingEngine.ts missing"
    ((FAILED++))
fi

if [ -f "src/services/ai/RiskManagementModule.ts" ]; then
    echo -e "${GREEN}✓${NC} RiskManagementModule.ts exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} RiskManagementModule.ts missing"
    ((FAILED++))
fi

echo ""
echo "📦 Testing Components..."
echo "------------------------"
if [ -f "src/components/Navigation.tsx" ]; then
    echo -e "${GREEN}✓${NC} Navigation component exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Navigation component missing"
    ((FAILED++))
fi

if [ -f "src/components/ui/Logo.tsx" ]; then
    echo -e "${GREEN}✓${NC} Logo component exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Logo component missing"
    ((FAILED++))
fi

if [ -f "src/components/LoginMap.tsx" ]; then
    echo -e "${GREEN}✓${NC} LoginMap component exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} LoginMap component missing"
    ((FAILED++))
fi

echo ""
echo "=============================================="
echo "📊 Complete Test Results"
echo "=============================================="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

# Calculate success rate
if [ $((PASSED + FAILED)) -gt 0 ]; then
    success_rate=$(( (PASSED * 100) / (PASSED + FAILED) ))
    echo -e "${CYAN}Success Rate: ${success_rate}%${NC}"
    echo ""
fi

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "✨ Complete trading platform is fully operational!"
    echo ""
    echo "📍 Available Pages:"
    echo "   • http://localhost:3000 - Home"
    echo "   • http://localhost:3000/dashboard - Dashboard"
    echo "   • http://localhost:3000/quantum-pro - Quantum Pro AI"
    echo "   • http://localhost:3000/ai-trading - AI Trading Hub"
    echo "   • http://localhost:3000/backtesting - Backtest Strategies"
    echo "   • http://localhost:3000/risk-management - Risk Management"
    echo "   • http://localhost:3000/signals - Signal Monitor"
    echo "   • http://localhost:3000/market-analysis - Market Analysis"
    echo "   • http://localhost:3000/bot-management - Bot Management"
    echo "   • http://localhost:3000/crypto - Crypto Markets"
    echo "   • http://localhost:3000/stocks - Stock Markets"
    echo "   • http://localhost:3000/portfolio - Portfolio"
    echo "   • http://localhost:3000/watchlist - Watchlist"
    echo "   • http://localhost:3000/settings - Settings"
    echo "   • http://localhost:3000/login - Login"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above.${NC}"
    exit 1
fi