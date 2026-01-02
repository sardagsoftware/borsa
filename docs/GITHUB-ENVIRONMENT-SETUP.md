# 🔒 GitHub Environment Setup Guide

**CRITICAL**: This is REQUIRED for your CI/CD pipeline to work!

**Time Required**: 10 minutes
**Difficulty**: Easy (step-by-step instructions)

---

## ⚠️ Why This Is Critical

Your production deployment workflow (`production-deploy.yml`) requires manual approval to protect your live site at **www.ailydian.com**.

Without this setup:
- ❌ Production deployments will FAIL
- ❌ Manual approval won't work
- ❌ CI/CD pipeline incomplete

With this setup:
- ✅ You control all production deployments
- ✅ No accidental deployments
- ✅ Full CI/CD protection active

---

## 📋 Step-by-Step Instructions

### Step 1: Navigate to GitHub Repository Settings

1. Go to your GitHub repository:
   ```
   https://github.com/YOUR-USERNAME/ailydian-from-github
   ```

2. Click **Settings** (top navigation bar)

3. In the left sidebar, scroll down to **Environments**

4. Click **Environments**

---

### Step 2: Create Production Environment

1. Click the green **New environment** button

2. Enter environment name:
   ```
   production
   ```
   ⚠️ **IMPORTANT**: Must be exactly `production` (lowercase)

3. Click **Configure environment**

---

### Step 3: Configure Deployment Protection Rules

On the environment configuration page:

1. **Required reviewers** section:
   - ✅ Check the box **Required reviewers**
   - Click **Add reviewers**
   - Select yourself (your GitHub username)
   - You can add up to 6 reviewers

2. **Wait timer** (optional):
   - Leave at 0 minutes
   - Or set a delay (e.g., 5 minutes before deployment can proceed)

3. **Deployment branches** (optional):
   - Leave as default (all branches)
   - Or restrict to `main` branch only

4. Click **Save protection rules** at the bottom

---

### Step 4: Add Environment Secrets

Still on the environment page:

1. Scroll down to **Environment secrets** section

2. Click **Add secret** button

3. Add the following 3 secrets:

#### Secret 1: VERCEL_TOKEN

**Name**: `VERCEL_TOKEN`

**Value**: Your Vercel API token

**How to get it**:
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Get token from Vercel dashboard:
# https://vercel.com/account/tokens
# Click "Create Token" → Copy the token
```

**OR** via Vercel Dashboard:
1. Go to https://vercel.com/account/tokens
2. Click **Create Token**
3. Name: `GitHub Actions`
4. Scope: Full Account
5. Expiration: No expiration (or 1 year)
6. Click **Create Token**
7. **COPY THE TOKEN** (you won't see it again!)

#### Secret 2: VERCEL_ORG_ID

**Name**: `VERCEL_ORG_ID`

**Value**: Your Vercel organization ID

**How to get it**:
```bash
# Method 1: From Vercel CLI
cd /path/to/your/project
vercel link
cat .vercel/project.json
# Look for "orgId": "team_xxxxx"

# Method 2: From Vercel URL
# Your Vercel URL looks like:
# https://vercel.com/YOUR-ORG-ID/ailydian-prod
# The ORG-ID is in the URL after vercel.com/
```

**OR** from your deployment URL:
```
https://vercel.com/emrahsardag-yandexcoms-projects/ailydian-prod/9wMfumXS2xVbnSFTFdD2o76DRp2g

Organization ID: emrahsardag-yandexcoms-projects
```

#### Secret 3: VERCEL_PROJECT_ID

**Name**: `VERCEL_PROJECT_ID`

**Value**: Your Vercel project ID

**How to get it**:
```bash
# From Vercel CLI
cd /path/to/your/project
vercel link
cat .vercel/project.json
# Look for "projectId": "prj_xxxxx"
```

**OR** from Vercel Dashboard:
1. Go to your project: https://vercel.com/emrahsardag-yandexcoms-projects/ailydian-prod
2. Click **Settings**
3. Look for **Project ID** (usually starts with `prj_`)

---

### Step 5: Verify Environment Setup

After adding all secrets, your environment page should show:

**Protection Rules**:
- ✅ Required reviewers: [Your username]
- ✅ Wait timer: 0 minutes (or your chosen delay)

**Environment Secrets**:
- ✅ VERCEL_TOKEN (hidden)
- ✅ VERCEL_ORG_ID (hidden)
- ✅ VERCEL_PROJECT_ID (hidden)

Click **Save protection rules** if you haven't already.

---

## 🧪 Step 6: Test the Setup

Now let's test that everything works!

### Option A: Manual Trigger (Recommended)

1. Go to your repository **Actions** tab

2. Click **Production Deployment** workflow (left sidebar)

3. Click **Run workflow** button (right side)

4. Select branch: `main` (or your current branch)

5. Click **Run workflow**

6. Watch the workflow run:
   - ✅ Pre-deployment checks run automatically
   - ✅ Build verification runs
   - ⏸️ **Workflow PAUSES** at deployment step
   - 📧 You receive a notification

7. Click the yellow banner: **"This workflow is waiting for approval"**

8. Click **Review deployments**

9. Check the box next to `production`

10. Click **Approve and deploy**

11. Watch deployment proceed:
    - ✅ Deployment to Vercel
    - ✅ Smoke tests
    - ✅ Notification

### Option B: Create a Test PR (More Realistic)

1. Create a new branch:
   ```bash
   git checkout -b test/ci-cd-setup
   ```

2. Make a small change (e.g., add a comment):
   ```bash
   echo "# Test CI/CD" >> README.md
   git add README.md
   git commit -m "test: CI/CD pipeline"
   git push origin test/ci-cd-setup
   ```

3. Create PR on GitHub

4. Watch `test-pr.yml` run (should pass - no deployment)

5. Merge the PR

6. Watch `production-deploy.yml` trigger and pause for approval

7. Approve the deployment

---

## ✅ Success Indicators

After successful setup and test:

1. **Environment Page** shows:
   - ✅ Protection rules active
   - ✅ All 3 secrets present

2. **Workflow Run** shows:
   - ✅ Pre-deployment checks: Success
   - ✅ Build: Success
   - ⏸️ Deploy: Waiting for approval
   - ✅ After approval: Success
   - ✅ Smoke tests: Success

3. **Notifications**:
   - 📧 You received approval request
   - 📧 You received deployment success notification

4. **Production**:
   - ✅ Site accessible: https://www.ailydian.com
   - ✅ Health check: https://www.ailydian.com/api/services/health

---

## 🚨 Troubleshooting

### Issue 1: "Secret not found" error

**Problem**: Workflow fails with "secret not found"

**Solution**:
1. Go back to Environment secrets
2. Verify all 3 secrets are added
3. Check spelling (VERCEL_TOKEN, not VERCEL-TOKEN)
4. Re-run the workflow

### Issue 2: No approval request

**Problem**: Workflow doesn't pause for approval

**Solution**:
1. Check environment name is exactly `production`
2. Verify required reviewers is enabled
3. Add yourself as a reviewer
4. Save protection rules
5. Re-run workflow

### Issue 3: "Deployment failed" after approval

**Problem**: Deployment fails after you approve

**Solution**:
1. Check Vercel token is valid
2. Verify org ID and project ID are correct
3. Check Vercel dashboard for errors
4. Review workflow logs

### Issue 4: Multiple approval requests

**Problem**: Multiple people can approve

**Solution**:
- This is normal if you added multiple reviewers
- Only 1 approval is needed (from anyone in the list)
- To restrict to yourself only, remove other reviewers

---

## 📚 Additional Resources

**GitHub Documentation**:
- [Deployment environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Environment secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-an-environment)

**Vercel Documentation**:
- [Vercel CLI](https://vercel.com/docs/cli)
- [Environment variables](https://vercel.com/docs/concepts/projects/environment-variables)

**AILYDIAN Documentation**:
- [CI/CD Workflows](./.github/workflows/README.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

## 🎯 Next Steps

After successful setup:

1. ✅ GitHub environment configured
2. ✅ CI/CD pipeline fully functional
3. ✅ Production protected

**Ready for**: Phase 5.3 - Monitoring & Alerting

---

**Generated by**: Claude Code (Sonnet 4.5)
**Date**: January 2, 2026
**Purpose**: GitHub Environment Setup for CI/CD Protection

_Complete step-by-step guide to set up GitHub environment protection for production deployments._
