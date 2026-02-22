# LyDian AI - Index Bridge
**PHASE D: INDEX TRIGGER (API-based)**

Ethical, API-based URL submission to search engines and AI platforms for LyDian discovery feeds.

---

## Purpose

Submit LyDian AI discovery feeds to:
- **Search Engines:** Google, Bing, Yandex
- **AI Platforms:** OpenAI, Gemini, Perplexity, Brave Search

**Policy:** White-Hat · 0 Mock · Secrets Masked · API-based only

---

## Features

- ✅ Google Indexing API (200 URLs/day)
- ✅ Bing URL Submission API (10 URLs/day)
- ✅ Yandex Webmaster API (100 URLs/day)
- ✅ AI Platform discovery pinging
- ✅ Exponential backoff for rate limits (429, 403)
- ✅ Secret masking (first4...last3)
- ✅ JSON reports with timestamps
- ✅ Error handling and retry logic

---

## Installation

### 1. Install Python Dependencies

```bash
cd /home/lydian/Desktop/ailydian-ultra-pro/ops/index_bridge
pip install -r requirements.txt
```

### 2. Configure API Credentials

#### Google Indexing API

1. **Create Service Account:**
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
   - Create new service account
   - Name: `lydian-indexing-bot`
   - Grant role: `Indexing API User`

2. **Download JSON Key:**
   - Click on service account
   - Keys → Add Key → Create new key → JSON
   - Save as `google-service-account.json`

3. **Enable Indexing API:**
   - Go to: https://console.cloud.google.com/apis/library/indexing.googleapis.com
   - Click "Enable"

4. **Add Service Account to Search Console:**
   - Go to: https://search.google.com/search-console
   - Select property: `https://www.ailydian.com`
   - Settings → Users and permissions → Add user
   - Email: `lydian-indexing-bot@PROJECT_ID.iam.gserviceaccount.com`
   - Permission: Owner

5. **Set Environment Variable:**
   ```bash
   export GOOGLE_SERVICE_ACCOUNT_JSON="/path/to/google-service-account.json"
   ```

#### Bing Webmaster API

1. **Get API Key:**
   - Go to: https://www.bing.com/webmasters
   - Settings → API access → Get API Key
   - Copy API key

2. **Set Environment Variable:**
   ```bash
   export BING_WEBMASTER_API_KEY="your_api_key_here"
   ```

#### Yandex Webmaster API

1. **Create OAuth Application:**
   - Go to: https://oauth.yandex.com/
   - Register new application
   - Permissions: `webmaster:list`, `webmaster:read`, `webmaster:write`

2. **Get OAuth Token:**
   ```bash
   # Get authorization code
   open "https://oauth.yandex.com/authorize?response_type=code&client_id=YOUR_CLIENT_ID"

   # Exchange for token
   curl -X POST https://oauth.yandex.com/token \
     -d grant_type=authorization_code \
     -d code=YOUR_AUTH_CODE \
     -d client_id=YOUR_CLIENT_ID \
     -d client_secret=YOUR_CLIENT_SECRET
   ```

3. **Get User ID and Host ID:**
   ```bash
   # Get user ID
   curl -H "Authorization: OAuth YOUR_TOKEN" \
     https://api.webmaster.yandex.net/v4/user

   # Get host ID
   curl -H "Authorization: OAuth YOUR_TOKEN" \
     https://api.webmaster.yandex.net/v4/user/YOUR_USER_ID/hosts
   ```

4. **Set Environment Variables:**
   ```bash
   export YANDEX_WEBMASTER_TOKEN="your_oauth_token"
   export YANDEX_USER_ID="12345"
   export YANDEX_HOST_ID="https:ailydian.com:443"
   ```

---

## Usage

### Submit to Google

```bash
python index_trigger.py --platform google
```

**Output:**
```
[2025-10-09 12:00:00 UTC] [INFO] [Google] Starting Google Indexing API submission for 3 URLs
[2025-10-09 12:00:01 UTC] [INFO] [Google] Authenticated with token: sk_t...xyz
[2025-10-09 12:00:02 UTC] [INFO] [Google] ✅ Submitted: https://www.ailydian.com/llms.txt
[2025-10-09 12:00:03 UTC] [INFO] [Google] ✅ Submitted: https://www.ailydian.com/feed/ai_models.json
[2025-10-09 12:00:04 UTC] [INFO] [Google] ✅ Submitted: https://www.ailydian.com/feed/ai_models.rss
[2025-10-09 12:00:05 UTC] [INFO] [Google] Submission complete: 3/3 successful
```

### Submit to Bing

```bash
python index_trigger.py --platform bing
```

### Submit to Yandex

```bash
python index_trigger.py --platform yandex
```

### Submit to All Platforms

```bash
python index_trigger.py --platform all
```

### Ping AI Platforms

```bash
python index_trigger.py --ping-ai-platforms
```

**Output:**
```
[2025-10-09 12:00:00 UTC] [INFO] [AI-Ping] Pinging AI platform discovery endpoints...
[2025-10-09 12:00:01 UTC] [INFO] [AI-Ping] ✅ OpenAI: Accessible (200)
[2025-10-09 12:00:02 UTC] [INFO] [AI-Ping] ✅ Gemini (Googlebot): Accessible (200)
[2025-10-09 12:00:03 UTC] [INFO] [AI-Ping] ✅ Perplexity: Accessible (200)
[2025-10-09 12:00:04 UTC] [INFO] [AI-Ping] ✅ Brave Search: Accessible (200)
[2025-10-09 12:00:05 UTC] [INFO] [AI-Ping] Ping complete: 4/4 platforms accessible
```

### Custom URL File

```bash
python index_trigger.py --platform google --urls custom_urls.txt
```

### Custom Output Report

```bash
python index_trigger.py --platform google --output reports/google_submission.json
```

---

## Reports

Submission reports are saved to `ops/artifacts/index_submission_report_{platform}.json`:

```json
{
  "platform": "google",
  "timestamp": "2025-10-09T12:00:05Z",
  "stats": {
    "submitted": 3,
    "success": 3,
    "failed": 0,
    "errors": []
  },
  "policy_compliance": "White-Hat · 0 Mock · Secrets Masked · API-based"
}
```

---

## Rate Limits

| Platform | Daily Quota | Per Request |
|----------|-------------|-------------|
| Google Indexing API | 200 URLs | 1 URL |
| Bing URL Submission API | 10 URLs | Batch (up to 10) |
| Yandex Webmaster API | 100 URLs | 1 URL |

**Note:** Script includes 1-second delay between requests to avoid rate limiting.

---

## Error Handling

### 429 (Rate Limit Exceeded)
- **Action:** Exponential backoff (1s, 2s, 4s, 8s, ..., max 60s)
- **Max Retries:** 3

### 403 (Forbidden)
- **Cause:** Service account lacks permissions
- **Solution:** Add service account to Search Console as Owner

### 401 (Unauthorized)
- **Cause:** Invalid or expired token
- **Solution:** Regenerate API token or OAuth token

---

## Security Best Practices

### 1. Secret Storage

**DO NOT commit secrets to git:**
```bash
# Store in ~/.env
echo "GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/key.json" >> ~/.env
echo "BING_WEBMASTER_API_KEY=your_key" >> ~/.env
echo "YANDEX_WEBMASTER_TOKEN=your_token" >> ~/.env
chmod 600 ~/.env

# Load in shell
source ~/.env
```

### 2. Secret Masking

All logs mask secrets using `first4...last3` pattern:
```python
mask_secret("sk_test_1234567890abcdef")
# Output: "sk_t...def"
```

### 3. Service Account Permissions

Only grant minimal required permissions:
- Google: `Indexing API User` role only
- Bing: Read-only for most operations
- Yandex: `webmaster:write` scope only

---

## Troubleshooting

### Google: "Service account not found"
1. Verify service account email in IAM console
2. Check service account added to Search Console
3. Wait 5-10 minutes for propagation

### Bing: "Site not found"
1. Verify site ownership in Bing Webmaster Tools
2. Ensure `siteUrl` matches exactly (including www/non-www)
3. Check API key is valid

### Yandex: "Host not found"
1. Verify host added to Yandex Webmaster
2. Check `host_id` format: `https:ailydian.com:443`
3. Ensure OAuth token has correct scopes

### Rate Limiting
If you hit rate limits:
- Reduce URL count to stay under daily quota
- Spread submissions across multiple days
- Use batch API where available (Bing)

---

## Verification

### Check Submission Status

**Google Search Console:**
```bash
open https://search.google.com/search-console?resource_id=https://www.ailydian.com
# Go to: Coverage → Valid
```

**Bing Webmaster Tools:**
```bash
open https://www.bing.com/webmasters
# Go to: URL Inspection → Enter URL
```

**Yandex Webmaster:**
```bash
open https://webmaster.yandex.com/site/https:ailydian.com:443/indexing/reindex/
```

### Check Indexing Status

```bash
# Google
curl "https://www.google.com/search?q=site:www.ailydian.com/feed/ai_models.json"

# Bing
curl "https://www.bing.com/search?q=site:www.ailydian.com/feed/ai_models.json"

# Yandex
curl "https://yandex.com/search/?text=site:www.ailydian.com/feed/ai_models.json"
```

---

## Automation

### Daily Cron Job

```bash
# Edit crontab
crontab -e

# Add daily submission at 03:00 UTC
0 3 * * * source ~/.env && cd /home/lydian/Desktop/ailydian-ultra-pro/ops/index_bridge && python index_trigger.py --platform all >> logs/index_bridge.log 2>&1
```

### CI/CD Integration (GitHub Actions)

```yaml
name: Index Submission

on:
  schedule:
    - cron: '0 3 * * *'  # Daily at 03:00 UTC
  workflow_dispatch:

jobs:
  submit-urls:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd ops/index_bridge
          pip install -r requirements.txt

      - name: Submit to Google
        env:
          GOOGLE_SERVICE_ACCOUNT_JSON: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_JSON }}
        run: |
          cd ops/index_bridge
          python index_trigger.py --platform google

      - name: Submit to Bing
        env:
          BING_WEBMASTER_API_KEY: ${{ secrets.BING_WEBMASTER_API_KEY }}
        run: |
          cd ops/index_bridge
          python index_trigger.py --platform bing
```

---

## Next Steps (PHASE E)

After successful submission:
1. Monitor indexing status in Search Console
2. Check Google Search for indexed pages
3. Verify AI platforms can access feeds
4. Set up daily monitoring cron job
5. Create PHASE E verification report

---

## Support

- **Documentation:** /docs/BRIEF_PHASE_D.md
- **Issues:** Contact discovery@ailydian.com
- **Policy:** White-Hat · 0 Mock · Secrets Masked · API-based

---

**Generated:** 2025-10-09T16:00:00Z
**Status:** Ready for API key configuration and testing
