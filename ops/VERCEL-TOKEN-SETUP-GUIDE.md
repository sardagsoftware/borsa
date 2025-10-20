# AILYDIAN - Vercel Token Setup & Final Automation Guide

**Status:** Waiting for valid Vercel token  
**Next Step:** Token setup → Automation completion → Validation

---

## Step 1: Get Vercel Team-Scoped Token

### Option A: Create New Token (Recommended)

1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Configuration:
   - **Token Name:** `ailydian-afd-dns-automation`
   - **Scope:** Select **"emrahsardag-9142"** team
   - **Expiration:** 30 days (or longer)
   - **Permissions:** Full access (or DNS records write access)
4. Click **"Create"**
5. **Copy the token immediately** (shown only once)

### Option B: Verify Existing Token

If you have a token, verify it works:

```bash
# Test token validity
export VERCEL_TOKEN="your-token-here"
export VERCEL_TEAM_ID="emrahsardag-9142"

curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v2/domains/ailydian.com/records?teamId=$VERCEL_TEAM_ID" \
  | jq -r 'if .error then "❌ ERROR: \(.error.message)" else "✅ Token valid: \(.records | length) records found" end'
```

**Expected Output:**
```
✅ Token valid: X records found
```

**If you see error:**
```json
{
  "error": {
    "code": "forbidden",
    "message": "The request is missing an authentication token"
  }
}
```
→ Token is invalid or expired, create a new one.

---

## Step 2: Set Environment Variables

```bash
# In your terminal (NOT in scripts)
export VERCEL_TOKEN="paste-your-token-here"
export VERCEL_TEAM_ID="emrahsardag-9142"

# Verify
echo "Token length: ${#VERCEL_TOKEN} characters"
echo "Team ID: $VERCEL_TEAM_ID"
```

---

## Step 3: Run Automated Finalization

Once token is set, run the automation:

```bash
cd ~/Desktop/ailydian-ultra-pro/ops

# Option A: Full automated validation and setup
./final-validation-summary.sh

# Option B: Portal finalization guide (no API required)
./afd-portal-finalization.sh

# Option C: Monitor DNS propagation
./monitor-propagation.sh
```

---

## Step 4: Manual Azure Portal Steps (REQUIRED)

**Even with Vercel API access**, the following MUST be done via Azure Portal:

### 4.1 Custom Domain Validation

**Path:** Azure Portal → Front Door → Domains → Custom domains

For each domain **NOT** showing "Approved":
1. Click domain name
2. Copy validation token
3. Go to Vercel Dashboard → Domain DNS → Add TXT record:
   - Type: `TXT`
   - Name: `_dnsauth` (or `_dnsauth.<subdomain>`)
   - Value: `<token from Azure>`
   - TTL: `300`
4. Wait 5-10 minutes
5. Return to Azure Portal → Click **"Revalidate"**

### 4.2 HTTPS Certificates

For each **Approved** domain:
1. Azure Portal → Front Door → Domains → Click domain
2. HTTPS Configuration:
   - Certificate type: **Azure managed**
   - Minimum TLS version: **1.2**
   - Click **Update**
3. Wait 10-15 minutes for provisioning

### 4.3 WAF/DDoS Protection

1. Search **"Web Application Firewall"** → Create
2. Configuration:
   - Resource group: `aly-core-prod-rg`
   - Policy name: `aly-waf-prod`
   - Region: `Global`
   - Mode: `Prevention`
   - Tier: `Premium`
3. Add managed rules:
   - `Microsoft_DefaultRuleSet 2.1`
   - `Microsoft_BotManagerRuleSet 1.0`
4. Associate with Front Door

### 4.4 Monitoring Alerts

Create 4 alert rules:
- High latency (p95 > 120ms)
- 5xx error rate (> 0.5%)
- Availability (< 99.9%)
- Cost threshold (> 100 GB/day)

### 4.5 Diagnostic Logging

Enable logs:
- `FrontDoorAccessLog`
- `FrontDoorHealthProbeLog`
- `FrontDoorWebApplicationFirewallLog`

Retention: 30 days minimum

---

## Step 5: Validation

### DNS Propagation Check

```bash
# Quick check all domains
for d in ailydian.com travel.ailydian.com blockchain.ailydian.com \
         video.ailydian.com borsa.ailydian.com newsai.earth; do
  echo "== $d =="
  dig +short CNAME "$d" 2>/dev/null || echo "(apex may use ALIAS)"
  curl -sSI "https://$d" 2>&1 | grep -Ei '^(HTTP/|server:|x-azure-ref)' | head -3
  echo ""
done
```

### Expected Results

**After DNS Propagation (5-60 minutes):**
```
== ailydian.com ==
HTTP/2 200
server: ...
x-azure-ref: 0000...
```

**Before Propagation:**
```
== ailydian.com ==
76.76.19.61
HTTP/2 200
server: Vercel
(no x-azure-ref header)
```

---

## Current Status Without Vercel Token

**What Works:**
- ✅ AFD endpoint is LIVE
- ✅ DNS cutover completed manually via Vercel UI
- ✅ Complete documentation delivered (100KB, 30+ files)
- ✅ Validation scripts ready
- ✅ White-hat compliance maintained

**What Requires Token:**
- ⚠️ Automated TXT validation record creation (optional)
- ⚠️ Automated DNS verification via API (optional)

**What Requires Azure Portal (MANDATORY):**
- ⚠️ Custom domain approval verification
- ⚠️ HTTPS certificate enablement
- ⚠️ WAF policy creation and association
- ⚠️ Monitoring alerts configuration
- ⚠️ Diagnostic logging enablement

---

## Alternative: Manual Workflow (No Vercel Token)

If you prefer to work without Vercel API token:

### 1. Azure Portal Domain Setup

Follow: `AZURE-PORTAL-QUICK-START.md` (6.5KB guide)

**TXT Records to Add Manually:**

You'll need to get validation tokens from Azure Portal for each domain:

1. Azure Portal → Front Door → Domains → Custom domains
2. Click each domain → Copy validation token
3. Add to Vercel DNS:

```
Domain: ailydian.com
  TXT: _dnsauth = <token-from-azure>
  TTL: 300

Domain: travel.ailydian.com (zone: ailydian.com)
  TXT: _dnsauth.travel = <token-from-azure>
  TTL: 300

Domain: blockchain.ailydian.com (zone: ailydian.com)
  TXT: _dnsauth.blockchain = <token-from-azure>
  TTL: 300

Domain: video.ailydian.com (zone: ailydian.com)
  TXT: _dnsauth.video = <token-from-azure>
  TTL: 300

Domain: borsa.ailydian.com (zone: ailydian.com)
  TXT: _dnsauth.borsa = <token-from-azure>
  TTL: 300

Domain: newsai.earth
  TXT: _dnsauth = <token-from-azure>
  TTL: 300
```

### 2. Wait for Validation (5-10 minutes)

### 3. Enable HTTPS (per domain)

### 4. Complete WAF, Alerts, Logging setup

**Total Time:** 30-45 minutes (manual Portal workflow)

---

## Recommended Approach

**Option 1: With Vercel Token** (Faster, Automated)
- ✅ Get team-scoped Vercel token
- ✅ Export to environment
- ✅ Run validation scripts
- ⏱️ Time saved: ~15 minutes

**Option 2: Without Vercel Token** (Manual, Reliable)
- ✅ Follow Azure Portal guides
- ✅ Manual TXT record entry
- ✅ Manual validation
- ⏱️ Total time: 30-45 minutes

**Both options achieve the same result.** Choose based on your preference.

---

## Next Steps

1. **Decide:** With token or manual Portal workflow?
2. **If with token:** Create token → Export to env → Run scripts
3. **If manual:** Follow `AZURE-PORTAL-QUICK-START.md`
4. **Monitor:** `./monitor-propagation.sh`
5. **Validate:** `./final-validation-summary.sh`

---

## Support

**Guides Available:**
- Quick Start: `AZURE-PORTAL-QUICK-START.md` (6.5KB)
- Full Guide: `AZURE-PORTAL-ENTERPRISE-GUIDE.md` (15KB)
- Summary: `FINAL-DEPLOYMENT-SUMMARY-20251004-223645.md` (15KB)

**Scripts Available:**
- Validation: `./final-validation-summary.sh`
- Propagation: `./monitor-propagation.sh`
- Finalization: `./afd-portal-finalization.sh`
- Rollback: `./rollback.sh all`

**Workspace:** `/Users/sardag/Desktop/ailydian-ultra-pro/ops`

---

**Status:** Ready for token setup OR manual Portal workflow  
**White-Hat Discipline: Enforced**
