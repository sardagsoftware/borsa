# 🛡️ BunnyCDN Security & Cache Rules Setup

**Pull Zone:** ailydian-prod (ID: 4591275)
**Dashboard:** https://dash.bunny.net/cdn/4591275

---

## 🛡️ SECURITY EDGE RULES (7 Kurallar)

### Rule 1: Force HTTPS
```
Trigger:
  - IF Request Protocol = HTTP

Action:
  - Redirect to HTTPS (301)
  - URL Pattern: https://{url}
```

**Dashboard'da:**
1. Pull Zone → Edge Rules → Add Edge Rule
2. Name: `Force HTTPS`
3. Trigger: Request → Protocol → Equals → `http`
4. Action: Redirect → `https://{url}` → Status Code: `301`
5. ✅ Enable

---

### Rule 2: Block SQL Injection
```
Trigger:
  - IF URL Contains (case-insensitive):
    - SELECT
    - UNION
    - DROP
    - INSERT
    - DELETE
    - UPDATE
    - ;--
    - '
    - "

Action:
  - Return Status Code: 403
```

**Dashboard'da:**
1. Edge Rules → Add Edge Rule
2. Name: `Block SQL Injection`
3. Trigger: Request → URL → Contains Any (case-insensitive)
4. Patterns: `SELECT`, `UNION`, `DROP`, `INSERT`, `DELETE`, `UPDATE`, `;--`, `'`, `"`
5. Action: Set Status Code → `403`
6. ✅ Enable

---

### Rule 3: Block XSS Attacks
```
Trigger:
  - IF URL Contains (case-insensitive):
    - <script
    - javascript:
    - onerror=
    - onload=
    - eval(

Action:
  - Return Status Code: 403
```

**Dashboard'da:**
1. Edge Rules → Add Edge Rule
2. Name: `Block XSS`
3. Trigger: Request → URL → Contains Any (case-insensitive)
4. Patterns: `<script`, `javascript:`, `onerror=`, `onload=`, `eval(`
5. Action: Set Status Code → `403`
6. ✅ Enable

---

### Rule 4: Rate Limiting - General
```
Trigger:
  - IF Request Count > 100 per 60 seconds (same IP)

Action:
  - Return Status Code: 429
```

**Dashboard'da:**
1. Edge Rules → Add Edge Rule
2. Name: `Rate Limit General`
3. Trigger: Rate Limit → Requests per IP → `100` per `60` seconds
4. Action: Set Status Code → `429`
5. ✅ Enable

---

### Rule 5: Rate Limiting - API
```
Trigger:
  - IF URL Starts With: /api/
  - AND Request Count > 30 per 60 seconds (same IP)

Action:
  - Return Status Code: 429
```

**Dashboard'da:**
1. Edge Rules → Add Edge Rule
2. Name: `Rate Limit API`
3. Trigger 1: Request → URL → Starts With → `/api/`
4. Trigger 2: Rate Limit → Requests per IP → `30` per `60` seconds
5. Match Type: AND (all triggers must match)
6. Action: Set Status Code → `429`
7. ✅ Enable

---

### Rule 6: Block Bad Bots
```
Trigger:
  - IF User-Agent Contains (case-insensitive):
    - bot (but NOT googlebot, bingbot)
    - crawler
    - scraper
    - spider

Action:
  - Return Status Code: 403
```

**Dashboard'da:**
1. Edge Rules → Add Edge Rule
2. Name: `Block Bad Bots`
3. Trigger: Request → User-Agent → Contains Any (case-insensitive)
4. Patterns: `bot`, `crawler`, `scraper`, `spider`
5. Exception: User-Agent NOT Contains: `googlebot`, `bingbot`, `slurp`
6. Action: Set Status Code → `403`
7. ✅ Enable

---

### Rule 7: Security Headers
```
Action:
  - Add Response Headers (for all requests)
```

**Dashboard'da:**
1. Pull Zone → Settings (NOT Edge Rules)
2. Scroll to "Custom Headers"
3. Add Headers:
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   Referrer-Policy: strict-origin-when-cross-origin
   Permissions-Policy: camera=(), microphone=(), geolocation=()
   X-XSS-Protection: 1; mode=block
   ```

---

## ⚡ CACHE OPTIMIZATION RULES (4 Kurallar)

### Cache Rule 1: Static Assets (1 year)
```
Trigger:
  - IF URL Ends With:
    - .jpg, .jpeg, .png, .gif, .webp, .ico, .svg
    - .css, .js
    - .woff, .woff2, .ttf, .eot

Action:
  - Override Cache Time: 31536000 (1 year)
  - Set Browser Cache: 31536000 (1 year)
```

**Dashboard'da:**
1. Edge Rules → Add Edge Rule
2. Name: `Cache Static Assets`
3. Trigger: Request → URL → Ends With Any
4. Extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.ico`, `.svg`, `.css`, `.js`, `.woff`, `.woff2`, `.ttf`, `.eot`
5. Action: Override Cache Time → `31536000`
6. ✅ Enable

---

### Cache Rule 2: HTML Pages (1 hour)
```
Trigger:
  - IF URL Ends With: .html
  - OR URL is exactly: /

Action:
  - Override Cache Time: 3600 (1 hour)
  - Set Browser Cache: 3600 (1 hour)
```

**Dashboard'da:**
1. Edge Rules → Add Edge Rule
2. Name: `Cache HTML Pages`
3. Trigger 1: Request → URL → Ends With → `.html`
4. Trigger 2: Request → URL → Equals → `/`
5. Match Type: OR (any trigger)
6. Action: Override Cache Time → `3600`
7. ✅ Enable

---

### Cache Rule 3: API - No Cache
```
Trigger:
  - IF URL Starts With: /api/

Action:
  - Bypass Cache (no caching)
  - Add Header: Cache-Control: no-store, no-cache, must-revalidate
```

**Dashboard'da:**
1. Edge Rules → Add Edge Rule
2. Name: `No Cache for API`
3. Trigger: Request → URL → Starts With → `/api/`
4. Action: Override Cache Time → `0` (no cache)
5. Action 2: Set Response Header → `Cache-Control: no-store, no-cache, must-revalidate`
6. ✅ Enable

---

### Cache Rule 4: Media Files (1 month)
```
Trigger:
  - IF URL Ends With:
    - .mp4, .webm, .mov, .avi
    - .mp3, .wav, .ogg

Action:
  - Override Cache Time: 2592000 (30 days)
  - Set Browser Cache: 2592000 (30 days)
```

**Dashboard'da:**
1. Edge Rules → Add Edge Rule
2. Name: `Cache Media Files`
3. Trigger: Request → URL → Ends With Any
4. Extensions: `.mp4`, `.webm`, `.mov`, `.avi`, `.mp3`, `.wav`, `.ogg`
5. Action: Override Cache Time → `2592000`
6. ✅ Enable

---

## 📋 ADDITIONAL SETTINGS

### Compression
**Pull Zone → Settings → Optimization:**
```
✅ Enable Brotli Compression
✅ Enable Gzip Compression
✅ Enable WebP Optimization (if available)
```

### Query String Handling
**Pull Zone → Settings → Caching:**
```
✅ Enable Query String Ordering
❌ Ignore Query Strings (keep disabled)
```

### Origin Shield
**Pull Zone → Settings → Origin:**
```
✅ Enable Origin Shield
Region: EU (Frankfurt) - already enabled
```

---

## 🚀 Quick Setup Commands

Dashboard açmak için:
```bash
open https://dash.bunny.net/cdn/4591275
```

---

## ✅ Setup Checklist

### Security Rules (Dashboard → Edge Rules)
- [ ] Rule 1: Force HTTPS
- [ ] Rule 2: Block SQL Injection
- [ ] Rule 3: Block XSS
- [ ] Rule 4: Rate Limit General (100/min)
- [ ] Rule 5: Rate Limit API (30/min)
- [ ] Rule 6: Block Bad Bots
- [ ] Rule 7: Security Headers (in Settings)

### Cache Rules (Dashboard → Edge Rules)
- [ ] Cache Rule 1: Static Assets (1 year)
- [ ] Cache Rule 2: HTML Pages (1 hour)
- [ ] Cache Rule 3: API No Cache
- [ ] Cache Rule 4: Media Files (1 month)

### Additional Settings
- [ ] Enable Brotli Compression
- [ ] Enable Gzip Compression
- [ ] Enable Query String Ordering
- [ ] Verify Origin Shield (EU)

---

## 🧪 Validation After Setup

Rule'lar eklendikten sonra test edin:

```bash
# Force HTTPS test
curl -I http://ailydian-prod.b-cdn.net/

# SQL Injection test (403 olmalı)
curl -I "https://ailydian-prod.b-cdn.net/?id=1%20UNION%20SELECT"

# XSS test (403 olmalı)
curl -I "https://ailydian-prod.b-cdn.net/?x=<script>alert(1)</script>"

# Cache test (static files)
curl -I https://ailydian-prod.b-cdn.net/images/logo.png | grep -i cache

# API no-cache test
curl -I https://ailydian-prod.b-cdn.net/api/health | grep -i cache
```

---

## 📊 Expected Results

After setup:
- ✅ All HTTP → HTTPS redirects
- ✅ SQL injection blocked (403)
- ✅ XSS attacks blocked (403)
- ✅ Rate limits enforced (429)
- ✅ Bad bots blocked (403)
- ✅ Security headers added
- ✅ Static files cached 1 year
- ✅ HTML cached 1 hour
- ✅ API not cached
- ✅ Media files cached 1 month

---

**Created:** 5 Ekim 2025
**Pull Zone:** ailydian-prod
**Status:** Ready for manual setup
