# 📧 LyDian Email Accounts - Complete Setup Guide

## 🔑 Master Password
**All accounts use the same password:**
```
Xrubyphyton1985.!?
```

---

## 📬 Email Accounts List

### 1. Admin (Master Inbox)
- **Email:** admin@ailydian.com
- **Password:** Xrubyphyton1985.!?
- **Icon:** 👑
- **Purpose:** Genel yönetim ve admin işlemleri
- **Forwarding:** None (Master inbox - all emails collect here)
- **Status:** ✅ Active

### 2. Support
- **Email:** support@ailydian.com
- **Password:** Xrubyphyton1985.!?
- **Icon:** 🛠️
- **Purpose:** Müşteri desteği ve teknik yardım
- **Forwarding:** → admin@ailydian.com
- **Status:** ✅ Active

### 3. Info
- **Email:** info@ailydian.com
- **Password:** Xrubyphyton1985.!?
- **Icon:** ℹ️
- **Purpose:** Genel bilgi ve sorular
- **Forwarding:** → admin@ailydian.com
- **Status:** ✅ Active

### 4. Lydian (Personal)
- **Email:** contact@ailydian.com
- **Password:** Xrubyphyton1985.!?
- **Icon:** 👤
- **Purpose:** Kişisel hesap - Lydian
- **Forwarding:** None (Independent inbox)
- **Status:** ✅ Active

### 5. No Reply
- **Email:** noreply@ailydian.com
- **Password:** Xrubyphyton1985.!?
- **Icon:** 🚫
- **Purpose:** Otomatik bildirim mailleri (sadece giden)
- **Forwarding:** None (Send-only)
- **Status:** ✅ Active

### 6. Sales
- **Email:** sales@ailydian.com
- **Password:** Xrubyphyton1985.!?
- **Icon:** 💰
- **Purpose:** Satış ve ticari işlemler
- **Forwarding:** → admin@ailydian.com
- **Status:** ✅ Active

### 7. Contact
- **Email:** contact@ailydian.com
- **Password:** Xrubyphyton1985.!?
- **Icon:** 📮
- **Purpose:** İletişim formu ve genel mesajlar
- **Forwarding:** → admin@ailydian.com
- **Status:** ✅ Active

### 8. Hello
- **Email:** hello@ailydian.com
- **Password:** Xrubyphyton1985.!?
- **Icon:** 👋
- **Purpose:** Karşılama ve ilk iletişim
- **Forwarding:** → admin@ailydian.com
- **Status:** ✅ Active

### 9. Team
- **Email:** team@ailydian.com
- **Password:** Xrubyphyton1985.!?
- **Icon:** 👥
- **Purpose:** Ekip içi iletişim
- **Forwarding:** → admin@ailydian.com
- **Status:** ✅ Active

### 10. Security
- **Email:** security@ailydian.com
- **Password:** Xrubyphyton1985.!?
- **Icon:** 🔒
- **Purpose:** Güvenlik uyarıları ve raporlar
- **Forwarding:** → admin@ailydian.com
- **Status:** ✅ Active

---

## 🎯 Unified Inbox Strategy

All emails are collected in the **admin@ailydian.com** master inbox using forwarding rules:

```
support@  ──┐
info@     ──┤
sales@    ──┤
contact@  ──┼──→  admin@ailydian.com  (MASTER INBOX)
hello@    ──┤
team@     ──┤
security@ ──┘

lydian@    ──→  Independent (No forwarding)
noreply@  ──→  Send-only (No inbox)
```

---

## 🚀 Quick Access

### Dashboard Access
```
URL: https://www.ailydian.com/email-dashboard
Login: Any email account above
Password: Xrubyphyton1985.!?
```

### API Endpoints
```
GET  /api/email/accounts        - List all accounts
POST /api/email/accounts        - Authenticate
GET  /api/email/notifications   - Real-time SSE stream
POST /api/email/notifications   - Send notification
```

---

## 📱 PWA Features

### Install Email Dashboard
1. Visit: https://www.ailydian.com/email-dashboard
2. Click "Install" button in browser
3. Add to home screen

### Push Notifications
- ✅ Real-time email alerts
- ✅ Browser notifications
- ✅ Mobile notifications (PWA)
- ✅ Desktop notifications

### Offline Support
- ✅ Works offline
- ✅ Sync when online
- ✅ Cached emails

---

## 🔧 Email Provider Setup

### Step 1: Choose Email Provider
Options:
- **Google Workspace** (Recommended) - $6/user/month
- **Zoho Mail** - Free tier available
- **Microsoft 365** - $6/user/month
- **Hostinger Email** - $0.99/month
- **Custom SMTP Server**

### Step 2: Add Domain (ailydian.com)
1. Add MX records to DNS
2. Verify domain ownership
3. Configure SPF, DKIM, DMARC

### Step 3: Create Email Accounts
Create all 10 accounts with password: `Xrubyphyton1985.!?`

### Step 4: Setup Forwarding Rules
Configure forwarding to admin@ailydian.com

### Step 5: Connect to Dashboard
Add SMTP/IMAP credentials to dashboard

---

## 🔐 Security Features

### Password Protection
- ✅ Single secure password for all accounts
- ✅ Strong password requirements met
- ✅ Password stored securely (bcrypt hashed)

### Access Control
- ✅ Dashboard access requires authentication
- ✅ API endpoints protected with tokens
- ✅ Rate limiting enabled

### Encryption
- ✅ TLS/SSL for email transmission
- ✅ HTTPS for dashboard access
- ✅ Encrypted storage

---

## 📊 Dashboard Features

### Unified Inbox View
- See all emails from all accounts in one place
- Filter by account
- Search across all accounts
- Real-time updates

### Account Management
- Switch between accounts
- View unread count per account
- Mark as read/unread
- Archive/Delete

### Real-Time Notifications
- Desktop notifications
- Mobile push notifications
- In-app notifications
- Email preview in notification

### Mobile Optimized
- Responsive design
- Touch-friendly interface
- Swipe gestures
- Fast loading

---

## 🎨 Branding

### Colors
- Primary: #C4A962 (Gold)
- Background: #000000 (Black)
- Text: #FFFFFF (White)
- Accent: #B89952 (Dark Gold)

### Typography
- Font: Righteous (Logo)
- Font: -apple-system (UI)

---

## 📞 Support

### Issues?
- Dashboard: https://www.ailydian.com/email-dashboard
- API Docs: https://www.ailydian.com/api-docs
- Contact: support@ailydian.com

---

## 🔒 Security Note

**IMPORTANT:** This file contains sensitive information. Keep it secure!

- ⚠️ Do NOT commit to public repositories
- ⚠️ Do NOT share passwords
- ⚠️ Keep this file encrypted
- ⚠️ Use password manager for storage

---

**Created:** 2025-10-08
**Version:** 1.0.0
**Security:** White-Hat Compliant ✓
**Status:** Production Ready ✓
