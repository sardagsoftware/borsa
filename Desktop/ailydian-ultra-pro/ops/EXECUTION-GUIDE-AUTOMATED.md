# 🚀 AILYDIAN FULL DNS CUTOVER - AUTOMATED EXECUTION GUIDE

**Date:** 2025-10-04
**Script:** `full-dns-cutover-automated.sh` (570 lines)
**Mode:** Principal SRE - Full Automation
**Policy:** Top Sende / White-Hat Discipline (0 downtime, 0 data loss, instant rollback)

---

## 📋 PRE-EXECUTION CHECKLIST

### Required Tools ✅
- [x] Azure CLI (`az`)
- [x] curl
- [x] jq
- [x] dig (dnsutils)
- [x] nslookup

### Environment Variables 🔐
```bash
# Required
export VERCEL_TOKEN="your_vercel_token_here"

# Optional (defaults provided)
export PRIMARY_REGION="westeurope"
export DR_REGION="northeurope"
export ORIGIN_UI_HOST="ailydian.vercel.app"
export AZ_SUBSCRIPTION="<your_subscription_id>"  # Optional
```

### Azure Access ☁️
- [x] Azure CLI authenticated (`az login`)
- [x] Contributor role on subscription
- [x] Access to create AFD resources

### Vercel Access 🌐
- [x] Vercel token with DNS management permissions
- [x] Domain ownership: ailydian.com, newsai.earth

---

## 🎯 WHAT THIS SCRIPT DOES

The script executes **6 automated phases** with BRIEFs after each:

### **PHASE 0: Precheck & Workspace**
- Verify tools (az, curl, jq, dig, nslookup)
- Create workspace: `~/Desktop/ailydian-ultra-pro/ops`
- Load environment variables
- Authenticate Azure CLI
- **OUTPUT:** BRIEF(0) - Tools status, masked token

### **PHASE 1: AFD Discovery/Bootstrap**
- Check for existing Azure Front Door
- If not found: Create minimal AFD infrastructure
  - Resource Group: `aly-core-prod-rg`
  - Profile: `aly-fd-prod` (Premium)
  - Endpoint: `aly-fd-endpoint`
  - Origin: `ailydian.vercel.app`
- Save AFD FQDN to `afd.txt`
- **OUTPUT:** BRIEF(1) - AFD details (RG, profile, endpoint, FQDN)

### **PHASE 2: DNS Backup**
- Backup existing Vercel DNS records
  - `preflight-dns-ailydian-com.json`
  - `preflight-dns-newsai-earth.json`
- **OUTPUT:** BRIEF(2) - Backup file locations, record counts

### **PHASE 3: AFD Custom Domain Validation**
- Create AFD custom domains for all 6 FQDNs
- Get validation tokens from Azure
- Create TXT records on Vercel DNS (`_dnsauth`)
- Poll for approval (max 20 attempts, 10s intervals)
- **OUTPUT:** BRIEF(3) - Validation status

### **PHASE 4: DNS Canary Changes**
**Order (apex LAST):**
1. travel.ailydian.com (CNAME)
2. blockchain.ailydian.com (CNAME)
3. video.ailydian.com (CNAME)
4. borsa.ailydian.com (CNAME)
5. newsai.earth (CNAME @)
6. ailydian.com (HTTPS @) ← **LAST**

For each domain:
- Create DNS record via Vercel API
- Validate:
  - DNS resolution (dig)
  - TXT verification (nslookup)
  - HTTPS headers (curl)
  - Health endpoint
  - Response time
- Wait 10 seconds before next
- **OUTPUT:** BRIEF(4) - Canary results per domain

### **PHASE 5: Full Cutover & Blue-Green**
- Confirm 100% traffic on AFD
- Keep Blue backend (Vercel) HOT for 72 hours
- Schedule DB contract migration at T+72h
- **OUTPUT:** BRIEF(5) - Cutover status, blue-hot window

### **PHASE 6: Outputs & Audit**
Generate files:
- `dns-output.md` (human-readable table)
- `dns-output.json` (machine-readable config)
- `validate.sh` (batch validation script)
- `rollback.sh` (emergency rollback script)
- `dns-change-log.ndjson` (audit trail)
- **OUTPUT:** BRIEF(6) - File locations

---

## 🚀 EXECUTION

### Step 1: Set Environment

```bash
# Navigate to workspace
cd ~/Desktop/ailydian-ultra-pro/ops

# Set Vercel token (REQUIRED)
export VERCEL_TOKEN="your_vercel_token_here"

# Optional: Set Azure subscription
export AZ_SUBSCRIPTION="your_subscription_id"
```

### Step 2: Run Script

```bash
# Execute full cutover
./full-dns-cutover-automated.sh
```

**Expected Duration:** 10-15 minutes
- Phase 0: 30 seconds
- Phase 1: 2-5 minutes (if creating AFD)
- Phase 2: 10 seconds
- Phase 3: 1-2 minutes (validation polling)
- Phase 4: 5-7 minutes (6 domains × ~1 min each)
- Phase 5: Immediate
- Phase 6: 30 seconds

### Step 3: Monitor Output

The script will display:
- ✅ Success messages (green)
- ⚠️ Warnings (yellow)
- ❌ Errors (red)
- ℹ️ Info (blue)
- 📋 BRIEFs (cyan) after each phase

### Step 4: Post-Execution Validation

```bash
# Validate all domains
./validate.sh

# Check individual domain
dig +short CNAME travel.ailydian.com
curl -I https://ailydian.com | grep azure
```

---

## 📊 OUTPUT FILES

After successful execution:

```
~/Desktop/ailydian-ultra-pro/ops/
├── afd.txt                              (AFD endpoint FQDN)
├── preflight-dns-ailydian-com.json      (backup)
├── preflight-dns-newsai-earth.json      (backup)
├── dns-output.md                        (human-readable table)
├── dns-output.json                      (machine-readable config)
├── validate.sh                          (validation script)
├── rollback.sh                          (rollback script)
└── dns-change-log.ndjson                (audit trail)
```

---

## 🔄 ROLLBACK PROCEDURE

### Trigger Conditions:
- p95 latency > 200ms for 5+ minutes
- 5xx error rate > 1% for 5+ minutes
- SSL certificate errors
- Health check failures
- User-reported critical issues

### Execute Rollback:

```bash
# Method 1: Run rollback script
./rollback.sh

# Method 2: Manual rollback
# 1. Read preflight backups
cat preflight-dns-ailydian-com.json

# 2. Delete new records via Vercel UI or API
# 3. Recreate old records

# 4. Purge AFD cache
az afd endpoint purge \
  --resource-group aly-core-prod-rg \
  --profile-name aly-fd-prod \
  --endpoint-name aly-fd-endpoint \
  --content-paths '/*'

# 5. Wait 5-10 minutes for DNS propagation
sleep 300

# 6. Validate
./validate.sh
```

**Recovery Time:** < 5 minutes (DNS TTL = 300 seconds)

---

## 🔐 SECURITY & COMPLIANCE

### White-Hat Discipline ✅
- **0 Downtime:** Canary deployment (subdomain → apex)
- **0 Data Loss:** Complete DNS backups before changes
- **Instant Rollback:** Recovery time < 5 minutes
- **Audit Trail:** All changes logged to NDJSON

### Token Security 🔒
- Never logged in plaintext
- Masked in output (first4...last3)
- Read from environment only
- Not persisted to files

### DNS Safety 🛡️
- TTL: 300 seconds (fast rollback)
- Canary order: Low-risk → High-risk
- Apex domain LAST
- Full validation after each step

---

## 📈 SLO TARGETS

| Metric | Target | Threshold |
|--------|--------|-----------|
| p95 Latency | ≤ 120ms | < 200ms |
| Error Rate (5xx) | < 0.5% | < 1% |
| Availability | ≥ 99.9% | - |
| RTO | < 2 minutes | - |
| RPO | ≤ 5 minutes | - |

---

## 🎯 SUCCESS CRITERIA

After execution, verify:

- ✅ All 6 domains resolve to AFD endpoint
- ✅ SSL certificates valid
- ✅ Azure CDN headers present (`x-azure-ref`, `server: Microsoft-Azure-CDN`)
- ✅ Health endpoints return HTTP 200
- ✅ p95 latency < 200ms
- ✅ Error rate < 1%
- ✅ No user-reported issues

---

## 🐛 TROUBLESHOOTING

### Issue: "Missing required tool: az"
**Solution:**
```bash
# macOS
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Issue: "VERCEL_TOKEN not set"
**Solution:**
```bash
export VERCEL_TOKEN="your_token_here"
# Get token from: https://vercel.com/account/tokens
```

### Issue: "No AFD found" but creation fails
**Solution:**
```bash
# Check Azure quota
az vm list-usage --location westeurope --query "[?name.value=='cores'].{Name:name.value,Current:currentValue,Limit:limit}" -o table

# Or create AFD manually via Azure Portal
```

### Issue: "DNS not propagating"
**Solution:**
```bash
# Wait 5-10 minutes
sleep 300

# Check DNS from different resolver
dig @8.8.8.8 +short CNAME travel.ailydian.com
dig @1.1.1.1 +short CNAME travel.ailydian.com

# Trace DNS path
dig +trace travel.ailydian.com
```

### Issue: "Health check fails"
**Solution:**
```bash
# Check backend directly
curl -I https://ailydian.vercel.app

# Check AFD endpoint
curl -I https://$(cat afd.txt)

# Check AFD origin health
az afd origin show -g aly-core-prod-rg \
  --profile-name aly-fd-prod \
  --origin-group-name orig-ui \
  --origin-name ui-origin \
  --query healthProbeSettings
```

---

## 📞 SUPPORT

**Documentation:**
- Execution Guide: `ops/EXECUTION-GUIDE-AUTOMATED.md` (this file)
- DNS Output: `ops/dns-output.md`
- BRIEF Archive: `ops/BRIEF-*.txt`

**Scripts:**
- Main cutover: `ops/full-dns-cutover-automated.sh`
- Validation: `ops/validate.sh`
- Rollback: `ops/rollback.sh`

**Logs:**
- Audit trail: `ops/dns-change-log.ndjson`
- AFD endpoint: `ops/afd.txt`
- DNS backups: `ops/preflight-dns-*.json`

---

## 📋 POST-CUTOVER CHECKLIST

### Immediate (T+0 to T+1h):
- [ ] Run `./validate.sh` to verify all domains
- [ ] Check SSL certificates in browser
- [ ] Review `dns-change-log.ndjson` for audit
- [ ] Monitor AFD metrics in Azure Portal
- [ ] Send success notification to team

### Short-term (T+1h to T+72h):
- [ ] Monitor p95 latency (target: < 120ms)
- [ ] Monitor 5xx error rate (target: < 0.5%)
- [ ] Keep Blue backend (Vercel) HOT
- [ ] Heat AFD + Vercel ISR caches
- [ ] Collect user feedback

### Long-term (T+72h+):
- [ ] Execute database contract migration
- [ ] Scale down old backend gradually
- [ ] Generate 7-day SLO/SLA report
- [ ] Archive old infrastructure
- [ ] Document lessons learned

---

## ✅ READY FOR EXECUTION

**Location:** `/Users/sardag/Desktop/ailydian-ultra-pro/ops/`

**Execute:**
```bash
cd ~/Desktop/ailydian-ultra-pro/ops
export VERCEL_TOKEN="your_token"
./full-dns-cutover-automated.sh
```

**Validate:**
```bash
./validate.sh
```

**Rollback if needed:**
```bash
./rollback.sh
```

---

**Principal SRE - Full Automation Ready** 🚀

*White-Hat Discipline: 0 downtime | 0 data loss | Instant rollback*
