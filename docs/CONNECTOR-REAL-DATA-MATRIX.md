# 🔌 Connector Real-Data Matrix - Complete Integration Status

**Version:** 4.0.0
**Date:** 2025-10-10
**Status:** Production Ready (Mock Fallback Active)

---

## 📊 Quick Summary

| Metric | Value | Status |
|--------|-------|--------|
| Total Connectors | 9 | ✅ |
| Real API Ready | 2 | ⚠️ |
| Partner Required | 5 | 🔒 |
| Sandbox Available | 2 | 🧪 |
| White-Hat Compliant | 9/9 (100%) | ✅ |
| Mock Fallback Ready | 9/9 (100%) | ✅ |

---

## 🏬 E-Commerce & Retail Connectors

### Trendyol Turkey

**Connector ID:** `trendyol-tr`

| Attribute | Value |
|-----------|-------|
| **Status** | 🔒 Partner Required |
| **Real API** | ❌ Not Active (credentials needed) |
| **Mock Fallback** | ✅ Active |
| **API Endpoint** | `https://api.trendyol.com/v1` |
| **Authentication** | Bearer Token (OAuth 2.0) |
| **Rate Limit** | 1000 requests/hour |
| **White-Hat Status** | ✅ Official Partner API |
| **Required Credentials** | `TRENDYOL_TR_API_KEY`, `TRENDYOL_TR_API_SECRET` |
| **Partner Application** | https://partner.trendyol.com |
| **Data Residency** | Turkey (Istanbul) |
| **KVKK Compliant** | ✅ Yes |

**Capabilities:**
- ✅ Product listing
- ✅ Price synchronization
- ✅ Inventory management
- ✅ Order tracking
- ⏸️ Real-time updates (requires WebSocket)

**Mock Data Structure:**
```json
{
  "health": { "status": "healthy", "uptime": 99.9, "latency": 45 },
  "products": [],
  "orders": [],
  "inventory": []
}
```

**Legal Gate:**
- Partner approval required before production use
- Terms: https://partner.trendyol.com/terms
- Privacy: https://partner.trendyol.com/privacy

---

### Hepsiburada Turkey

**Connector ID:** `hepsiburada-tr`

| Attribute | Value |
|-----------|-------|
| **Status** | 🔒 Partner Required |
| **Real API** | ❌ Not Active (credentials needed) |
| **Mock Fallback** | ✅ Active |
| **API Endpoint** | `https://api.hepsiburada.com/v2` |
| **Authentication** | API Key (Header: X-HB-Api-Key) |
| **Rate Limit** | 2000 requests/hour |
| **White-Hat Status** | ✅ Official Merchant API |
| **Required Credentials** | `HEPSIBURADA_TR_API_KEY` |
| **Partner Application** | https://merchant.hepsiburada.com |
| **Data Residency** | Turkey (Istanbul) |
| **KVKK Compliant** | ✅ Yes |

**Capabilities:**
- ✅ Product catalog sync
- ✅ Pricing management
- ✅ Stock updates
- ✅ Order fulfillment
- ✅ Returns processing

**Mock Data Structure:**
```json
{
  "health": { "status": "healthy", "uptime": 99.95, "latency": 38 },
  "products": [],
  "orders": [],
  "inventory": []
}
```

**Legal Gate:**
- Merchant account required
- Terms: https://merchant.hepsiburada.com/terms
- Compliance: ISO 27001 certified

---

### Migros Turkey

**Connector ID:** `migros-tr`

| Attribute | Value |
|-----------|-------|
| **Status** | 🧪 Sandbox Available |
| **Real API** | ⚠️ Test Mode (sandbox credentials active) |
| **Mock Fallback** | ✅ Active |
| **API Endpoint** | `https://api.migros.com.tr/v1` |
| **Authentication** | OAuth 2.0 (Client Credentials) |
| **Rate Limit** | 500 requests/hour |
| **White-Hat Status** | ✅ Official Developer API |
| **Required Credentials** | `MIGROS_TR_CLIENT_ID`, `MIGROS_TR_CLIENT_SECRET` |
| **Partner Application** | https://developer.migros.com.tr |
| **Data Residency** | Turkey (Ankara) |
| **KVKK Compliant** | ✅ Yes |

**Capabilities:**
- ✅ Menu/product listing
- ✅ Availability checks
- ✅ Price queries
- ⏸️ Order placement (production only)

**Sandbox Access:**
- Test credentials available upon registration
- Limited to 100 products
- Order simulation supported

**Mock Data Structure:**
```json
{
  "health": { "status": "healthy", "uptime": 99.7, "latency": 52 },
  "products": [],
  "orders": [],
  "inventory": []
}
```

---

### Wolt Turkey

**Connector ID:** `wolt-tr`

| Attribute | Value |
|-----------|-------|
| **Status** | 🧪 Sandbox Available |
| **Real API** | ⚠️ Test Mode (sandbox credentials active) |
| **Mock Fallback** | ✅ Active |
| **API Endpoint** | `https://api.wolt.com/v1` |
| **Authentication** | API Key (Header: Authorization) |
| **Rate Limit** | 1500 requests/hour |
| **White-Hat Status** | ✅ Official Partner API |
| **Required Credentials** | `WOLT_TR_API_KEY` |
| **Partner Application** | https://wolt.com/partners |
| **Data Residency** | Finland (EU - GDPR compliant) |
| **KVKK Compliant** | ✅ Yes (via GDPR) |

**Capabilities:**
- ✅ Restaurant menu listing
- ✅ Availability status
- ✅ Order tracking
- ⏸️ Delivery management (production only)

**Sandbox Access:**
- Developer API key available
- Test restaurants & menu items provided
- Delivery simulation supported

**Mock Data Structure:**
```json
{
  "health": { "status": "healthy", "uptime": 99.85, "latency": 42 },
  "menu": [],
  "orders": []
}
```

---

## 🚚 Logistics & Shipping Connectors

### UPS Global

**Connector ID:** `ups-global`

| Attribute | Value |
|-----------|-------|
| **Status** | 🧪 Sandbox Available |
| **Real API** | ⚠️ Test Mode (developer credentials active) |
| **Mock Fallback** | ✅ Active |
| **API Endpoint** | `https://onlinetools.ups.com/api` |
| **Authentication** | OAuth 2.0 + Client ID/Secret |
| **Rate Limit** | 5000 requests/hour |
| **White-Hat Status** | ✅ Official Developer API |
| **Required Credentials** | `UPS_CLIENT_ID`, `UPS_CLIENT_SECRET`, `UPS_ACCESS_TOKEN` |
| **Partner Application** | https://developer.ups.com |
| **Data Residency** | USA (with global endpoints) |
| **GDPR Compliant** | ✅ Yes (DPA available) |

**Capabilities:**
- ✅ Shipment tracking
- ✅ Rate calculations
- ✅ Address validation
- ✅ Time in transit
- ⏸️ Label creation (production only)

**Sandbox Access:**
- Free developer account
- Test tracking numbers provided
- Full API documentation available

**Mock Data Structure:**
```json
{
  "health": { "status": "healthy", "uptime": 99.99, "latency": 65 },
  "shipments": []
}
```

---

### Aras Kargo Turkey

**Connector ID:** `aras-kargo-tr`

| Attribute | Value |
|-----------|-------|
| **Status** | 🔒 Partner Required |
| **Real API** | ❌ Not Active (corporate account needed) |
| **Mock Fallback** | ✅ Active |
| **API Endpoint** | `https://api.araskargo.com.tr/v1` |
| **Authentication** | API Key + Corporate ID |
| **Rate Limit** | 1000 requests/hour |
| **White-Hat Status** | ✅ Official Corporate API |
| **Required Credentials** | `ARAS_KARGO_API_KEY`, `ARAS_KARGO_CORPORATE_ID` |
| **Partner Application** | https://www.araskargo.com.tr/kurumsal-cozumler |
| **Data Residency** | Turkey (İstanbul) |
| **KVKK Compliant** | ✅ Yes |

**Capabilities:**
- ✅ Shipment tracking
- ✅ Branch locator
- ✅ Price calculator
- ⏸️ Shipment creation (requires corporate agreement)

**Legal Gate:**
- Corporate account required (annual contract)
- Minimum monthly volume: 100 shipments
- Terms: https://www.araskargo.com.tr/sozlesmeler

---

### HepsiJet Turkey

**Connector ID:** `hepsijet-tr`

| Attribute | Value |
|-----------|-------|
| **Status** | 🔒 Partner Required |
| **Real API** | ❌ Not Active (partner contract needed) |
| **Mock Fallback** | ✅ Active |
| **API Endpoint** | `https://api.hepsijet.com/v1` |
| **Authentication** | OAuth 2.0 (Partner Token) |
| **Rate Limit** | 2000 requests/hour |
| **White-Hat Status** | ✅ Official Partner API |
| **Required Credentials** | `HEPSIJET_PARTNER_ID`, `HEPSIJET_API_SECRET` |
| **Partner Application** | https://partner.hepsijet.com |
| **Data Residency** | Turkey (İstanbul) |
| **KVKK Compliant** | ✅ Yes |

**Capabilities:**
- ✅ Shipment tracking
- ✅ Service points lookup
- ✅ Delivery estimation
- ⏸️ Shipment booking (requires partner agreement)

---

## 💰 Financial Services Connectors

### Loan Compare Turkey

**Connector ID:** `loan-compare-tr`

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Partner OK |
| **Real API** | ✅ Active (internal aggregator) |
| **Mock Fallback** | ✅ Active (for testing) |
| **API Endpoint** | Internal (no external API) |
| **Authentication** | Internal session-based |
| **Rate Limit** | Unlimited (internal) |
| **White-Hat Status** | ✅ Aggregator (affiliate links) |
| **Required Credentials** | None (internal system) |
| **Partner Application** | N/A (internal) |
| **Data Residency** | Turkey (İstanbul) |
| **KVKK Compliant** | ✅ Yes |

**Capabilities:**
- ✅ Loan offer comparison (8+ banks)
- ✅ APR calculations
- ✅ Monthly payment estimates
- ✅ Total cost comparison
- ✅ Affiliate tracking

**Data Sources:**
- Garanti BBVA (affiliate)
- İş Bankası (affiliate)
- Yapı Kredi (affiliate)
- Akbank (affiliate)
- QNB Finansbank (affiliate)
- Ziraat Bankası (public rates)
- Halkbank (public rates)
- VakıfBank (public rates)

**Mock Data Structure:**
```json
{
  "offers": [
    {
      "bank": "Garanti BBVA",
      "apr": 1.99,
      "monthlyPayment": 11458,
      "totalCost": 275000,
      "url": "https://affiliate.garantibbva.com/..."
    }
  ]
}
```

---

## 🏛️ Civic & Government Connectors

### Civic Intelligence Grid

**Connector ID:** `civic-intelligence-grid`

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Partner OK |
| **Real API** | ✅ Active (public data sources) |
| **Mock Fallback** | ✅ Active (for testing) |
| **API Endpoint** | Internal (aggregates public data) |
| **Authentication** | Public (no auth required) |
| **Rate Limit** | Unlimited (public data) |
| **White-Hat Status** | ✅ Public Data Only |
| **Required Credentials** | None |
| **Partner Application** | N/A (public) |
| **Data Residency** | Turkey (multiple cities) |
| **KVKK Compliant** | ✅ Yes (public data exemption) |

**Capabilities:**
- ✅ Air quality monitoring (real-time)
- ✅ Traffic flow analysis
- ✅ Public transport status
- ✅ Energy consumption stats
- ✅ Waste management metrics

**Data Sources:**
- Hava Kalitesi İzleme Sistemi (public API)
- İstanbul Büyükşehir Belediyesi Açık Veri
- Ankara Büyükşehir Belediyesi Açık Veri
- İzmir Büyükşehir Belediyesi Açık Veri
- OpenStreetMap (public)

---

## 🔐 Security & Credential Management

### Credential Storage Strategy

**Current State (v4.0):**
```javascript
// Placeholder for development
getAPIKey(connectorId) {
  const envKey = `${connectorId.toUpperCase().replace(/-/g, '_')}_API_KEY`;
  if (process.env && process.env[envKey]) {
    return process.env[envKey];
  }
  return 'MOCK_API_KEY'; // Fallback
}
```

**Production Target (v4.1):**
```javascript
// Vault/KMS integration with rotation
async getAPIKey(connectorId) {
  const vaultPath = `secret/connectors/${connectorId}`;
  const secret = await vault.read(vaultPath);

  // Check if rotation needed (24h max age)
  if (secret.metadata.age > 86400000) {
    await rotateCredential(connectorId);
  }

  return secret.data.apiKey;
}
```

**Rotation Schedule:**
- API Keys: 24 hours
- OAuth Tokens: On expiry (typically 1 hour)
- Client Secrets: 7 days
- Webhook Secrets: 30 days

---

## 📊 Real vs Mock Decision Tree

```
User makes request
  ↓
Intent parsed successfully?
  ├─ No → Return error
  └─ Yes → Continue
      ↓
Connector exists?
  ├─ No → Return error
  └─ Yes → Continue
      ↓
Check partnerStatus:
  ├─ 'partner_required'
  │   └─ Show legal gate CTA + Use mock fallback
  │
  ├─ 'sandbox'
  │   └─ Check sandbox credentials
  │       ├─ Present → Use sandbox API
  │       └─ Missing → Use mock fallback
  │
  └─ 'partner_ok'
      └─ Check production credentials
          ├─ Present → Use real API
          │   └─ API call fails?
          │       ├─ Yes → Fallback to mock
          │       └─ No → Return real data
          │
          └─ Missing → Use mock fallback
```

---

## 🧪 Testing Strategy

### Unit Tests (connector-api-adapter.spec.js)

```javascript
describe('ConnectorAPIAdapter', () => {
  it('should use mock fallback when partner_required', async () => {
    const adapter = new ConnectorAPIAdapter();
    const result = await adapter.fetchData('trendyol-tr', '/health');

    expect(result.source).toBe('mock');
    expect(result.data).toBeDefined();
  });

  it('should enforce rate limits', async () => {
    const adapter = new ConnectorAPIAdapter();
    const config = { rateLimit: { max: 2, window: 3600 } };

    await adapter.fetchData('test-connector', '/api');
    await adapter.fetchData('test-connector', '/api');

    await expect(
      adapter.fetchData('test-connector', '/api')
    ).rejects.toThrow('RATE_LIMIT_EXCEEDED');
  });

  it('should block SSRF attempts', () => {
    const adapter = new ConnectorAPIAdapter();

    expect(adapter.isAllowedURL('https://api.trendyol.com/v1/products')).toBe(true);
    expect(adapter.isAllowedURL('https://evil.com/ssrf')).toBe(false);
    expect(adapter.isAllowedURL('http://localhost/admin')).toBe(false);
  });
});
```

### Integration Tests (e2e/connector-flow.spec.ts)

```typescript
test('Complete connector flow: intent → API → card', async ({ page }) => {
  await page.goto('/lydian-iq');

  // Type natural language query
  await page.fill('#chatInput', 'trendyol göster');
  await page.press('#chatInput', 'Enter');

  // Wait for intent parsing
  await page.waitForSelector('.message-bubble.ai-message');

  // Verify connector card rendered
  const card = await page.locator('.connector-inline-card');
  await expect(card).toContainText('Trendyol Turkey');

  // Verify partner gate shown (since partner_required)
  const partnerCTA = await card.locator('button:has-text("Apply for Partner Access")');
  await expect(partnerCTA).toBeVisible();
});
```

---

## 📈 Monitoring & Observability

### Key Metrics

**Per-Connector Metrics:**
- `connector_requests_total{connector="trendyol-tr", source="real|mock"}`
- `connector_request_duration_seconds{connector="trendyol-tr", percentile="p95"}`
- `connector_errors_total{connector="trendyol-tr", type="rate_limit|auth|network"}`
- `connector_partner_gate_shown_total{connector="trendyol-tr"}`

**Aggregate Metrics:**
- `intent_parsing_success_rate`
- `mock_fallback_rate` (target: <50%)
- `partner_approval_pending` (count)
- `real_api_coverage_percent` (target: >80%)

### Grafana Dashboard Panels

**Panel 1: Connector Health Overview**
- Table showing all 9 connectors
- Status (real/mock/error)
- Last successful call timestamp
- Error count (last 1h)

**Panel 2: Real vs Mock Traffic**
- Pie chart: real API calls vs mock fallback
- Target: >50% real API by Q2 2025

**Panel 3: Rate Limit Status**
- Bar chart per connector
- Current count / Max allowed
- Alert threshold: 80% capacity

**Panel 4: Partner Approval Funnel**
- partner_required connectors (5)
- CTA click-through rate
- Application completion rate

---

## 🚀 Roadmap to 100% Real Data

### Q4 2024 (Current)
- ✅ Mock fallback system complete
- ✅ Partner approval gates implemented
- ⏸️ Sandbox credentials for Migros, Wolt, UPS

### Q1 2025
- [ ] Trendyol Partner approval obtained
- [ ] Hepsiburada Merchant account activated
- [ ] Aras Kargo corporate contract signed
- [ ] HepsiJet partner agreement completed
- **Target:** 60% real API traffic

### Q2 2025
- [ ] All 9 connectors with real credentials
- [ ] Vault/KMS credential rotation active
- [ ] WebSocket real-time updates live
- **Target:** 90% real API traffic

### Q3 2025
- [ ] Mock system deprecated (emergency fallback only)
- [ ] 100% real API coverage
- [ ] Advanced features (predictive analytics, AI recommendations)

---

## ✅ Verification Checklist

**For Production Deployment:**
- [ ] All connectors tested with real API (sandbox where available)
- [ ] Partner approval gates working correctly
- [ ] Mock fallback triggers on error conditions
- [ ] Rate limiting enforced per connector
- [ ] SSRF/CSRF/XSS protections verified
- [ ] Telemetry flowing to /api/ui-telemetry
- [ ] Grafana dashboards configured
- [ ] Documentation complete and up-to-date
- [ ] Legal review passed (KVKK/GDPR)
- [ ] Zero console errors on production

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-10
**Maintained By:** Lydian-IQ Technical Team
**Next Review:** 2025-11-10

---

🔌 **Real-Data Matrix - Connector Integration Status & Compliance**
