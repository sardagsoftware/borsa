# Season 2 Week 1 Balance Note

**Patch ID**: s2-w1-hotfix-001
**Date**: 2026-01-21
**Version**: 1.0
**Status**: Ready for Canary Deployment
**Deployment**: Canary 10% (2h) → 50% (6h) → 100%
**Rollback**: ✅ Tested and Ready

---

## Executive Summary

Based on Season 2 Week 1 telemetry analysis (January 15-21, 2026), we are implementing targeted economy and difficulty micro-adjustments to maintain healthy KPIs while improving player engagement with storm puzzles and preparing for Week 2 boss launch.

**Key Changes:**
- 🔹 Storm puzzle rewards **+5% CR** (base) / **+10% CR** (perfect)
- 🔹 Echo Sentinel Phase 1 HP **-7%** (25,000 → 23,250)
- 🔹 Vendor prices **+3%** (conditional, if inflation >1.08)
- 🔹 Daily earn cap **-200 CR** (4,500 → 4,300, conditional if earn/spend >1.10)
- 🔹 Fraud detection threshold **2.5σ** (from 3.0σ, conditional if fraud flags >5)

**Expected Impact:**
- ✅ Maintain inflation index **<1.08** (target) / **<1.15** (critical)
- ✅ Improve storm puzzle completion from **~65%** to **70%+**
- ✅ Prepare boss success rate for **45-65%** target band
- ✅ Keep earn/spend ratio within **0.9-1.1** band
- ✅ Zero impact on player retention (D1 target: ≥42%)

---

## 1. Storm Puzzle Rewards (+5% Base, +10% Perfect)

### Problem Statement

Week 1 telemetry indicates storm puzzle completion rates are tracking below our 70% target:
- **Current**: 65-68% completion rate (depending on puzzle type)
- **Target**: ≥70% completion rate
- **Player Feedback**: "Rewards feel underwhelming for difficulty"

### Before/After Comparison

| Puzzle Type           | Before (Base) | After (Base) | Before (Perfect) | After (Perfect) | Change |
|-----------------------|---------------|--------------|------------------|-----------------|--------|
| Frequency Align       | 115 CR        | **120 CR**   | 170 CR           | **180 CR**      | +5/+10 |
| Phase Chain           | 130 CR        | **135 CR**   | 190 CR           | **200 CR**      | +5/+10 |
| Echo Triangulation    | 145 CR        | **150 CR**   | 215 CR           | **225 CR**      | +5/+10 |

### Impact Analysis

**Currency Flow Impact:**
- **Assumption**: 2,600 DAU, 70% attempt storm puzzles daily, 70% completion rate
- **Daily CR Injection (Before)**: ~130 CR/player/day from puzzles
- **Daily CR Injection (After)**: ~137 CR/player/day (+5.4% increase)
- **Total Economy Impact**: +18,200 CR/day systemwide (+5.4%)

**Inflation Risk**: LOW
- Daily earn cap (4,500 CR) remains primary throttle
- Vendor price adjustment (+3%) can absorb if inflation >1.08
- Net impact on earn/spend ratio: +0.02 (well within 0.9-1.1 band)

**Player Engagement Impact**: POSITIVE
- Expected completion rate increase: 65% → 72% (+7pp)
- Improved perceived value of storm content
- Supports Week 2 narrative progression

### Monitoring Metrics

- `puzzle_completion_rate` (target: ≥70%)
- `avg_cr_earned_per_dau` (watch for spike)
- `inflation_index` (must stay <1.08 warning, <1.15 critical)
- `player_satisfaction_nps` (expected +2-3 point lift)

---

## 2. Boss HP Adjustment (-7% for Echo Sentinel Phase 1)

### Problem Statement

S1 boss data showed success rates trending toward 48%, below our 55% target. S2 boss design (Echo Sentinel) is more mechanically complex, requiring preemptive balance.

**S1 Learnings:**
- Boss HP too high → success rate 48% → player frustration
- Optimal band: **45-65% success rate** (challenging but achievable)
- Co-op scaling factor critical (avoid HP wall in 4-player groups)

### Before/After Comparison

| Boss Encounter          | Before HP | After HP  | Change  | Co-op Scaling Before | Co-op Scaling After |
|-------------------------|-----------|-----------|---------|----------------------|---------------------|
| Echo Sentinel Phase 1   | 25,000    | **23,250** | **-7%** | 4,000/player         | **3,720/player**    |
| Echo Sentinel Phase 2   | 40,000    | 40,000    | No change | 6,400/player       | 6,400/player        |
| Echo Sentinel Phase 3   | 60,000    | 60,000    | No change | 9,600/player       | 9,600/player        |

**Rationale for Phase 1 Only:**
- Phase 1 launches Week 2 (Jan 22, 20:00 TRT) - immediate adjustment needed
- Phase 2/3 launch later (Week 3, Week 4) - observe Phase 1 data first
- Avoids overcorrection; iterative tuning preferred

### Impact Analysis

**Difficulty Impact:**
- **Solo**: ~13 seconds less fight duration (assuming 133 DPS average)
- **Co-op (4 players)**: ~17 seconds less fight duration
- **Success Rate Projection**: 48% → 56% (+8pp, within 45-65% target)

**Player Behavior Impact:**
- Reduced "brick wall" frustration on first attempts
- Better onboarding for boss mechanics learning
- Co-op groups benefit proportionally (no scaling imbalance)

**Economy Impact**: MINIMAL
- Boss defeat rewards unchanged (still 500 CR + loot)
- Attempt frequency may increase slightly (+5-10% more attempts)
- Net CR injection: +1,250 CR/day systemwide (negligible vs. 4,500 daily cap)

### Monitoring Metrics

- `boss_success_rate` (target: 45-65%)
- `avg_attempts_to_defeat` (expect decrease from ~3.2 to ~2.8)
- `boss_engagement_pct` (% of DAU attempting boss, target: ≥40%)
- `player_support_tickets` (watch for "too easy" feedback)

---

## 3. Vendor Price Adjustment (+3%, Conditional)

### Problem Statement

If Week 1 telemetry shows **inflation index >1.08**, we need a mild deflationary measure to counter purchasing power creep.

**Inflation Index Explained:**
```
Inflation Index = (Current Avg Balance / Current Avg Vendor Price) / (Baseline Avg Balance / Baseline Avg Vendor Price)
```
- **Baseline**: Jan 15, 2026 (S2 Week 1 Day 1)
- **Warning**: >1.08 (8% inflation)
- **Critical**: >1.15 (15% inflation, triggers auto-rollback)

### Before/After Comparison

| Vendor Category  | Before Multiplier | After Multiplier | Change | Example Item | Before Price | After Price |
|------------------|-------------------|------------------|--------|--------------|--------------|-------------|
| Cosmetics        | 1.00              | **1.03**         | +3%    | Storm Cape   | 1,200 CR     | **1,236 CR** |
| Consumables      | 1.00              | **1.03**         | +3%    | Healing Pot  | 50 CR        | **52 CR**    |
| Upgrades         | 1.00              | **1.03**         | +3%    | Echo Crystal | 800 CR       | **824 CR**   |
| Starter Bundles  | 1.00              | 1.00             | **No change** | New Player Kit | 500 CR | 500 CR |

**Conditional Application:**
- ✅ **Apply** if `inflation_index > 1.08` on Jan 21
- ❌ **Skip** if `inflation_index ≤ 1.08` (no adjustment needed)

### Impact Analysis

**Purchasing Power Impact:**
- **Mild deflation**: Players need ~3% more CR for same items
- **Avg transaction value**: Expected +24 CR per vendor visit
- **Player perception**: Minimal (3% is below JND threshold ~5%)

**Inflation Correction:**
- Expected inflation index reduction: -0.03 to -0.05
- Example: 1.10 → 1.05 (back to healthy range)
- Earn/spend ratio adjustment: +0.02 (compensates for storm puzzle reward increase)

**New Player Protection:**
- Starter bundles **exempt** from price increase
- First 10 levels unaffected by economy shift
- Onboarding flow remains smooth

### Monitoring Metrics

- `inflation_index` (target: <1.08)
- `vendor_usage_pct` (must stay ≥40%, watch for drop)
- `avg_transaction_value` (expect +24 CR)
- `player_satisfaction_nps` (ensure no negative impact)

---

## 4. Daily Earn Cap Reduction (-200 CR, Conditional)

### Problem Statement

If Week 1 telemetry shows **earn/spend ratio >1.10**, too much CR is entering the economy vs. sinks. Tightening the daily earn cap prevents runaway inflation.

**Earn/Spend Ratio Explained:**
```
Earn/Spend Ratio = Total CR Earned (all sources) / Total CR Spent (all sinks)
```
- **Target Band**: 0.9 - 1.1
- **Warning**: <0.90 or >1.10
- **Critical**: <0.85 or >1.20 (triggers auto-rollback)

### Before/After Comparison

| Limit Type       | Before  | After   | Change    | % Change |
|------------------|---------|---------|-----------|----------|
| Daily Earn Cap   | 4,500 CR | **4,300 CR** | **-200 CR** | **-4.4%** |
| Weekly Earn Cap  | 30,000 CR | **28,000 CR** | **-2,000 CR** | **-6.7%** |

**Conditional Application:**
- ✅ **Apply** if `earn_spend_ratio > 1.10` on Jan 21
- ❌ **Skip** if `earn_spend_ratio ≤ 1.10` (no adjustment needed)

**Safeguards (Abort Conditions):**
- ❌ **Abort** if `retention_d1_pct < 40%` (player engagement risk)
- ❌ **Abort** if `dau < 2,400` (population health risk)

### Impact Analysis

**Currency Flow Impact:**
- **Average Player**: Hits daily cap ~60% of days
- **Hardcore Players**: Hits daily cap 90%+ of days
- **Casual Players**: Rarely hits cap (unaffected)
- **Net CR Reduction**: -120 CR/player/day avg (-2.7% of daily cap)

**Player Behavior Impact:**
- **Low Impact**: Most players earn 3,200-4,000 CR/day (below cap)
- **High-Engagement Players**: May feel slight constraint
- **Compensated by**: Storm puzzle reward increase (+5%)

**Earn/Spend Ratio Correction:**
- Expected ratio reduction: -0.05 to -0.08
- Example: 1.13 → 1.05 (back to healthy 0.9-1.1 band)

**Retention Risk**: LOW
- Safeguards prevent application if D1 retention <40%
- Storm puzzle reward increase offsets perceived constraint
- Weekly cap reduction spreads impact over 7 days

### Monitoring Metrics

- `earn_spend_ratio` (target: 0.9-1.1)
- `retention_d1_pct` (critical safeguard: ≥40%)
- `dau` (critical safeguard: ≥2,400)
- `player_satisfaction_nps` (watch for negative sentiment)

---

## 5. Fraud Detection Tuning (2.5σ, Conditional)

### Problem Statement

If Week 1 telemetry shows **fraud flags >5 per day**, we need to increase sensitivity to abnormal earning patterns while minimizing false positives.

**Fraud Detection Thresholds:**
- **Current**: 3.0σ (3 standard deviations from mean earn rate)
- **Proposed**: 2.5σ (more sensitive)
- **Trade-off**: +20% fraud detection, +10% false positives

### Before/After Comparison

| Detection Type          | Before Threshold | After Threshold | Change | False Positive Impact |
|-------------------------|------------------|-----------------|--------|-----------------------|
| Earn Rate Anomaly       | 3.0σ             | **2.5σ**        | More sensitive | +10% FP rate |
| Duplication Attempt     | 3.0σ             | **2.5σ**        | More sensitive | +10% FP rate |
| Suspicious Transaction  | 1,000 CR         | **800 CR**      | Lower threshold | +15% FP rate |

**Conditional Application:**
- ✅ **Apply** if `fraud_flags > 5` per day (baseline is 2-3/day)
- ❌ **Skip** if `fraud_flags ≤ 5` (no fraud spike detected)

### Impact Analysis

**Fraud Detection Impact:**
- **Expected fraud catch rate**: +18-22% (from 65% to ~80%)
- **False positive rate**: +10% (from 8% to ~18% of flagged accounts)
- **Manual review queue**: +12 tickets/day (manageable by CS team)

**Player Impact:**
- **False Positive Handling**: Auto-review by CS within 24h
- **Communication**: Email notification "Account review in progress"
- **Resolution**: 90% cleared within 24h, no player-visible impact

**Economy Protection:**
- **Duplication exploits**: Catch earlier (2.5σ vs 3.0σ)
- **Bot farming**: Identify suspicious patterns sooner
- **CR injection prevention**: Estimated -800 CR/day from stopped exploits

### Monitoring Metrics

- `fraud_flags` (watch for spike >20, triggers rollback)
- `false_positive_rate` (target: <20%)
- `player_support_tickets` (capacity check: <50/day)
- `fraud_recovery_rate` (% of flagged CR recovered)

---

## Canary Deployment Plan

### Stage 1: 10% Canary (2 hours)

**Target Population**: 260 players (~10% of 2,600 DAU)
**Duration**: 2 hours
**Start Time**: TBD (coordinated with LiveOps team)

**Success Criteria:**
- ✅ Crash-free rate ≥98.5%
- ✅ Inflation index <1.15 (critical threshold)
- ✅ Earn/spend ratio 0.85-1.20 (critical band)
- ✅ Fraud flags <20 (no spike)

**Rollback Triggers (Auto):**
- 🔴 Crash-free rate <97.5%
- 🔴 Inflation index >1.15
- 🔴 Earn/spend ratio <0.80 or >1.25
- 🔴 Fraud flags >50

**Monitoring:**
- Real-time dashboard: `/monitoring/canary-s2-w1`
- Alert channels: `#alerts-economy`, `#alerts-liveops`
- PagerDuty: economy-oncall (on standby)

---

### Stage 2: 50% Canary (6 hours)

**Target Population**: 1,300 players (~50% of 2,600 DAU)
**Duration**: 6 hours
**Prerequisite**: Stage 1 success

**Success Criteria:**
- ✅ Crash-free rate ≥98.5%
- ✅ Inflation index <1.12 (tighter threshold)
- ✅ Retention D1 ≥40% (safeguard)
- ✅ Player support tickets <50 (capacity check)

**Rollback Triggers (Manual Review):**
- 🟡 Retention D1 <38% (review required)
- 🟡 NPS drop >5 points (sentiment check)
- 🟡 Support ticket spike >75 (capacity strain)

**Monitoring:**
- Hourly KPI snapshots
- Player sentiment analysis (Discord, Reddit)
- CS ticket categories (balance complaints)

---

### Stage 3: 100% Full Deployment (24 hours)

**Target Population**: All players (2,600 DAU)
**Duration**: 24 hours minimum observation
**Prerequisite**: Stage 2 success

**Success Criteria:**
- ✅ All metrics green (no warnings)
- ✅ No rollback triggered
- ✅ Week 2 preparation complete

**Final Sign-Off:**
- Economy lead approval
- LiveOps lead approval
- Incident log review (no critical issues)

---

## Rollback Plan

### Automated Rollback Triggers

1. **Inflation Index >1.15** (Critical)
   - **Action**: Immediate rollback to pre-patch state
   - **Notification**: PagerDuty + #alerts-economy
   - **Script**: `LiveOps/runbook/w1-rollback.sh`

2. **Crash-Free Rate <97.5%** (Critical)
   - **Action**: Immediate rollback
   - **Investigation**: Tech health team triages

3. **Fraud Flags >50** (Critical)
   - **Action**: Manual review required (no auto-rollback)
   - **Reason**: May indicate exploit, needs investigation

### Manual Rollback Process

**Script**: `LiveOps/runbook/w1-rollback.sh`
**Backup File**: `LiveOps/economy/patches/s2-w1-hotfix-backup.yaml`

**Rollback Steps:**
1. Execute: `./LiveOps/runbook/w1-rollback.sh`
2. Verify: All economy values reverted to pre-patch state
3. Monitor: 30 min observation for stability
4. Communicate: Player notification (if needed)
5. Post-Mortem: Document rollback reason

**Rollback SLA**: <30 minutes from decision to full revert

---

## Compliance & Audit

### KVKK/GDPR/PDPL Compliance

- ✅ **No PII in patch file**: User IDs anonymized in telemetry
- ✅ **Data retention**: 90-day limit on analytics data
- ✅ **Audit trail**: All patch deployments logged
- ✅ **Player consent**: Economy changes covered by ToS acceptance

### White-Hat Security

- ✅ **Official APIs only**: No scraping, no unofficial endpoints
- ✅ **RBAC enforcement**: Requires `economy.admin` role
- ✅ **Anti-cheat active**: Fraud detection operational
- ✅ **HMAC authentication**: All API calls signed

### Audit Trail

| Timestamp             | Action                 | User          | Status  |
|-----------------------|------------------------|---------------|---------|
| 2026-01-21 18:00 UTC  | Patch created          | liveops-team  | ✅      |
| 2026-01-21 18:30 UTC  | Economy lead approval  | economy-lead  | ✅      |
| 2026-01-21 19:00 UTC  | Canary Stage 1 deploy  | automation    | Pending |

---

## Success Metrics (Post-Deployment, Week 2 Review)

### Primary KPIs

| Metric                 | Baseline (W1) | Target (W2) | Critical Threshold |
|------------------------|---------------|-------------|--------------------|
| Inflation Index        | 1.05-1.10     | **<1.08**   | <1.15              |
| Earn/Spend Ratio       | 1.08-1.12     | **0.9-1.1** | 0.85-1.20          |
| Puzzle Completion      | 65-68%        | **≥70%**    | ≥60%               |
| Boss Success Rate      | N/A (W1)      | **45-65%**  | 35-75%             |
| Crash-Free Rate        | 98.7%         | **≥98.5%**  | ≥98.0%             |
| Retention D1           | 43.2%         | **≥42%**    | ≥40%               |

### Secondary KPIs

- **NPS**: Target +2-3 point lift (baseline: 42)
- **Vendor Usage**: Maintain ≥40% DAU
- **Fraud Flags**: Maintain <5/day avg
- **Player Support Tickets**: <50/day (balance-related)

---

## Week 2 Recommendations

Based on Week 1 analysis and this hotfix patch:

1. **Monitor Boss Phase 1 Data**: Collect 7 days of Echo Sentinel data (Jan 22-28) to validate HP adjustment
2. **A/B Experiment Interim Analysis**: Day 7 interim reports for active experiments (storm rewards, boss HP, co-op opt-in)
3. **PhotoMode Campaign**: Launch "Storm Trails" community event (Jan 23), moderate submissions within 24h SLA
4. **Economy Deep Dive**: If inflation persists >1.08 after W2, consider vendor price +5% (stronger deflation)
5. **Boss Phase 2/3 Prep**: Adjust HP for Phase 2/3 based on Phase 1 success rate data

---

## Approval & Sign-Off

| Role                  | Name          | Status    | Date/Time            |
|-----------------------|---------------|-----------|----------------------|
| Economy Lead          | [Name]        | ✅ Approved | 2026-01-21 18:30 UTC |
| LiveOps Lead          | [Name]        | Pending   | -                    |
| Tech Lead (Stability) | [Name]        | Pending   | -                    |

**Final Approval Required Before Canary Deployment**

---

## References

- **Analytics Notebook**: `Analytics/notebooks/S2-W1-review.ipynb`
- **SQL Queries**: `Analytics/queries/w1/*.sql`
- **Patch File**: `LiveOps/economy/patches/s2-w1-hotfix.yaml`
- **Rollback Script**: `LiveOps/runbook/w1-rollback.sh`
- **S2 Balance Baseline**: `LiveOps/economy/s2-balance.yaml`
- **A/B Experiments**: `LiveOps/experiments/s2-ab/*.json`

---

**Document Version**: 1.0
**Last Updated**: 2026-01-21 18:30 UTC
**Next Review**: 2026-01-28 (End of Week 2)
