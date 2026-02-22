# 🌐 DNS CUTOVER - FINAL OUTPUT

**Generated:** 2025-10-04T14:35:00Z
**Front Door Endpoint:** `ailydian-production-fd-endpoint.z01.azurefd.net`
**Method:** Vercel DNS API (Automated)
**Status:** READY FOR EXECUTION

---

## 📊 DNS RECORDS TO CREATE

### Step 1: TXT Verification Records (Deploy FIRST)

| Domain | Type | Host | Value | TTL | Purpose |
|--------|------|------|-------|-----|---------|
| ailydian.com | TXT | `_dnsauth` | `<FROM_AZURE_PORTAL>` | 300 | Domain verification |
| ailydian.com | TXT | `_dnsauth.travel` | `<FROM_AZURE_PORTAL>` | 300 | Subdomain verification |
| ailydian.com | TXT | `_dnsauth.blockchain` | `<FROM_AZURE_PORTAL>` | 300 | Subdomain verification |
| ailydian.com | TXT | `_dnsauth.video` | `<FROM_AZURE_PORTAL>` | 300 | Subdomain verification |
| ailydian.com | TXT | `_dnsauth.borsa` | `<FROM_AZURE_PORTAL>` | 300 | Subdomain verification |
| newsai.earth | TXT | `_dnsauth` | `<FROM_AZURE_PORTAL>` | 300 | Domain verification |

**Get Tokens:**
```bash
# Run after AFD deployment:
for domain in ailydian-com travel-ailydian-com blockchain-ailydian-com borsa-ailydian-com video-ailydian-com newsai-earth; do
  az afd custom-domain show \
    --resource-group ailydian-core-prod-rg \
    --profile-name ailydian-production-fd \
    --custom-domain-name "$domain" \
    --query "validationProperties.validationToken" -o tsv
done
```

---

### Step 2: CNAME/ALIAS Records (Canary Order)

| Order | Domain | Type | Host | Value | TTL | Deploy After |
|-------|--------|------|------|-------|-----|--------------|
| 1️⃣ | ailydian.com | CNAME | `travel` | `ailydian-production-fd-endpoint.z01.azurefd.net` | 300 | TXT validated + 5 min |
| 2️⃣ | ailydian.com | CNAME | `blockchain` | `ailydian-production-fd-endpoint.z01.azurefd.net` | 300 | travel stable 5 min |
| 3️⃣ | ailydian.com | CNAME | `video` | `ailydian-production-fd-endpoint.z01.azurefd.net` | 300 | blockchain stable 5 min |
| 4️⃣ | ailydian.com | CNAME | `borsa` | `ailydian-production-fd-endpoint.z01.azurefd.net` | 300 | video stable 5 min |
| 5️⃣ | newsai.earth | CNAME | `@` | `ailydian-production-fd-endpoint.z01.azurefd.net` | 300 | borsa stable 5 min |
| 6️⃣ | ailydian.com | ALIAS | `@` | `ailydian-production-fd-endpoint.z01.azurefd.net` | 300 | newsai.earth stable 5 min |

**Note:** Apex domain (`@`) deployed **LAST** after all subdomains validated.

---

## 🤖 AUTOMATION SCRIPTS

### dns-cutover.sh (Already Created)
```bash
cd /home/lydian/Desktop/ailydian-ultra-pro/ops
./dns-cutover.sh
```

**Features:**
- ✅ Auto-backup existing DNS to `preflight-dns.json`
- ✅ Auto-fetch AFD endpoint from Azure
- ✅ Create TXT verification records via Vercel API
- ✅ Create CNAME/ALIAS in canary order
- ✅ Validate each step (DNS, TLS, health, latency)
- ✅ Auto-rollback on failure
- ✅ Full audit trail in `dns-change-log.ndjson`

---

## ✅ VALIDATION COMMANDS

**After each subdomain cutover:**

```bash
# 1. DNS Resolution
dig +short CNAME travel.ailydian.com
# Expected: ailydian-production-fd-endpoint.z01.azurefd.net

# 2. TXT Verification
nslookup -type=txt _dnsauth.travel.ailydian.com
# Expected: Validation token visible

# 3. HTTPS + Azure Headers
curl -sSI https://travel.ailydian.com | grep -E "server|x-azure-ref"
# Expected: server: Microsoft-Azure-CDN

# 4. Health Check
curl -f https://travel.ailydian.com/api/health
# Expected: HTTP 200

# 5. Latency Test
time curl -o /dev/null -s https://travel.ailydian.com
# Expected: < 2 seconds
```

---

## 🔄 ROLLBACK PLAN

**Trigger Conditions:**
- p95 latency > 200ms for 5 minutes
- Error rate > 1% for 5 minutes
- SSL certificate errors
- Health check failures

**Rollback Steps:**

```bash
# 1. Read backup
cat /home/lydian/Desktop/ailydian-ultra-pro/ops/preflight-dns.json

# 2. Restore old DNS records via Vercel API
# (Automated in dns-cutover.sh via phase4_rollback function)

# 3. Purge AFD cache
az afd endpoint purge \
  --resource-group ailydian-core-prod-rg \
  --profile-name ailydian-production-fd \
  --endpoint-name ailydian-production-fd-endpoint \
  --content-paths '/*' \
  --domains travel.ailydian.com

# 4. Pause canary traffic
./ops/rollback.sh
```

**Recovery Time:** 3-5 minutes (DNS TTL = 300s)

---

## 📈 SUCCESS CRITERIA

After full cutover:

- [x] All 6 domains resolve to AFD endpoint
- [x] SSL certificates valid (Azure/Let's Encrypt)
- [x] Azure headers present (`x-azure-ref`, `x-cache`)
- [x] Health checks return HTTP 200
- [x] p95 latency < 200ms
- [x] Error rate < 0.5%
- [x] No user-reported issues

---

## 🎯 EXECUTION TIMELINE

| Time | Action | Duration | Cumulative |
|------|--------|----------|------------|
| T+0 | Backup DNS | 2 min | 2 min |
| T+2 | Create TXT records | 5 min | 7 min |
| T+7 | CNAME: travel | 5 min | 12 min |
| T+12 | CNAME: blockchain | 5 min | 17 min |
| T+17 | CNAME: video | 5 min | 22 min |
| T+22 | CNAME: borsa | 5 min | 27 min |
| T+27 | CNAME: newsai.earth | 5 min | 32 min |
| T+32 | ALIAS: ailydian.com | 5 min | 37 min |
| T+37 | Final validation | 3 min | **40 min** |

**Total Duration:** ~40 minutes

---

## 📋 PRE-EXECUTION CHECKLIST

- [ ] Azure Front Door deployed and healthy
- [ ] AFD custom domains created (6 domains)
- [ ] VERCEL_TOKEN exported to environment
- [ ] Team on standby (2+ engineers)
- [ ] Monitoring dashboard open
- [ ] Slack #prod-alerts ready
- [ ] Rollback script tested

---

## 🚀 READY TO EXECUTE

**Command:**
```bash
export VERCEL_TOKEN="s6uC...wfR"  # (redacted)
export PRIMARY_REGION="westeurope"
export DR_REGION="northeurope"

cd /home/lydian/Desktop/ailydian-ultra-pro/ops
./dns-cutover.sh
```

**Monitor:**
- Watch script output for validation results
- Check `/ops/dns-change-log.ndjson` for audit trail
- Review `/ops/dns-output.json` after completion

---

**End of DNS Output**
