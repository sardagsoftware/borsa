# 🌐 WWW.AILYDIAN.COM DOMAIN MIGRATION GUIDE

**Status:** 🔄 **MIGRATION IN PROGRESS**
**Current Issue:** Domain assigned to another project
**Target:** www.ailydian.com (Primary) + ailydian.com (Redirect)
**Date:** 2025-10-08

---

## ⚠️ CURRENT SITUATION

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║            ⚠️  DOMAIN ALREADY ASSIGNED                        ║
║                                                                ║
║   Domain:                 www.ailydian.com                     ║
║   Status:                 ❌ Assigned to another project      ║
║   Error:                  Cannot add (400)                     ║
║                                                                ║
║   Required Action:        Remove from old project first       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

**Error Message:**
```
Error: Cannot add www.ailydian.com since it's already assigned to another project. (400)
```

---

## 🔧 SOLUTION STEPS

### Step 1: Find Current Project Assignment

**Via Vercel Dashboard:**
```
1. Go to https://vercel.com/dashboard
2. Check all projects under your account
3. Look for www.ailydian.com in Domains section
4. Note the project name
```

**Via CLI:**
```bash
# List all your projects
vercel projects ls

# Check each project for domains
# You may need to switch between projects
```

---

### Step 2: Remove Domain from Old Project

**Option A: Via Vercel Dashboard (Recommended)**
```
1. Go to https://vercel.com/dashboard
2. Select the old project that has www.ailydian.com
3. Go to Settings > Domains
4. Find www.ailydian.com
5. Click "..." menu > Remove
6. Confirm removal
```

**Option B: Via CLI**
```bash
# Switch to the old project
vercel switch [old-project-name]

# Remove the domain
vercel domains rm www.ailydian.com

# Also remove root if present
vercel domains rm ailydian.com
```

---

### Step 3: Add Domains to Current Project

**Switch back to ailydian-ultra-pro:**
```bash
# Make sure you're in the correct project
cd /home/lydian/Desktop/ailydian-ultra-pro

# Verify project
vercel project ls

# Add www subdomain (primary)
vercel domains add www.ailydian.com

# Add root domain (will redirect to www)
vercel domains add ailydian.com
```

**Expected Output:**
```
✓ Domain www.ailydian.com added to project ailydian
✓ Domain ailydian.com added to project ailydian
Configure your domain's DNS records
```

---

### Step 4: Configure DNS Records

#### Option A: Nameservers (Recommended)
```
At your domain registrar (GoDaddy, Namecheap, etc.):

1. Go to DNS Management
2. Change nameservers to:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
3. Save changes
```

#### Option B: CNAME + A Records
```
At your domain registrar:

CNAME Record:
- Type:  CNAME
- Name:  www
- Value: cname.vercel-dns.com
- TTL:   3600

A Record:
- Type:  A
- Name:  @
- Value: 76.76.21.21
- TTL:   3600
```

---

### Step 5: Verify DNS Propagation

```bash
# Wait 5-15 minutes, then check:

# Check www CNAME
dig www.ailydian.com

# Check root A record
dig ailydian.com

# Check nameservers
dig NS ailydian.com

# Global check
curl -s "https://dns.google/resolve?name=www.ailydian.com&type=CNAME"
```

---

### Step 6: Verify in Vercel

```bash
# Check domain status
vercel domains ls

# Should show:
# www.ailydian.com  ✓ Verified
# ailydian.com      ✓ Verified

# Inspect domains
vercel domains inspect www.ailydian.com
vercel domains inspect ailydian.com
```

---

### Step 7: Test HTTPS & SSL

```bash
# Test www (primary)
curl -I https://www.ailydian.com

# Expected:
# HTTP/2 200
# strict-transport-security: max-age=63072000...
# x-vercel-cache: HIT

# Test root (should redirect)
curl -I https://ailydian.com

# Expected:
# HTTP/2 308 (Permanent Redirect)
# location: https://www.ailydian.com/
```

---

## 🔍 TROUBLESHOOTING

### Issue 1: Cannot Find Old Project

**Solution:**
```bash
# List all projects with details
vercel projects ls --json > projects.json
cat projects.json | grep -i "ailydian"

# Check Vercel Dashboard thoroughly
# Domain may be in a different account or team
```

### Issue 2: No Permission to Remove Domain

**Solution:**
```
1. Check if you're the project owner
2. If domain is in a team, ensure you have admin rights
3. Contact team admin to remove domain
4. Or transfer project ownership first
```

### Issue 3: Domain Still Shows as Assigned

**Solution:**
```bash
# Wait a few minutes for Vercel to update
# Then try adding again
vercel domains add www.ailydian.com

# If still fails, contact Vercel support:
# https://vercel.com/support
```

### Issue 4: DNS Not Propagating

**Solution:**
```bash
# Clear local DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Check from different DNS servers
dig @8.8.8.8 www.ailydian.com      # Google DNS
dig @1.1.1.1 www.ailydian.com      # Cloudflare DNS
dig @208.67.222.222 www.ailydian.com # OpenDNS

# Use online tool
# https://dnschecker.org/#A/www.ailydian.com
```

---

## 📋 MIGRATION CHECKLIST

### Pre-Migration
- [ ] Identify current project with www.ailydian.com
- [ ] Verify you have permission to remove domain
- [ ] Backup current DNS settings
- [ ] Note current nameservers

### Domain Removal
- [ ] Remove www.ailydian.com from old project
- [ ] Remove ailydian.com from old project (if present)
- [ ] Verify domains are removed: `vercel domains ls`

### Domain Addition
- [ ] Switch to ailydian-ultra-pro project
- [ ] Add www.ailydian.com to project
- [ ] Add ailydian.com to project
- [ ] Verify domains are added: `vercel domains ls`

### DNS Configuration
- [ ] Choose nameserver or CNAME+A method
- [ ] Update DNS records at registrar
- [ ] Save changes
- [ ] Wait 5-15 minutes

### Verification
- [ ] Check DNS propagation: `dig www.ailydian.com`
- [ ] Verify in Vercel: `vercel domains ls`
- [ ] Test www: `curl -I https://www.ailydian.com`
- [ ] Test root redirect: `curl -I https://ailydian.com`
- [ ] Check SSL certificate
- [ ] Verify security headers
- [ ] Test edge cache (HIT status)

### Post-Migration
- [ ] Update all documentation with www domain
- [ ] Test all features on www.ailydian.com
- [ ] Verify API endpoints work
- [ ] Check auth flows
- [ ] Monitor for 24 hours

---

## 🎯 EXPECTED RESULTS

### After Successful Migration

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║              ✅ WWW.AILYDIAN.COM ACTIVE                       ║
║                                                                ║
║   Primary Domain:         www.ailydian.com                     ║
║   Root Domain:            ailydian.com → www (308 redirect)   ║
║                                                                ║
║   DNS Status:             ✅ Propagated globally              ║
║   SSL Certificate:        ✅ Valid (auto-issued)              ║
║   Security Headers:       ✅ All active                       ║
║   Edge Cache:             ✅ HIT                              ║
║                                                                ║
║   Production URL:         https://www.ailydian.com            ║
║   Status:                 ✅ Live                             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

### Domain Behavior

```
User enters:                Redirects to:
─────────────────────────────────────────────────
http://www.ailydian.com  →  https://www.ailydian.com (301)
https://www.ailydian.com →  https://www.ailydian.com (Direct)
http://ailydian.com      →  https://www.ailydian.com (301+308)
https://ailydian.com     →  https://www.ailydian.com (308)
```

---

## 📞 SUPPORT & RESOURCES

### Vercel Dashboard
```
https://vercel.com/lydian-projects/ailydian
```

### Current Deployment
```
https://ailydian-mb25vhpl1-lydian-projects.vercel.app
(This will remain active during migration)
```

### Vercel Support
```
https://vercel.com/support
Email: support@vercel.com
```

### DNS Checking Tools
```
https://dnschecker.org
https://dns.google/query
https://www.whatsmydns.net
```

---

## 🔄 ROLLBACK PROCEDURE

**If migration fails:**

```bash
# Remove domains from current project
vercel domains rm www.ailydian.com
vercel domains rm ailydian.com

# Add back to old project if needed
vercel switch [old-project]
vercel domains add www.ailydian.com
vercel domains add ailydian.com

# Restore DNS settings
# (Use backup from pre-migration step)
```

**Note:** Current Vercel deployment URLs remain unaffected during this process. The platform is still accessible via:
- https://ailydian-mb25vhpl1-lydian-projects.vercel.app

---

## ✅ SUCCESS CRITERIA

**Migration is successful when:**
- ✅ `vercel domains ls` shows both domains verified
- ✅ https://www.ailydian.com returns HTTP 200
- ✅ https://ailydian.com redirects to www (308)
- ✅ SSL certificates valid on both
- ✅ All security headers present
- ✅ Edge cache returns HIT
- ✅ No errors in browser console
- ✅ All features work correctly

---

**Migration Guide Version:** 1.0.0
**Last Updated:** 2025-10-08
**Status:** 🔄 **AWAITING DOMAIN REMOVAL FROM OLD PROJECT**

**Next Step:** Find and remove www.ailydian.com from previous project assignment
