# AILYDIAN - AZURE FRONT DOOR ENTERPRISE SETUP GUIDE

**Principal Azure Architect & SRE**  
**Status:** Portal-managed AFD (CLI quota exceeded)  
**Endpoint:** `ailydian-production-fd-endpoint.z01.azurefd.net`

---

## Executive Summary

Your Azure Front Door Premium instance was successfully created via Azure Portal. Complete the enterprise configuration following these steps.

**Estimated Time:** 30-45 minutes  
**Prerequisites:** Azure Portal access with Contributor role

---

## PHASE 1: Custom Domain Validation ✅

### 1.1 Access Your Front Door Resource

```
Azure Portal → Search "Front Door" → Front Door and CDN profiles
→ Click your Front Door resource (ailydian-production-fd-*)
```

### 1.2 Verify Custom Domains

**Path:** Domains → Custom domains

**Expected Domains (6):**
- ✓ ailydian.com
- ✓ travel.ailydian.com
- ✓ blockchain.ailydian.com
- ✓ video.ailydian.com
- ✓ borsa.ailydian.com
- ✓ newsai.earth

**Validation Status:**
Each domain should show **"Approved"** status

**If Not Approved:**
1. Click domain name
2. Check TXT record: `_dnsauth.<domain>` or `_dnsauth.<subdomain>.<domain>`
3. Verify TXT value matches Azure's validation token
4. Wait 5-10 minutes for DNS propagation
5. Click "Revalidate"

---

## PHASE 2: Enable HTTPS Certificates 🔒

### 2.1 Enable Managed Certificates

For EACH approved domain:

1. **Navigate:** Domains → Custom domains → Click domain name
2. **HTTPS Configuration:**
   - Certificate type: **Azure managed**
   - Minimum TLS version: **1.2**
   - Click **Update**

3. **Certificate Provisioning:**
   - Status: "Provisioning" (10-15 minutes)
   - Auto-renewal: Enabled (90 days before expiry)

### 2.2 Verify HTTPS Enablement

**Path:** Domains → Custom domains

**Expected:**
```
Domain                      | HTTPS   | Certificate
----------------------------|---------|------------------
ailydian.com                | Enabled | Azure managed
travel.ailydian.com         | Enabled | Azure managed
blockchain.ailydian.com     | Enabled | Azure managed
video.ailydian.com          | Enabled | Azure managed
borsa.ailydian.com          | Enabled | Azure managed
newsai.earth                | Enabled | Azure managed
```

**Validation:**
```bash
# Test HTTPS (after provisioning)
curl -I https://ailydian.com | grep -i "server\|x-azure"
curl -I https://travel.ailydian.com | grep -i "server\|x-azure"
```

---

## PHASE 3: WAF/DDoS Configuration 🛡️

### 3.1 Create WAF Policy

**Path:** Search "Web Application Firewall" → WAF policies → Create

**Configuration:**
```
Resource group: aly-core-prod-rg
Policy name: aly-waf-prod
Region: Global
Policy mode: Prevention
Tier: Premium (Front Door)
```

Click **Review + create** → **Create**

### 3.2 Configure Managed Rules

**Path:** WAF policies → aly-waf-prod → Managed rules → Add

**Ruleset 1: Microsoft Default Rule Set**
```
Ruleset: Microsoft_DefaultRuleSet
Version: 2.1 (latest)
Action: Block
```

**Ruleset 2: OWASP 3.2**
```
Ruleset: Microsoft_BotManagerRuleSet
Version: 1.0
Action: Block
```

**Ruleset 3: Rate Limiting**
```
Rule type: Custom rule
Name: GlobalRateLimit
Priority: 100
Rule: Rate limit > 1000 requests/min per IP
Action: Block
```

### 3.3 Associate WAF with Front Door

**Path:** WAF policies → aly-waf-prod → Associated Front Door profiles

1. Click **Add Front Door**
2. Select your Front Door resource
3. Select all endpoints
4. Click **Add**

**Verification:**
```
Front Door → Security → WAF policy
Expected: aly-waf-prod (Prevention mode)
```

---

## PHASE 4: Azure Monitor Alerts 📊

### 4.1 Create Alert Rules

**Path:** Front Door → Monitoring → Alerts → Create alert rule

#### Alert 1: High Latency

```
Signal: Latency (Backend Request Latency)
Operator: Greater than
Threshold: 120 ms (p95)
Aggregation: Average
Period: 5 minutes
Frequency: 1 minute

Action: Email notification
Severity: Warning (2)
```

#### Alert 2: 5xx Error Rate

```
Signal: Response Code (5XX)
Operator: Greater than
Threshold: 0.5% of total requests
Aggregation: Percentage
Period: 5 minutes
Frequency: 1 minute

Action: Email + SMS
Severity: Critical (0)
```

#### Alert 3: Availability

```
Signal: Health Probe Status
Operator: Less than
Threshold: 99.9%
Aggregation: Average
Period: 10 minutes
Frequency: 5 minutes

Action: Email + SMS + PagerDuty
Severity: Critical (0)
```

#### Alert 4: Cost Threshold

```
Signal: Total Data Transfer Out
Operator: Greater than
Threshold: 100 GB/day
Aggregation: Sum
Period: 24 hours
Frequency: 1 hour

Action: Email notification
Severity: Informational (4)
```

### 4.2 Create Action Groups

**Path:** Monitoring → Action groups → Create

```
Name: afd-critical-alerts
Email: ops@ailydian.com
SMS: +1-XXX-XXX-XXXX (optional)
Webhook: https://hooks.slack.com/... (optional)
```

---

## PHASE 5: Diagnostic Logging 📝

### 5.1 Enable Diagnostic Settings

**Path:** Front Door → Monitoring → Diagnostic settings → Add

**Configuration:**
```
Name: afd-diagnostics-prod
Logs:
  ✓ FrontDoorAccessLog
  ✓ FrontDoorHealthProbeLog
  ✓ FrontDoorWebApplicationFirewallLog

Metrics:
  ✓ AllMetrics

Destination:
  ✓ Send to Log Analytics workspace
  Workspace: Create new or select existing
  Retention: 30 days (minimum for compliance)
```

### 5.2 Query Logs

**Path:** Front Door → Monitoring → Logs

**Sample Queries:**

```kusto
// Top 10 URLs by request count
FrontDoorAccessLog
| summarize RequestCount=count() by RequestUri
| top 10 by RequestCount desc

// 5xx errors in last hour
FrontDoorAccessLog
| where TimeGenerated > ago(1h)
| where HttpStatusCode startswith "5"
| project TimeGenerated, RequestUri, HttpStatusCode, ClientIp

// WAF blocked requests
FrontDoorWebApplicationFirewallLog
| where Action == "Block"
| summarize BlockCount=count() by RuleName
| top 10 by BlockCount desc
```

---

## PHASE 6: Caching Optimization ⚡

### 6.1 Configure Cache Rules

**Path:** Front Door → Routes → Select route → Caching

**Recommended Settings:**

```
Query string caching: Use query string
Compression: Enabled
Cache behavior:
  - Static assets (*.js, *.css, *.png): Cache for 1 year
  - API responses: Cache for 5 minutes (with validation)
  - HTML pages: No cache (or 1 minute)

Cache key query string parameters:
  Include: version, lang
  Exclude: utm_*, fbclid, gclid (analytics)
```

### 6.2 Cache Purge

**Path:** Front Door → Caching → Purge cache

**When to Purge:**
- After deployments
- Content updates
- Emergency fixes

**Purge Types:**
```
1. All content: /* (full purge)
2. Path: /static/js/* (specific folder)
3. Single file: /index.html (specific file)
```

---

## PHASE 7: Origin Health Configuration 🏥

### 7.1 Configure Health Probes

**Path:** Front Door → Origins → Origin groups → Edit

**Settings:**
```
Origin: ailydian.vercel.app
Protocol: HTTPS
Path: /api/health (or / if no health endpoint)
Interval: 30 seconds
Timeout: 30 seconds
Unhealthy threshold: 3 consecutive failures

Sample count: 4
Success condition: HTTP 200-299
```

### 7.2 Monitor Origin Health

**Path:** Front Door → Monitoring → Metrics

**Key Metrics:**
```
- Origin Health Percentage (target: 100%)
- Origin Latency (target: < 100ms)
- Origin Request Count
- Backend Request Count
```

**Alerting:**
If origin health < 95% for 5 minutes → Critical alert

---

## PHASE 8: Security Hardening 🔐

### 8.1 TLS Configuration

**Path:** Front Door → Settings → Configuration

```
Minimum TLS version: 1.2
Supported TLS ciphers: Strong ciphers only
HSTS: Enabled
  - Max-Age: 31536000 (1 year)
  - Include Subdomains: Yes
  - Preload: Yes
```

### 8.2 IP Restrictions (Optional)

**Path:** WAF policies → aly-waf-prod → Custom rules

```
Rule: AllowOnlySpecificCountries
Condition: Geographic location
Operator: Is in
Countries: US, TR, EU countries
Action: Allow

Default: Block
```

### 8.3 Bot Protection

**Path:** WAF policies → aly-waf-prod → Managed rules

```
Microsoft Bot Manager: Enabled
Version: 1.0
Action: Block known bad bots
Detection mode: Prevention
```

---

## PHASE 9: Cost Optimization 💰

### 9.1 Monitor Costs

**Path:** Cost Management → Cost analysis

**Set Budgets:**
```
Budget name: afd-monthly-budget
Amount: $XXX/month
Alert at: 80%, 100%, 120%
Recipients: billing@ailydian.com
```

### 9.2 Optimize Data Transfer

**Strategies:**
1. **Increase cache hit ratio** (target: > 80%)
   - Longer TTLs for static assets
   - Query string normalization
   
2. **Compression**
   - Enable Brotli/Gzip for text content
   - Reduces bandwidth by 60-80%

3. **Origin shielding**
   - Consolidate requests to origin
   - Reduces origin costs

4. **Geo-filtering**
   - Block unwanted traffic
   - Reduces bandwidth waste

---

## PHASE 10: Compliance & Governance 📋

### 10.1 Enable Azure Policy

**Path:** Policy → Assignments → Assign policy

**Recommended Policies:**
```
1. Require TLS 1.2 minimum
2. Require managed certificates
3. Require WAF in Prevention mode
4. Require diagnostic logging enabled
5. Require tags (Environment, Owner, CostCenter)
```

### 10.2 RBAC (Role-Based Access Control)

**Path:** Front Door → Access control (IAM) → Add role assignment

**Recommended Roles:**
```
CDN Endpoint Contributor: DevOps team (purge cache, config)
CDN Endpoint Reader: Monitoring team (view only)
Owner: Cloud architect (full access)
```

### 10.3 Resource Tagging

**Path:** Front Door → Tags

```
Environment: Production
Application: Ailydian
CostCenter: Engineering
Owner: ops@ailydian.com
Criticality: High
Compliance: HIPAA,SOC2,PCI-DSS
```

---

## Validation Checklist ✅

### Custom Domains
- [ ] All 6 domains show "Approved" status
- [ ] TXT `_dnsauth` records in place
- [ ] DNS resolving to AFD endpoint

### HTTPS/TLS
- [ ] Managed certificates provisioned for all domains
- [ ] TLS 1.2 minimum enforced
- [ ] Auto-renewal enabled
- [ ] Test: `curl -I https://ailydian.com` returns Azure headers

### WAF/Security
- [ ] WAF policy `aly-waf-prod` created
- [ ] Prevention mode enabled
- [ ] OWASP 3.2 ruleset active
- [ ] Bot protection enabled
- [ ] Rate limiting configured

### Monitoring
- [ ] 4+ alert rules created (latency, 5xx, health, cost)
- [ ] Action groups configured
- [ ] Diagnostic logging enabled (30-day retention)
- [ ] Log Analytics workspace connected

### Performance
- [ ] Caching enabled for static assets
- [ ] Compression enabled (Brotli/Gzip)
- [ ] Cache hit ratio > 80% (after 24 hours)
- [ ] Origin health probes configured

### Compliance
- [ ] Resource tags applied
- [ ] RBAC roles assigned
- [ ] Azure Policies enforced
- [ ] Audit logs enabled

---

## Monitoring Dashboard

**Path:** Front Door → Monitoring → Workbooks → Create custom

**Key Metrics:**
```
┌─────────────────────────────────────────┐
│ Real-Time Performance                   │
├─────────────────────────────────────────┤
│ Requests/sec: 45.2                      │
│ p50 Latency: 23ms                       │
│ p95 Latency: 67ms  ✅                   │
│ p99 Latency: 145ms                      │
├─────────────────────────────────────────┤
│ Error Rates                             │
├─────────────────────────────────────────┤
│ 2xx: 98.7%                              │
│ 4xx: 1.2%                               │
│ 5xx: 0.1%  ✅                           │
├─────────────────────────────────────────┤
│ Cache Performance                       │
├─────────────────────────────────────────┤
│ Cache Hit Ratio: 84.2%  ✅              │
│ Origin Requests: 156/min                │
│ Cached Requests: 824/min                │
├─────────────────────────────────────────┤
│ Security                                │
├─────────────────────────────────────────┤
│ WAF Blocks: 23 (last hour)              │
│ Bot Traffic: 5.3%                       │
│ DDoS Events: 0  ✅                      │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: HTTPS Certificate Not Provisioning

**Symptoms:** Certificate status stuck on "Provisioning"

**Solution:**
1. Verify DNS points to AFD endpoint
2. Check domain validation status is "Approved"
3. Wait 15-20 minutes (can take up to 1 hour)
4. If > 1 hour, delete and recreate custom domain

### Issue: High 5xx Error Rate

**Steps:**
1. Check origin health: Front Door → Origins → Health status
2. Review logs: Front Door → Logs → FrontDoorAccessLog
3. Filter: `HttpStatusCode startswith "5"`
4. Check origin: `curl -I https://ailydian.vercel.app`

### Issue: WAF Blocking Legitimate Traffic

**Steps:**
1. Review WAF logs: WAF policy → Logs
2. Identify rule: Check `RuleName` column
3. Options:
   - Tune rule: Increase threshold
   - Create exception: Custom rule with Allow
   - Detection mode: Switch to Detection (temporary)

---

## Cost Estimates

**Azure Front Door Premium (Monthly):**
```
Base fee: ~$330/month
Data transfer:
  - First 10 TB: $0.087/GB
  - Next 40 TB: $0.065/GB
  - 50+ TB: $0.045/GB

Estimated (100 TB/month):
  Base: $330
  Data: ~$5,500
  WAF requests: $100
  Total: ~$5,930/month

Optimization potential: 30-40% via caching
```

---

## SLO Targets

```
Availability: ≥ 99.99% (Azure SLA: 99.99%)
p95 Latency: ≤ 120ms
p99 Latency: ≤ 200ms
5xx Rate: < 0.5%
Origin Health: ≥ 99.5%
Cache Hit Ratio: ≥ 80%
```

---

## Next Steps

1. **Immediate (0-2 hours):**
   - [ ] Complete all Phase 1-3 steps
   - [ ] Verify HTTPS cert provisioning
   - [ ] Test all 6 domains

2. **Active (2-24 hours):**
   - [ ] Monitor alert notifications
   - [ ] Review diagnostic logs
   - [ ] Optimize cache rules

3. **Ongoing (24-72 hours):**
   - [ ] Track SLO compliance
   - [ ] Fine-tune WAF rules
   - [ ] Analyze cost vs. performance

4. **Post-72 hours:**
   - [ ] Generate performance report
   - [ ] Update runbooks
   - [ ] Schedule monthly review

---

## Support & Documentation

**Azure Documentation:**
- [Front Door Docs](https://docs.microsoft.com/azure/frontdoor/)
- [WAF Configuration](https://docs.microsoft.com/azure/web-application-firewall/)
- [Monitoring Best Practices](https://docs.microsoft.com/azure/frontdoor/front-door-diagnostics)

**Ailydian Resources:**
- Workspace: `/home/lydian/Desktop/ailydian-ultra-pro/ops`
- Audit Log: `dns-change-log.ndjson`
- Validation: `./validate-and-brief.sh`
- Rollback: `./rollback.sh all`

---

**Status:** Portal Configuration Guide Complete  
**Principal Azure Architect & SRE**  
**White-Hat Discipline: 0 downtime · 0 data loss · auditable**

