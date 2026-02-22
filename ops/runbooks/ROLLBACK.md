# ⏪ ROLLBACK RUNBOOK - Emergency Deployment Reversal

**Document Version**: 1.0
**Last Updated**: 2025-10-07
**Owner**: SRE Team
**Classification**: Internal - CRITICAL

---

## 🚨 WHEN TO USE THIS RUNBOOK

Initiate rollback **immediately** if any of these conditions occur:

- ❌ Error rate > 0.5% for 2+ minutes
- ❌ Critical service downtime detected
- ❌ Data corruption or loss detected
- ❌ Security breach or vulnerability exploited
- ❌ p95 latency > 2000ms (2x normal)
- ❌ Health check failure (3 consecutive)
- ❌ Customer-impacting bug in production

**DO NOT WAIT FOR APPROVAL** - SRE engineers have authority to rollback immediately.

---

## ⚡ FAST ROLLBACK (< 2 minutes)

Use this procedure when **speed is critical**.

### Step 1: Identify Current Deployment (15 seconds)

```bash
# Get current production deployment ID
vercel ls --prod | head -3
```

### Step 2: Identify Last Known Good Deployment (15 seconds)

```bash
# List recent deployments
vercel ls | head -10

# Get previous stable deployment
PREVIOUS_DEPLOYMENT=$(vercel ls --prod | sed -n '2p' | awk '{print $1}')
echo "Rolling back to: $PREVIOUS_DEPLOYMENT"
```

### Step 3: Execute Rollback (30 seconds)

```bash
# Promote previous deployment to production
vercel alias set $PREVIOUS_DEPLOYMENT www.ailydian.com --yes

# Verify rollback
curl -I https://www.ailydian.com/api/health
```

### Step 4: Verify Rollback Success (30 seconds)

```bash
# Check health endpoint
curl https://www.ailydian.com/api/health | jq .

# Check error rate (should drop immediately)
watch -n 2 'curl -s https://www.ailydian.com/api/health | jq ".error_rate"'

# Verify version
curl https://www.ailydian.com/api/health | jq -r '.version'
```

### Step 5: Communication (30 seconds)

```bash
# Post to Slack #incidents channel
echo "🚨 ROLLBACK EXECUTED - Deployment ID: $PREVIOUS_DEPLOYMENT - Reason: [fill in]" | slack-cli post #incidents

# Update status page
# https://status.ailydian.com → "Investigating"
```

**Total Time**: < 2 minutes

---

## 🔍 DETAILED ROLLBACK PROCEDURE

Use this when you have time to diagnose before rolling back.

### Phase 0: Assess the Situation (2-5 minutes)

**Responsible**: SRE Engineer + SRE Lead

**Checklist**:

1. **Identify the Issue**
   ```bash
   # Check error logs
   vercel logs --follow | grep -i "error"

   # Check metrics dashboard
   open https://vercel.com/lydiansoftware/ailydian-ultra-pro/analytics

   # Check user reports
   # Review #customer-support channel
   ```

2. **Determine Severity**
   - **P0 (Critical)**: Service down, data loss, security breach → **ROLLBACK IMMEDIATELY**
   - **P1 (High)**: Degraded performance, intermittent errors → **Rollback within 5 min**
   - **P2 (Medium)**: Non-critical bugs, cosmetic issues → **Consider hotfix**
   - **P3 (Low)**: Minor issues → **Plan fix for next deployment**

3. **Verify Rollback is the Right Action**
   - Can the issue be mitigated with a hotfix? (e.g., feature flag toggle)
   - Is rollback safe? (check for database migrations)
   - Will rollback cause data loss?

**Decision**: ✅ Proceed with rollback / ❌ Attempt hotfix / ⏸️ Monitor

---

### Phase 1: Pre-Rollback Safety Checks (1-2 minutes)

**CRITICAL**: Verify these before rolling back

```bash
# 1. Check for database migrations in current deployment
git log --oneline --grep="migrate" HEAD^..HEAD

# 2. Check for schema changes
git diff HEAD^ HEAD -- prisma/schema.prisma

# 3. Verify previous deployment is still available
vercel ls | grep $(date -v-1d +%Y-%m-%d)

# 4. Check if users have active sessions
# If yes, notify users or wait for graceful shutdown
```

**⚠️ WARNING**: If database migrations were run, rollback may cause schema mismatch. Coordinate with DB team.

---

### Phase 2: Execute Rollback (1-2 minutes)

**Responsible**: SRE Engineer (with SRE Lead approval for P1+)

#### Option A: Rollback via Vercel CLI (Recommended)

```bash
# 1. Set rollback target
ROLLBACK_TARGET="<deployment-id>"  # From Phase 0 investigation

# 2. Promote to production
vercel alias set $ROLLBACK_TARGET www.ailydian.com --yes

# 3. Verify deployment
curl -I https://www.ailydian.com/api/health

# 4. Check version
curl https://www.ailydian.com/api/health | jq -r '.version'
```

#### Option B: Rollback via Vercel Dashboard

1. Go to https://vercel.com/lydiansoftware/ailydian-ultra-pro/deployments
2. Find last known good deployment (green checkmark)
3. Click "..." → "Promote to Production"
4. Confirm promotion
5. Wait for deployment propagation (~30 seconds)

#### Option C: Rollback via Git Revert (For code-based issues)

```bash
# 1. Identify problematic commit
git log --oneline -5

# 2. Revert commit
git revert <commit-sha> --no-edit

# 3. Push to trigger new deployment
git push origin main

# 4. Wait for Vercel auto-deploy
vercel ls --follow
```

---

### Phase 3: Verify Rollback Success (2-3 minutes)

**Checklist**:

```bash
# 1. Health check
curl https://www.ailydian.com/api/health | jq .
# Expected: { "status": "OK", "version": "<previous-version>" }

# 2. Error rate
# Monitor for 2-3 minutes, should drop to baseline
watch -n 5 'curl -s https://www.ailydian.com/api/health | jq ".error_rate"'

# 3. Run smoke tests
npx playwright test tests/smoke/production.spec.ts

# 4. Check critical APIs
curl https://www.ailydian.com/api/ai-chat -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "model": "model_fast"}'

# 5. Check feature flags
curl https://www.ailydian.com/api/feature-flags | jq .

# 6. Verify CDN cache
curl -I https://www.ailydian.com | grep -i "x-vercel-cache"
```

**Success Criteria**:

- [ ] Health check returns 200 OK
- [ ] Error rate < 0.1%
- [ ] Smoke tests passing
- [ ] Critical APIs responding
- [ ] User reports: issue resolved

---

### Phase 4: Post-Rollback Actions (5-10 minutes)

**Immediate**:

1. **Update Status Page**
   - https://status.ailydian.com → "Resolved" or "Monitoring"
   - Post incident timeline

2. **Communicate to Stakeholders**
   ```bash
   # Slack #incidents channel
   echo "✅ ROLLBACK SUCCESSFUL - Services restored - Investigating root cause"

   # Email to leadership (if P0/P1)
   # Subject: "[RESOLVED] Production Rollback - <brief description>"
   ```

3. **Create Incident Ticket**
   - Document timeline
   - Attach logs and metrics screenshots
   - Assign root cause analysis owner

**Within 1 hour**:

4. **Root Cause Analysis (Preliminary)**
   - What caused the issue?
   - Why wasn't it caught in testing?
   - What monitoring gaps exist?

5. **Block Re-Deployment**
   - Add rollback commit to deployment blocklist
   - Update CI/CD to prevent re-merge of bad commit

**Within 24 hours**:

6. **Full Post-Mortem**
   - Schedule blameless post-mortem meeting
   - Document lessons learned
   - Create action items with owners
   - Update runbooks based on findings

---

## 🔄 FEATURE FLAG ROLLBACK (Alternative to Full Rollback)

If the issue is isolated to a specific feature, use feature flags instead of full deployment rollback.

### Quick Feature Flag Disable

```bash
# 1. Identify problematic feature flag
curl https://www.ailydian.com/api/feature-flags | jq .

# 2. Disable via Vercel environment variables
vercel env add FEATURE_FLAG_<NAME> false production

# 3. Trigger re-deployment (or wait for next request)
vercel --prod --force

# 4. Verify flag disabled
curl https://www.ailydian.com/api/feature-flags | jq '.data.<flag_name>'
# Expected: false
```

**Advantage**: No full rollback needed, faster recovery, isolated impact

---

## 🗂️ DATABASE ROLLBACK (Advanced)

**⚠️ CRITICAL**: Only perform with DBA approval

### When Database Rollback is Needed

- Schema migration caused data corruption
- Irreversible data changes made
- Foreign key constraints broken

### Database Rollback Procedure

```bash
# 1. Stop application (prevent writes)
# Via Vercel: disable production deployment temporarily

# 2. Identify migration to revert
npx prisma migrate status

# 3. Revert migration (DBA only)
npx prisma migrate resolve --rolled-back <migration-name>

# 4. Restore from backup (if needed)
# Coordinate with Azure Backup team

# 5. Verify schema
npx prisma db pull
git diff prisma/schema.prisma

# 6. Re-enable application
vercel alias set <deployment-id> www.ailydian.com
```

**Time Estimate**: 10-30 minutes (depending on database size)

---

## 📊 Rollback Metrics & Monitoring

### During Rollback - Monitor These

1. **Error Rate**: Should drop to < 0.1% within 30 seconds
2. **Latency**: p95 should return to baseline within 1 minute
3. **Health Check**: Should pass consistently (3+ consecutive)
4. **User Sessions**: Active sessions should not be disrupted
5. **CDN Cache**: May take 1-2 minutes to propagate

### Post-Rollback - Track These

1. **MTTR** (Mean Time to Recovery): Target < 5 minutes
2. **User Impact**: How many users affected? For how long?
3. **Data Loss**: Any data lost? How much?
4. **Revenue Impact**: Estimated lost revenue (if applicable)

---

## 📞 Rollback Escalation Path

| Time | Action | Responsible |
|------|--------|-------------|
| 0-2 min | Execute fast rollback | SRE Engineer |
| 2-5 min | Verify rollback success | SRE Lead |
| 5-10 min | Post-rollback actions | SRE Team |
| 10-30 min | Stakeholder communication | DevOps Manager |
| 30-60 min | Preliminary RCA | SRE Lead |
| 1-24h | Full post-mortem | SRE Team + Engineering |

---

## 🔗 Related Runbooks

- [GO-LIVE.md](./GO-LIVE.md) - Production deployment procedures
- [INCIDENT-RESPONSE.md](./INCIDENT-RESPONSE.md) - Incident management
- [DATABASE-RECOVERY.md](./DATABASE-RECOVERY.md) - Database backup/restore

---

## 📝 Rollback Checklist (Print & Keep)

```
⏪ ROLLBACK CHECKLIST

Pre-Rollback:
[ ] Severity assessed (P0/P1/P2/P3)
[ ] Rollback is the right decision
[ ] Database migrations checked
[ ] Previous deployment identified
[ ] SRE Lead notified (P0/P1)

Rollback Execution:
[ ] Deployment alias updated
[ ] Health check passing
[ ] Error rate dropped
[ ] Version verified

Post-Rollback:
[ ] Status page updated
[ ] Stakeholders notified
[ ] Incident ticket created
[ ] Smoke tests passing
[ ] Monitoring dashboards green

Follow-Up:
[ ] Root cause identified
[ ] Post-mortem scheduled
[ ] Action items created
[ ] Runbooks updated
```

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-07 | SRE Team | Initial version |

---

**© 2025 Ailydian. All rights reserved.**
