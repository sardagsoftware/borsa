# Hugging Face Setup Guide
**LyDian Discovery Feed - Manual Setup Instructions**

**Status:** API token not configured (per "0 mock" policy, manual setup required)

---

## Prerequisites

1. **Hugging Face Account**
   - Sign up: https://huggingface.co/join
   - Verify email

2. **API Token**
   - Go to: https://huggingface.co/settings/tokens
   - Click "New token"
   - Name: `lydian-discovery-publish`
   - Type: **Write** (required for creating repos and uploading files)
   - Copy token and save securely

---

## Step 1: Create Repository

### Option A: Via Web Interface

1. Go to: https://huggingface.co/new-dataset
2. Fill in details:
   ```
   Owner: lydian-ai (or your organization)
   Dataset name: lydian-discovery-feed
   License: cc-by-4.0
   Visibility: Public
   ```
3. Click "Create dataset"

### Option B: Via API (Preferred for Automation)

```bash
# Set environment variable
export HF_API_TOKEN="hf_xxxx...xxxx"

# Create repository
curl -X POST \
  https://huggingface.co/api/repos/create \
  -H "Authorization: Bearer $HF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "lydian-discovery-feed",
    "type": "dataset",
    "private": false,
    "organization": "lydian-ai"
  }'
```

**Expected Response:**
```json
{
  "url": "https://huggingface.co/datasets/lydian-ai/lydian-discovery-feed",
  "name": "lydian-discovery-feed",
  "organization": "lydian-ai",
  "private": false
}
```

---

## Step 2: Upload Files

### Option A: Git-based Upload

```bash
# Clone the repository
git clone https://huggingface.co/datasets/lydian-ai/lydian-discovery-feed
cd lydian-discovery-feed

# Copy files from hf_publish directory
cp /path/to/hf_publish/README.md .
cp /path/to/hf_publish/card.md .
cp /path/to/hf_publish/LICENSE .

# Commit and push
git add README.md card.md LICENSE
git commit -m "Initial commit: LyDian Discovery Feed v1.0.0"
git push
```

### Option B: Hugging Face Hub Python Library

```python
from huggingface_hub import HfApi, create_repo

api = HfApi()

# Create repository
repo_id = "lydian-ai/lydian-discovery-feed"
create_repo(
    repo_id=repo_id,
    token="hf_xxxx...xxxx",
    repo_type="dataset",
    private=False
)

# Upload files
api.upload_file(
    path_or_fileobj="/path/to/hf_publish/README.md",
    path_in_repo="README.md",
    repo_id=repo_id,
    token="hf_xxxx...xxxx",
    repo_type="dataset"
)

api.upload_file(
    path_or_fileobj="/path/to/hf_publish/card.md",
    path_in_repo="card.md",
    repo_id=repo_id,
    token="hf_xxxx...xxxx",
    repo_type="dataset"
)

api.upload_file(
    path_or_fileobj="/path/to/hf_publish/LICENSE",
    path_in_repo="LICENSE",
    repo_id=repo_id,
    token="hf_xxxx...xxxx",
    repo_type="dataset"
)
```

### Option C: Web Interface Upload

1. Go to your repository: https://huggingface.co/datasets/lydian-ai/lydian-discovery-feed
2. Click "Files and versions"
3. Click "Add file" → "Upload files"
4. Upload README.md, card.md, LICENSE
5. Commit message: "Initial commit: LyDian Discovery Feed v1.0.0"

---

## Step 3: Add Feed URLs

After the on-site feed files are deployed (PHASE C), update README.md to include live links:

```markdown
## 🔗 Live Feed Links

- **JSON Feed:** https://www.ailydian.com/feed/ai_models.json
- **RSS Feed:** https://www.ailydian.com/feed/ai_models.rss
- **LLMs.txt:** https://www.ailydian.com/llms.txt
```

---

## Step 4: Verify Deployment

```bash
# Check repository exists
curl -I https://huggingface.co/datasets/lydian-ai/lydian-discovery-feed

# Expected: HTTP/2 200

# Check README is visible
curl https://huggingface.co/datasets/lydian-ai/lydian-discovery-feed/raw/main/README.md

# Expected: Full README content
```

---

## Step 5: Update Metadata (Optional)

Edit the dataset card via web interface or API to add:

1. **Tags:**
   - `ai-models`
   - `llm`
   - `model-discovery`
   - `benchmarks`
   - `leaderboard`

2. **Task Categories:**
   - `text-generation`
   - `text-classification`
   - `question-answering`

3. **Size Categories:**
   - `1K<n<10K` (adjust based on actual feed size)

---

## Security Best Practices

### Token Management

```bash
# Store token securely (not in git)
echo "HF_API_TOKEN=hf_xxxx...xxxx" >> ~/.env
chmod 600 ~/.env

# Load in scripts
source ~/.env
```

### Secret Masking

When logging API calls:
```python
def mask_token(token):
    if len(token) > 7:
        return f"{token[:4]}...{token[-3:]}"
    return "****"

print(f"Using token: {mask_token(HF_API_TOKEN)}")
# Output: Using token: hf_a...xyz
```

---

## Troubleshooting

### Error: Repository already exists
```
Solution: Either use a different name or delete existing repo first
```

### Error: 403 Forbidden
```
Cause: Token doesn't have write permissions
Solution: Generate new token with "write" scope
```

### Error: 401 Unauthorized
```
Cause: Invalid or expired token
Solution: Verify token is correct and not expired
```

---

## Automation Script

For automated publishing (after initial setup):

```python
#!/usr/bin/env python3
"""
Automated HF Repository Update
Updates README and feed links after deployment
"""

import os
from huggingface_hub import HfApi

# Configuration (from environment)
HF_TOKEN = os.getenv('HF_API_TOKEN')
REPO_ID = "lydian-ai/lydian-discovery-feed"

def update_readme(token, repo_id):
    """Update README with live feed URLs"""
    api = HfApi()

    # Read current README
    readme_path = "/path/to/hf_publish/README.md"

    # Upload updated README
    api.upload_file(
        path_or_fileobj=readme_path,
        path_in_repo="README.md",
        repo_id=repo_id,
        token=token,
        repo_type="dataset",
        commit_message="Update feed URLs"
    )

    print(f"✅ README updated: https://huggingface.co/datasets/{repo_id}")

if __name__ == '__main__':
    if not HF_TOKEN:
        print("❌ HF_API_TOKEN not set")
        exit(1)

    update_readme(HF_TOKEN, REPO_ID)
```

---

## Next Steps

After HF setup:
1. ✅ Repository created and files uploaded
2. ⏳ Generate feed files (PHASE C)
3. ⏳ Deploy to www.ailydian.com
4. ⏳ Update HF README with live URLs
5. ⏳ Submit to search engines (PHASE D)

---

**Support:** discovery@ailydian.com
**Documentation:** This guide
