# CI/CD Pipeline Documentation

Enterprise-grade continuous integration and deployment for AILYDIAN Ultra Pro.

**Live Production**: https://www.ailydian.com

## 🛡️ ZERO-RISK DEPLOYMENT STRATEGY

**CRITICAL**: Production site is LIVE. All workflows include safety mechanisms:

1. **PR Testing** - NO deployment capability (test-pr.yml)
2. **Production Deployment** - MANUAL APPROVAL REQUIRED (production-deploy.yml)
3. **Pre-Deployment Gates** - All tests must pass before deployment
4. **Post-Deployment Validation** - Smoke tests verify health

---

## 🚀 Available Workflows

### ⭐ PRIMARY WORKFLOWS (Phase 5 - Production Safe)

#### 1. PR Tests (`test-pr.yml`) - ✅ SAFE, NO DEPLOYMENT

**Triggers**: Pull requests to main/develop

**Purpose**: Test all PRs with ZERO deployment risk

**Jobs**:

- ✅ Code Quality Checks (ESLint - warnings allowed)
- ✅ Unit & Integration Tests (Phase 4 microservices)
- ✅ Microservices Validation (6 service files)
- ✅ Security Audit (npm audit, secret scanning)
- ✅ PR Summary (aggregate results)

**Safety**:

- ❌ NO deployment capability
- ❌ Cannot affect production
- ✅ Isolated CI environment
- ✅ Validates Phase 4 integration

---

#### 2. Production Deployment (`production-deploy.yml`) - 🔒 MANUAL APPROVAL

**Triggers**: Push to main, Manual dispatch

**Purpose**: Deploy to production with approval gate

**Jobs**:

1. Pre-Deployment Quality Gates (tests, security, env validation)
2. Build Production Assets (dependency verification)
3. **Deploy to Vercel** - 🔒 **REQUIRES MANUAL APPROVAL**
4. Post-Deployment Smoke Tests (health checks, API validation)
5. Deployment Notifications (status summary)

**Critical Safety Feature**:

```yaml
environment:
  name: production
  url: https://www.ailydian.com
```

This **PAUSES** deployment and requires maintainer approval!

**Approval Process**:

1. Pre-deployment checks run automatically
2. GitHub **PAUSES** at deployment step
3. Notification sent to maintainers
4. Maintainer reviews and approves
5. Deployment proceeds to Vercel
6. Smoke tests validate deployment

---

### 🔧 LEGACY WORKFLOWS (Pre-Phase 5)

#### 1. Enhanced CI Pipeline (`enhanced-ci.yml`)

**Triggers**: Pull requests, Push to main/develop, Manual

**Jobs**:

- ✅ Server Validation & Health Checks
- ✅ Security & Compliance Audit
- ✅ Performance Benchmarks
- ✅ Dependency Analysis
- ✅ Documentation Validation

**Purpose**: Validate every code change before merge

#### 2. Other Legacy Workflows

- `ci-main.yml` - Comprehensive CI with multiple test stages
- `security.yml` - Security scanning (npm audit, SAST)
- `e2e-tests.yml` - End-to-end Playwright tests
- `ci-cd-gates.yml` - Quality gates and compliance checks
- `automated-backup.yml` - Database backup automation

## 📋 Workflow Execution Order

### On Pull Request:

```
1. Enhanced CI Pipeline
   ├── Server Validation (Winston + Redis tests)
   ├── Security Scan (secrets, vulnerabilities)
   ├── Performance Benchmarks (cache, logger)
   ├── Dependency Analysis
   └── Documentation Check

2. CI Main Pipeline (if configured)
   ├── TypeScript/ESLint
   ├── Unit Tests
   ├── Build
   ├── Integration Tests
   └── E2E Tests
```

### On Push to Main:

```
1. All PR checks (above)

2. Production Deployment
   ├── Pre-Deployment Validation
   ├── Build Production
   ├── Deploy to Vercel
   ├── Smoke Tests
   └── Notification
```

## 🔐 Required Secrets

Add these to GitHub repository secrets:

```
VERCEL_TOKEN           # Vercel deployment token
VERCEL_ORG_ID          # Vercel organization ID
VERCEL_PROJECT_ID      # Vercel project ID
```

### How to Get Vercel Secrets:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Get org and project IDs
vercel env ls
```

---

## 🔒 Setting Up Manual Approval (REQUIRED)

**CRITICAL**: You MUST set up manual approval to protect production.

### Step 1: Create GitHub Environment

1. Go to repository **Settings** → **Environments**
2. Click **New environment**
3. Name: `production`
4. Under **Deployment protection rules**:
   - ✅ Check **Required reviewers**
   - Add your GitHub username
   - Set **Wait timer**: 0 minutes (optional)
5. Click **Save protection rules**

### Step 2: Add Environment Secrets

Add the following secrets to the `production` environment:

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### Step 3: Test Approval Flow

1. Trigger workflow manually:
   - Go to **Actions** → **Production Deployment**
   - Click **Run workflow**
   - Select branch: `main`
   - Click **Run workflow**

2. Workflow will pause at deployment step
3. You'll receive a notification
4. Click **Review deployments**
5. Check `production` environment
6. Click **Approve and deploy**

---

## 🧑‍💻 How to Use: Developer Workflow

### For Feature Development (Safe)

```bash
# 1. Create feature branch
git checkout -b feature/my-awesome-feature

# 2. Make changes
# ... code ...

# 3. Commit and push
git add .
git commit -m "feat: Add awesome feature"
git push origin feature/my-awesome-feature

# 4. Create PR on GitHub
# → test-pr.yml runs automatically (safe, no deployment)

# 5. Review test results
# → Check GitHub Actions tab

# 6. If tests pass, merge PR
# → Merging does NOT deploy automatically!
```

### For Production Deployment (Protected)

```bash
# After PR is merged to main:

# 1. production-deploy.yml triggers automatically
# 2. Pre-deployment checks run
# 3. Workflow PAUSES for approval
# 4. You receive notification
# 5. Review deployment request:
#    - Check what changed
#    - Review test results
#    - Verify it's safe
# 6. Approve deployment
# 7. Deployment proceeds to Vercel
# 8. Smoke tests validate health
```

### Manual Rollback (If Needed)

```bash
# Option A: Via Vercel Dashboard (Fastest)
1. Go to https://vercel.com/emrahsardag-yandexcoms-projects/ailydian-prod
2. Find the last known good deployment
3. Click the deployment
4. Click "Promote to Production"
5. Done! (takes ~30 seconds)

# Option B: Via Git Revert
git revert <commit-hash>
git push origin main
# Then approve the deployment when prompted
```

## ⚙️ Quality Gates

### Critical (Block Deployment):

- ❌ Security vulnerabilities (critical/high)
- ❌ Server startup failure
- ❌ Cache performance degradation
- ❌ Hardcoded secrets in code

### Warnings (Allow with Review):

- ⚠️ Code quality issues
- ⚠️ Documentation missing
- ⚠️ Performance below target

## 🧪 Local Testing

Test workflows locally before pushing:

```bash
# Test logger
NODE_ENV=test node test-logger.js

# Test cache (requires Redis)
docker run -d -p 6379:6379 redis:7-alpine
NODE_ENV=test node test-cache.js

# Test server startup
NODE_ENV=test PORT=3100 node server.js
```

## 📊 Performance Benchmarks

### Expected Performance:

| Metric             | Target  | Threshold |
| ------------------ | ------- | --------- |
| Cache (2000 ops)   | < 50ms  | < 1000ms  |
| Logger (1000 logs) | < 100ms | < 500ms   |
| Server startup     | < 10s   | < 30s     |
| Redis latency      | < 10ms  | < 50ms    |

## 🔍 Security Checks

### Automated Scans:

- NPM audit (critical/high vulnerabilities)
- Hardcoded secrets detection
- API key pattern matching
- Password in code detection
- PII redaction validation
- HIPAA/GDPR compliance verification

### Patterns Detected:

```
❌ sk-[a-zA-Z0-9]{20,}           # API keys
❌ password\s*[:=]\s*['"][^'"]{8,}['"]  # Hardcoded passwords
✅ logger.info() with PII redaction     # Secure logging
✅ HIPAA audit logger present           # Compliance
```

## 🎯 Best Practices

### 1. Before Creating PR:

```bash
# Run local tests
npm run test

# Check for secrets
git diff | grep -i "password\|secret\|key"

# Validate logger
node test-logger.js

# Test cache
node test-cache.js
```

### 2. PR Description:

```markdown
## Changes

- Brief description of changes

## Testing

- [ ] Local tests passed
- [ ] Logger tests passed
- [ ] Cache tests passed
- [ ] No secrets in code

## Deployment Notes

- Any environment variable changes?
- Any database migrations needed?
```

### 3. After Merge:

- Monitor deployment in GitHub Actions
- Check Vercel deployment logs
- Run smoke tests on production
- Monitor error rates in Azure Insights

## 🚨 Troubleshooting

### CI Failure: "Server failed to start"

```bash
# Check logs in GitHub Actions
# Common causes:
- Missing environment variables
- Redis connection failure
- Port already in use
- Dependency issues
```

### CI Failure: "Performance degraded"

```bash
# Check:
- Redis connection latency
- Cache hit rates
- Server resource usage
```

### Deployment Failure

```bash
# Verify Vercel secrets
vercel env ls

# Check build logs
vercel logs

# Manual deployment
vercel --prod
```

## 📈 Monitoring

### GitHub Actions:

- View workflow runs: Repository → Actions
- Check artifacts: Click on workflow run
- Download logs: Three dots menu → Download logs

### Vercel Deployment:

- Dashboard: https://vercel.com/dashboard
- Logs: Project → Deployments → View logs
- Analytics: Project → Analytics

### Production Monitoring:

- Azure Application Insights (if configured)
- Vercel Analytics
- Server logs via Winston

## 🔄 Workflow Updates

### Adding New Tests:

1. Add test script to `package.json`
2. Add job to `enhanced-ci.yml`
3. Test locally first
4. Create PR with workflow change

### Modifying Quality Gates:

1. Update thresholds in workflow files
2. Document changes in this README
3. Get team approval
4. Test on feature branch first

## 📝 Changelog

### 2026-01-02 - Phase 5.2: ZERO-RISK CI/CD

- 🛡️ **Added test-pr.yml** - PR testing with NO deployment capability
- 🔒 **Updated production-deploy.yml** - Added MANUAL APPROVAL requirement
- ✅ Added GitHub environment protection for production
- ✅ Updated health checks to use Phase 4's `/api/services/health`
- ✅ Added comprehensive deployment documentation
- ✅ Added rollback procedures

### 2025-12-27 - Phase 4: Microservices Integration

- ✅ Added enhanced-ci.yml with Winston/Redis tests
- ✅ Added production-deploy.yml with Vercel integration
- ✅ Added performance benchmarks
- ✅ Added security compliance checks
- ✅ Added documentation validation

---

**Maintained By**: AILYDIAN DevOps Team
**Last Updated**: 2026-01-02
**Status**: ✅ Production Ready with Manual Approval Protection
