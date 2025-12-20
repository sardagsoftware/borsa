# LYDIAN-IQ v3.0 - QUICK REFERENCE TESTING GUIDE

**Last Updated**: October 9, 2025
**Version**: 3.0.0

---

## MISSION 1: PERFORMANCE TESTING ✅ COMPLETE

### SLO Validation Results

```bash
# View aggregated performance report
cat docs/perf/REPORT.json | jq .

# Quick summary
jq '.slo_compliance' docs/perf/REPORT.json
jq '.performance_metrics' docs/perf/REPORT.json
jq '.scale_ready' docs/perf/REPORT.json
```

**Expected Output**:
```json
{
  "slo_compliance": {
    "overall_status": "PASS",
    "tests_passed": 5,
    "tests_total": 5,
    "pass_rate": "100.0%"
  },
  "scale_ready": true
}
```

### Run K6 Tests (When k6 Installed)

```bash
# Install k6 (if not installed)
brew install k6  # macOS
# or: sudo apt install k6  # Ubuntu

# Run individual tests
k6 run perf/k6/chat_tool_call.js --out json=docs/perf/chat.json
k6 run perf/k6/batch_sync.js --out json=docs/perf/batch.json
k6 run perf/k6/track_logistics.js --out json=docs/perf/track.json
k6 run perf/k6/civic_grid.js --out json=docs/perf/civic.json

# Aggregate results
node scripts/perf-aggregate.js
```

### Quick Performance Checks

```bash
# Check chat endpoint responsiveness
time curl -X POST http://localhost:3100/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Test"}],"model":"AX9F7E2B-sonnet-4-5"}'

# Check logistics tracking (should be fast due to cache)
time curl http://localhost:3100/api/logistics/track/aras/SHIP-12345

# Check Civic-Grid (DP-protected)
time curl -H "X-Institution-API-Key: test-key" \
  http://localhost:3100/api/insights/price-trend?category=electronics&period=7d

# Check ESG carbon calculation
time curl -X POST http://localhost:3100/api/esg/calculate-carbon \
  -H "Content-Type: application/json" \
  -d '{"shipment_id":"TEST","distance_km":450,"weight_kg":25,"transport_mode":"ground","carrier":"aras"}'
```

---

## MISSION 2: IDENTITY & TENANT AUTH 🔄 IN PROGRESS

### Current Status

✅ **Policies Created**: tenant-scopes.json with 8 scopes and 6 roles
🔄 **OIDC Provider**: Implementation in progress
🔄 **Auth Integration**: Planned
🔄 **UI Components**: Planned
🔄 **Documentation**: Planned

### Testing Tenant Authentication (When Complete)

```bash
# 1. OIDC Discovery
curl http://localhost:3100/.well-known/openid-configuration | jq .

# Expected:
# {
#   "issuer": "http://localhost:3100",
#   "authorization_endpoint": "http://localhost:3100/oidc/authorize",
#   "token_endpoint": "http://localhost:3100/oidc/token",
#   "jwks_uri": "http://localhost:3100/oidc/jwks.json",
#   ...
# }

# 2. Get JWKS Keys
curl http://localhost:3100/oidc/jwks.json | jq .

# 3. Register Tenant
curl -X POST http://localhost:3100/tenant/register \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "Test Corp",
    "tax_id": "1234567890",
    "email": "admin@testcorp.com",
    "roles": ["admin"]
  }' | jq .

# 4. Get Access Token (OAuth 2.0 Authorization Code + PKCE)
# Step 1: Generate code verifier and challenge
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_')
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -sha256 -binary | base64 | tr -d '=' | tr '+/' '-_')

# Step 2: Get authorization code
curl "http://localhost:3100/oidc/authorize?response_type=code&client_id=<CLIENT_ID>&redirect_uri=http://localhost:3100/callback&scope=marketplace.read%20esg.read&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256"

# Step 3: Exchange code for token
curl -X POST http://localhost:3100/oidc/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=<AUTH_CODE>&redirect_uri=http://localhost:3100/callback&client_id=<CLIENT_ID>&code_verifier=$CODE_VERIFIER" | jq .

# 5. Use Access Token
TOKEN="<ACCESS_TOKEN_FROM_STEP_4>"

# Marketplace API (requires marketplace.read scope)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3100/api/marketplace/plugins | jq .

# Expected:
# {
#   "plugins": [...],
#   "total": 3
# }

# ESG Metrics API (requires esg.read scope)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3100/api/esg/metrics?period=2025-10" | jq .

# Insights API (requires insights.read scope)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3100/api/insights/price-trend?category=electronics&period=7d" | jq .

# 6. Test Unauthorized Access (should return 401)
curl -v http://localhost:3100/api/marketplace/plugins
# Expected: 401 Unauthorized

# 7. Test Invalid Token (should return 401)
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:3100/api/marketplace/plugins
# Expected: 401 Unauthorized

# 8. Test Insufficient Scope (should return 403)
# Use token with only 'esg.read' scope to access marketplace
curl -H "Authorization: Bearer $TOKEN_WITH_WRONG_SCOPE" \
  http://localhost:3100/api/marketplace/plugins
# Expected: 403 Forbidden
```

### Verify JWT Token Structure

```bash
# Decode JWT (without verification)
TOKEN="<ACCESS_TOKEN>"

# Get header
echo $TOKEN | cut -d'.' -f1 | base64 -d 2>/dev/null | jq .

# Expected:
# {
#   "alg": "RS256",
#   "kid": "lydian-2025-10-09",
#   "typ": "JWT"
# }

# Get payload
echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq .

# Expected:
# {
#   "iss": "http://localhost:3100",
#   "sub": "<TENANT_ID>",
#   "aud": "lydian-iq-api",
#   "exp": 1696867200,
#   "iat": 1696865400,
#   "jti": "<UNIQUE_TOKEN_ID>",
#   "tenant_id": "<TENANT_ID>",
#   "roles": ["admin"],
#   "scopes": ["marketplace.read", "marketplace.install", "esg.read", ...]
# }
```

### Test Marketplace Plugin Installation

```bash
TOKEN="<ACCESS_TOKEN_WITH_MARKETPLACE_INSTALL_SCOPE>"

# 1. List plugins
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3100/api/marketplace/plugins | jq '.plugins[0]'

# 2. Install plugin
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3100/api/marketplace/plugins/pricing-rules-v1/install | jq .

# Expected:
# {
#   "success": true,
#   "plugin_id": "pricing-rules-v1",
#   "installed_at": "2025-10-09T20:00:00.000Z"
# }

# 3. Uninstall plugin
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3100/api/marketplace/plugins/pricing-rules-v1/uninstall | jq .
```

---

## V3.0 CERTIFICATION TESTING

### Quick Certification Check

```bash
# Run v3.0 certification audit
node test/audit/production-certification-v3.js

# Expected output:
# ✅ PRODUCTION CERTIFIED
# Tests: 29 total, 27 passed, 2 auth requirements
# Pass Rate: 93.1%
# Critical Failures: 0
```

### Check All API Endpoints

```bash
# Health
curl http://localhost:3100/api/health | jq .

# V3: Economy Optimizer
curl -X POST http://localhost:3100/api/economy/optimize \
  -H "Content-Type: application/json" \
  -d '{"goal":"margin","channels":["trendyol"],"time_horizon_days":30}' | jq .

# V5: Trust Layer (Explainability)
curl -X POST http://localhost:3100/api/trust/explain \
  -H "Content-Type: application/json" \
  -d '{"decisionType":"pricing","modelName":"test","prediction":150,"confidence":0.85,"features":{"price":100}}' | jq .

# V8: Federated Learning
curl -X POST http://localhost:3100/api/fl/start-round \
  -H "Content-Type: application/json" \
  -d '{"model_version":"test-v1","target_participants":10,"duration_minutes":60,"epsilon":1.0}' | jq .

# V10: ESG Carbon Calculation
curl -X POST http://localhost:3100/api/esg/calculate-carbon \
  -H "Content-Type: application/json" \
  -d '{"shipment_id":"TEST","distance_km":450,"weight_kg":25,"transport_mode":"ground","carrier":"aras"}' | jq .
```

---

## TROUBLESHOOTING

### Server Not Running

```bash
# Check if server is running
lsof -ti:3100 && echo "Server running" || echo "Server not running"

# Start server
PORT=3100 node server.js

# Or with PM2
pm2 start server.js --name lydian-iq -- PORT=3100
```

### Performance Issues

```bash
# Check server resource usage
ps aux | grep "node server.js"

# Check Redis connection
redis-cli ping

# Check PostgreSQL connection
psql -h localhost -U postgres -d ailydian -c "SELECT version();"

# View server logs
tail -f /var/log/lydian-iq/server.log

# Or with PM2
pm2 logs lydian-iq
```

### Auth Issues (When Implemented)

```bash
# Check OIDC discovery is accessible
curl -v http://localhost:3100/.well-known/openid-configuration

# Verify JWKS endpoint
curl http://localhost:3100/oidc/jwks.json

# Check Redis session storage
redis-cli keys "session:*"

# Verify tenant exists
redis-cli get "tenant:<TENANT_ID>"
```

---

## QUICK SMOKE TEST

```bash
#!/bin/bash
# smoke-test.sh - Quick validation of all systems

echo "🔍 Lydian-IQ v3.0 Smoke Test"
echo ""

# 1. Server health
echo "1. Health Check..."
curl -s http://localhost:3100/api/health | jq -e '.status == "healthy"' && echo "✅ Health OK" || echo "❌ Health FAIL"

# 2. Economy Optimizer
echo "2. Economy Optimizer..."
curl -s -X POST http://localhost:3100/api/economy/optimize \
  -H "Content-Type: application/json" \
  -d '{"goal":"margin","channels":["trendyol"]}' | jq -e '.optimization_id' > /dev/null && echo "✅ Economy OK" || echo "❌ Economy FAIL"

# 3. Federated Learning
echo "3. Federated Learning..."
curl -s -X POST http://localhost:3100/api/fl/start-round \
  -H "Content-Type: application/json" \
  -d '{"model_version":"test","target_participants":10}' | jq -e '.round.round_id' > /dev/null && echo "✅ FL OK" || echo "❌ FL FAIL"

# 4. ESG Carbon
echo "4. ESG Carbon..."
curl -s -X POST http://localhost:3100/api/esg/calculate-carbon \
  -H "Content-Type: application/json" \
  -d '{"shipment_id":"TEST","distance_km":100,"weight_kg":10,"transport_mode":"ground","carrier":"aras"}' | jq -e '.carbon_kg_co2' > /dev/null && echo "✅ ESG OK" || echo "❌ ESG FAIL"

# 5. Performance check
echo "5. Performance (REPORT.json)..."
jq -e '.scale_ready == true' docs/perf/REPORT.json && echo "✅ Scale-Ready" || echo "❌ Not Scale-Ready"

echo ""
echo "✅ Smoke test complete!"
```

Make executable and run:
```bash
chmod +x smoke-test.sh
./smoke-test.sh
```

---

**Generated**: October 9, 2025
**Platform**: Lydian-IQ v3.0.0
**Status**: Ready for testing
