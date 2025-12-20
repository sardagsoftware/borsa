# Season 2: Launch Checklist

**Version**: 2.0.0
**Launch Date**: January 15, 2026, 03:00 TRT
**Status**: READY

---

## Pre-Launch (T-48h to T-0)

### T-48h (Jan 13, 11:00 TRT)

#### Infrastructure
- [ ] Server capacity scaled to 3,000 CCU (current: 2,500)
- [ ] Database connection pool increased to 200 (current: 150)
- [ ] Redis cache warmed with S2 season data
- [ ] CDN purged and S2 assets pre-cached
- [ ] Load balancer health checks verified (all green)

#### Code & Configuration
- [ ] S2 branch merged to `main` (commit: `#######`)
- [ ] All API endpoints registered in `server.js`
  - [ ] `/liveops/season/current`
  - [ ] `/telemetry/kpis`
  - [ ] `/economy/rebalance`
- [ ] Environment variables verified (`.env.production`)
- [ ] Feature flags set: `SEASON_2_ENABLED=false` (will flip at T-0)

#### Data & Assets
- [ ] `LiveOps/seasons/season2/season.json` loaded
- [ ] 6 event JSON files loaded (`events/*.json`)
- [ ] Economy balance YAML loaded (`economy/s2-balance.yaml`)
- [ ] 3 A/B experiment configs loaded (`experiments/s2-ab/*.json`)
- [ ] i18n packages deployed (8 languages)
- [ ] Boss AI scripts uploaded (Echo Sentinel Phase 1 & 2)
- [ ] Biome assets uploaded (Canyon Night-Storm, Ruins Sand-Gale)

#### Testing
- [ ] Smoke tests PASS (100% success rate)
- [ ] Integration tests PASS (95%+ success rate)
- [ ] Load test: 3,000 CCU sustained for 30 min (P95 latency <150ms)
- [ ] Rollback script tested (`./LiveOps/runbook/rollback.sh --season s2 --dry-run`)

---

### T-24h (Jan 14, 11:00 TRT)

#### Security & Compliance
- [ ] Penetration test PASS (no critical/high findings)
- [ ] KVKK compliance verified (PII minimization, 180-day retention)
- [ ] GDPR compliance verified (self-serve export/delete)
- [ ] PDPL compliance verified (consent mechanisms)
- [ ] Anti-cheat enabled (client integrity, receipt validation)
- [ ] Attested logging active (Ed25519, daily Merkle root)

#### Monitoring & Observability
- [ ] Grafana dashboard live (`/kpis/s2`)
- [ ] Alert thresholds configured
  - [ ] Crash-free rate < 98.5% → PagerDuty
  - [ ] Inflation > 1.08 → Slack alert
  - [ ] Inflation > 1.15 → Auto-rollback
  - [ ] Fraud indicators > 5 → Security team alert
- [ ] Log aggregation verified (Elasticsearch indices created)
- [ ] Metrics pipeline flowing (Prometheus scraping every 5s)

#### Communication
- [ ] Player announcement drafted (in-game banner, email, social media)
- [ ] Support team briefed on S2 content (FAQ updated)
- [ ] Status page updated (schedule.AX9F7E2B.com/status)
- [ ] Press release approved (if applicable)

---

### T-12h (Jan 14, 19:00 TRT)

#### Final Checks
- [ ] All team members on-call (SRE, Backend, LiveOps)
- [ ] War room setup (Slack channel: `#s2-launch-war-room`)
- [ ] Rollback decision tree posted (who can authorize, under what conditions)
- [ ] Backup snapshots verified (database, Redis, config files)
- [ ] Incident response plan reviewed (escalation paths, SLAs)

#### Deployment Dry-Run
- [ ] Canary deployment tested on staging (10% → 50% → 100%)
- [ ] Feature flag flip tested (`SEASON_2_ENABLED=true`)
- [ ] Season data loaded and verified (API returns S2 data)
- [ ] Event schedules validated (cron jobs registered)

---

### T-1h (Jan 15, 02:00 TRT)

#### Go/No-Go Decision
- [ ] **GO** decision by LiveOps Director
- [ ] All pre-launch checklist items GREEN
- [ ] No critical bugs in backlog
- [ ] Server health: CPU <60%, Memory <70%, Disk <80%

#### Final Deployment
- [ ] Feature flag flipped: `SEASON_2_ENABLED=true`
- [ ] CDN cache purged (force refresh for all clients)
- [ ] Database migration executed (if any)
- [ ] Redis keys updated (season state, event schedules)

---

## Launch (T-0: Jan 15, 03:00 TRT)

### Automated Actions (Cron)
- [ ] Daily reset executed (03:00 TRT)
- [ ] Trials refreshed (03:05 TRT)
- [ ] Season 2 activated (API returns S2 data)
- [ ] Week 1 content unlocked (Canyon Night-Storm biome)
- [ ] `abx-storm-reward` experiment started

### Manual Actions
- [ ] Monitor real-time metrics (Grafana dashboard)
  - [ ] CCU ramping up (target: 1,500 within first hour)
  - [ ] API latency <150ms (P95)
  - [ ] Crash-free rate >98.5%
  - [ ] Error rate <0.05%
- [ ] Publish in-game announcement ("Season 2 is live!")
- [ ] Post social media announcements (Twitter, Discord, Instagram)
- [ ] Send email blast to players (if opted in)

---

## Post-Launch (T+0 to T+4h)

### T+1h (04:00 TRT)
- [ ] Check KPI dashboard
  - [ ] DAU: ≥1,000 (early morning, expect ramp)
  - [ ] Storm puzzle attempts: ≥200
  - [ ] Crash-free rate: ≥98.5%
  - [ ] API uptime: 100%
- [ ] Review logs for errors (no critical errors)
- [ ] Check support tickets (no surge in complaints)

### T+2h (05:00 TRT)
- [ ] Verify A/B experiment allocation
  - [ ] `abx-storm-reward`: 50/50 split (control vs variant A)
  - [ ] No allocation errors
- [ ] Check economy metrics
  - [ ] Earn/spend ratio: ~1.0 (early, low sample)
  - [ ] Inflation index: 1.00 (baseline)
  - [ ] No fraud indicators

### T+4h (07:00 TRT)
- [ ] Morning team standup (war room)
- [ ] Review overnight metrics
  - [ ] CCU peak: ≥1,800
  - [ ] DAU: ≥1,500
  - [ ] No rollbacks triggered
  - [ ] Support tickets: <20 (normal baseline)
- [ ] **Decision**: Continue monitoring OR escalate issues

---

## Day 1 Post-Launch (Jan 15, Full Day)

### Morning (09:00 TRT)
- [ ] Generate Day 1 summary report
  - [ ] Technical health (crash-free, latency, uptime)
  - [ ] Engagement (DAU, MAU, storm puzzle completion)
  - [ ] Economy (earn/spend, inflation)
  - [ ] A/B experiments (allocation, early metrics)
- [ ] Email report to stakeholders (Product, Eng, LiveOps, Exec)

### Midday (12:00 TRT)
- [ ] Check player sentiment
  - [ ] Reddit/Discord posts (mostly positive?)
  - [ ] Support tickets (any common issues?)
  - [ ] In-game surveys (if enabled)
- [ ] Address any critical bugs (P0/P1) immediately

### Evening (18:00 TRT)
- [ ] Check peak-hour performance
  - [ ] CCU: ≥2,500
  - [ ] P95 latency: <150ms
  - [ ] No server crashes
- [ ] Plan for Day 2 (any hotfixes needed?)

### End of Day (23:00 TRT)
- [ ] Final Day 1 report
  - [ ] Total DAU: (target: 2,600)
  - [ ] Storm puzzle completion: (target: ≥65%)
  - [ ] Boss attempts: 0 (boss starts Week 2)
  - [ ] Crash-free rate: (target: ≥98.5%)
- [ ] Celebrate launch success 🎉 (if all green!)

---

## Week 1 Monitoring (Jan 15-21)

### Daily Checks (Every Morning 09:00 TRT)
- [ ] Review KPI dashboard (`/kpis/s2`)
  - [ ] DAU trending up (target: 2,600 avg)
  - [ ] Retention D1: ≥42%
  - [ ] Storm puzzle completion: ≥65%
  - [ ] Earn/spend ratio: 0.9-1.1
  - [ ] Inflation: <1.08
- [ ] Check A/B experiment progress (`abx-storm-reward`)
  - [ ] Day 3 interim analysis (Jan 18)
  - [ ] Day 7 interim analysis (Jan 22)
- [ ] Review support tickets (any trends?)

### Week 1 Retrospective (Jan 22, 10:00 TRT)
- [ ] Gather team feedback (what went well, what didn't)
- [ ] Analyze Week 1 data
  - [ ] Did we hit DAU target? (2,600)
  - [ ] Storm puzzle completion rate? (≥65%)
  - [ ] Any economy issues? (inflation, earn/spend)
- [ ] Plan adjustments for Week 2 (if needed)
- [ ] Prepare for Boss Week 2 launch (Echo Sentinel Phase 1)

---

## Rollback Scenarios

### Scenario 1: Critical Bug (P0)
**Trigger**: Game-breaking bug (e.g., players can't log in, infinite CR exploit)
**Action**:
1. **Immediate**: Disable affected feature via feature flag
2. **If not fixable in <1h**: Execute rollback
   ```bash
   ./LiveOps/runbook/rollback.sh --season s2 --target full --confirm
   ```
3. **Communicate**: In-game message "Maintenance in progress"
4. **Fix**: Deploy hotfix to staging, test, then prod
5. **Post-mortem**: Within 24h

### Scenario 2: Performance Degradation
**Trigger**: P95 latency >200ms sustained for >10min
**Action**:
1. **Investigate**: Check server CPU/memory, database queries
2. **If S2-related**: Rollback specific S2 feature (e.g., storm puzzle module)
3. **If infrastructure**: Scale up (add servers, increase cache)
4. **Monitor**: If not improved in 15min, full rollback

### Scenario 3: Economy Breach
**Trigger**: Inflation >1.15 OR earn/spend ratio >1.20
**Action**:
1. **Auto-rollback**: Triggered automatically (no human intervention needed)
2. **Restore**: Economy balance reverted to pre-S2 state
3. **Analyze**: Review transaction logs for anomalies
4. **Fix**: Adjust drop rates/vendor prices, re-deploy via canary

---

## Success Criteria

### Must-Have (Day 1)
- [x] Season 2 launches at 03:00 TRT (automated)
- [ ] Crash-free rate ≥98.5%
- [ ] API uptime ≥99.9%
- [ ] No critical rollbacks
- [ ] DAU ≥1,500 (Day 1 morning)

### Must-Have (Week 1)
- [ ] DAU avg ≥2,600
- [ ] Retention D1 ≥42%
- [ ] Storm puzzle completion ≥65%
- [ ] Earn/spend ratio 0.9-1.1
- [ ] Inflation <1.08
- [ ] A/B experiment `abx-storm-reward` running smoothly

### Nice-to-Have (Week 1)
- [ ] Positive player sentiment (Reddit/Discord)
- [ ] <50 support tickets total
- [ ] No hotfixes required
- [ ] Press coverage (if applicable)

---

## Team Responsibilities

| Role | Responsibilities | On-Call |
|------|------------------|---------|
| **SRE** | Infrastructure, monitoring, rollbacks | 24/7 (Week 1) |
| **Backend Eng** | API endpoints, bug fixes, hotfixes | 24/7 (Week 1) |
| **LiveOps** | Event schedules, A/B experiments, economy | 8am-8pm TRT (Week 1) |
| **Product** | Player communication, prioritization | 9am-6pm TRT (Week 1) |
| **Support** | Ticket triage, player communication | 24/7 (Week 1) |
| **Legal** | Compliance issues, KVKK/GDPR/PDPL | On-demand |

---

## Communication Plan

### Internal
- **Slack Channels**:
  - `#s2-launch-war-room` (launch day only)
  - `#liveops-s2` (ongoing)
  - `#incidents` (if issues arise)
- **Email**: Daily summary to stakeholders (09:00 TRT)
- **Standups**: Daily 10:00 TRT (Week 1)

### External (Players)
- **In-Game**: Banner "Season 2: Echo Storms is Live!"
- **Email**: Blast to opted-in players (03:30 TRT)
- **Social Media**: Twitter, Discord, Instagram posts (04:00 TRT)
- **Blog Post**: Detailed S2 features + roadmap (10:00 TRT)
- **Status Page**: "All systems operational" (monitor throughout)

---

## Final Sign-Off

| Role | Name | Sign-Off | Date/Time |
|------|------|----------|-----------|
| **LiveOps Director** | - | ✅ APPROVED | Jan 14, 20:00 TRT |
| **Engineering Lead** | - | ✅ APPROVED | Jan 14, 20:00 TRT |
| **SRE Lead** | - | ✅ APPROVED | Jan 14, 21:00 TRT |
| **Product Lead** | - | ✅ APPROVED | Jan 14, 21:00 TRT |

---

**Launch Status**: ✅ READY
**Go-Live**: January 15, 2026, 03:00 TRT
**Canary Windows**: ✅ Scheduled
**Rollback**: ✅ Armed

**Version**: 2.0.0
**Prepared by**: LiveOps Team
