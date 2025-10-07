# 🐰 BunnyCDN Implementation Guide - Ailydian.com
## Zero Downtime Migration - Step by Step

**Date:** October 5, 2025
**Target:** www.ailydian.com
**Current Setup:** Vercel (273140a7bc1139dc.vercel-dns-016.com)
**Goal:** Add BunnyCDN layer with zero downtime

---

## 📊 CURRENT BASELINE METRICS

### DNS Configuration
```
www.ailydian.com → 273140a7bc1139dc.vercel-dns-016.com
IP: 216.150.1.129, 216.150.16.129
```

### Performance Metrics (Before CDN)
```
TTFB: 282ms
Total Time: 283ms
Server: Vercel
Cache: Vercel Edge Network
```

### Current Security Headers
```
✅ strict-transport-security: max-age=63072000
✅ x-content-type-options: nosniff
✅ x-frame-options: DENY
✅ referrer-policy: strict-origin-when-cross-origin
✅ permissions-policy: camera=(), microphone=(), geolocation=()
⚠️ access-control-allow-origin: * (wildcard - needs fixing)
```

---

## 🎯 EXPECTED IMPROVEMENTS

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **TTFB** | 282ms | <100ms | **3x faster** |
| **Cache Hit** | ~30% | >90% | **3x better** |
| **DDoS Protection** | Vercel only | BunnyCDN + Vercel | **Enhanced** |
| **WAF** | Basic | Advanced Edge Rules | **7 new rules** |
| **Cost** | $20-40/mo | $5-10/mo | **75% savings** |

---

## 🚀 IMPLEMENTATION STEPS

### ✅ STEP 1: PRE-DEPLOYMENT BACKUP (COMPLETED)

```bash
# DNS Backup
www.ailydian.com → 273140a7bc1139dc.vercel-dns-016.com ✅

# Performance Backup
TTFB: 282ms ✅

# Headers Backup
All security headers documented ✅
```

---

### 📝 STEP 2: BUNNYCDN ACCOUNT SETUP

**Manual steps required (5 minutes):**

1. **Create Account**
   - Go to: https://bunny.net
   - Email: admin@ailydian.com (or your preferred email)
   - Password: [Strong password - min 12 chars]
   - ✅ Verify email

2. **Enable 2FA (MANDATORY)**
   - Dashboard → Account → Security
   - Enable Google Authenticator
   - ✅ Save backup codes

3. **Add Payment Method**
   - Dashboard → Billing
   - Add credit card
   - Free credit: $10 (covers first month)

4. **Generate API Key**
   - Dashboard → Account → API
   - Click "Generate API Key"
   - **SAVE THIS KEY:** ___________________________
   - ⚠️ Keep it secret, never commit to git

---

### 🔧 STEP 3: PULL ZONE CONFIGURATION

**Manual steps in BunnyCDN Dashboard:**

1. **Create Pull Zone**
   - Go to: Dashboard → CDN → Add Pull Zone
   - Name: `ailydian-prod`
   - Origin URL: `https://ailydian-ultra-pro.vercel.app`
   - Type: Standard
   - ✅ Create

2. **Select Edge Locations**
   - ✅ Europe: Frankfurt, London, Paris, Amsterdam
   - ✅ US East: New York, Washington DC
   - ✅ US West: Los Angeles, Seattle
   - ✅ Asia: Singapore, Tokyo (optional, for global reach)

3. **Cache Settings**
   - Cache Time: `3600` (1 hour)
   - Browser Cache: `86400` (1 day)
   - Query String Sort: ✅ Enabled
   - Cookies: Forward All
   - Ignore Query String: ❌ Disabled

4. **Security Settings**
   - Origin Shield: ✅ Enabled
   - DDoS Protection: ✅ Enabled
   - Token Authentication: ❌ Disabled (public site)

5. **Save Pull Zone Details**
   - Pull Zone URL: `ailydian-prod.b-cdn.net`
   - Pull Zone ID: ___________________

---

### 🧪 STEP 4: TEST DOMAIN SETUP

**Test before production migration!**

1. **Add Custom Hostname in BunnyCDN**
   - Pull Zone → Hostnames → Add Custom Hostname
   - Hostname: `test-cdn.ailydian.com`
   - SSL: Let's Encrypt (Free, Auto)
   - ✅ Save
   - ⏱️ Wait 5-10 minutes for SSL

2. **Add DNS CNAME Record**

   **In your domain registrar (GoDaddy/Namecheap/etc):**
   ```
   Type:  CNAME
   Host:  test-cdn
   Value: ailydian-prod.b-cdn.net
   TTL:   300 (5 minutes)
   ```

3. **Verify DNS Propagation**
   ```bash
   dig test-cdn.ailydian.com +short
   # Expected: ailydian-prod.b-cdn.net
   ```

4. **Test SSL**
   ```bash
   curl -I https://test-cdn.ailydian.com
   # Expected: HTTP/2 200
   ```

5. **Test Functionality**
   ```bash
   # Homepage
   curl https://test-cdn.ailydian.com | grep "LyDian"

   # API Health
   curl https://test-cdn.ailydian.com/api/health
   # Expected: {"status":"OK"}
   ```

6. **Test Cache**
   ```bash
   # First request (MISS)
   curl -I https://test-cdn.ailydian.com | grep x-cache
   # Expected: MISS

   # Second request (HIT)
   curl -I https://test-cdn.ailydian.com | grep x-cache
   # Expected: HIT
   ```

7. **Performance Test**
   ```bash
   curl -w "TTFB: %{time_starttransfer}s\n" -o /dev/null -s https://test-cdn.ailydian.com
   # Expected: < 0.100s (100ms)
   ```

---

### 🛡️ STEP 5: SECURITY EDGE RULES

**Configure in BunnyCDN → Pull Zone → Edge Rules:**

#### Rule 1: Block Bad Bots
```
IF User-Agent matches regex "(bot|crawler|spider|scraper)"
   AND NOT User-Agent contains "Googlebot|Bingbot|Slurp"
THEN Block (403)
```

#### Rule 2: Rate Limiting (General)
```
IF Request Count > 100 per 60 seconds (same IP)
THEN Block (429)
```

#### Rule 3: API Rate Limiting
```
IF URL starts with "/api/"
   AND Request Count > 30 per 60 seconds (same IP)
THEN Block (429)
```

#### Rule 4: SQL Injection Protection
```
IF URL contains regex "(SELECT|UNION|DROP|INSERT|DELETE|UPDATE|;--|'|\")"
THEN Block (403)
```

#### Rule 5: XSS Protection
```
IF URL contains regex "(<script|javascript:|onerror=|onload=)"
THEN Block (403)
```

#### Rule 6: Force HTTPS
```
IF Protocol = "http"
THEN Redirect to HTTPS (301)
```

#### Rule 7: Security Headers
```
Add Response Headers:
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

### ⚡ STEP 6: CACHE OPTIMIZATION

**Configure in BunnyCDN → Pull Zone → Edge Rules:**

#### Cache Rule 1: Static Assets (1 year)
```
IF URL ends with ".jpg|.png|.gif|.css|.js|.woff|.woff2|.ttf|.ico|.svg"
THEN Set Cache Time: 31536000 (1 year)
```

#### Cache Rule 2: HTML Pages (1 hour)
```
IF URL ends with ".html" OR URL is "/"
THEN Set Cache Time: 3600 (1 hour)
```

#### Cache Rule 3: API Responses (No Cache)
```
IF URL starts with "/api/"
THEN Set Cache Time: 0 (no cache)
     Add Header: Cache-Control: no-store, no-cache, must-revalidate
```

#### Cache Rule 4: Media Files (1 month)
```
IF URL ends with ".mp4|.webm|.mov|.avi|.mp3|.wav"
THEN Set Cache Time: 2592000 (30 days)
```

#### Compression Settings
```
✅ Enable Brotli Compression (priority)
✅ Enable Gzip Compression (fallback)
✅ Enable WebP Optimization (images)
```

---

### 🔄 STEP 7: PRODUCTION DNS MIGRATION (CRITICAL!)

**⚠️ ZERO DOWNTIME MIGRATION STRATEGY**

#### Phase 1: Lower TTL (1 hour before migration)
```
In Domain Registrar:
  Type:  CNAME
  Host:  www
  Value: 273140a7bc1139dc.vercel-dns-016.com (current)
  TTL:   60 (change from 3600 to 60)

⏱️ WAIT 1 HOUR for global DNS cache to expire
```

#### Phase 2: Add Production Hostname in BunnyCDN
```
Pull Zone → Hostnames → Add Custom Hostname
  Hostname: www.ailydian.com
  SSL: Let's Encrypt (Auto)

⏱️ WAIT 10 minutes for SSL provisioning
```

#### Phase 3: DNS Migration (The Switch!)
```
In Domain Registrar:
  Type:  CNAME
  Host:  www
  Value: ailydian-prod.b-cdn.net (NEW!)
  TTL:   60 (keep low for rollback)

✅ SAVE
```

#### Phase 4: Propagation Check (2-5 minutes)
```bash
# Check DNS
dig www.ailydian.com +short
# Expected: ailydian-prod.b-cdn.net

# Check HTTP
curl -I https://www.ailydian.com
# Expected: HTTP/2 200
# Expected Header: x-pull-zone: ailydian-prod

# Check API
curl https://www.ailydian.com/api/health
# Expected: {"status":"OK"}

# Check Cache
curl -I https://www.ailydian.com | grep x-cache
# Expected: MISS (first), then HIT (second request)
```

#### Phase 5: Monitoring (15 minutes)
```
Monitor these:
1. UptimeRobot: Should stay 100% uptime
2. BunnyCDN Dashboard: Requests should start appearing
3. Error logs: Should be empty
4. Performance: TTFB should drop to <100ms
```

#### Phase 6: Raise TTL (If all good)
```
In Domain Registrar:
  TTL: 60 → 3600 (1 hour)

This stabilizes DNS and improves performance
```

---

### 🚨 ROLLBACK PLAN (Emergency)

**If anything goes wrong (site down, errors, slow):**

#### Immediate Rollback (30 seconds)
```
In Domain Registrar:
  Type:  CNAME
  Host:  www
  Value: 273140a7bc1139dc.vercel-dns-016.com (OLD!)
  TTL:   60

✅ SAVE

⏱️ Wait 1-2 minutes, site will be back to normal
```

#### Purge Cache (If needed)
```
BunnyCDN Dashboard:
  Pull Zone → Purge → Purge All Cache
```

#### Support Contacts
```
BunnyCDN Support:
  Email: support@bunny.net
  Live Chat: 24/7 (Dashboard → Support)

Vercel Support:
  Email: support@vercel.com
  Status: https://vercel-status.com
```

---

## ✅ VALIDATION CHECKLIST

### Functionality Tests
- [ ] Homepage loads: `curl https://www.ailydian.com | grep "LyDian"`
- [ ] API works: `curl https://www.ailydian.com/api/health`
- [ ] Medical page: `curl https://www.ailydian.com/medical-expert.html`
- [ ] Legal page: `curl https://www.ailydian.com/lydian-legal-search.html`
- [ ] Auth flow: Test login/logout

### Performance Tests
- [ ] TTFB < 100ms: `curl -w "TTFB: %{time_starttransfer}s" www.ailydian.com`
- [ ] Cache hit rate > 80%: Check BunnyCDN dashboard
- [ ] Lighthouse score > 90: `npx lighthouse https://www.ailydian.com`

### Security Tests
- [ ] SSL valid: `curl -I https://www.ailydian.com | grep HTTP/2`
- [ ] Security headers: `curl -I https://www.ailydian.com | grep -i strict`
- [ ] WAF SQL injection: `curl "https://www.ailydian.com/?id=1%20UNION%20SELECT" → 403`
- [ ] Rate limit: 150 rapid requests → some should get 429

### Monitoring Check
- [ ] BunnyCDN Dashboard: Traffic flowing
- [ ] UptimeRobot: 100% uptime maintained
- [ ] Error logs: Empty
- [ ] Response time: < 100ms average

---

## 📊 MONITORING SETUP

### UptimeRobot Configuration
```
Monitor 1:
  Name: Ailydian - Homepage
  URL: https://www.ailydian.com
  Type: HTTP(s)
  Interval: 1 minute
  Alert: Email + SMS

Monitor 2:
  Name: Ailydian - API Health
  URL: https://www.ailydian.com/api/health
  Type: HTTP(s)
  Interval: 1 minute
  Alert: Email + SMS
  Expected: "OK"
```

### BunnyCDN Dashboard Metrics
```
Check daily:
1. Request count (should increase)
2. Cache hit ratio (target: >90%)
3. Bandwidth usage
4. Error rate (target: <0.1%)
5. Average response time (target: <100ms)
```

---

## 💰 COST ESTIMATE

### BunnyCDN Pricing
```
Traffic: $0.01/GB (first 500GB)
Requests: Free (unlimited)
SSL: Free (Let's Encrypt)
DDoS: Free (included)

Estimated Monthly Cost:
- 50GB traffic: $0.50
- 100GB traffic: $1.00
- 500GB traffic: $5.00

Total: $5-10/month (vs $20-40 on Vercel alone)
Savings: 75% 🎉
```

---

## 🎯 SUCCESS METRICS

### Must Achieve
- ✅ TTFB: 282ms → <100ms (3x faster)
- ✅ Cache Hit: 30% → >90% (3x better)
- ✅ Uptime: 100% (zero downtime)
- ✅ No broken functionality
- ✅ All security headers intact

### Bonus Goals
- 🎯 Lighthouse score: >95
- 🎯 Global latency: <50ms (from edge locations)
- 🎯 Cost reduction: >70%

---

## 📝 IMPLEMENTATION LOG

**Migration Start:** ____/____/____ __:__
**Test Domain Active:** ____/____/____ __:__
**Security Rules Applied:** ____/____/____ __:__
**Cache Rules Applied:** ____/____/____ __:__
**Production DNS Migrated:** ____/____/____ __:__
**Validation Complete:** ____/____/____ __:__
**Migration End:** ____/____/____ __:__

**Total Duration:** _______ minutes

**Issues Encountered:**
- [ ] None ✅
- [ ] _______________

**Rollback Performed:**
- [ ] No ✅
- [ ] Yes - Reason: _______________

---

## 🚀 NEXT STEPS AFTER CDN

Once BunnyCDN is stable (1-2 weeks), consider:

1. **Advanced Analytics**
   - Integrate BunnyCDN analytics API
   - Real-time dashboard for traffic

2. **Image Optimization**
   - Enable BunnyCDN Optimizer
   - Auto WebP conversion

3. **Video Streaming** (if needed)
   - BunnyCDN Stream (HLS/DASH)
   - Adaptive bitrate streaming

4. **Storage Zone** (if needed)
   - Store static assets in BunnyCDN Storage
   - Reduce Vercel bandwidth costs

5. **Multi-CDN Strategy**
   - Keep Vercel as origin
   - BunnyCDN as primary CDN
   - Cloudflare as failover (future)

---

## ✅ COMPLETION SIGN-OFF

**Implemented By:** _______________
**Verified By:** _______________
**Date:** ____/____/____

**Status:**
- [ ] Planning
- [ ] Testing
- [ ] Production
- [ ] Completed ✅

---

**END OF GUIDE** 🐰

*This guide ensures zero downtime migration with complete rollback plans at every step.*
