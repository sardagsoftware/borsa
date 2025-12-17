#!/bin/bash

# ===================================================================
# 🧪 AILYDIAN RATE LIMIT TESTER
# ===================================================================
#
# Tests rate limiting on ngrok-protected API endpoints
#
# Usage:
#   ./scripts/test-rate-limit.sh https://ailydian-api.ngrok.app
#   ./scripts/test-rate-limit.sh http://localhost:3000
#
# Test Scenarios:
#   1. General API limit (100 req/min)
#   2. Groq API limit (50 req/min)
#   3. Heavy operations limit (30 req/min)
#   4. Rate limit headers validation
#
# ===================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="${1:-http://localhost:3000}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🧪 AILYDIAN RATE LIMIT TESTER                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Testing against: ${BLUE}$BASE_URL${NC}"
echo ""

# Test 1: General API endpoint (100 req/min)
test_general_api() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 Test 1: General API Limit (100 req/min)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    local success=0
    local rate_limited=0
    local endpoint="/api/health"

    echo -e "${BLUE}Sending 105 requests to $endpoint...${NC}"

    for i in {1..105}; do
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>/dev/null || echo "000")
        http_code=$(echo "$response" | tail -n1)

        if [ "$http_code" = "200" ]; then
            ((success++))
        elif [ "$http_code" = "429" ]; then
            ((rate_limited++))
            if [ $rate_limited -eq 1 ]; then
                echo -e "${RED}❌ Rate limit hit at request #$i${NC}"
                echo -e "${YELLOW}Response body:${NC}"
                echo "$response" | head -n -1 | jq '.' 2>/dev/null || echo "$response" | head -n -1
            fi
        fi

        # Progress indicator
        if [ $((i % 10)) -eq 0 ]; then
            echo -ne "${BLUE}Progress: $i/105${NC}\r"
        fi
    done

    echo ""
    echo -e "${GREEN}✅ Results:${NC}"
    echo -e "   Successful:    ${GREEN}$success${NC}"
    echo -e "   Rate Limited:  ${RED}$rate_limited${NC}"
    echo ""

    if [ $success -ge 95 ] && [ $success -le 105 ] && [ $rate_limited -gt 0 ]; then
        echo -e "${GREEN}✅ Test PASSED: Rate limiting working correctly${NC}"
    else
        echo -e "${RED}❌ Test FAILED: Unexpected rate limit behavior${NC}"
    fi
    echo ""
}

# Test 2: Groq API endpoint (50 req/min)
test_groq_api() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 Test 2: Groq API Limit (50 req/min)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    local success=0
    local rate_limited=0
    local endpoint="/api/lydian-iq/test-groq"

    echo -e "${BLUE}Sending 55 requests to $endpoint...${NC}"

    for i in {1..55}; do
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d '{"test": true}' \
            "$BASE_URL$endpoint" 2>/dev/null || echo "000")
        http_code=$(echo "$response" | tail -n1)

        if [ "$http_code" = "200" ]; then
            ((success++))
        elif [ "$http_code" = "429" ]; then
            ((rate_limited++))
            if [ $rate_limited -eq 1 ]; then
                echo -e "${RED}❌ Rate limit hit at request #$i${NC}"
            fi
        fi

        if [ $((i % 5)) -eq 0 ]; then
            echo -ne "${BLUE}Progress: $i/55${NC}\r"
        fi

        # Small delay to avoid hammering the API
        sleep 0.1
    done

    echo ""
    echo -e "${GREEN}✅ Results:${NC}"
    echo -e "   Successful:    ${GREEN}$success${NC}"
    echo -e "   Rate Limited:  ${RED}$rate_limited${NC}"
    echo ""

    if [ $success -ge 45 ] && [ $success -le 55 ] && [ $rate_limited -gt 0 ]; then
        echo -e "${GREEN}✅ Test PASSED: Groq rate limiting working correctly${NC}"
    else
        echo -e "${RED}❌ Test FAILED: Unexpected Groq rate limit behavior${NC}"
    fi
    echo ""
}

# Test 3: Rate limit headers
test_rate_limit_headers() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 Test 3: Rate Limit Headers${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    local endpoint="/api/health"
    echo -e "${BLUE}Fetching headers from $endpoint...${NC}"
    echo ""

    headers=$(curl -s -I "$BASE_URL$endpoint" 2>/dev/null)

    echo -e "${GREEN}Response Headers:${NC}"
    echo "$headers" | grep -i "ratelimit\|retry-after\|x-powered-by" || echo -e "${YELLOW}No rate limit headers found${NC}"
    echo ""

    if echo "$headers" | grep -qi "x-ratelimit"; then
        echo -e "${GREEN}✅ Test PASSED: Rate limit headers present${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: No rate limit headers (may not be using ngrok)${NC}"
    fi
    echo ""
}

# Test 4: Burst attack simulation
test_burst_attack() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 Test 4: Burst Attack Simulation${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    local endpoint="/api/health"
    echo -e "${BLUE}Sending 20 rapid requests (no delay)...${NC}"

    local start_time=$(date +%s)
    local success=0

    for i in {1..20}; do
        http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
        if [ "$http_code" = "200" ]; then
            ((success++))
        fi
    done

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    echo -e "${GREEN}✅ Results:${NC}"
    echo -e "   Successful:  ${GREEN}$success/20${NC}"
    echo -e "   Duration:    ${BLUE}${duration}s${NC}"
    echo -e "   Rate:        ${BLUE}$((20 / duration)) req/s${NC}"
    echo ""
}

# Run all tests
echo -e "${YELLOW}Starting comprehensive rate limit tests...${NC}"
echo ""

test_general_api
sleep 2

test_groq_api
sleep 2

test_rate_limit_headers
sleep 1

test_burst_attack

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ ALL TESTS COMPLETED                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
