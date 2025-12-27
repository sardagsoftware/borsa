# CI/CD Pipeline Documentation

Enterprise-grade continuous integration and deployment for AILYDIAN Ultra Pro.

## 🚀 Available Workflows

### 1. Enhanced CI Pipeline (`enhanced-ci.yml`)

**Triggers**: Pull requests, Push to main/develop, Manual

**Jobs**:
- ✅ Server Validation & Health Checks
- ✅ Security & Compliance Audit
- ✅ Performance Benchmarks
- ✅ Dependency Analysis
- ✅ Documentation Validation

**Purpose**: Validate every code change before merge

### 2. Production Deployment (`production-deploy.yml`)

**Triggers**: Push to main, Manual

**Jobs**:
- ✅ Pre-Deployment Quality Gates
- ✅ Build Production Assets
- ✅ Deploy to Vercel
- ✅ Post-Deployment Smoke Tests
- ✅ Deployment Notifications

**Purpose**: Automated production deployment with verification

### 3. Existing Legacy Workflows

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

| Metric | Target | Threshold |
|--------|--------|-----------|
| Cache (2000 ops) | < 50ms | < 1000ms |
| Logger (1000 logs) | < 100ms | < 500ms |
| Server startup | < 10s | < 30s |
| Redis latency | < 10ms | < 50ms |

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

### 2025-12-27
- ✅ Added enhanced-ci.yml with Winston/Redis tests
- ✅ Added production-deploy.yml with Vercel integration
- ✅ Added performance benchmarks
- ✅ Added security compliance checks
- ✅ Added documentation validation

---

**Maintained By**: AILYDIAN DevOps Team
**Last Updated**: 2025-12-27
**Status**: ✅ Production Ready
