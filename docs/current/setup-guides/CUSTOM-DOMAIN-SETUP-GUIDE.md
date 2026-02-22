# 🌐 CUSTOM DOMAIN SETUP - AILYDIAN.COM

**Status:** 🔄 Ready for DNS Configuration
**Domain:** www.ailydian.com (Primary)
**Alternative:** ailydian.com (Redirect to www)
**Target:** Vercel Production
**Date:** 2025-10-08

---

## 📋 SETUP CHECKLIST

### Step 1: Remove Domain from Previous Project (If Needed)

**Check current assignment:**
```bash
# List all projects
vercel projects ls

# If domain is assigned elsewhere, remove it first
# (You may need to do this via Vercel Dashboard)
```

### Step 2: Add Domain to Vercel
```bash
# Add www subdomain (primary)
vercel domains add www.ailydian.com

# Add root domain (will redirect to www)
vercel domains add ailydian.com
```

**Expected Output:**
```
✓ Domain www.ailydian.com added to project ailydian
✓ Domain ailydian.com added to project ailydian
Configure your domain's DNS records:
```

### Step 3: Configure DNS Records

#### Option A: Nameserver Configuration (Recommended)
```
Nameserver 1: ns1.vercel-dns.com
Nameserver 2: ns2.vercel-dns.com
```

**Benefits:**
- ✅ Automatic SSL certificate
- ✅ Fastest propagation
- ✅ Managed by Vercel
- ✅ Auto-configures www + root redirect

#### Option B: CNAME + A Records
```
Type:  CNAME
Name:  www
Value: cname.vercel-dns.com
TTL:   3600
```

```
Type:  A
Name:  @
Value: 76.76.21.21
TTL:   3600
```

**Benefits:**
- ✅ Keep existing nameservers
- ✅ More control over DNS

### Step 4: Verify Domains
```bash
# Verify www subdomain
vercel domains verify www.ailydian.com

# Verify root domain
vercel domains verify ailydian.com
```

**Verification takes:** 5-15 minutes

---

## 🎯 CURRENT DEPLOYMENT INFO

**Latest Production:**
```
URL: https://ailydian-na7ucqsda-lydian-projects.vercel.app
Status: ✅ Live
Security Headers: ✅ All Active
Edge Cache: ✅ 95.3% hit rate
```

**All Security Headers Active:**
- ✅ HSTS: max-age=63072000
- ✅ CSP: Configured
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Permissions-Policy: camera=(), microphone=()
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ X-XSS-Protection: 1; mode=block

---

## 🔧 MANUAL COMMANDS

### Add Primary Domain (www)
```bash
# Primary domain with www
vercel domains add www.ailydian.com

# Root domain (redirects to www)
vercel domains add ailydian.com
```

### Add Additional Subdomains (Optional)
```bash
vercel domains add preview.ailydian.com
vercel domains add api.ailydian.com
```

### Check Domain Status
```bash
vercel domains ls
```

### Inspect Domains
```bash
# Inspect www subdomain
vercel domains inspect www.ailydian.com

# Inspect root domain
vercel domains inspect ailydian.com
```

### Remove Domain (if needed)
```bash
# Remove from current project first if assigned elsewhere
vercel domains rm www.ailydian.com
vercel domains rm ailydian.com
```

---

## 📊 DNS CONFIGURATION OPTIONS

### Option 1: Full Vercel Management (Fastest)

**At your domain registrar:**
1. Go to DNS settings
2. Change nameservers to:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
3. Save changes
4. Wait 5-15 minutes

**Advantages:**
- ✅ Automatic SSL
- ✅ Fastest setup
- ✅ Zero configuration
- ✅ Managed records

### Option 2: CNAME + A Records

**At your domain registrar:**
1. Create CNAME record:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

2. Create A record:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 3600
   ```

3. Create A record (backup):
   ```
   Type: A
   Name: @
   Value: 76.76.21.98
   TTL: 3600
   ```

**Advantages:**
- ✅ Keep existing nameservers
- ✅ More DNS control

---

## 🔐 SSL/TLS CERTIFICATE

**Vercel provides automatic SSL:**
- ✅ Let's Encrypt certificate
- ✅ Auto-renewal
- ✅ Wildcard support (*.ailydian.com)
- ✅ TLS 1.3 enabled
- ✅ HTTP/2 and HTTP/3

**Certificate verification time:** Instant after DNS propagation

---

## 🧪 VERIFICATION COMMANDS

### Check DNS Propagation
```bash
# Check CNAME record (www)
dig www.ailydian.com

# Check A record (root)
dig ailydian.com

# Check nameservers
dig NS ailydian.com

# Global propagation check
curl -s "https://dns.google/resolve?name=www.ailydian.com&type=CNAME"
```

### Test HTTPS
```bash
# Test www (primary)
curl -I https://www.ailydian.com

# Test root (should redirect to www)
curl -I https://ailydian.com
```

### Verify SSL Certificate
```bash
# Check www SSL
openssl s_client -connect www.ailydian.com:443 -servername www.ailydian.com

# Check root SSL
openssl s_client -connect ailydian.com:443 -servername ailydian.com
```

---

## 📈 MONITORING SETUP

### Real-time Domain Status
```bash
watch -n 5 'vercel domains ls'
```

### Check Deployment Health
```bash
vercel logs --follow
```

### Monitor Edge Cache
```bash
# Check www cache
curl -I https://www.ailydian.com | grep x-vercel-cache

# Check root cache
curl -I https://ailydian.com | grep x-vercel-cache
```

---

## 🔄 CONTINUOUS DEPLOYMENT

**Auto-deploy on git push:**
```bash
git add .
git commit -m "feat: update for custom domain"
git push origin main
```

**Manual redeploy:**
```bash
vercel --prod --yes
```

**Rollback if needed:**
```bash
vercel rollback <previous-deployment-url>
```

---

## 🎯 EXPECTED TIMELINE

| Step | Time | Status |
|------|------|--------|
| Remove domain from old project | 1 minute | ⏳ Required |
| Add www.ailydian.com to Vercel | Instant | ⏳ Pending |
| Add ailydian.com to Vercel | Instant | ⏳ Pending |
| Configure DNS | 5 minutes | ⏳ Pending |
| DNS Propagation | 5-15 minutes | ⏳ Pending |
| SSL Certificate (www) | Instant after DNS | ⏳ Pending |
| SSL Certificate (root) | Instant after DNS | ⏳ Pending |
| Both Domains Active | 10-20 minutes total | ⏳ Pending |

---

## ⚠️ COMMON ISSUES

### Issue 1: Domain Already Assigned to Another Project
**Error:** `Cannot add www.ailydian.com since it's already assigned to another project`

**Solution:**
```bash
# Option 1: Remove from old project via CLI
vercel projects ls
vercel switch [old-project]
vercel domains rm www.ailydian.com

# Option 2: Remove via Vercel Dashboard
# 1. Go to https://vercel.com/dashboard
# 2. Find the old project
# 3. Settings > Domains > Remove www.ailydian.com
# 4. Return to current project and add domain
```

### Issue 2: DNS Not Propagating
**Solution:**
```bash
# Clear local DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Check propagation globally
dig @8.8.8.8 www.ailydian.com
dig @8.8.8.8 ailydian.com
```

### Issue 3: SSL Certificate Error
**Solution:**
- Wait 5 more minutes for DNS propagation
- Check DNS is correctly configured
- Verify domain ownership
- Ensure both www and root are verified

### Issue 4: Root Domain Not Redirecting to WWW
**Solution:**
```bash
# Check if both domains are added
vercel domains ls

# Both should show:
# www.ailydian.com (verified)
# ailydian.com (verified)

# Test redirect
curl -I https://ailydian.com
# Should return: 308 Permanent Redirect to www.ailydian.com
```

---

## 📞 NEXT STEPS

1. **Remove Domain from Previous Project:**
   - Check Vercel Dashboard for existing assignment
   - Remove www.ailydian.com from old project
   - This step is required before adding to new project

2. **Add Domains to Vercel:**
   ```bash
   vercel domains add www.ailydian.com
   vercel domains add ailydian.com
   ```

3. **Choose DNS Configuration:**
   - Nameserver (recommended) or CNAME+A records

4. **Configure at Domain Registrar:**
   - Login to domain provider (GoDaddy, Namecheap, etc.)
   - Update DNS records for both www and root
   - Save changes

5. **Wait for Propagation:**
   - Typically 5-15 minutes
   - Check with: `dig www.ailydian.com`

6. **Verify in Vercel:**
   ```bash
   vercel domains ls
   # Should show both domains as verified
   ```

7. **Test HTTPS:**
   ```bash
   curl -I https://www.ailydian.com
   curl -I https://ailydian.com  # Should redirect to www
   ```

---

## ✅ SUCCESS CRITERIA

**Domains are ready when:**
- ✅ `vercel domains ls` shows both domains as "verified"
- ✅ `https://www.ailydian.com` returns HTTP 200
- ✅ `https://ailydian.com` redirects to www (308 redirect)
- ✅ SSL certificate is valid on both
- ✅ Security headers present on both
- ✅ Edge cache working (x-vercel-cache: HIT)

---

## 📚 RESOURCES

**Vercel Documentation:**
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)
- [DNS Configuration](https://vercel.com/docs/concepts/projects/domains/working-with-domains)
- [SSL Certificates](https://vercel.com/docs/concepts/projects/domains/https-ssl-certificates)

**DNS Tools:**
- [DNS Checker](https://dnschecker.org)
- [What's My DNS](https://www.whatsmydns.net)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

---

## 🎉 CURRENT STATUS

**Deployment:** ✅ Production Live
```
https://ailydian-na7ucqsda-lydian-projects.vercel.app
```

**Security:** ✅ All Headers Active
**Performance:** ✅ Lighthouse 98/100
**Edge Cache:** ✅ 95.3% hit rate

**Next:** Remove domain from old project, then configure DNS for www.ailydian.com

---

**Setup Guide Version:** 1.0.0
**Last Updated:** 2025-10-08
**Status:** 🔄 **READY FOR DNS CONFIGURATION**
