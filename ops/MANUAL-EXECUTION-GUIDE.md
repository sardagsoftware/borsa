# 🚀 AILYDIAN DNS CUTOVER - MANUAL EXECUTION GUIDE

**Date:** 2025-10-04
**Purpose:** Production DNS cutover to Azure Front Door with zero downtime
**Domains:** 6 (ailydian.com + 5 subdomains/domains)

---

## ⚠️ IMPORTANT: PRE-EXECUTION CHECKLIST

Before running the DNS cutover script, ensure:

### 1. Azure Infrastructure Deployed

**Required Resources:**
- ✅ Azure Front Door Premium profile deployed
- ✅ AFD custom domains created for all 6 FQDNs:
  - `ailydian.com`
  - `travel.ailydian.com`
  - `blockchain.ailydian.com`
  - `video.ailydian.com`
  - `borsa.ailydian.com`
  - `newsai.earth`
- ✅ Backend origin configured (pointing to your Container Apps/APIM)
- ✅ WAF policy attached
- ✅ SSL/TLS certificates configured

**Verify AFD Deployment:**
```bash
# Check AFD profile exists
az afd profile list --output table

# Expected output: 1+ profiles with State=Enabled

# Get AFD endpoint hostname
az afd endpoint list --profile-name <YOUR_AFD_PROFILE_NAME> \
  --resource-group <YOUR_RESOURCE_GROUP> \
  --query "[0].hostName" -o tsv

# Expected: something like "ailydian-production-fd-endpoint.z01.azurefd.net"
```

### 2. Vercel Access Token

**Get Token:**
1. Go to https://vercel.com/account/tokens
2. Create new token with scope: `DNS Management`
3. Copy token securely (shown only once)

**Test Token:**
```bash
export VERCEL_TOKEN="your_token_here"
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v2/domains/ailydian.com/records" | jq '.records | length'

# Expected: Number > 0 (existing DNS records count)
```

### 3. Team & Permissions

- ✅ 2+ engineers available during cutover window
- ✅ Incident response plan reviewed
- ✅ Rollback decision authority identified
- ✅ User notification prepared (if needed)

---

## 📋 EXECUTION STEPS

### Step 1: Save the DNS Cutover Script

The script is already saved at:
```
/Users/sardag/Desktop/ailydian-ultra-pro/ops/dns-cutover-runner.sh
```

Make it executable:
```bash
chmod +x /Users/sardag/Desktop/ailydian-ultra-pro/ops/dns-cutover-runner.sh
```

### Step 2: Set Environment Variables

```bash
export PRIMARY_REGION="westeurope"
export DR_REGION="northeurope"
```

### Step 3: Execute the Cutover

```bash
cd /Users/sardag/Desktop/ailydian-ultra-pro
./ops/dns-cutover-runner.sh
```

**Interactive Prompts:**
- VERCEL_TOKEN (hidden input - paste securely)
- VERCEL_TEAM_ID (optional - press Enter to skip)

**Expected Timeline:**
- T+0: Preflight backup (2 min)
- T+2: AFD custom domain verification (5 min)
- T+7: Canary DNS cutover starts
  - T+7: travel.ailydian.com (5 min)
  - T+12: blockchain.ailydian.com (5 min)
  - T+17: video.ailydian.com (5 min)
  - T+22: borsa.ailydian.com (5 min)
  - T+27: newsai.earth (5 min)
  - T+32: ailydian.com apex (5 min)
- T+37: Final validation (3 min)
- **Total: ~40 minutes**

### Step 4: Monitor Progress

**Watch Output:**
- Script provides real-time BRIEF updates
- Each domain shows validation results
- DNS propagation checks included

**Parallel Monitoring:**
```bash
# Terminal 2: Watch DNS propagation
watch -n 10 'dig +short CNAME travel.ailydian.com'

# Terminal 3: Monitor AFD metrics
az monitor metrics list --resource <AFD_RESOURCE_ID> \
  --metric "RequestCount" --interval 1m
```

### Step 5: Post-Cutover Validation

```bash
# Automated validation
./ops/validate.sh

# Expected output:
# - All domains resolve to AFD endpoint
# - Azure headers present (x-azure-ref, server: Microsoft-Azure-CDN)
# - Health checks: OK
# - Latency: < 2 seconds
```

---

## 🔄 ROLLBACK PROCEDURE

**Trigger Conditions:**
- p95 latency > 200ms for 5+ minutes
- Error rate > 1% for 5+ minutes
- SSL certificate errors
- Health check failures
- User-reported critical issues

**Execute Rollback:**
```bash
# Rollback all domains
./ops/rollback.sh all

# OR rollback specific domain
./ops/rollback.sh ailydian.com
```

**Manual Rollback (if script fails):**
1. Restore DNS from backup files:
   - `ops/preflight-dns-ailydian.json`
   - `ops/preflight-dns-newsai.json`

2. Delete new DNS records via Vercel UI:
   - Go to https://vercel.com/dashboard/domains
   - Select domain → DNS Records
   - Delete CNAME/ALIAS records pointing to AFD

3. Purge AFD cache:
```bash
az afd endpoint purge \
  --resource-group <YOUR_RG> \
  --profile-name <YOUR_AFD_PROFILE> \
  --endpoint-name <YOUR_ENDPOINT> \
  --content-paths '/*'
```

**Recovery Time:** 3-5 minutes (DNS TTL = 300 seconds)

---

## 📊 SUCCESS CRITERIA

After full cutover, verify:

- ✅ All 6 domains resolve to AFD endpoint
- ✅ SSL certificates valid (check via browser)
- ✅ Azure CDN headers present in responses
- ✅ Health endpoints return HTTP 200
- ✅ p95 latency < 200ms (check in Azure Monitor)
- ✅ Error rate < 1% (check in Application Insights)
- ✅ No user-reported issues

---

## 🔐 SECURITY NOTES

**Token Handling:**
- Never commit VERCEL_TOKEN to git
- Token is masked in logs as `s6uC...wfR`
- Script reads token securely (hidden input)

**Audit Trail:**
- All DNS changes logged to `ops/dns-change-log.ndjson`
- Timestamps in UTC
- Backup files retained for 30 days

**White-Hat Compliance:**
- Zero downtime (canary deployment)
- Zero data loss (idempotent operations)
- Full rollback capability (< 5 min)

---

## 📞 TROUBLESHOOTING

### Issue: "VERCEL_TOKEN not set"
**Solution:** Re-run script and paste token when prompted

### Issue: "AFD endpoint not found"
**Solution:** Deploy Azure infrastructure first via Bicep:
```bash
az deployment sub create --location westeurope \
  --template-file infra/bicep/main.bicep \
  --parameters environment=production
```

### Issue: "DNS not propagating"
**Solution:** Wait 5-10 minutes, then check:
```bash
dig +trace ailydian.com
nslookup ailydian.com 8.8.8.8
```

### Issue: "Health check fails"
**Solution:**
1. Check backend origin in AFD
2. Verify Container Apps running
3. Test directly: `curl https://<backend-url>/api/health`

---

## 📁 FILE LOCATIONS

**Scripts:**
- Main runner: `ops/dns-cutover-runner.sh`
- Validation: `ops/validate.sh`
- Rollback: `ops/rollback.sh`

**Configuration:**
- Environment: `ops/.env.dns`
- Preflight: `ops/preflight.json`

**Backups:**
- `ops/preflight-dns-ailydian.json`
- `ops/preflight-dns-newsai.json`

**Logs:**
- `ops/dns-change-log.ndjson` (created during execution)

**Documentation:**
- Execution brief: `ops/EXECUTION-BRIEF-FINAL.md`
- DNS output: `ops/dns-output.json`, `ops/dns-output.md`
- This guide: `ops/MANUAL-EXECUTION-GUIDE.md`

---

## 🎯 NEXT STEPS AFTER SUCCESSFUL CUTOVER

**Immediate (T+0 to T+1h):**
- Monitor error rates in Azure portal
- Check SSL certificate status
- Review change log
- Send success notification to team

**Short-term (T+1h to T+72h):**
- Keep old backend HOT (do not scale down)
- Monitor SLO metrics daily
- Heat caches (AFD + Vercel ISR)
- Collect user feedback

**Long-term (T+72h+):**
- Execute database contract migration
- Scale down old backend gradually
- Enable PostgreSQL reserved capacity (30-50% cost savings)
- Generate 7-day SLO/SLA report
- Archive old infrastructure

---

**✅ READY FOR EXECUTION**

When Azure infrastructure is deployed and verified, run:
```bash
./ops/dns-cutover-runner.sh
```

**Good luck! 🚀**
