# AILYDIAN - Azure Portal Quick Start Guide
**Estimated Time:** 30-45 minutes  
**Prerequisites:** Azure Portal access with Contributor role

---

## 🎯 Quick Navigation

**Azure Portal:** https://portal.azure.com  
**Resource Group:** aly-core-prod-rg  
**AFD Endpoint:** ailydian-production-fd-endpoint.z01.azurefd.net

---

## ✅ 5-Phase Checklist

### Phase 1: Custom Domain Validation (5-10 min)

**Path:** Azure Portal → Search "Front Door" → Front Door and CDN profiles → Click your resource

1. Navigate to: **Domains** → **Custom domains**
2. Verify each domain shows **"Approved"** status:
   - [ ] ailydian.com
   - [ ] travel.ailydian.com
   - [ ] blockchain.ailydian.com
   - [ ] video.ailydian.com
   - [ ] borsa.ailydian.com
   - [ ] newsai.earth

**If NOT Approved:**
- Check TXT record matches Azure validation token
- Wait 5-10 minutes for DNS propagation
- Click **Revalidate**

---

### Phase 2: HTTPS Certificates (10-15 min per domain)

**Path:** Domains → Custom domains → Click domain name

For **EACH** approved domain:

1. **HTTPS Configuration:**
   - Certificate type: **Azure managed**
   - Minimum TLS version: **1.2**
   - Click **Update**

2. Wait for provisioning (10-15 min per domain)
3. Verify: Status shows "Enabled" with green checkmark

**Validation:**
```bash
curl -vI https://ailydian.com 2>&1 | grep -i 'subject\|issuer'
```

---

### Phase 3: WAF/DDoS Protection (10-15 min)

#### Step 1: Create WAF Policy

**Path:** Search "Web Application Firewall" → **WAF policies** → **Create**

**Configuration:**
```
Resource group: aly-core-prod-rg
Policy name: aly-waf-prod
Region: Global
Policy mode: Prevention
Tier: Premium (Front Door)
```

Click **Review + create** → **Create**

#### Step 2: Add Managed Rules

**Path:** WAF policies → aly-waf-prod → **Managed rules** → **Add**

Add 2 rulesets:

1. **Microsoft Default Rule Set**
   - Ruleset: Microsoft_DefaultRuleSet
   - Version: 2.1 (latest)
   - Action: Block

2. **Bot Manager Rule Set**
   - Ruleset: Microsoft_BotManagerRuleSet
   - Version: 1.0
   - Action: Block

#### Step 3: Add Custom Rate Limit

**Path:** WAF policies → aly-waf-prod → **Custom rules** → **Add**

```
Rule type: Custom rule
Name: GlobalRateLimit
Priority: 100
Condition: Rate limit > 1000 requests/min per IP
Action: Block
```

#### Step 4: Associate with Front Door

**Path:** WAF policies → aly-waf-prod → **Associated Front Door profiles** → **Add Front Door**

1. Select your Front Door resource
2. Select all endpoints
3. Click **Add**

**Validation:**
```bash
curl -I 'https://ailydian.com/?id=1%20OR%201=1'
# Should return 403 Forbidden (WAF blocked)
```

---

### Phase 4: Monitoring Alerts (10 min)

**Path:** Front Door → **Monitoring** → **Alerts** → **Create alert rule**

Create **4 alert rules:**

#### Alert 1: High Latency
```
Signal: Backend Request Latency
Operator: Greater than
Threshold: 120 ms (p95)
Aggregation: Average
Period: 5 minutes
Frequency: 1 minute
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
Severity: Informational (4)
```

**Action Group:**
- Name: afd-critical-alerts
- Email: ops@ailydian.com

---

### Phase 5: Diagnostic Logging (5 min)

**Path:** Front Door → **Monitoring** → **Diagnostic settings** → **Add**

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
  Retention: 30 days (minimum)
```

Click **Save**

**Validation:**
```bash
# Wait 5-10 minutes, then check logs
# Azure Portal → Front Door → Monitoring → Logs
```

**Sample Query:**
```kusto
FrontDoorAccessLog
| where TimeGenerated > ago(1h)
| summarize RequestCount=count() by RequestUri
| top 10 by RequestCount desc
```

---

## 🔍 Verification Checklist

After completing all phases:

- [ ] All 6 domains show "Approved" status
- [ ] HTTPS enabled for all 6 domains (Azure managed certs)
- [ ] WAF policy "aly-waf-prod" created and associated
- [ ] 4 alert rules created (latency, 5xx, availability, cost)
- [ ] Diagnostic logging enabled with 30-day retention
- [ ] Test HTTPS: `curl -I https://ailydian.com` returns 200/301
- [ ] Test WAF: SQL injection attempt returns 403

---

## 📊 Expected Results

**After 1 hour:**
- DNS fully propagated to Azure Front Door
- HTTPS certificates provisioned for all domains
- WAF actively blocking malicious requests
- Alerts configured and ready

**After 24 hours:**
- Cache hit ratio > 80%
- p95 latency < 120ms
- 5xx error rate < 0.5%
- Diagnostic logs available for analysis

**After 72 hours:**
- Full SLO compliance confirmed
- Cost vs. performance optimized
- Monthly review scheduled

---

## 🚨 Troubleshooting

### Issue: HTTPS Certificate Not Provisioning

**Symptoms:** Certificate stuck on "Provisioning"

**Solution:**
1. Verify DNS points to AFD endpoint
2. Check domain validation is "Approved"
3. Wait 15-20 minutes (can take up to 1 hour)
4. If > 1 hour, delete and recreate custom domain

### Issue: WAF Blocking Legitimate Traffic

**Solution:**
1. Review WAF logs: WAF policy → Logs
2. Identify blocking rule
3. Options:
   - Tune rule threshold
   - Create exception (Allow rule)
   - Temporary: Switch to Detection mode

### Issue: High 5xx Error Rate

**Solution:**
1. Check origin health: Front Door → Origins → Health status
2. Review logs: Front Door → Logs → Filter 5xx
3. Test origin directly: `curl -I https://ailydian.vercel.app`

---

## 📞 Support

**Documentation:**
- Full Guide: `AZURE-PORTAL-ENTERPRISE-GUIDE.md` (15KB, 10 phases)
- Validation: `./validate-and-brief.sh`
- Monitoring: `./monitor-propagation.sh`
- Rollback: `./rollback.sh all`

**Azure Support:**
- [Front Door Docs](https://docs.microsoft.com/azure/frontdoor/)
- [WAF Configuration](https://docs.microsoft.com/azure/web-application-firewall/)

---

**Status:** DNS cutover complete, ready for Portal setup  
**Principal Azure Architect & SRE**  
**White-Hat Discipline: Enforced**
