# SendGrid DNS Setup - www.ailydian.com

**Domain**: www.ailydian.com
**Purpose**: Email authentication (Domain Authentication + DKIM + DMARC)
**Date**: January 2, 2026

---

## 📋 DNS Records to Add (6 Total)

### ✅ 1. CNAME - SendGrid Tracking Domain

```
Type:  CNAME
Host:  url4343.www
Value: sendgrid.net
TTL:   3600 (or Auto)
```

**Purpose**: Click tracking and link branding

---

### ✅ 2. CNAME - SendGrid Subdomain

```
Type:  CNAME
Host:  58513307.www
Value: sendgrid.net
TTL:   3600 (or Auto)
```

**Purpose**: Email domain verification

---

### ✅ 3. CNAME - Email Subdomain

```
Type:  CNAME
Host:  em8774.www
Value: u58513307.wl058.sendgrid.net
TTL:   3600 (or Auto)
```

**Purpose**: Email sending domain

---

### ✅ 4. CNAME - DKIM Key 1

```
Type:  CNAME
Host:  s1._domainkey.www
Value: s1.domainkey.u58513307.wl058.sendgrid.net
TTL:   3600 (or Auto)
```

**Purpose**: DomainKeys Identified Mail (DKIM) signature - Key 1

---

### ✅ 5. CNAME - DKIM Key 2

```
Type:  CNAME
Host:  s2._domainkey.www
Value: s2.domainkey.u58513307.wl058.sendgrid.net
TTL:   3600 (or Auto)
```

**Purpose**: DomainKeys Identified Mail (DKIM) signature - Key 2

---

### ✅ 6. TXT - DMARC Policy

```
Type:  TXT
Host:  _dmarc.www
Value: v=DMARC1; p=none;
TTL:   3600 (or Auto)
```

**Purpose**: DMARC (Domain-based Message Authentication, Reporting & Conformance)

**Note**: If your DNS panel requires Turkish, use `p=yok` instead of `p=none`

---

## 🚀 Quick Setup Guide

### Option 1: Vercel DNS (Recommended if using Vercel)

```bash
# Add DNS records via Vercel CLI
vercel dns add www.ailydian.com url4343.www CNAME sendgrid.net
vercel dns add www.ailydian.com 58513307.www CNAME sendgrid.net
vercel dns add www.ailydian.com em8774.www CNAME u58513307.wl058.sendgrid.net
vercel dns add www.ailydian.com s1._domainkey.www CNAME s1.domainkey.u58513307.wl058.sendgrid.net
vercel dns add www.ailydian.com s2._domainkey.www CNAME s2.domainkey.u58513307.wl058.sendgrid.net
vercel dns add www.ailydian.com _dmarc.www TXT "v=DMARC1; p=none;"
```

### Option 2: Cloudflare DNS

1. Go to Cloudflare Dashboard → DNS → Records
2. Click "Add record" for each entry above
3. Select record type (CNAME or TXT)
4. Enter Host/Name (e.g., `url4343.www`)
5. Enter Value/Target
6. Set Proxy status to "DNS only" (gray cloud)
7. Click "Save"

### Option 3: Manual DNS Panel

Copy the records above and paste into your DNS provider's panel:

- **Namecheap**: Advanced DNS → Add New Record
- **GoDaddy**: DNS Management → Add Record
- **Name.com**: DNS Records → Add Record
- **Google Domains**: DNS → Custom records

---

## 🔍 Verification Steps

### 1. Check DNS Propagation (after adding records)

```bash
# Check CNAME records
dig url4343.www.ailydian.com CNAME +short
dig 58513307.www.ailydian.com CNAME +short
dig em8774.www.ailydian.com CNAME +short

# Check DKIM records
dig s1._domainkey.www.ailydian.com CNAME +short
dig s2._domainkey.www.ailydian.com CNAME +short

# Check DMARC record
dig _dmarc.www.ailydian.com TXT +short
```

**Expected Results**:

- CNAME records should return SendGrid targets
- DMARC TXT should return `"v=DMARC1; p=none;"`

### 2. Verify in SendGrid Dashboard

1. Go to SendGrid → Settings → Sender Authentication
2. Click "Verify" next to your domain
3. Wait for DNS propagation (can take 24-48 hours)
4. Status should change to "Verified" ✅

### 3. Test Email Sending

Once verified, test sending an email:

```bash
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer YOUR_SENDGRID_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "noreply@www.ailydian.com"},
    "subject": "SendGrid DNS Test",
    "content": [{"type": "text/plain", "value": "DNS setup successful!"}]
  }'
```

---

## 📊 DNS Record Summary Table

| #   | Type  | Host               | Value                                     | Purpose             |
| --- | ----- | ------------------ | ----------------------------------------- | ------------------- |
| 1   | CNAME | url4343.www        | sendgrid.net                              | Click tracking      |
| 2   | CNAME | 58513307.www       | sendgrid.net                              | Domain verification |
| 3   | CNAME | em8774.www         | u58513307.wl058.sendgrid.net              | Email sending       |
| 4   | CNAME | s1.\_domainkey.www | s1.domainkey.u58513307.wl058.sendgrid.net | DKIM Key 1          |
| 5   | CNAME | s2.\_domainkey.www | s2.domainkey.u58513307.wl058.sendgrid.net | DKIM Key 2          |
| 6   | TXT   | \_dmarc.www        | v=DMARC1; p=none;                         | DMARC Policy        |

---

## ⚠️ Important Notes

### DNS Panel Specifics

**If your DNS panel shows "ailydian.com" as the base domain:**

- Use ONLY the left side of the host (e.g., `url4343.www`)
- The panel will automatically append `.ailydian.com`
- Result: `url4343.www.ailydian.com` ✅

**Full vs Relative Hostnames:**

- Some panels want: `url4343.www` (relative)
- Others want: `url4343.www.ailydian.com` (absolute)
- Check your DNS panel's convention

### DMARC Policy

**Current**: `p=none` (monitor only, no enforcement)

**Future Options**:

- `p=quarantine` - Send suspicious emails to spam
- `p=reject` - Reject unauthenticated emails

**Recommended**: Start with `p=none`, monitor for 2-4 weeks, then upgrade to `p=quarantine`

### Propagation Time

- **Minimum**: 15-30 minutes
- **Typical**: 2-6 hours
- **Maximum**: 24-48 hours

Use https://dnschecker.org to check propagation globally.

---

## 🔧 Troubleshooting

### Issue: DNS records not propagating

**Solution**:

1. Check TTL settings (should be 3600 or lower)
2. Flush local DNS cache: `sudo dscacheutil -flushcache` (macOS)
3. Wait 24-48 hours for full propagation
4. Use different DNS checker tools

### Issue: SendGrid verification fails

**Solution**:

1. Double-check all 6 records are added correctly
2. Ensure no typos in hostnames or values
3. Check for trailing dots (some DNS panels add them)
4. Wait for full DNS propagation
5. Contact SendGrid support if still failing

### Issue: DMARC policy rejected

**Solution**:

- If DNS panel rejects `p=none`, try:
  - `p=yok` (Turkish)
  - `p=reject` (stricter but works)
  - Contact DNS provider support

---

## 📚 Additional Resources

- [SendGrid DNS Setup Guide](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
- [DKIM Explained](https://docs.sendgrid.com/glossary/dkim)
- [DMARC Best Practices](https://docs.sendgrid.com/glossary/dmarc)
- [DNS Propagation Checker](https://dnschecker.org)

---

## ✅ Next Steps

After DNS records are verified:

1. [ ] Add SendGrid API Key to Vercel environment variables
2. [ ] Configure email templates in SendGrid
3. [ ] Set up email sending service in application
4. [ ] Test email delivery
5. [ ] Monitor DMARC reports (optional)

---

**Generated by**: Claude Code (Sonnet 4.5)
**Date**: January 2, 2026
**Project**: www.ailydian.com
**Status**: Ready for DNS setup

_Follow the guide above to complete SendGrid domain authentication._
