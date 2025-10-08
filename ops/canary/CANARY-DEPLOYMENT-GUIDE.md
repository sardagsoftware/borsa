# 🚀 Canary Deployment Guide

**LyDian i18n System v2.0**
**Date:** 2025-10-07
**Author:** LyDian AI Platform - DevOps Team

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Rollout Strategy](#rollout-strategy)
3. [Feature Flags](#feature-flags)
4. [Canary Controller CLI](#canary-controller-cli)
5. [Monitoring & Metrics](#monitoring--metrics)
6. [Rollback Procedures](#rollback-procedures)
7. [Step-by-Step Deployment](#step-by-step-deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The canary deployment system allows gradual rollout of the i18n system to production users with automatic rollback capabilities.

**Key Features:**
- 5-phase gradual rollout (1% → 5% → 25% → 50% → 100%)
- Automatic rollback on error thresholds
- User bucketing for consistent experience
- Real-time monitoring
- Feature flags for granular control

---

## 📊 Rollout Strategy

### Phase Schedule

| Phase | Percentage | Duration | Description |
|-------|-----------|----------|-------------|
| Phase 1 | 1% | 24h | Initial canary - High-risk testing |
| Phase 2 | 5% | 48h | Expanded canary - Broader validation |
| Phase 3 | 25% | 72h | Quarter rollout - Significant user base |
| Phase 4 | 50% | 72h | Half rollout - Majority confidence |
| Phase 5 | 100% | Permanent | Full rollout - Complete deployment |

### Success Criteria

Each phase must meet these criteria before promotion:

**Phase 1 (1%):**
- Error rate: < 0.1%
- Load time: < 200ms
- User complaints: 0

**Phase 2 (5%):**
- Error rate: < 0.1%
- Load time: < 200ms
- User complaints: < 5

**Phase 3 (25%):**
- Error rate: < 0.1%
- Load time: < 250ms
- User complaints: < 10

**Phase 4 (50%):**
- Error rate: < 0.1%
- Load time: < 250ms
- User complaints: < 20

**Phase 5 (100%):**
- Error rate: < 0.1%
- Load time: < 300ms
- User complaints: < 50

---

## 🚩 Feature Flags

### Available Flags

```json
{
  "i18n_system_enabled": "Master switch for i18n system",
  "i18n_auto_detection": "Automatic locale detection",
  "i18n_locale_switcher": "Language switcher UI",
  "i18n_rtl_support": "RTL support for Arabic",
  "i18n_hreflang_tags": "SEO hreflang tags",
  "i18n_translation_cache": "Client-side caching",
  "i18n_lazy_loading": "Lazy load categories"
}
```

### Configuration File

**Location:** `ops/canary/feature-flags.json`

**Structure:**
```json
{
  "flags": {
    "i18n_system_enabled": {
      "enabled": true,
      "rolloutPercentage": 1,
      "rolloutStrategy": "gradual",
      "targetAudience": "all"
    }
  }
}
```

---

## 🛠️ Canary Controller CLI

### Installation

```bash
# Make executable
chmod +x ops/tools/canary-rollout-controller.js

# Add to PATH (optional)
ln -s $(pwd)/ops/tools/canary-rollout-controller.js /usr/local/bin/canary-rollout
```

### Commands

#### 1. Check Status

```bash
node ops/tools/canary-rollout-controller.js status
```

Shows current rollout status for all features.

#### 2. Start Rollout

```bash
node ops/tools/canary-rollout-controller.js start --feature=i18n_system_enabled
```

Starts canary deployment for a feature (moves to next phase).

#### 3. Promote to Next Phase

```bash
node ops/tools/canary-rollout-controller.js promote --feature=i18n_system_enabled
```

Manually promote to next phase (same as `start`).

#### 4. Rollback

```bash
node ops/tools/canary-rollout-controller.js rollback --feature=i18n_system_enabled
node ops/tools/canary-rollout-controller.js rollback --feature=i18n_system_enabled --reason="High error rate"
```

Rolls back to previous phase.

---

## 📈 Monitoring & Metrics

### Tracked Metrics

```javascript
{
  "i18n.locale.detected": "Number of successful locale detections",
  "i18n.locale.changed": "Number of manual locale changes",
  "i18n.translation.loaded": "Number of translation files loaded",
  "i18n.translation.failed": "Number of failed translations",
  "i18n.translation.cache_hit": "Cache hit rate",
  "i18n.translation.cache_miss": "Cache miss rate",
  "i18n.hreflang.injected": "SEO tags injected",
  "i18n.rtl.activated": "RTL mode activations",
  "i18n.load_time": "Average load time (ms)",
  "i18n.error_rate": "Error rate (%)"
}
```

### Alert Thresholds

| Metric | Threshold | Severity | Channel |
|--------|-----------|----------|---------|
| Error Rate | > 0.5% | Critical | Slack |
| Load Time | > 500ms | Warning | Slack |
| Translation Failures | > 10/min | Warning | Email |

---

## ⚠️ Rollback Procedures

### Automatic Rollback Triggers

The system automatically rolls back if any of these conditions are met:

1. **Error Rate > 0.5%** in 5-minute window
2. **Load Time > 500ms** average in 5-minute window
3. **User Complaints > 10** in 1-hour window
4. **Crash Rate > 0.1%** in 5-minute window

### Manual Rollback

```bash
# Rollback with reason
node ops/tools/canary-rollout-controller.js rollback \
  --feature=i18n_system_enabled \
  --reason="High error rate detected"

# Emergency rollback (disable feature)
node ops/tools/canary-rollout-controller.js rollback \
  --feature=i18n_system_enabled \
  --reason="EMERGENCY: Critical bug"
```

### Rollback Actions

1. **Revert to previous phase percentage**
2. **Log rollback event with reason**
3. **Send alert to team**
4. **Update monitoring dashboard**
5. **Notify affected users (if needed)**

---

## 📝 Step-by-Step Deployment

### Pre-Deployment Checklist

- [ ] All security tests passed
- [ ] Developer documentation complete
- [ ] Monitoring dashboard configured
- [ ] Team trained on rollback procedures
- [ ] Communication plan ready
- [ ] Rollback tested in staging

### Phase 1: Initial Canary (1%)

**Day 1 - Hour 0:**

```bash
# 1. Check current status
node ops/tools/canary-rollout-controller.js status

# 2. Start Phase 1 (1%)
node ops/tools/canary-rollout-controller.js start --feature=i18n_system_enabled

# 3. Monitor metrics
# - Check dashboard every 15 minutes
# - Watch error logs
# - Monitor user feedback
```

**Day 1 - Hours 1-24:**
- Monitor continuously for first 4 hours
- Check metrics every hour
- Review logs for errors
- Respond to any alerts immediately

**Day 1 - Hour 24 (Decision Point):**

Success criteria met?
- ✅ **YES** → Proceed to Phase 2
- ❌ **NO** → Rollback and investigate

```bash
# If successful, promote to Phase 2
node ops/tools/canary-rollout-controller.js promote --feature=i18n_system_enabled

# If failed, rollback
node ops/tools/canary-rollout-controller.js rollback --feature=i18n_system_enabled --reason="Success criteria not met"
```

### Phase 2: Expanded Canary (5%)

**Day 2-3:**
- Same monitoring as Phase 1
- 48-hour observation period
- Review user feedback
- Check performance metrics

### Phase 3: Quarter Rollout (25%)

**Day 4-6:**
- Significant user base now affected
- Monitor closely for pattern changes
- Review error logs daily
- Check user complaint tickets

### Phase 4: Half Rollout (50%)

**Day 7-9:**
- Majority of users now included
- Monitor for edge cases
- Review performance impact
- Prepare for full rollout

### Phase 5: Full Rollout (100%)

**Day 10+:**
- All users now have i18n enabled
- Continue monitoring
- Celebrate success! 🎉

---

## 🔍 Monitoring Dashboard

### Real-Time Metrics

Access the monitoring dashboard:

**URL:** `http://localhost:3100/ops/canary/monitoring-dashboard.html`

**Metrics Displayed:**
- Current rollout percentage per feature
- Error rate (real-time)
- Average load time
- Translation success rate
- Cache hit/miss ratio
- User feedback count
- Rollout history

### Grafana Integration (Optional)

For production monitoring, integrate with Grafana:

```bash
# Install Grafana datasource
# Add metrics from /api/monitoring/metrics endpoint
# Import dashboard from ops/canary/grafana-dashboard.json
```

---

## 🐛 Troubleshooting

### Issue: High Error Rate

**Symptoms:**
- Error rate > 0.5%
- Translation failures in logs

**Actions:**
1. Check recent code changes
2. Review translation file integrity
3. Verify API endpoints are responding
4. Check browser console errors
5. Consider rollback if critical

**Rollback Command:**
```bash
node ops/tools/canary-rollout-controller.js rollback \
  --feature=i18n_system_enabled \
  --reason="High error rate: [error description]"
```

### Issue: Slow Load Times

**Symptoms:**
- Load time > 500ms
- User complaints about slowness

**Actions:**
1. Check CDN cache hit rate
2. Review lazy loading implementation
3. Verify translation file sizes
4. Check network latency
5. Consider caching improvements

### Issue: User Complaints

**Symptoms:**
- Multiple support tickets
- Negative feedback

**Actions:**
1. Review complaint details
2. Check if specific to language/locale
3. Test in affected browsers
4. Reproduce issue locally
5. Fix and redeploy
6. Consider rollback if severe

### Issue: Feature Flag Not Working

**Symptoms:**
- Feature not activating for users
- Unexpected behavior

**Actions:**
1. Check feature-flags.json syntax
2. Verify user bucket calculation
3. Check browser local storage
4. Test with different user buckets
5. Clear cache and retry

**Debug Commands:**
```javascript
// In browser console
console.log('User bucket:', localStorage.getItem('ailydian_user_bucket'));
console.log('Feature flags:', localStorage.getItem('ailydian_feature_flags'));

// Force flag override for testing
const flags = new FeatureFlags();
await flags.init();
flags.setOverride('i18n_system_enabled', true);
```

---

## 📞 Support & Escalation

### On-Call Rotation

| Day | Engineer | Phone | Slack |
|-----|----------|-------|-------|
| Mon-Tue | Engineer A | xxx-xxxx | @engineerA |
| Wed-Thu | Engineer B | xxx-xxxx | @engineerB |
| Fri-Sun | Engineer C | xxx-xxxx | @engineerC |

### Escalation Path

1. **Level 1:** On-call engineer (0-15 min response)
2. **Level 2:** Team lead (15-30 min response)
3. **Level 3:** Engineering director (30-60 min response)

### Communication Channels

- **Slack:** #i18n-canary-alerts
- **Email:** i18n-team@ailydian.com
- **PagerDuty:** https://ailydian.pagerduty.com/i18n

---

## ✅ Post-Deployment Checklist

After successful full rollout (100%):

- [ ] Update documentation
- [ ] Archive rollout logs
- [ ] Conduct retrospective meeting
- [ ] Document lessons learned
- [ ] Update monitoring thresholds
- [ ] Remove temporary debugging code
- [ ] Celebrate team success! 🎉

---

## 📚 Additional Resources

- **Developer Guide:** `docs/i18n-developer-guide.md`
- **Security Report:** `ops/reports/PHASE-4-5-CLI-DEVOPS-SECURITY-COMPLETE-2025-10-07.md`
- **Feature Flags Config:** `ops/canary/feature-flags.json`
- **Rollout History:** `ops/canary/rollout-history.json`

---

**Made with ❤️ by LyDian AI Platform**
