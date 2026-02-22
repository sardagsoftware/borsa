# Deployment Runbook - LyDian Platform
**Version:** 1.0
**Last Updated:** October 8, 2025
**Maintainer:** DevOps Team

---

## Table of Contents
1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Procedure](#deployment-procedure)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Rollback Procedure](#rollback-procedure)
6. [Troubleshooting](#troubleshooting)
7. [Emergency Contacts](#emergency-contacts)

---

## Overview

This runbook documents the standard deployment procedure for the LyDian Platform. It covers deployments to Preview, Staging, and Production environments.

### Environments

| Environment | URL | Purpose | Deployment Trigger |
|-------------|-----|---------|-------------------|
| **Preview** | `*.vercel.app` | PR testing | Pull request created/updated |
| **Staging** | `staging.ailydian.com` | Pre-production testing | Push to `develop` branch |
| **Production** | `ailydian.com` | Live users | Push to `main` branch |

### Deployment Methods

1. **Automatic (CI/CD)** - GitHub Actions workflows
2. **Manual** - Emergency deployments via workflow_dispatch

---

## Pre-Deployment Checklist

### 1. Code Quality ✅

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Code review approved (2+ reviewers)
- [ ] No merge conflicts
- [ ] ESLint/Prettier checks passed

```bash
# Run locally before pushing
npm run lint
npm test
npm run build
```

### 2. Security ✅

- [ ] String guard scan passed (no critical violations)
- [ ] No hardcoded secrets or API keys
- [ ] npm audit shows no high/critical vulnerabilities
- [ ] HTTPS enforced
- [ ] CORS properly configured

```bash
# Security checks
npm audit --prod --audit-level=moderate
node ops/tools/string-guard.js --report=json
```

### 3. Performance ✅

- [ ] Lighthouse score ≥85 (performance)
- [ ] Bundle sizes within budget (JS <1.5MB, CSS <400KB)
- [ ] Images optimized (run optimize-images.js)
- [ ] Cache headers configured

```bash
# Performance checks
lighthouse http://localhost:3100/ --only-categories=performance
node ops/tools/optimize-images.js --dry-run
```

### 4. Database ✅

- [ ] Database migrations tested locally
- [ ] Backup created (if schema changes)
- [ ] RLS policies verified
- [ ] Seed data available (if needed)

```bash
# Database checks
psql $DATABASE_URL -c "SELECT version();"
# Run migrations
npm run db:migrate
```

### 5. Environment Variables ✅

- [ ] All required secrets in GitHub Secrets
- [ ] `.env.example` updated with new variables
- [ ] Staging environment variables verified
- [ ] Production environment variables verified

**Required Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 6. Monitoring ✅

- [ ] Error tracking enabled
- [ ] APM configured
- [ ] Health check endpoint responding
- [ ] Alerting configured (Slack/Discord)

```bash
# Verify monitoring
curl https://ailydian.com/api/monitoring/health
curl -H "x-api-key: $ADMIN_API_KEY" https://ailydian.com/api/monitoring/metrics
```

---

## Deployment Procedure

### Preview Deployment (Automatic)

**Trigger:** Create or update a pull request

1. **Create Pull Request**
   ```bash
   git checkout -b feature/my-feature
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

2. **GitHub Actions Workflow**
   - CI workflow runs (quality + security + tests)
   - Preview workflow deploys to Vercel
   - PR comment shows preview URL

3. **Verification**
   - Visit preview URL
   - Test changed functionality
   - Verify no regressions
   - Check browser console for errors

### Staging Deployment (Automatic)

**Trigger:** Merge PR to `develop` branch

1. **Merge Pull Request**
   ```bash
   # After PR approval
   git checkout develop
   git pull origin develop
   # Verify no conflicts
   ```

2. **GitHub Actions Workflow**
   - CI workflow runs
   - Security scan runs
   - i18n validation runs (if applicable)
   - Azure deployment workflow triggers

3. **Monitor Deployment**
   ```bash
   # Watch GitHub Actions
   gh run watch

   # Check deployment logs
   az containerapp logs show \
     --name ailydian-api-staging \
     --resource-group ailydian-staging-rg \
     --follow
   ```

4. **Staging Verification**
   - Health check: `https://staging.ailydian.com/api/health`
   - Smoke tests: Run E2E test suite
   - Performance: Check response times
   - Errors: Monitor error tracking

### Production Deployment (Automatic)

**Trigger:** Merge `develop` to `main` branch

⚠️ **CAUTION:** This deploys to live users!

1. **Pre-Deployment Steps**
   - [ ] Staging fully tested and verified
   - [ ] No critical bugs reported
   - [ ] Change log updated
   - [ ] Team notified in Slack/Discord
   - [ ] Database backup created

2. **Merge to Main**
   ```bash
   git checkout main
   git pull origin main
   git merge develop --no-ff
   git push origin main
   ```

3. **Monitor Deployment**
   ```bash
   # Watch GitHub Actions
   gh run watch

   # Azure Container Apps deployment
   az containerapp revision list \
     --name ailydian-api \
     --resource-group ailydian-production-rg \
     --output table
   ```

4. **Deployment Progress**
   - Build & Test (5-10 minutes)
   - Docker Build & Push (10-15 minutes)
   - Azure Deployment (5-10 minutes)
   - **Total:** ~20-35 minutes

---

## Post-Deployment Verification

### Immediate Checks (< 5 minutes)

```bash
# 1. Health Check
curl https://ailydian.com/api/health
# Expected: { "status": "healthy", ... }

# 2. API Status
curl https://ailydian.com/api/status
# Expected: { "status": "ok", "models_count": 23, ... }

# 3. Database Connection
curl https://ailydian.com/api/database/health
# Expected: { "status": "healthy", ... }

# 4. Cache Status
curl https://ailydian.com/api/cache/health
# Expected: { "status": "healthy", "hitRatio": ... }

# 5. Response Times
time curl https://ailydian.com/ -o /dev/null -s -w "Total time: %{time_total}s\n"
# Expected: < 2 seconds
```

### Functional Verification (< 15 minutes)

- [ ] Homepage loads correctly
- [ ] User authentication works
- [ ] AI chat functional
- [ ] API endpoints responding
- [ ] WebSocket connections working
- [ ] File uploads working
- [ ] Search functionality working

### Performance Verification (< 10 minutes)

```bash
# Lighthouse audit
lighthouse https://ailydian.com/ --only-categories=performance

# Expected:
# - Performance: ≥85
# - LCP: <2.5s
# - FCP: <1.8s
# - TBT: <300ms
```

### Monitoring Verification (< 5 minutes)

1. **Error Tracking**
   - Check error logs: No new critical errors
   - Error rate: <1% of requests

2. **APM Metrics**
   - Response time P95: <500ms
   - Database query time P95: <100ms
   - Cache hit ratio: >70%

3. **System Health**
   - CPU usage: <70%
   - Memory usage: <80%
   - No container restarts

### User Verification (< 10 minutes)

- [ ] Test user login (existing user)
- [ ] Test user registration (new user)
- [ ] Test AI chat (send message)
- [ ] Test file upload
- [ ] Check mobile responsiveness

---

## Rollback Procedure

### When to Rollback

Rollback immediately if:
- ❌ Critical security vulnerability introduced
- ❌ Data loss or corruption detected
- ❌ Error rate >5% of requests
- ❌ Core functionality broken
- ❌ Performance degradation >50%

### Automatic Rollback

Azure Container Apps automatically rolls back if:
- Health checks fail after deployment
- Container fails to start
- Continuous crash loop detected

### Manual Rollback (< 5 minutes)

#### Option 1: Revert Git Commit

```bash
# 1. Identify the bad commit
git log --oneline -10

# 2. Revert the commit (creates new commit)
git revert <commit-sha>

# 3. Push to main
git push origin main

# GitHub Actions will automatically deploy the revert
```

#### Option 2: Activate Previous Revision (Azure)

```bash
# 1. List recent revisions
az containerapp revision list \
  --name ailydian-api \
  --resource-group ailydian-production-rg \
  --output table

# 2. Activate previous revision
az containerapp revision activate \
  --resource-group ailydian-production-rg \
  --name ailydian-api \
  --revision <previous-revision-name>

# 3. Deactivate bad revision
az containerapp revision deactivate \
  --resource-group ailydian-production-rg \
  --name ailydian-api \
  --revision <bad-revision-name>
```

#### Option 3: Vercel Rollback

```bash
# 1. List deployments
vercel list

# 2. Promote previous deployment
vercel promote <deployment-url>
```

### Post-Rollback Steps

1. **Verify Rollback**
   - Run post-deployment verification checks
   - Confirm error rate returned to normal
   - Check user reports

2. **Notify Team**
   - Post rollback notice in Slack/Discord
   - Update status page
   - Communicate ETA for fix

3. **Root Cause Analysis**
   - Create incident ticket
   - Review logs and metrics
   - Identify cause
   - Plan fix

4. **Fix and Redeploy**
   - Fix the issue in a new branch
   - Full testing in staging
   - Deploy fix to production

---

## Troubleshooting

### Deployment Fails

**Symptom:** GitHub Actions workflow fails

**Common Causes:**
1. Test failures → Check test logs
2. Lint errors → Run `npm run lint --fix`
3. Build errors → Check build logs
4. Security violations → Check string-guard report

**Resolution:**
```bash
# Run locally to reproduce
npm install
npm run lint
npm test
npm run build

# Fix issues and push
git add .
git commit -m "fix: resolve deployment issues"
git push
```

### Health Check Fails

**Symptom:** `/api/health` returns 503

**Common Causes:**
1. Database connection failed
2. Redis cache unreachable
3. Environment variables missing

**Resolution:**
```bash
# Check logs
az containerapp logs show \
  --name ailydian-api \
  --resource-group ailydian-production-rg \
  --tail 100

# Verify environment variables
az containerapp show \
  --name ailydian-api \
  --resource-group ailydian-production-rg \
  --query "properties.configuration.secrets" \
  --output table

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check Redis
redis-cli -u $REDIS_URL ping
```

### High Error Rate

**Symptom:** Error rate >5%

**Diagnosis:**
```bash
# Check error logs
curl -H "x-api-key: $ADMIN_API_KEY" \
  https://ailydian.com/api/monitoring/metrics?range=15m

# Review recent errors
az containerapp logs show \
  --name ailydian-api \
  --resource-group ailydian-production-rg \
  --tail 500 | grep ERROR
```

**Resolution:**
- If recent deployment: **Rollback immediately**
- If external dependency: Check third-party status pages
- If traffic spike: Scale up resources

### Slow Performance

**Symptom:** Response times >2 seconds

**Diagnosis:**
```bash
# Check APM metrics
curl -H "x-api-key: $ADMIN_API_KEY" \
  https://ailydian.com/api/monitoring/metrics

# Check system resources
az containerapp show \
  --name ailydian-api \
  --resource-group ailydian-production-rg \
  --query "properties.template.scale" \
  --output json

# Check slow queries
# (from APM dashboard or database logs)
```

**Resolution:**
- Cache frequently accessed data
- Optimize database queries
- Scale up container replicas
- Enable CDN for static assets

---

## Emergency Contacts

### Escalation Matrix

| Severity | Response Time | Contact |
|----------|--------------|---------|
| **P0 - Critical** | Immediate | On-call engineer + CTO |
| **P1 - High** | <15 minutes | On-call engineer |
| **P2 - Medium** | <1 hour | DevOps team |
| **P3 - Low** | <1 day | Development team |

### Severity Definitions

**P0 - Critical:**
- Complete service outage
- Data loss or corruption
- Security breach

**P1 - High:**
- Core functionality broken
- Error rate >5%
- Performance degradation >50%

**P2 - Medium:**
- Non-critical feature broken
- Error rate 1-5%
- Performance degradation 25-50%

**P3 - Low:**
- Minor bug
- Error rate <1%
- Cosmetic issues

### Communication Channels

- **Slack:** #deployments, #incidents
- **Discord:** #deployments channel
- **Email:** devops@ailydian.com
- **Phone:** Emergency on-call rotation

---

## Deployment History

| Date | Version | Deployed By | Changes | Rollback? |
|------|---------|-------------|---------|-----------|
| 2025-10-08 | v2.0.1 | Auto (CI/CD) | Cache headers, monitoring | No |
| 2025-10-07 | v2.0.0 | Auto (CI/CD) | Major update | No |

---

## Change Log

### v1.0 (2025-10-08)
- Initial deployment runbook
- Added cache headers section
- Added image optimization steps
- Included monitoring verification

---

## Appendix

### Useful Commands

```bash
# GitHub CLI
gh pr list                              # List open PRs
gh pr view <number>                     # View PR details
gh run list                             # List workflow runs
gh run watch                            # Watch current run

# Azure CLI
az login                                # Login to Azure
az account show                         # Show current account
az containerapp list --output table    # List all container apps
az containerapp revision list           # List revisions
az containerapp logs show --follow      # Follow logs

# Vercel CLI
vercel list                             # List deployments
vercel logs <deployment-url>            # View deployment logs
vercel domains                          # List domains

# Database
psql $DATABASE_URL                      # Connect to database
npm run db:migrate                      # Run migrations
npm run db:seed                         # Seed database

# Performance
lighthouse <url> --view                 # Run Lighthouse with viewer
npm run test:performance                # Run performance tests
```

### Environment Variables Reference

See `.env.example` for complete list of environment variables.

### Links

- **GitHub Repository:** https://github.com/lydiansoftware/borsa
- **Azure Portal:** https://portal.azure.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Upstash Dashboard:** https://console.upstash.com

---

**Document Version:** 1.0
**Last Reviewed:** October 8, 2025
**Next Review:** November 8, 2025

✅ **This runbook should be reviewed and updated after every major deployment.**
