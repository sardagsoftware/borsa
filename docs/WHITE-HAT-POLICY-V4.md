# 🛡️ White-Hat Policy v4.0 - Ethical Connector Integration

**Version:** 4.0.0
**Effective Date:** 2025-10-10
**Review Cycle:** Quarterly
**Policy Owner:** Lydian-IQ Security & Compliance Team

---

## 📜 Policy Statement

**Lydian-IQ operates with ZERO-TOLERANCE for unethical data practices.** All connector integrations must use **official APIs, partner feeds, or affiliate gateways** with explicit authorization. Web scraping, credential harvesting, unauthorized data access, and any other grey-hat or black-hat techniques are **strictly prohibited**.

This policy ensures compliance with:
- ✅ **KVKK** (Turkish Personal Data Protection Law)
- ✅ **GDPR** (EU General Data Protection Regulation)
- ✅ **PDPL** (UAE Personal Data Protection Law)
- ✅ **ISO 27001** (Information Security Management)
- ✅ **SOC 2 Type II** (Security & Availability)

**Violation Consequences:**
- Immediate connector deactivation
- Security incident report filed
- Legal review & potential termination
- User notification if data exposure risk exists

---

## ✅ Approved Integration Methods

### 1. Official Partner APIs

**Definition:** APIs provided by the platform/vendor with formal partnership agreement.

**Requirements:**
- ✅ Written partnership agreement or terms of service acceptance
- ✅ API credentials issued by the platform (API key, OAuth client ID/secret)
- ✅ Rate limits documented and adhered to
- ✅ Data usage terms reviewed and accepted
- ✅ Attribution provided when required

**Examples:**
```
✅ Trendyol Partner API (requires partnership)
✅ Hepsiburada Merchant API (requires merchant account)
✅ UPS Developer API (requires developer account)
✅ Wolt Partners API (requires partnership)
```

**Verification:**
```bash
# Before integrating, verify:
1. API documentation URL from official domain
2. Terms of Service explicitly allow integration
3. Credentials obtained through official registration
4. Rate limits clearly documented
5. Data retention policies defined
```

---

### 2. Official Sandbox/Developer APIs

**Definition:** Test/development APIs provided for integration purposes.

**Requirements:**
- ✅ Free or paid developer account registration
- ✅ Sandbox credentials separate from production
- ✅ Test data clearly marked
- ✅ Migration path to production documented
- ✅ Sandbox limitations respected (no production data)

**Examples:**
```
✅ Migros Developer API (sandbox available)
✅ UPS Developer Kit (free sandbox)
✅ Wolt Test Environment (developer account)
```

**Sandbox → Production Checklist:**
```
[ ] Partnership agreement signed
[ ] Production credentials obtained
[ ] Data protection agreement reviewed
[ ] KVKK/GDPR compliance verified
[ ] Rate limits increased (if applicable)
[ ] Monitoring & alerting configured
[ ] Legal review completed
```

---

### 3. Affiliate Gateway/Feed APIs

**Definition:** APIs provided to affiliates for product/service promotion.

**Requirements:**
- ✅ Affiliate program registration completed
- ✅ Affiliate agreement accepted
- ✅ Attribution/tracking parameters implemented
- ✅ Commission structure understood
- ✅ Cookie consent for tracking (GDPR)

**Examples:**
```
✅ Garanti BBVA Affiliate API (loan offers)
✅ İş Bankası Affiliate Feed (credit products)
✅ Travel comparison affiliate networks
```

**Affiliate Compliance:**
```javascript
// Always include affiliate tracking
const affiliateLink = `${baseURL}?ref=lydian-iq&aid=${affiliateId}`;

// Disclose affiliate relationship to users
<div class="disclosure">
  ℹ️ We may earn a commission from purchases made through this link.
</div>
```

---

### 4. Public Open Data APIs

**Definition:** Government/public sector APIs providing open data.

**Requirements:**
- ✅ Officially published by government/public entity
- ✅ License allows commercial use (or non-commercial for free tier)
- ✅ Attribution provided as required
- ✅ Data accuracy disclaimers included
- ✅ No personal data (only aggregate/anonymized)

**Examples:**
```
✅ İstanbul Büyükşehir Belediyesi Açık Veri (Istanbul Open Data)
✅ Hava Kalitesi İzleme Sistemi (Air Quality Monitoring)
✅ Ankara Trafik Akış Verileri (Traffic Flow Data)
✅ OpenStreetMap (open license)
```

**Public Data Usage:**
```javascript
// Example: Air quality data
{
  source: "T.C. Çevre ve Şehircilik Bakanlığı",
  license: "CC BY 4.0",
  attribution: "Data provided by Ministry of Environment",
  disclaimer: "For informational purposes only. Not a substitute for official sources.",
  lastUpdate: "2025-10-10T12:00:00Z"
}
```

---

## ❌ Prohibited Integration Methods

### 1. Web Scraping / HTML Parsing

**Definition:** Extracting data from websites not designed for programmatic access.

**Why Prohibited:**
- ❌ Violates Terms of Service of most platforms
- ❌ Fragile (breaks when HTML changes)
- ❌ Legal risk (CFAA, computer trespass laws)
- ❌ Ethical violation (using data without permission)
- ❌ GDPR/KVKK violation (unauthorized data processing)

**Banned Techniques:**
```python
# ❌ NEVER DO THIS
import requests
from bs4 import BeautifulSoup

response = requests.get('https://example-ecommerce.com/products')
soup = BeautifulSoup(response.text, 'html.parser')
prices = soup.find_all('span', class_='price')  # PROHIBITED!
```

**Consequences:**
- Immediate connector removal
- Incident report to legal team
- Potential cease & desist from scraped platform
- User notification if data was exposed

---

### 2. Credential Harvesting / Account Takeover

**Definition:** Obtaining user credentials to access platforms on their behalf without proper OAuth flow.

**Why Prohibited:**
- ❌ Massive security risk (credential storage)
- ❌ Phishing / social engineering concerns
- ❌ KVKK/GDPR violation (excessive data collection)
- ❌ Legal liability (if accounts compromised)
- ❌ Destroys user trust

**Banned Techniques:**
```javascript
// ❌ NEVER STORE RAW CREDENTIALS
function loginToTrendyol(username, password) {
  // PROHIBITED! Never ask for or store platform credentials
  return fetch('https://trendyol.com/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}
```

**Proper Alternative:**
```javascript
// ✅ USE OAUTH 2.0 ONLY
function initiateOAuth() {
  const authUrl = `https://auth.trendyol.com/oauth/authorize?
    client_id=${CLIENT_ID}&
    redirect_uri=${REDIRECT_URI}&
    response_type=code&
    scope=read_products,read_orders`;

  window.location.href = authUrl;
}
```

---

### 3. Reverse Engineering / API Abuse

**Definition:** Decompiling apps, intercepting traffic, or using internal APIs not meant for public use.

**Why Prohibited:**
- ❌ Violates Terms of Service
- ❌ Legal risk (DMCA, reverse engineering laws)
- ❌ Unstable (internal APIs change without notice)
- ❌ Security risk (bypassing authentication)
- ❌ Ethical violation

**Banned Techniques:**
```bash
# ❌ NEVER INTERCEPT INTERNAL APIS
mitmproxy --mode reverse:https://api-internal.example.com  # PROHIBITED!
curl https://api-internal.example.com/v2/products  # Undocumented API - PROHIBITED!
```

---

### 4. CAPTCHA Solving / Anti-Bot Bypass

**Definition:** Using services or techniques to bypass bot protection.

**Why Prohibited:**
- ❌ Clear violation of Terms of Service
- ❌ Platform considers this hostile activity
- ❌ Legal risk (CFAA, unauthorized access)
- ❌ Ethical violation (circumventing security)

**Banned Services:**
```
❌ 2captcha, Anti-Captcha, DeathByCaptcha
❌ Puppeteer/Playwright in stealth mode (for scraping)
❌ Residential proxy networks (for scraping)
❌ CAPTCHA solving browser extensions
```

---

### 5. Rate Limit Evasion

**Definition:** Techniques to bypass or circumvent API rate limits.

**Why Prohibited:**
- ❌ Violates API Terms of Service
- ❌ Platform may ban our account
- ❌ Unfair resource consumption
- ❌ Could cause service disruption for others

**Banned Techniques:**
```javascript
// ❌ NEVER ROTATE IPs TO EVADE RATE LIMITS
const proxies = ['proxy1.com', 'proxy2.com', 'proxy3.com'];
let proxyIndex = 0;

function evadeRateLimit() {
  // PROHIBITED! Respect rate limits
  const proxy = proxies[proxyIndex++ % proxies.length];
  return fetch(url, { agent: new HttpsProxyAgent(proxy) });
}
```

**Proper Alternative:**
```javascript
// ✅ IMPLEMENT BACKOFF & QUEUE
async function respectRateLimit(request) {
  const limiter = rateLimiters.get(connectorId);

  if (limiter.count >= limiter.max) {
    // Wait until reset time
    const waitTime = limiter.resetAt - Date.now();
    await sleep(waitTime);
  }

  return executeRequest(request);
}
```

---

## 🔒 Security Requirements

### 1. Credential Storage

**Requirements:**
- ✅ All API keys stored in Vault/KMS (never in code)
- ✅ Secrets rotated every 24 hours (max)
- ✅ Access logs for all credential retrievals
- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.3+)

**Implementation:**
```javascript
// ✅ CORRECT: Fetch from Vault
async function getAPIKey(connectorId) {
  const secret = await vault.read(`secret/connectors/${connectorId}`);

  // Check rotation age
  if (secret.metadata.age > 86400000) { // 24h
    await rotateCredential(connectorId);
  }

  return secret.data.apiKey;
}

// ❌ WRONG: Hardcoded in code
const API_KEY = 'sk-1234567890abcdef'; // NEVER DO THIS!
```

---

### 2. SSRF Protection

**Requirements:**
- ✅ URL allowlist for all external API calls
- ✅ Block private IP ranges (127.0.0.0/8, 10.0.0.0/8, etc.)
- ✅ Block metadata endpoints (169.254.169.254)
- ✅ Validate URL scheme (only https://)
- ✅ DNS rebinding protection

**Implementation:**
```javascript
function isAllowedURL(url) {
  const allowedDomains = [
    'api.trendyol.com',
    'api.hepsiburada.com',
    'api.migros.com.tr',
    'api.wolt.com',
    'onlinetools.ups.com'
  ];

  try {
    const urlObj = new URL(url);

    // Only HTTPS allowed
    if (urlObj.protocol !== 'https:') return false;

    // Check allowlist
    const allowed = allowedDomains.some(domain =>
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );

    if (!allowed) {
      console.error('🚫 SSRF blocked:', url);
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
```

---

### 3. CSRF Protection

**Requirements:**
- ✅ CSRF tokens on all state-changing requests
- ✅ SameSite=Strict cookies
- ✅ Origin/Referer header validation
- ✅ Double-submit cookie pattern

**Implementation:**
```javascript
// Frontend
async function makeAPICall(endpoint, data) {
  const csrfToken = await fetch('/api/csrf-token').then(r => r.json());

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken.token
    },
    credentials: 'include', // Send cookies
    body: JSON.stringify(data)
  });
}

// Backend
function validateCSRF(req, res, next) {
  const tokenFromHeader = req.headers['x-csrf-token'];
  const tokenFromSession = req.session.csrfToken;

  if (tokenFromHeader !== tokenFromSession) {
    return res.status(403).json({ error: 'CSRF token mismatch' });
  }

  next();
}
```

---

### 4. XSS Protection

**Requirements:**
- ✅ Escape all user input before rendering
- ✅ Content-Security-Policy headers
- ✅ DOMPurify for HTML sanitization
- ✅ No eval() or innerHTML with user data

**Implementation:**
```javascript
// ✅ SAFE: Escape HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ✅ SAFE: Use textContent
element.textContent = userInput;

// ❌ DANGEROUS: innerHTML with user data
element.innerHTML = userInput; // XSS risk!
```

---

## 📊 Compliance Verification

### Pre-Integration Checklist

Before adding any new connector:

```
[ ] Official API documentation URL verified (from vendor's domain)
[ ] Terms of Service reviewed and accepted
[ ] Partnership/developer account created
[ ] API credentials obtained through official channel
[ ] Rate limits documented
[ ] Data retention policy understood
[ ] KVKK/GDPR compliance verified
[ ] Legal review completed (if handling personal data)
[ ] Security review completed (SSRF/CSRF/XSS checks)
[ ] Monitoring & alerting configured
```

---

### Monthly Audit

Every month, verify:

```
[ ] All connectors still have valid credentials
[ ] No rate limit violations in past 30 days
[ ] No security incidents related to connectors
[ ] All partner agreements still active
[ ] Documentation up-to-date
[ ] Telemetry data retention < 7 days
[ ] No user complaints about unauthorized access
```

---

### Quarterly Review

Every quarter:

```
[ ] Review all connector integrations for continued business value
[ ] Check for new official APIs that could replace workarounds
[ ] Update partner agreements if needed
[ ] Conduct penetration testing on connector layer
[ ] Review access logs for anomalies
[ ] Update this policy document if needed
```

---

## 🚨 Incident Response

### If Unauthorized Access Detected

**Within 1 hour:**
1. Immediately disable affected connector
2. Revoke all associated API credentials
3. Check logs for data exposure
4. Notify security team

**Within 24 hours:**
5. Complete incident report
6. Determine if user data was exposed
7. If yes: prepare user notification (KVKK/GDPR requirement)
8. Legal review of potential violations

**Within 72 hours:**
9. Notify users if personal data breach occurred (GDPR requirement)
10. File breach report with authorities if required
11. Implement fixes to prevent recurrence
12. Update security measures

---

## 📋 Approved Connector Registry

**Last Updated:** 2025-10-10

| Connector ID | Method | Status | Agreement | Expires |
|--------------|--------|--------|-----------|---------|
| trendyol-tr | Partner API | Partner Required | Pending | N/A |
| hepsiburada-tr | Partner API | Partner Required | Pending | N/A |
| migros-tr | Sandbox API | Active | Developer ToS | N/A |
| wolt-tr | Sandbox API | Active | Developer ToS | N/A |
| ups-global | Developer API | Active | Developer ToS | N/A |
| aras-kargo-tr | Partner API | Partner Required | Pending | N/A |
| hepsijet-tr | Partner API | Partner Required | Pending | N/A |
| loan-compare-tr | Affiliate API | Active | Multiple Affiliates | Varies |
| civic-intelligence | Public API | Active | CC BY 4.0 | N/A |

---

## ✅ Certification

**I certify that:**
- All connector integrations follow this white-hat policy
- No web scraping or credential harvesting is used
- All security requirements are implemented
- Compliance with KVKK/GDPR is maintained
- This policy is reviewed quarterly

**Certified By:** Lydian-IQ Technical Team
**Date:** 2025-10-10
**Next Review:** 2026-01-10

---

## 📞 Contact

**Security Concerns:** security@ailydian.com
**Legal Questions:** legal@ailydian.com
**Partner Inquiries:** partnerships@ailydian.com

---

**Document Version:** 4.0.0
**Effective:** 2025-10-10
**Classification:** Public

---

🛡️ **White-Hat Policy - Ethical Integration Standards**
