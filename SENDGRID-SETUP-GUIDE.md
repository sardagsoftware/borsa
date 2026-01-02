# 📧 SendGrid Complete Setup Guide - www.ailydian.com

**Status**: ✅ Ready for DNS Setup
**Domain**: www.ailydian.com
**Date**: January 2, 2026

---

## 🎯 Quick Start (Choose Your DNS Provider)

### ✅ Prerequisites Completed

- [x] SendGrid API Key configured
- [x] DNS records prepared (6 total)
- [x] Scripts created for automation
- [x] Local environment configured
- [x] Documentation complete

---

## 📋 Step-by-Step Setup

### Step 1: Identify Your DNS Provider

**Question**: Where is `www.ailydian.com` DNS managed?

- [ ] **Cloudflare** → Use Option A
- [ ] **Vercel** → Use Option B
- [ ] **Namecheap** → Use Option C
- [ ] **GoDaddy** → Use Option C
- [ ] **Other** → Use Option C (Manual)

---

## Option A: Cloudflare DNS (Automated) ☁️

### Requirements

1. Cloudflare API Token or API Key
2. `jq` command-line tool (for JSON parsing)

### Setup Steps

```bash
# 1. Install jq (if not already installed)
brew install jq  # macOS
# OR
apt-get install jq  # Linux

# 2. Get Cloudflare API Token
# Visit: https://dash.cloudflare.com/profile/api-tokens
# Create Token with "Zone.DNS.Edit" permission for ailydian.com

# 3. Set environment variable
export CLOUDFLARE_API_TOKEN="your-api-token-here"

# 4. Run automated script
./scripts/setup-sendgrid-cloudflare.sh
```

**Expected Output**:

```
✅ Zone ID: abc123...
✅ 1️⃣ SendGrid Click Tracking - Added successfully
✅ 2️⃣ SendGrid Domain Verification - Added successfully
✅ 3️⃣ SendGrid Email Sending Domain - Added successfully
✅ 4️⃣ DKIM Signature Key 1 - Added successfully
✅ 5️⃣ DKIM Signature Key 2 - Added successfully
✅ 6️⃣ DMARC Policy - Added successfully
```

**Propagation Time**: 1-5 minutes (Cloudflare is fast!)

---

## Option B: Vercel DNS (Automated) ▲

### Requirements

1. Domain must be added to Vercel DNS
2. Vercel CLI authenticated (`vercel login`)

### Setup Steps

```bash
# 1. Check if logged in
vercel whoami

# 2. Add domain to Vercel (if not already)
vercel domains add www.ailydian.com

# 3. Run automated script
./scripts/setup-sendgrid-dns.sh
```

**Note**: Currently, no Vercel domains detected. If you want to use Vercel DNS, first add the domain via Vercel dashboard or CLI.

**Propagation Time**: 15-30 minutes

---

## Option C: Manual DNS Setup (Any Provider) 📝

### Manual Entry Guide

**Log into your DNS provider's control panel** and add these 6 records:

#### 1️⃣ CNAME Record - Click Tracking

```
Type:  CNAME
Host:  url4343.www
Value: sendgrid.net
TTL:   3600 (or Auto)
```

#### 2️⃣ CNAME Record - Domain Verification

```
Type:  CNAME
Host:  58513307.www
Value: sendgrid.net
TTL:   3600 (or Auto)
```

#### 3️⃣ CNAME Record - Email Domain

```
Type:  CNAME
Host:  em8774.www
Value: u58513307.wl058.sendgrid.net
TTL:   3600 (or Auto)
```

#### 4️⃣ CNAME Record - DKIM Key 1

```
Type:  CNAME
Host:  s1._domainkey.www
Value: s1.domainkey.u58513307.wl058.sendgrid.net
TTL:   3600 (or Auto)
```

#### 5️⃣ CNAME Record - DKIM Key 2

```
Type:  CNAME
Host:  s2._domainkey.www
Value: s2.domainkey.u58513307.wl058.sendgrid.net
TTL:   3600 (or Auto)
```

#### 6️⃣ TXT Record - DMARC Policy

```
Type:  TXT
Host:  _dmarc.www
Value: v=DMARC1; p=none;
TTL:   3600 (or Auto)
```

**⚠️ Important**: If your DNS panel already shows `ailydian.com`, only enter the left part (e.g., `url4343.www`)

**Propagation Time**: 2-24 hours (varies by provider)

---

## Step 2: Verify DNS Propagation

Wait for DNS propagation, then verify using `dig` commands:

```bash
# Check CNAME records
dig url4343.www.ailydian.com CNAME +short
# Expected: sendgrid.net

dig 58513307.www.ailydian.com CNAME +short
# Expected: sendgrid.net

dig em8774.www.ailydian.com CNAME +short
# Expected: u58513307.wl058.sendgrid.net

# Check DKIM records
dig s1._domainkey.www.ailydian.com CNAME +short
# Expected: s1.domainkey.u58513307.wl058.sendgrid.net

dig s2._domainkey.www.ailydian.com CNAME +short
# Expected: s2.domainkey.u58513307.wl058.sendgrid.net

# Check DMARC record
dig _dmarc.www.ailydian.com TXT +short
# Expected: "v=DMARC1; p=none;"
```

**Online Tools**:

- https://dnschecker.org
- https://mxtoolbox.com/SuperTool.aspx

---

## Step 3: Verify in SendGrid Dashboard

1. Go to [SendGrid Dashboard](https://app.sendgrid.com)
2. Navigate to **Settings → Sender Authentication**
3. Find your domain `www.ailydian.com`
4. Click **Verify** button
5. Wait for verification (can take 24-48 hours after DNS propagation)
6. Status should change to **Verified** ✅

---

## Step 4: Add API Key to Vercel (Production)

### Option A: Vercel Dashboard (Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add these variables:

```
Name:  SENDGRID_API_KEY
Value: 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
Scope: Production, Preview, Development

Name:  SENDGRID_FROM_EMAIL
Value: noreply@www.ailydian.com
Scope: Production, Preview, Development

Name:  SENDGRID_FROM_NAME
Value: AILYDIAN
Scope: Production, Preview, Development
```

5. Click **Save**
6. Redeploy your project

### Option B: Vercel CLI

```bash
# Navigate to your project directory
cd /path/to/your/vercel/project

# Add environment variables
echo "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" | \
  vercel env add SENDGRID_API_KEY production preview development

echo "noreply@www.ailydian.com" | \
  vercel env add SENDGRID_FROM_EMAIL production preview development

echo "AILYDIAN" | \
  vercel env add SENDGRID_FROM_NAME production preview development

# Redeploy
vercel --prod
```

---

## Step 5: Local Development Setup

### Already Configured! ✅

The API key is already set in `.env.local`:

```bash
# Check configuration
cat .env.local

# Should show:
# SENDGRID_API_KEY=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
# SENDGRID_FROM_EMAIL=noreply@www.ailydian.com
# SENDGRID_FROM_NAME=AILYDIAN
```

**Note**: `.env.local` is in `.gitignore` and won't be committed to git 🔒

---

## Step 6: Test Email Sending

### Test Script (Node.js)

Create `test-sendgrid.js`:

```javascript
require('dotenv').config({ path: '.env.local' });
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'your-email@example.com', // Change to your email
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: 'SendGrid Test - www.ailydian.com',
  text: 'This is a test email from SendGrid integration!',
  html: '<strong>This is a test email from SendGrid integration!</strong>',
};

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email sent successfully!');
    console.log('📧 From:', process.env.SENDGRID_FROM_EMAIL);
    console.log('📬 To:', msg.to);
  })
  .catch(error => {
    console.error('❌ Error sending email:');
    console.error(error.response ? error.response.body : error);
  });
```

### Run Test

```bash
# Install SendGrid SDK (if not already)
npm install @sendgrid/mail dotenv

# Run test
node test-sendgrid.js
```

**Expected Output**:

```
✅ Email sent successfully!
📧 From: noreply@www.ailydian.com
📬 To: your-email@example.com
```

---

## 📊 Checklist

- [ ] **DNS Provider Identified** (Cloudflare/Vercel/Other)
- [ ] **DNS Records Added** (6 total)
- [ ] **DNS Propagation Verified** (`dig` commands)
- [ ] **SendGrid Domain Verified** (Dashboard status: Verified)
- [ ] **Vercel Env Variables Added** (Production/Preview/Dev)
- [ ] **Local Development Tested** (`.env.local` working)
- [ ] **Test Email Sent** (Received successfully)

---

## 🔒 Security Notes

✅ **Already Implemented**:

- API key in `.env.local` (gitignored)
- API key not in code repository
- Vercel env variables encrypted
- DKIM signatures enabled
- DMARC policy configured

⚠️ **Best Practices**:

- Rotate API keys every 90 days
- Use separate keys for dev/staging/production
- Monitor SendGrid dashboard for suspicious activity
- Enable SendGrid 2FA
- Review DMARC reports monthly

---

## 📚 Additional Resources

- **Full Documentation**: `docs/SENDGRID-DNS-SETUP.md`
- **SendGrid Docs**: https://docs.sendgrid.com
- **DNS Checker**: https://dnschecker.org
- **Vercel Env Vars**: https://vercel.com/docs/environment-variables

---

## 🆘 Troubleshooting

### Issue: DNS records not propagating

**Solution**:

1. Wait 24-48 hours for full propagation
2. Use multiple DNS checkers (dnschecker.org, whatsmydns.net)
3. Flush local DNS cache: `sudo dscacheutil -flushcache` (macOS)
4. Check for typos in DNS records

### Issue: SendGrid verification fails

**Solution**:

1. Verify all 6 DNS records are correctly added
2. Wait for DNS propagation (minimum 2-6 hours)
3. Check SendGrid Dashboard for specific error messages
4. Contact SendGrid support if still failing after 48 hours

### Issue: Emails not sending

**Solution**:

1. Check API key is correct in `.env.local` and Vercel
2. Verify domain is "Verified" in SendGrid Dashboard
3. Check SendGrid Activity Feed for error messages
4. Ensure from email matches verified domain (`noreply@www.ailydian.com`)
5. Check Vercel deployment logs for errors

---

**Generated by**: Claude Code (Sonnet 4.5)
**Date**: January 2, 2026
**Status**: ✅ Ready for DNS Setup

_Follow the steps above to complete SendGrid integration for www.ailydian.com_
