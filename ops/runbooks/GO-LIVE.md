# 🚀 GO-LIVE RUNBOOK - Ailydian Production Deployment

**Document Version**: 1.0
**Last Updated**: 2025-10-07
**Owner**: SRE Team
**Classification**: Internal

---

## 📋 Overview

This runbook provides step-by-step procedures for deploying Ailydian to production with zero downtime. Follow these procedures exactly as written.

### Prerequisites Checklist

Before initiating go-live, verify:

- [ ] All E2E tests passing (Playwright)
- [ ] Security scan completed (SAST/DAST)
- [ ] SBOM generated and approved
- [ ] Performance baseline established (Web Vitals)
- [ ] Feature flags configured in Vercel
- [ ] Database migrations tested in staging
- [ ] Rollback plan reviewed and approved
- [ ] Incident response team on standby
- [ ] Monitoring dashboards operational
- [ ] DNS/TLS certificates valid
- [ ] Rate limiting configured
- [ ] CDN cache rules verified

---

## 🎯 Deployment Strategy: Canary Release

We use a **canary deployment** strategy with automatic rollback on threshold violation.

### Traffic Distribution

```
Phase 1:  1% → Canary  (99% → Stable)     [5 min soak]
Phase 2:  5% → Canary  (95% → Stable)     [10 min soak]
Phase 3: 25% → Canary  (75% → Stable)     [15 min soak]
Phase 4: 50% → Canary  (50% → Stable)     [20 min soak]
Phase 5: 100% → Canary (0% → Stable)      [Full cutover]
```

### Success Criteria (per phase)

- Error rate < 0.1%
- p95 latency < 500ms
- p99 latency < 1000ms
- Zero critical errors in logs
- CPU < 70%
- Memory < 80%

### Automatic Rollback Triggers

- Error rate > 0.5%
- p95 latency > 1000ms
- Critical error detected
- Health check failure (3 consecutive)

---

## 📝 Step-by-Step Deployment

### Phase 0: Pre-Deployment Checks (T-30 min)

**Responsible**: SRE Lead

```bash
# 1. Verify staging environment
curl -I https://staging.ailydian.com/api/health

# 2. Run smoke tests
npx playwright test --grep @smoke

# 3. Check Vercel build status
vercel ls

# 4. Verify environment variables
vercel env ls production

# 5. Check rate limit configuration
curl https://www.ailydian.com/api/feature-flags | jq '.data.rate_limiting'

# 6. Verify DNS resolution
dig www.ailydian.com +short

# 7. Check TLS certificate expiry
echo | openssl s_client -connect www.ailydian.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Expected**: All checks pass, green light from SRE lead

---

### Phase 1: Deploy Canary (1% Traffic) - T0

**Responsible**: DevOps Engineer

```bash
# 1. Create deployment tag
git tag -a "v$(date +%Y%m%d-%H%M%S)-canary" -m "Canary deployment"
git push origin --tags

# 2. Deploy to Vercel with canary flag
vercel --prod --yes

# 3. Enable canary routing (1%)
# Via Vercel Dashboard: Settings → Deployment → Traffic Splitting
# - Canary: 1%
# - Production: 99%

# 4. Verify deployment URL
echo "Canary URL: https://ailydian-ultra-pro-<deployment-id>.vercel.app"
```

**Monitoring (5 minutes)**:

```bash
# Watch error rate
watch -n 5 'curl -s https://www.ailydian.com/api/health | jq .'

# Check logs (Vercel CLI)
vercel logs --follow

# Monitor metrics
open https://vercel.com/sardagsoftware/ailydian-ultra-pro/analytics
```

**Decision**: ✅ Proceed to Phase 2 / ❌ Rollback

---

### Phase 2: Increase to 5% Traffic - T+5 min

**Responsible**: SRE Engineer

```bash
# 1. Update traffic split (via Vercel Dashboard or API)
# - Canary: 5%
# - Production: 95%

# 2. Verify traffic distribution
curl -s https://www.ailydian.com/api/health | jq -r '.deployment_id'
# Run 100 times, expect ~5 different deployment IDs

# 3. Monitor for 10 minutes
```

**Monitoring Checklist**:

- [ ] Error rate < 0.1%
- [ ] p95 latency < 500ms
- [ ] No critical errors in logs
- [ ] CPU < 70%, Memory < 80%
- [ ] User reports: 0 critical issues

**Decision**: ✅ Proceed to Phase 3 / ❌ Rollback

---

### Phase 3: Increase to 25% Traffic - T+15 min

**Responsible**: SRE Engineer

```bash
# 1. Update traffic split
# - Canary: 25%
# - Production: 75%

# 2. Run smoke tests against production
npx playwright test tests/smoke/production.spec.ts --grep @critical

# 3. Check feature flags
curl https://www.ailydian.com/api/feature-flags | jq '.data'

# 4. Monitor for 15 minutes
```

**Monitoring Checklist**:

- [ ] All smoke tests passing
- [ ] Error rate stable
- [ ] Database connection pool healthy
- [ ] CDN cache hit ratio > 80%
- [ ] No rate limit 429 errors

**Decision**: ✅ Proceed to Phase 4 / ❌ Rollback

---

### Phase 4: Increase to 50% Traffic - T+30 min

**Responsible**: SRE Lead

```bash
# 1. Update traffic split
# - Canary: 50%
# - Production: 50%

# 2. Validate all critical paths
curl https://www.ailydian.com/api/ai-chat -X POST -H "Content-Type: application/json" \
  -d '{"message": "Test deployment", "model": "model_fast"}'

# 3. Check idempotency keys
curl https://www.ailydian.com/api/idempotency-stats

# 4. Monitor for 20 minutes
```

**Monitoring Checklist**:

- [ ] All API endpoints responding
- [ ] Idempotency middleware working
- [ ] Webhook validation active
- [ ] Rate limiting enforced
- [ ] No security alerts

**Decision**: ✅ Proceed to Phase 5 / ❌ Rollback

---

### Phase 5: Full Cutover (100% Traffic) - T+50 min

**Responsible**: SRE Lead + DevOps Manager

```bash
# 1. Final go/no-go decision
# - Review all metrics dashboards
# - Check incident reports
# - Verify rollback plan ready

# 2. Update traffic split
# - Canary: 100%
# - Production: 0%

# 3. Verify deployment
curl https://www.ailydian.com/api/health | jq '.version'

# 4. Update deployment alias
vercel alias set ailydian-ultra-pro-<canary-deployment-id>.vercel.app www.ailydian.com

# 5. Deprecate old deployment (after 24h soak)
# vercel remove <old-deployment-id> --yes
```

**Post-Cutover Monitoring (24 hours)**:

- [ ] Monitor error rates continuously
- [ ] Check user feedback channels
- [ ] Review logs for anomalies
- [ ] Verify backup systems
- [ ] Test rollback procedure (dry run)

---

## 🎉 Go-Live Completion

### Success Criteria Met

- [ ] All 5 canary phases completed successfully
- [ ] Zero critical incidents
- [ ] Error rate < 0.1%
- [ ] Latency within SLO
- [ ] User experience stable
- [ ] No data loss or corruption

### Post-Go-Live Actions

**Immediate (T+1h)**:
- [ ] Publish go-live announcement
- [ ] Update status page
- [ ] Notify stakeholders
- [ ] Document lessons learned

**Within 24h**:
- [ ] Review all metrics dashboards
- [ ] Analyze cost impact
- [ ] Update runbooks with findings
- [ ] Schedule post-mortem (if needed)

**Within 7 days**:
- [ ] Remove deprecated deployments
- [ ] Archive canary configurations
- [ ] Update documentation
- [ ] Plan next deployment

---

## 📞 Contacts & Escalation

### Incident Response Team

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| SRE Lead | TBD | TBD | @sre-lead |
| DevOps Manager | TBD | TBD | @devops-manager |
| CTO | TBD | TBD | @cto |

### Escalation Path

1. **Level 1** (0-5 min): SRE Engineer investigates
2. **Level 2** (5-15 min): SRE Lead engages, rollback decision
3. **Level 3** (15-30 min): DevOps Manager + CTO engaged
4. **Level 4** (30+ min): Full incident response, customer communication

---

## 🔗 Related Runbooks

- [ROLLBACK.md](./ROLLBACK.md) - Emergency rollback procedures
- [INCIDENT-RESPONSE.md](./INCIDENT-RESPONSE.md) - Incident management
- [MONITORING.md](./MONITORING.md) - Observability guidelines
- [SECURITY-INCIDENT.md](./SECURITY-INCIDENT.md) - Security breach response

---

## 📚 References

- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)
- [Canary Deployment Best Practices](https://martinfowler.com/bliki/CanaryRelease.html)
- [Feature Flag Strategy](https://martinfowler.com/articles/feature-toggles.html)

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-07 | SRE Team | Initial version |

---

**© 2025 Ailydian. All rights reserved.**
