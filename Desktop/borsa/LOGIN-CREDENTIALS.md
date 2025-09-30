# 🔐 LYDIAN TRADER - Login Credentials

## Production Access

**URL:** https://borsa.ailydian.com/login

### Demo Account

```
Email:    demo@ailydian.com
Password: Demo2025!
```

---

## Testing Credentials

✅ **Credentials have been verified and tested**
- Password hash generated with bcrypt (cost factor 12)
- Login authentication working correctly
- JWT token generation successful

Run test: `node test-login.js`

---

## Vercel Environment Variables

These variables must be set in Vercel dashboard:

```bash
ADMIN_EMAIL=demo@ailydian.com
PASSWORD_HASH=$2b$12$PvxW9uiX4ImXi/vLDhHnXOgnF1cnTchlNAyi0/wN04qc6/GSjSTVS
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars-12345678
NODE_ENV=production
```

**How to update Vercel:**
1. Go to https://vercel.com/dashboard
2. Select project: `borsa`
3. Settings → Environment Variables
4. Update `ADMIN_EMAIL` and `PASSWORD_HASH`
5. Redeploy

---

## Security Notes

⚠️ **IMPORTANT:**
- This is a **DEMO** account for testing purposes
- Never use these credentials in a real production environment
- Always change default credentials immediately after deployment
- Use strong, unique passwords (min 16 characters)
- Enable 2FA if available
- Rotate credentials regularly

---

## Troubleshooting

### "Invalid credentials" error
1. Verify Vercel environment variables are set correctly
2. Check password is exactly: `Demo2025!` (case-sensitive)
3. Clear browser cookies and try again
4. Run `node test-login.js` to verify hash

### "Unauthorized" error
1. Make sure you're logged in
2. Check JWT token hasn't expired (24h validity)
3. Try logging out and back in

---

## Password Change Instructions

To generate a new password hash:

```bash
# Edit generate-hash.js with new password
# Then run:
node generate-hash.js

# Copy the hash output and update:
# 1. Vercel environment variable: PASSWORD_HASH
# 2. This file for documentation
# 3. .env.local for local development
```

---

**Last Updated:** 2025-09-30
**Verified:** ✅ Working