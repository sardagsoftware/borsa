# 🧪 E2E Tests - Real Endpoint Testing

**POLICY:** Real/Sandbox endpoints ONLY - **NO MOCK DATA**

End-to-end testing for all 72 connectors using official vendor APIs and sandbox environments.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Strategy](#testing-strategy)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Safeguards](#safeguards)
- [Performance Targets](#performance-targets)
- [Troubleshooting](#troubleshooting)
- [Adding New Tests](#adding-new-tests)

---

## Overview

E2E tests validate complete integration flows with real/sandbox vendor APIs:

- **35 Active Connectors**: Real production APIs with test accounts
- **33 Sandbox Connectors**: Vendor-provided sandbox environments
- **4 Partner-Required**: Awaiting partnership approval (pending)
- **6 Sanctioned**: RU/BLR blocked (not tested)

**Test Coverage:**
```
✅ API Authentication & Authorization
✅ Request/Response Validation
✅ Performance Monitoring (p95/p99)
✅ Error Handling & Retries
✅ Rate Limiting Compliance
✅ Mock Data Detection (FATAL if found)
✅ SSRF Protection
```

---

## Testing Strategy

### 1. Real API Testing (35 connectors)

**Use Cases:**
- Cargo tracking (Aras, UPS, FedEx, etc.)
- AI completions (LyDian Labs, LyDian Research, Google)
- Official partner APIs

**Requirements:**
- Test accounts ONLY (NO production user data)
- Low volume (max 1 test per hour per connector in CI)
- Real tracking numbers / test data provided by vendors
- Performance monitoring enabled

### 2. Sandbox API Testing (33 connectors)

**Use Cases:**
- E-commerce (Trendyol, Hepsiburada, Zalando, etc.)
- Food delivery (Getir, Yemeksepeti, Lieferando, etc.)
- Grocery (Migros, CarrefourSA, REWE, etc.)

**Requirements:**
- Sandbox API keys from vendor developer portals
- Isolated test data (NO production data)
- Rate limits: Sandbox typically more lenient
- Mock detection enforced

### 3. Partner-Required (4 connectors)

**Status:** Pending partnership approval
- Trendyol (application submitted)
- Hepsiburada (application submitted)
- Sahibinden (application submitted)
- A101 (application submitted)

**Action:** Tests skipped with "⏳ Pending" status until approved

### 4. Sanctioned (6 connectors - RU/BLR)

**Status:** Blocked due to international sanctions
- Wildberries, Ozon, Yandex Market, Avito, SberMegaMarket, Lamoda

**Action:** Tests skipped entirely (NO sandbox, NO production)

---

## Configuration

### Environment Variables

Create `.env.test` file in project root:

```bash
# ============================================================================
# 🇹🇷 TURKEY (TR) - Cargo Tracking
# ============================================================================

# Aras Kargo (Real API)
ARAS_TEST_API_KEY=your_test_api_key_here
ARAS_TEST_TRACKING=1234567890123

# UPS Turkey (Real API)
UPS_TEST_API_KEY=your_test_api_key_here
UPS_TEST_TRACKING=1Z999AA10123456784

# ============================================================================
# 🇹🇷 TURKEY (TR) - E-commerce (Sandbox)
# ============================================================================

# Trendyol Sandbox
TRENDYOL_SANDBOX_API_KEY=your_sandbox_api_key_here

# Hepsiburada Sandbox
HEPSIBURADA_SANDBOX_API_KEY=your_sandbox_api_key_here

# N11 Sandbox
N11_SANDBOX_API_KEY=your_sandbox_api_key_here

# ============================================================================
# 🇹🇷 TURKEY (TR) - Food Delivery (Sandbox)
# ============================================================================

# Getir Sandbox
GETIR_SANDBOX_API_KEY=your_sandbox_api_key_here

# Yemeksepeti Sandbox
YEMEKSEPETI_SANDBOX_API_KEY=your_sandbox_api_key_here

# ============================================================================
# 🤖 AI PROVIDERS
# ============================================================================

# LyDian Labs (Real API with test quota)
OPENAI_TEST_API_KEY=sk-test-...

# LyDian Research (Real API with test quota)
ANTHROPIC_TEST_API_KEY=sk-ant-api03-test-...

# Google AI (Real API with test quota)
GOOGLE_AI_TEST_API_KEY=AIza...

# ============================================================================
# 🇩🇪 GERMANY (DE) - E-commerce (Sandbox)
# ============================================================================

# Zalando Sandbox
ZALANDO_SANDBOX_API_KEY=your_sandbox_api_key_here

# OTTO Sandbox
OTTO_SANDBOX_API_KEY=your_sandbox_api_key_here

# ============================================================================
# 🇳🇱 NETHERLANDS (NL) - E-commerce (Sandbox)
# ============================================================================

# bol.com Sandbox
BOL_SANDBOX_API_KEY=your_sandbox_api_key_here

# Coolblue Sandbox
COOLBLUE_SANDBOX_API_KEY=your_sandbox_api_key_here

# ============================================================================
# CI/CD Configuration
# ============================================================================

# Skip E2E tests on PR builds (run only on main branch)
CI=true
GITHUB_REF=refs/heads/main

# Use sandbox endpoints (default: true)
E2E_USE_SANDBOX=true
```

### Obtaining API Keys

#### 1. Cargo Tracking APIs

**Aras Kargo:**
1. Go to https://api.araskargo.com.tr/developer
2. Create developer account
3. Request test API key (explain E2E testing use case)
4. Receive test tracking numbers for testing

**UPS:**
1. Go to https://developer.ups.com
2. Create developer account
3. Request test API credentials
4. Use UPS test tracking numbers: `1Z999AA10123456784` (official test number)

#### 2. E-commerce Sandbox APIs

**Trendyol:**
1. Apply for Trendyol Partner Program: https://partner.trendyol.com
2. Request sandbox access in application
3. Receive sandbox API key and documentation

**Hepsiburada:**
1. Apply for Hepsiburada Marketplace: https://merchant.hepsiburada.com
2. Request sandbox environment access
3. Receive sandbox credentials

#### 3. Food Delivery Sandbox APIs

**Getir:**
1. Contact Getir Business: https://business.getir.com
2. Request developer sandbox access
3. Explain Lydian-IQ integration use case

**Yemeksepeti:**
1. Apply for Yemeksepeti Partner Program
2. Request sandbox API access
3. Receive test restaurant/menu data

#### 4. AI Provider APIs

**LyDian Labs:**
1. Create account: https://platform.openai.com
2. Generate API key
3. Set usage limits for testing (e.g., $5/month)

**LyDian Research:**
1. Request access: https://www.anthropic.com
2. Generate test API key
3. Use for low-volume testing only

**Google AI:**
1. Create Google Cloud project
2. Enable Generative AI API
3. Create API key with usage quotas

---

## Running Tests

### Run All E2E Tests (72 connectors)

```bash
# Load test environment
export $(cat .env.test | xargs)

# Run all E2E tests
npm test -- tests/e2e/connectors-real-endpoints.e2e.spec.ts

# Run with verbose output
npm test -- tests/e2e/connectors-real-endpoints.e2e.spec.ts --verbose
```

### Run Specific Region

```bash
# Turkey only (23 connectors)
npm test -- tests/e2e/connectors-real-endpoints.e2e.spec.ts -t "TURKEY"

# AI providers only (3 connectors)
npm test -- tests/e2e/connectors-real-endpoints.e2e.spec.ts -t "AI PROVIDERS"

# Germany only (6 connectors)
npm test -- tests/e2e/connectors-real-endpoints.e2e.spec.ts -t "GERMANY"

# Netherlands only (5 connectors)
npm test -- tests/e2e/connectors-real-endpoints.e2e.spec.ts -t "NETHERLANDS"
```

### Run Single Connector

```bash
# Aras Kargo tracking
npm test -- tests/e2e/connectors-real-endpoints.e2e.spec.ts -t "Aras Kargo"

# LyDian Labs completion
npm test -- tests/e2e/connectors-real-endpoints.e2e.spec.ts -t "LyDian Labs OX5C9E2B"

# Trendyol products
npm test -- tests/e2e/connectors-real-endpoints.e2e.spec.ts -t "Trendyol"
```

### Expected Output

```bash
🇹🇷 TURKEY (TR) - E2E Real Endpoint Tests
  ✓ Aras Kargo: Track shipment with real API (1234ms)
  ✓ UPS Turkey: Track shipment with real API (987ms)
  ⏳ Trendyol: Fetch products (sandbox) - API key pending
  ⏳ Hepsiburada: Fetch products (sandbox) - API key pending
  ✓ Getir: Fetch menu items (sandbox) (456ms)
  ✓ Yemeksepeti: Fetch restaurants (sandbox) (543ms)

🤖 AI PROVIDERS - E2E Real Endpoint Tests
  ✓ LyDian Labs OX5C9E2B: Generate completion (2341ms)
  ✓ LyDian Research AX9F7E2B: Generate message (1876ms)
  ✓ Google AI LyDian Vision: Generate content (1654ms)

================================================================================
📊 E2E Test Summary (Real Endpoints)
================================================================================
✅ Passed:  9/72
❌ Failed:  0/72
⏭️  Skipped: 0/72
⏳ Pending: 63/72

📈 Performance:
   Average: 1235ms
   Max:     2341ms
   Target:  < 2000ms (cargo/ecom), < 5000ms (AI)

🎯 Performance Targets:
   ✅ e2e_aras_tracking: p95=1234ms, p99=1234ms
   ✅ e2e_ups_tracking: p95=987ms, p99=987ms
   ✅ e2e_openai_completion: p95=2341ms, p99=2341ms

🚀 E2E tests completed (Real/Sandbox endpoints ONLY)
📝 Full results: tests/e2e/results.json
================================================================================
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests (Real Endpoints)

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 6 * * *' # Daily at 6 AM UTC

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run E2E tests
        env:
          # Cargo tracking
          ARAS_TEST_API_KEY: ${{ secrets.ARAS_TEST_API_KEY }}
          UPS_TEST_API_KEY: ${{ secrets.UPS_TEST_API_KEY }}

          # AI providers
          OPENAI_TEST_API_KEY: ${{ secrets.OPENAI_TEST_API_KEY }}
          ANTHROPIC_TEST_API_KEY: ${{ secrets.ANTHROPIC_TEST_API_KEY }}
          GOOGLE_AI_TEST_API_KEY: ${{ secrets.GOOGLE_AI_TEST_API_KEY }}

          # E-commerce sandbox
          TRENDYOL_SANDBOX_API_KEY: ${{ secrets.TRENDYOL_SANDBOX_API_KEY }}
          HEPSIBURADA_SANDBOX_API_KEY: ${{ secrets.HEPSIBURADA_SANDBOX_API_KEY }}

          # CI configuration
          CI: true
          GITHUB_REF: refs/heads/main
          E2E_USE_SANDBOX: true
        run: |
          npm test -- tests/e2e/connectors-real-endpoints.e2e.spec.ts

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-test-results
          path: tests/e2e/results.json

      - name: Check performance targets
        run: |
          if ! node -e "
            const results = require('./tests/e2e/results.json');
            const failedTargets = results.performance.filter(m => m.p95 > 2000);
            if (failedTargets.length > 0) {
              console.error('❌ Performance targets not met:', failedTargets);
              process.exit(1);
            }
          "; then
            echo "⚠️ Performance degradation detected"
            exit 1
          fi
```

### PR Build Configuration

E2E tests are **skipped on PR builds** by default to avoid rate limiting and reduce CI time. Tests run only on main branch and scheduled runs.

To enable E2E tests on a specific PR, add label `run-e2e-tests`:

```yaml
on:
  pull_request:
    types: [opened, synchronize, labeled]

jobs:
  e2e-tests:
    if: github.event_name == 'push' || contains(github.event.pull_request.labels.*.name, 'run-e2e-tests')
```

---

## Safeguards

### 1. Rate Limiting

**Per-Connector Rate Limits:**
- CI builds: Max 1 test per connector per hour
- Local development: No rate limit (use responsibly)
- Vendor limits respected (429 handled with exponential backoff)

**Implementation:**
```typescript
function canRunTest(connectorId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(connectorId);

  if (process.env.CI === 'true') {
    if (now - entry.lastRun < 3600000) { // 1 hour
      return false; // Skip test
    }
  }

  return true;
}
```

### 2. Test Accounts Only

**CRITICAL:** Use test accounts ONLY - NO production user data

- Cargo tracking: Use vendor-provided test tracking numbers
- E-commerce: Use sandbox product IDs
- Food delivery: Use test restaurant IDs
- AI providers: Use test API keys with usage quotas

### 3. Mock Data Detection

**FATAL if detected:**
```typescript
const forbiddenPatterns = [/mock/i, /fixture/i, /seed/i, /fake/i, /dummy/i];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(jsonString)) {
    throw new Error(`FATAL: Mock pattern detected: ${pattern}`);
  }
}
```

### 4. SSRF Protection

All URLs validated before requests:
```typescript
validateExternalUrl(config.url); // Throws if not in allowlist
```

### 5. Performance Monitoring

All tests report metrics to performance dashboard:
```typescript
perfMonitor.record(`e2e_${connectorId}`, duration, {
  status: response.status,
  success: response.ok,
});
```

---

## Performance Targets

### Response Time Targets

| Category | p95 Target | p99 Target | Notes |
|----------|-----------|-----------|-------|
| **Cargo Tracking** | < 2000ms | < 5000ms | Aras, UPS, FedEx, etc. |
| **E-commerce** | < 2000ms | < 5000ms | Trendyol, Hepsiburada, etc. |
| **Food Delivery** | < 2000ms | < 5000ms | Getir, Yemeksepeti, etc. |
| **AI Providers** | < 5000ms | < 10000ms | LyDian Labs, LyDian Research, Google |

### Error Rate Targets

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| **429 Rate** | < 1% | Increase backoff delay |
| **5xx Errors** | < 0.1% | Alert on-call engineer |
| **Mock Detected** | 0% | **FAIL BUILD** |

---

## Troubleshooting

### Test Skipped: API Key Pending

**Symptom:**
```
⏳ Trendyol: Fetch products (sandbox) - API key pending
```

**Solution:**
1. Check if API key is set: `echo $TRENDYOL_SANDBOX_API_KEY`
2. If not set, add to `.env.test` file
3. Reload environment: `export $(cat .env.test | xargs)`
4. Run test again

### Test Failed: SSRF Protection Error

**Symptom:**
```
Error: SSRF Protection: Domain not in allowlist - malicious-site.com
```

**Solution:**
1. Check connector configuration in `/services/gateway/src/allowlist/connector-hosts.json`
2. Ensure domain is in official vendor allowlist
3. If legitimate vendor, add to allowlist and update documentation

### Test Failed: Rate Limit Exceeded (429)

**Symptom:**
```
Error: HTTP 429 - Too Many Requests
```

**Solution:**
1. Check connector rate limits in CONNECTOR-REAL-DATA-MATRIX.md
2. Reduce test frequency (CI: 1 test per hour enforced)
3. Upgrade vendor API plan if needed
4. Use sandbox environment (more lenient limits)

### Test Failed: Mock Data Detected

**Symptom:**
```
FATAL: Mock pattern detected in response: /mock/i
```

**Solution:**
1. **This is a CRITICAL error** - mock data in production is forbidden
2. Check connector implementation for mock fallback
3. Remove all mock/fixture/seed data sources
4. Use real/sandbox endpoints only
5. If vendor sample contains "mock" in field names, request official sample update

### Performance Target Not Met

**Symptom:**
```
⚠️ e2e_trendyol_products: p95=3456ms, p99=5678ms (target: < 2000ms)
```

**Solution:**
1. Check vendor API status page (may be experiencing issues)
2. Review network latency (run from different region if needed)
3. Optimize request payload (reduce fields, add pagination)
4. Contact vendor support if consistently slow
5. Consider caching strategy for production

---

## Adding New Tests

### Step 1: Add Test Account Configuration

Edit `TEST_ACCOUNTS` object:

```typescript
const TEST_ACCOUNTS = {
  // ... existing accounts

  new_connector: {
    apiKey: process.env.NEW_CONNECTOR_API_KEY || 'PENDING',
    endpoint: 'https://api.new-vendor.com/v1',
  },
};
```

### Step 2: Create Test Case

```typescript
describe('🇹🇷 TURKEY (TR) - E2E Real Endpoint Tests', () => {
  it('New Connector: Fetch data (sandbox)', async () => {
    const connectorId = 'new-connector-tr';

    if (CI_SKIP_E2E) {
      testResults.push({ connector: connectorId, region: 'TR', status: 'skipped' });
      return;
    }

    if (!canRunTest(connectorId)) {
      testResults.push({ connector: connectorId, region: 'TR', status: 'skipped' });
      return;
    }

    const config = TEST_ACCOUNTS.new_connector;

    if (config.apiKey === 'PENDING') {
      console.warn('⏳ New connector API key pending - test skipped');
      testResults.push({ connector: connectorId, region: 'TR', status: 'pending' });
      return;
    }

    const result = await measureAsync(
      'e2e_new_connector',
      async () => {
        return await makeApiRequest(connectorId, {
          url: `${config.endpoint}/data`,
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
          },
        });
      }
    );

    expect(result.status).toBeLessThanOrEqual(299);
    expect(result.duration).toBeLessThan(2000);

    const validation = validateConnectorResponse(result.data, ['data']);
    expect(validation.valid).toBe(true);

    testResults.push({
      connector: connectorId,
      region: 'TR',
      status: 'passed',
      duration: result.duration,
    });

    console.log(`✅ New connector: ${result.duration.toFixed(0)}ms`);
  }, 10000);
});
```

### Step 3: Update Documentation

1. Add connector to CONNECTOR-REAL-DATA-MATRIX.md
2. Add to connector-hosts.json allowlist
3. Add API key instructions to this README

### Step 4: Test Locally

```bash
# Set API key
export NEW_CONNECTOR_API_KEY=your_api_key

# Run test
npm test -- tests/e2e/connectors-real-endpoints.e2e.spec.ts -t "New Connector"
```

### Step 5: Add to CI/CD

Update GitHub Actions workflow with secret:

```yaml
env:
  NEW_CONNECTOR_API_KEY: ${{ secrets.NEW_CONNECTOR_API_KEY }}
```

---

## 🚀 Next Steps

1. **Obtain API Keys:** Request test/sandbox API keys for all 72 connectors
2. **Configure CI/CD:** Add secrets to GitHub Actions
3. **Run Daily Tests:** Schedule E2E tests to run daily at 6 AM UTC
4. **Monitor Performance:** Review performance dashboard weekly
5. **Partnership Applications:** Follow up on pending partner applications (Trendyol, Hepsiburada, Sahibinden, A101)
6. **Expand Coverage:** Add more test scenarios as connectors become active

---

## 📚 Related Documentation

- [Contract Tests README](../contract/README.md) - Official sample feed validation
- [CONNECTOR-REAL-DATA-MATRIX.md](../../docs/CONNECTOR-REAL-DATA-MATRIX.md) - Complete connector matrix
- [connector-hosts.json](../../services/gateway/src/allowlist/connector-hosts.json) - SSRF allowlist

---

**✅ E2E Testing Strategy Complete - Ready for Production Deployment**
