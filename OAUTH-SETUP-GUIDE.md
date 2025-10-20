# 🔐 OAuth Setup Guide - LyDian Ultra Pro

Complete guide to configure Google, GitHub, Apple, and Microsoft OAuth authentication.

## 📋 Table of Contents

1. [Google OAuth](#google-oauth)
2. [GitHub OAuth](#github-oauth)
3. [Apple Sign In](#apple-sign-in)
4. [Microsoft OAuth](#microsoft-oauth)
5. [Testing OAuth](#testing-oauth)

---

## 1. Google OAuth

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**

### Step 2: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3100/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
5. Copy **Client ID** and **Client Secret**

### Step 3: Add to .env

```bash
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3100/api/auth/google/callback
```

---

## 2. GitHub OAuth

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in details:
   - **Application name**: LyDian Ultra Pro
   - **Homepage URL**: `http://localhost:3100`
   - **Authorization callback URL**: `http://localhost:3100/api/auth/github/callback`
4. Click **Register application**

### Step 2: Generate Client Secret

1. Click **Generate a new client secret**
2. Copy **Client ID** and **Client Secret**

### Step 3: Add to .env

```bash
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
GITHUB_CALLBACK_URL=http://localhost:3100/api/auth/github/callback
```

---

## 3. Apple Sign In

### Step 1: Create Apple Developer Account

1. Go to [Apple Developer](https://developer.apple.com/)
2. Enroll in Apple Developer Program ($99/year)

### Step 2: Create App ID

1. Go to **Certificates, Identifiers & Profiles**
2. Click **Identifiers** → **+** button
3. Select **App IDs** → **App**
4. Fill in details:
   - **Description**: LyDian Ultra Pro
   - **Bundle ID**: `com.ailydian.service`
5. Enable **Sign in with Apple**

### Step 3: Create Service ID

1. Click **Identifiers** → **+** button
2. Select **Services IDs**
3. Fill in details:
   - **Description**: LyDian Web Service
   - **Identifier**: `com.ailydian.service`
4. Enable **Sign in with Apple**
5. Configure:
   - **Domains**: `localhost` (dev), `yourdomain.com` (prod)
   - **Return URLs**: `http://localhost:3100/api/auth/apple/callback`

### Step 4: Create Private Key

1. Click **Keys** → **+** button
2. Enable **Sign in with Apple**
3. Download the `.p8` key file
4. Note the **Key ID**

### Step 5: Add to .env

```bash
APPLE_CLIENT_ID=com.ailydian.service
APPLE_TEAM_ID=ABC123DEFG
APPLE_KEY_ID=XYZ789HIJK
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----"
APPLE_CALLBACK_URL=http://localhost:3100/api/auth/apple/callback
```

---

## 4. Microsoft OAuth

### Step 1: Create Azure AD App

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**

### Step 2: Configure App

1. Fill in details:
   - **Name**: LyDian Ultra Pro
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
2. Add redirect URI:
   - **Platform**: Web
   - **Redirect URI**: `http://localhost:3100/api/auth/microsoft/callback`

### Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Set expiration and copy the **Value**

### Step 4: Add to .env

```bash
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789012
MICROSOFT_CLIENT_SECRET=abc~def123456789-_ABCDEFGHIJK
MICROSOFT_CALLBACK_URL=http://localhost:3100/api/auth/microsoft/callback
```

---

## 5. Testing OAuth

### Local Testing

1. Start the server:
```bash
cd ~/Desktop/ailydian-ultra-pro
npm install
PORT=3100 node server.js
```

2. Open browser:
```
http://localhost:3100/auth.html
```

3. Click on OAuth buttons:
- **Google ile devam et** → Google OAuth flow
- **GitHub ile devam et** → GitHub OAuth flow
- **Apple ile devam et** → Apple OAuth flow
- **Microsoft Hesabı ile devam et** → Microsoft OAuth flow

### Verify Success

After successful OAuth:
- User is redirected to `/dashboard.html`
- JWT token is stored in localStorage
- User data is available in session

### Troubleshooting

**Google OAuth fails:**
- Check if Google+ API is enabled
- Verify redirect URI matches exactly
- Check Client ID and Secret are correct

**GitHub OAuth fails:**
- Verify callback URL in GitHub app settings
- Check if app is not suspended
- Ensure email scope is requested

**Apple OAuth fails:**
- Verify all identifiers match
- Check private key format
- Ensure domains are configured

**Microsoft OAuth fails:**
- Check Azure AD app configuration
- Verify supported account types
- Ensure redirect URI is added

---

## 📝 Production Checklist

Before deploying to production:

- [ ] Update all callback URLs to production domain
- [ ] Enable HTTPS redirect URIs only
- [ ] Store secrets in secure environment variables
- [ ] Enable OAuth consent screen branding
- [ ] Add privacy policy and terms of service URLs
- [ ] Test all OAuth flows on production
- [ ] Monitor OAuth error rates
- [ ] Set up OAuth analytics

---

## 🔒 Security Best Practices

1. **Never commit OAuth secrets** to version control
2. **Use different credentials** for dev/staging/production
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Enable 2FA** on all provider accounts
5. **Monitor OAuth logs** for suspicious activity
6. **Implement rate limiting** on OAuth endpoints
7. **Validate all tokens** server-side
8. **Use HTTPS only** in production

---

## 📚 Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Microsoft OAuth Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

---

## 🆘 Support

For issues or questions:
- Open an issue on GitHub
- Contact: support@ailydian.com
- Documentation: https://docs.ailydian.com

---

**Last Updated**: 2025-01-02
**Version**: 1.0.0
