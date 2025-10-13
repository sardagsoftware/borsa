# Gold Pipeline Guide – Phase 4 Submission

## Overview

The Gold Pipeline automates the final build, certification, and submission preparation process for Phase 4 (Gold & Submission). Two variants are provided:

1. **gold-pipeline.sh** - Original AAA game pipeline (Unreal Engine, PS5/Xbox)
2. **gold-pipeline-web.sh** - Web application optimized pipeline (Current project)

## Scripts Comparison

| Feature | gold-pipeline.sh | gold-pipeline-web.sh |
|---------|------------------|----------------------|
| **Target Platform** | Game (PS5, Xbox, PC) | Web (PWA, Mobile) |
| **Build Tool** | Unreal Engine UAT | pnpm/Node.js |
| **Signing** | Cosign (game binaries) | N/A (web assets) |
| **Certification** | TRC/XR requirements | WCAG/PWA/Security |
| **Deployment** | Physical builds | Cloud (Vercel, Docker) |

## Recommended: gold-pipeline-web.sh

For Ailydian Ultra Pro, use **gold-pipeline-web.sh** as it's tailored for web applications.

### Prerequisites

```bash
# Required tools
node -v    # v20+ recommended
pnpm -v    # v9.15.9+
git --version

# Optional (for enhanced validation)
npx lighthouse --version
docker --version
```

### Running the Pipeline

```bash
cd ~/Desktop/ailydian-ultra-pro

# Review the script first
cat gold-pipeline-web.sh

# Execute
./gold-pipeline-web.sh
```

### What It Does

#### 1️⃣ Environment Setup
- Sets Node memory limit (8GB)
- Creates gold-main branch
- Initializes log directories

#### 2️⃣ Branch Preparation
- Checks out/creates gold-main branch
- Rebases with main
- Creates snapshot commit

#### 3️⃣ Security Audit
- Runs `pnpm run security:full`
- Executes `pnpm audit --audit-level=high`
- Generates security report

#### 4️⃣ Production Build
- Builds with `NODE_ENV=production`
- Optimizes assets
- Minifies JavaScript/CSS

#### 5️⃣ Certification Bundle
- Packages all compliance documents
- Includes security audit results
- Creates compressed archive

#### 6️⃣ Health Validation
- Starts production server
- Tests all critical endpoints:
  - `/api/health`
  - `/ops/canary/feature-flags.json`
  - `/i18n/tr/common.json`
  - `/i18n/ar/common.json`

#### 7️⃣ E2E Testing
- Runs Playwright test suite
- Generates test report

#### 8️⃣ Deployment Package
- Creates full deployment archive
- Excludes development files
- Optimized for production

#### 9️⃣ Summary Generation
- Builds markdown summary
- Lists all artifacts
- Provides deployment commands

### Output Artifacts

After running, you'll find:

```
build/
  ├── GOLD-DEPLOYMENT-20251011-2304.tar.gz  # Full deployment package
  ├── CERT-BUNDLE-20251011-2304.tar.gz       # Certification docs
  └── GOLD-SUMMARY-20251011-2304.md          # Build summary

docs/
  └── CERT-BUNDLE-20251011-2304.md           # Certification manifest

logs/
  ├── gold-pipeline-20251011-2304.log        # Build log
  └── server-20251011-2304.log               # Server startup log

reports/
  ├── security-audit-20251011-2304.txt       # Security scan
  ├── test-results-20251011-2304.txt         # Test results
  ├── health-20251011-2304.json              # Health check
  ├── feature-flags-20251011-2304.json       # Feature flags
  ├── i18n-tr-20251011-2304.json             # Turkish locale
  └── i18n-ar-20251011-2304.json             # Arabic locale
```

## Customization

### Environment Variables

```bash
# Custom port
PORT=8080 ./gold-pipeline-web.sh

# Custom branch name
BRANCH=release-v2.0 ./gold-pipeline-web.sh

# Custom Node memory
NODE_OPTIONS="--max-old-space-size=16384" ./gold-pipeline-web.sh
```

### Modify Script

Edit `gold-pipeline-web.sh` to add custom steps:

```bash
# After line "# 9️⃣ Create deployment package"
# Add custom validation
echo "🔍 Running custom validation..." | tee -a "$LOG"
node scripts/custom-validation.js 2>&1 | tee -a "$LOG"
```

## Deployment

### Vercel (Recommended)

```bash
# From build artifacts
vercel --prod

# Or with specific build
tar -xzf build/GOLD-DEPLOYMENT-20251011-2304.tar.gz -C /tmp/deploy
cd /tmp/deploy
vercel --prod
```

### Docker

```bash
# Build image
docker build -t ailydian-ultra-pro:gold .

# Run container
docker run -d \
  -p 3100:3100 \
  -e NODE_ENV=production \
  --name ailydian-gold \
  ailydian-ultra-pro:gold

# Health check
curl http://localhost:3100/api/health
```

### Manual Server

```bash
# Extract deployment package
tar -xzf build/GOLD-DEPLOYMENT-20251011-2304.tar.gz -C /var/www/ailydian

# Install production dependencies
cd /var/www/ailydian
pnpm i --prod --frozen-lockfile

# Start with PM2
pm2 start ecosystem.config.js --env production

# Or with systemd
sudo systemctl start ailydian-ultra-pro
```

## Certification Submission

### Web Platform (PWA)

1. **Google Play Console** (TWA/PWA)
   ```bash
   # Generate Android package
   npx @bubblewrap/cli build
   ```

2. **Apple App Store** (PWA via TestFlight)
   ```bash
   # Use PWABuilder.com or similar
   open https://www.pwabuilder.com/
   ```

3. **Microsoft Store**
   ```bash
   # Use PWABuilder or AppxManifest
   ```

### Compliance Checklist

Before submission, verify:

- [ ] All items in `docs/CERT-CHECKLISTS.md` completed
- [ ] Security audit passes (no high/critical issues)
- [ ] All E2E tests pass
- [ ] Performance metrics meet thresholds
  - [ ] Lighthouse score > 90
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] i18n complete for target markets
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Age rating obtained (if required)
- [ ] Accessibility audit complete (WCAG 2.1 AA)

## Troubleshooting

### Build Fails

```bash
# Check Node version
node -v  # Should be v20+

# Clear cache
pnpm store prune
rm -rf node_modules
pnpm i

# Retry build
NODE_ENV=production pnpm build
```

### Health Checks Fail

```bash
# Check if server is running
ps aux | grep "node server.js"

# Check port availability
lsof -ti:3100

# Manual server start
NODE_ENV=production PORT=3100 node server.js

# Test endpoints manually
curl http://localhost:3100/api/health
```

### Tests Fail

```bash
# Run tests in UI mode for debugging
pnpm test:ui

# Run specific test
pnpm test tests/smoke.spec.ts

# Update snapshots if needed
pnpm test --update-snapshots
```

## Rollback Procedure

If issues are discovered after gold build:

```bash
# Revert to previous commit
git checkout main
git log --oneline  # Find last good commit
git checkout -b hotfix-gold

# Fix issues
# ... make changes ...

# Re-run pipeline
./gold-pipeline-web.sh
```

## Support

For issues or questions:
- **Documentation**: `docs/` directory
- **Logs**: `logs/gold-pipeline-*.log`
- **Reports**: `reports/` directory
- **Contact**: dev@ailydian.com

## Version History

- **v1.0.0** (2025-10-11) - Initial gold pipeline
- **v2.0.0** (2025-10-11) - Web-optimized variant

---

**Last Updated**: October 11, 2025
**Maintainer**: Lydian DevOps Team
