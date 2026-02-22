# 📊 MONITORING & OBSERVABILITY RUNBOOK

**Document Version**: 1.0
**Last Updated**: 2025-10-07
**Owner**: SRE Team
**Classification**: Internal

---

## 🎯 Overview

This runbook provides guidelines for monitoring Ailydian's production systems, interpreting metrics, and responding to alerts.

### Monitoring Philosophy

- **Proactive**: Detect issues before users report them
- **Actionable**: Every alert must have a clear response procedure
- **Context-Rich**: Metrics with business context, not just technical stats
- **User-Centric**: Monitor what users experience, not just backend metrics

---

## 📈 Key Metrics & SLOs

### Service Level Objectives (SLOs)

| Metric | Target | Measurement Period |
|--------|--------|-------------------|
| Availability | 99.9% | 30 days (43 min downtime/month max) |
| Error Rate | < 0.1% | 5 minutes |
| Latency (p95) | < 500ms | 5 minutes |
| Latency (p99) | < 1000ms | 5 minutes |
| TTFB | < 800ms | 5 minutes |

### Core Web Vitals (User Experience)

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5s - 4.0s | > 4.0s |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 |
| INP (Interaction to Next Paint) | < 200ms | 200ms - 500ms | > 500ms |
| TTFB (Time to First Byte) | < 800ms | 800ms - 1.8s | > 1.8s |

---

## 🔍 Where to Monitor

### 1. Vercel Analytics Dashboard

**URL**: https://vercel.com/lydiansoftware/ailydian-ultra-pro/analytics

**Monitors**:
- Deployment status
- Request count & error rate
- Response time (p50, p75, p95, p99)
- Edge network performance
- Function execution metrics
- Bandwidth usage

**Access**: Vercel dashboard → Project → Analytics

### 2. Vercel Logs

**URL**: https://vercel.com/lydiansoftware/ailydian-ultra-pro/logs

**Real-time logs**:
```bash
# Stream logs
vercel logs --follow

# Filter by function
vercel logs --follow /api/ai-chat

# Search logs
vercel logs --grep "error" --since 1h
```

**Monitors**:
- Application errors
- API request/response cycles
- Function cold starts
- Edge function execution

### 3. Health Check Endpoint

**URL**: https://www.ailydian.com/api/health

**Response Format**:
```json
{
  "status": "OK",
  "version": "1.0.0",
  "timestamp": "2025-10-07T14:00:00Z",
  "deployment_id": "abc123",
  "uptime": 3600,
  "error_rate": 0.05,
  "latency_p95": 450
}
```

**Monitoring Script**:
```bash
# Continuous health monitoring
watch -n 10 'curl -s https://www.ailydian.com/api/health | jq .'

# Alert on unhealthy status
while true; do
  STATUS=$(curl -s https://www.ailydian.com/api/health | jq -r '.status')
  if [ "$STATUS" != "OK" ]; then
    echo "🚨 ALERT: Health check failed! Status: $STATUS" | slack-cli post #alerts
  fi
  sleep 30
done
```

### 4. Feature Flags Dashboard

**URL**: https://www.ailydian.com/api/feature-flags

**Monitors**:
- Feature flag configuration
- Active experiments
- Rollout percentages

**Check Flags**:
```bash
curl https://www.ailydian.com/api/feature-flags | jq '.data | keys[]'
```

### 5. Custom Metrics (Idempotency, Rate Limiting)

**Idempotency Stats**:
```bash
curl https://www.ailydian.com/api/idempotency-stats | jq .
```

**Rate Limit Stats** (future):
```bash
curl https://www.ailydian.com/api/rate-limit-stats | jq .
```

---

## 🚨 Alert Definitions & Response Procedures

### Critical Alerts (P0) - Immediate Response Required

#### Alert: Service Down

**Trigger**: Health check fails 3 consecutive times (90 seconds)

**Response**:
1. Check Vercel status: https://www.vercel-status.com/
2. Check deployment logs: `vercel logs --follow`
3. If deployment issue: Execute [ROLLBACK.md](./ROLLBACK.md)
4. If infrastructure issue: Escalate to Vercel support
5. Update status page: https://status.ailydian.com

**Escalation**: SRE Lead (immediate)

---

#### Alert: Critical Error Rate

**Trigger**: Error rate > 0.5% for 2+ minutes

**Response**:
```bash
# 1. Identify error pattern
vercel logs --follow | grep -i "error" | head -50

# 2. Check affected endpoints
curl https://www.ailydian.com/api/health | jq '.error_breakdown'

# 3. If widespread: Execute ROLLBACK
# 4. If isolated: Disable affected feature flag

# 5. Create incident ticket
```

**Escalation**: SRE Engineer → SRE Lead (2 min)

---

#### Alert: Data Loss or Corruption

**Trigger**: Database integrity check fails OR user reports data loss

**Response**:
1. **STOP ALL WRITES** - Disable deployment immediately
2. Verify database connection: Check Prisma logs
3. Check for schema mismatch: `npx prisma db pull`
4. Coordinate with DBA for backup restore
5. Execute [DATABASE-RECOVERY.md](./DATABASE-RECOVERY.md)

**Escalation**: SRE Lead + DBA (immediate)

---

### High Alerts (P1) - Response Within 5 Minutes

#### Alert: High Latency

**Trigger**: p95 latency > 1000ms for 5+ minutes

**Response**:
```bash
# 1. Check function execution time
vercel logs --follow | grep "Duration"

# 2. Identify slow endpoints
# Vercel Analytics → Functions → Sort by duration

# 3. Check for database slow queries
# Review Prisma query logs

# 4. Check for AI provider latency
# Review provider-specific metrics

# 5. If persistent: Scale up resources or optimize queries
```

**Mitigation**:
- Enable CDN cache for slow endpoints
- Increase function timeout (if needed)
- Optimize database queries
- Implement request coalescing

**Escalation**: SRE Engineer → SRE Lead (5 min)

---

#### Alert: Elevated Error Rate

**Trigger**: Error rate > 0.1% but < 0.5% for 5+ minutes

**Response**:
1. Identify error type: 4xx (client) vs 5xx (server)
2. Check recent deployments: `vercel ls | head -5`
3. If related to recent deploy: Consider rollback
4. If client errors (4xx): Review API contracts
5. If server errors (5xx): Investigate backend

**Escalation**: SRE Engineer (monitor for 10 min before escalating)

---

### Medium Alerts (P2) - Response Within 30 Minutes

#### Alert: High CDN Cache Miss Rate

**Trigger**: Cache hit rate < 70% for 15+ minutes

**Response**:
1. Check cache headers: `curl -I https://www.ailydian.com`
2. Review Vercel cache analytics
3. Identify uncacheable endpoints
4. Update cache-control headers
5. Consider adding ISR (Incremental Static Regeneration)

**Escalation**: SRE Engineer (no immediate escalation)

---

#### Alert: Elevated Function Cold Starts

**Trigger**: Cold start rate > 10% for 30+ minutes

**Response**:
1. Review function size: Check bundle size
2. Optimize dependencies: Remove unused imports
3. Enable keep-alive: Configure function warming
4. Consider region optimization

---

### Low Alerts (P3) - Informational

#### Alert: Dependency Vulnerability

**Trigger**: npm audit reports high/critical vulnerabilities

**Response**:
1. Review vulnerability details: `npm audit`
2. Check for patches: `npm audit fix`
3. Plan upgrade in next sprint
4. Document in security backlog

---

## 📊 Metrics Dashboard

### Essential Metrics to Track

```bash
# Daily Health Check Script
#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 AILYDIAN DAILY HEALTH CHECK - $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Service Status
echo "\n🏥 Service Health:"
curl -s https://www.ailydian.com/api/health | jq .

# 2. Error Rate (last 24h)
echo "\n❌ Error Rate (24h):"
# Query Vercel analytics API

# 3. Latency (last 24h)
echo "\n⏱️  Latency Metrics (24h):"
# Query Vercel analytics API

# 4. Traffic Volume
echo "\n📈 Traffic Volume (24h):"
# Query Vercel analytics API

# 5. Top Endpoints
echo "\n🔝 Top 10 Endpoints:"
# Query Vercel logs

# 6. Feature Flag Status
echo "\n🚩 Feature Flags:"
curl -s https://www.ailydian.com/api/feature-flags | jq '.data | to_entries[] | select(.value == true) | .key'

# 7. Security Scan
echo "\n🔒 Security Status:"
npm audit --json | jq '{total: .metadata.vulnerabilities.total, critical: .metadata.vulnerabilities.critical, high: .metadata.vulnerabilities.high}'

# 8. SBOM Age
echo "\n📦 SBOM Status:"
find ops/sbom -name "SBOM-SUMMARY-*.md" -mtime -7 | wc -l | awk '{if ($1 > 0) print "✅ Recent SBOM found"; else print "⚠️  SBOM older than 7 days"}'

echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

---

## 🔧 Monitoring Tools & Access

### Vercel CLI Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Test access
vercel ls
```

### Monitoring Aliases (Add to ~/.bashrc or ~/.zshrc)

```bash
# Ailydian monitoring shortcuts
alias ailydian-health='curl -s https://www.ailydian.com/api/health | jq .'
alias ailydian-logs='vercel logs --follow'
alias ailydian-status='vercel ls --prod | head -5'
alias ailydian-deploy='vercel --prod --yes'
alias ailydian-rollback='vercel alias set'  # Add deployment ID
alias ailydian-flags='curl -s https://www.ailydian.com/api/feature-flags | jq .'
```

---

## 📞 Monitoring Team Contacts

### On-Call Rotation

| Shift | Hours | Primary | Backup |
|-------|-------|---------|--------|
| Day (Mon-Fri) | 09:00-17:00 CET | SRE Engineer A | SRE Engineer B |
| Evening (Mon-Fri) | 17:00-01:00 CET | SRE Engineer B | SRE Engineer C |
| Night (Mon-Fri) | 01:00-09:00 CET | SRE Engineer C | SRE Engineer A |
| Weekend | 24/7 | Rotating | SRE Lead |

### Escalation Contacts

| Role | Slack | Phone | Email |
|------|-------|-------|-------|
| SRE Lead | @sre-lead | TBD | sre-lead@ailydian.com |
| DevOps Manager | @devops-mgr | TBD | devops@ailydian.com |
| CTO | @cto | TBD | cto@ailydian.com |

---

## 📚 Related Resources

- [GO-LIVE.md](./GO-LIVE.md) - Deployment procedures
- [ROLLBACK.md](./ROLLBACK.md) - Rollback procedures
- [INCIDENT-RESPONSE.md](./INCIDENT-RESPONSE.md) - Incident management
- [Vercel Monitoring Docs](https://vercel.com/docs/analytics)
- [Core Web Vitals Guide](https://web.dev/vitals/)

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-07 | SRE Team | Initial version |

---

**© 2025 Ailydian. All rights reserved.**
