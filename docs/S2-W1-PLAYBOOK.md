# Season 2 Week 1 A/B Experimentation Playbook

**Date Range**: January 15-21, 2026 (Week 1)
**Status**: All experiments IN OBSERVATION (7-day minimum)
**Decision Timeline**: Week 2 conclusion (Jan 28, 2026)
**Analyst**: LiveOps Data Team

---

## Executive Summary

Week 1 of Season 2 has 3 active A/B experiments running concurrently:

1. **abx-coop-optin** - Co-op opt-in suggestion frequency
2. **abx-storm-reward** - Storm puzzle reward optimization
3. **abx-boss-hp-storm** - Boss HP tuning (Echo Sentinel)

**Current Status (Day 7 of 14):**
- ✅ All experiments passed sample size checks
- ✅ No SRM (Sample Ratio Mismatch) detected
- ✅ All guardrail metrics within safe bounds
- 🟡 Preliminary results available, but **7-day minimum observation** policy in effect
- 🔵 **Decision deferred to Week 2 conclusion** (Jan 28) for statistical confidence

**Key Principle**: **Do not ship based on Week 1 data alone**. Small variance in early days can mislead. Require minimum 14-day observation for economy/difficulty experiments.

---

## 1. Experiment Overview

### ABX-COOP-OPTIN: Co-op Opt-In Suggestion Frequency

**Hypothesis**: Increasing co-op suggestion frequency will improve adoption without harming user experience.

**Configuration**: `LiveOps/experiments/s2-ab/abx-coop-optin.json`

**Arms**:
- **Control**: 1 suggestion per area transition (baseline)
- **Variant A**: 2 suggestions per session
- **Variant B**: 3 context-aware suggestions (after puzzle, after boss attempt, on login)

**Primary Metric**: `coop_adoption_rate` (% of DAU who engage in co-op)
- **Baseline**: 25.0%
- **Target**: 30.0% (+5pp, +20% relative lift)
- **MDE**: 2.0pp (minimum detectable effect)

**Guardrail Metrics**:
- `prompt_dismissal_rate` < 70% (avoid annoyance)
- `session_duration` no decrease (ensure no early exits)
- `retention_d1` no decrease >2pp (protect core engagement)

**Sample Size** (per arm):
- **Required**: 8,400 users (α=0.05, β=0.20, MDE=2.0pp)
- **Current (Day 7)**: ~9,100 users per arm ✅

**Duration**:
- **Start**: 2026-01-15 00:00 UTC
- **End**: 2026-01-28 23:59 UTC (14 days)
- **Current**: Day 7 of 14 (50% complete)

---

### ABX-STORM-REWARD: Storm Puzzle Reward Optimization

**Hypothesis**: Increasing storm puzzle rewards will boost completion rate without causing inflation.

**Configuration**: `LiveOps/experiments/s2-ab/abx-storm-reward.json`

**Arms**:
- **Control**: Current rewards (115-145 CR base)
- **Variant A**: +10% rewards (127-160 CR base)
- **Variant B**: +20% rewards + cosmetic drop chance (138-174 CR + 5% cape drop)

**Primary Metric**: `puzzle_completion_rate`
- **Baseline**: 65.0%
- **Target**: 70.0% (+5pp, +7.7% relative lift)
- **MDE**: 3.0pp (minimum detectable effect)

**Guardrail Metrics**:
- `inflation_index` < 1.08 (prevent runaway economy)
- `earn_spend_ratio` 0.9-1.1 (maintain balance)
- `avg_time_to_complete` no increase >10% (avoid grinding)

**Sample Size** (per arm):
- **Required**: 6,200 users (α=0.05, β=0.20, MDE=3.0pp)
- **Current (Day 7)**: ~6,800 users per arm ✅

**Duration**:
- **Start**: 2026-01-15 00:00 UTC
- **End**: 2026-01-28 23:59 UTC (14 days)
- **Current**: Day 7 of 14 (50% complete)

---

### ABX-BOSS-HP-STORM: Boss HP Tuning (Echo Sentinel)

**Hypothesis**: Reducing boss HP by 10% will improve success rate to 55% target without making fight trivial.

**Configuration**: `LiveOps/experiments/s2-ab/abx-boss-hp-storm.json`

**Arms**:
- **Control**: 25,000 HP (baseline)
- **Variant A**: 22,500 HP (-10%, softer)
- **Variant B**: 27,500 HP (+10%, harder)

**Primary Metric**: `boss_success_rate`
- **Baseline**: 48.0%
- **Target**: 55.0% (+7pp, +14.6% relative lift)
- **MDE**: 5.0pp (minimum detectable effect)

**Guardrail Metrics**:
- `avg_attempts_to_defeat` 2.5-4.0 (avoid frustration or trivialization)
- `boss_engagement_pct` no decrease (protect interest)
- `retention_d1` no decrease >2pp (protect core engagement)

**Sample Size** (per arm):
- **Required**: 4,500 users (α=0.05, β=0.20, MDE=5.0pp)
- **Current (Day 7)**: Boss launches Week 2, so **N=0** (no data yet)

**Duration**:
- **Start**: 2026-01-22 20:00 TRT (Week 2 launch)
- **End**: 2026-02-05 23:59 UTC (14 days post-launch)
- **Current**: Not yet started (launches in 1 day)

---

## 2. Week 1 Interim Analysis (Day 7)

### 2.1 Sample Size & SRM Checks

| Experiment        | Control N | Variant A N | Variant B N | Expected Ratio | Observed Ratio | SRM p-value | SRM Status |
|-------------------|-----------|-------------|-------------|----------------|----------------|-------------|------------|
| abx-coop-optin    | 9,124     | 9,087       | 9,139       | 33.3/33.3/33.3 | 33.2/33.1/33.3 | 0.94        | ✅ PASS    |
| abx-storm-reward  | 6,832     | 6,791       | 6,845       | 33.3/33.3/33.3 | 33.3/33.1/33.4 | 0.88        | ✅ PASS    |
| abx-boss-hp       | 0         | 0           | 0           | N/A            | N/A            | N/A         | Not started |

**Interpretation**: No Sample Ratio Mismatch detected. Traffic split is operating correctly (33.3% per arm).

---

### 2.2 Preliminary Results (DAY 7 ONLY - NOT FINAL)

⚠️ **CAUTION**: Day 7 data is preliminary. Do NOT make shipping decisions based on Week 1 alone. Small variance can flip results.

#### ABX-COOP-OPTIN (Day 7 Snapshot)

| Metric                  | Control  | Variant A | Variant B | Δ vs Control (A) | Δ vs Control (B) | p-value (A) | p-value (B) |
|-------------------------|----------|-----------|-----------|------------------|------------------|-------------|-------------|
| `coop_adoption_rate`    | 25.3%    | 27.1%     | 28.9%     | +1.8pp (+7.1%)   | +3.6pp (+14.2%)  | 0.08        | 0.02*       |
| `prompt_dismissal_rate` | 42.1%    | 58.3%     | 61.2%     | +16.2pp          | +19.1pp          | <0.001***   | <0.001***   |
| `session_duration`      | 42.3 min | 41.8 min  | 40.1 min  | -0.5 min         | -2.2 min         | 0.64        | 0.12        |
| `retention_d1`          | 43.2%    | 42.9%     | 42.1%     | -0.3pp           | -1.1pp           | 0.76        | 0.34        |

**Preliminary Observations**:
- 🟢 **Variant B shows +3.6pp lift** in co-op adoption (p=0.02, statistically significant at Day 7)
- 🔴 **Guardrail concern**: Prompt dismissal rate spiked to 61.2% in Variant B (above 70% threshold but approaching)
- 🟡 **Session duration trending down** in Variant B (-2.2 min, p=0.12, not yet significant)
- 🟢 **Retention D1 stable** (no harm detected)

**Week 2 Decision Criteria**:
- **Ship Variant B** IF: co-op adoption ≥+2.0pp AND prompt dismissal <70% AND retention stable
- **Ship Variant A** IF: co-op adoption ≥+1.5pp AND better guardrails than B
- **Keep Control** IF: guardrail violations or insufficient lift

---

#### ABX-STORM-REWARD (Day 7 Snapshot)

| Metric                  | Control | Variant A | Variant B | Δ vs Control (A) | Δ vs Control (B) | p-value (A) | p-value (B) |
|-------------------------|---------|-----------|-----------|------------------|------------------|-------------|-------------|
| `puzzle_completion_rate`| 65.2%   | 68.1%     | 71.3%     | +2.9pp (+4.4%)   | +6.1pp (+9.4%)   | 0.04*       | <0.001***   |
| `inflation_index`       | 1.06    | 1.08      | 1.11      | +0.02            | +0.05            | 0.22        | 0.03*       |
| `earn_spend_ratio`      | 1.02    | 1.04      | 1.07      | +0.02            | +0.05            | 0.18        | 0.02*       |
| `avg_time_to_complete`  | 8.4 min | 8.6 min   | 8.3 min   | +0.2 min         | -0.1 min         | 0.54        | 0.76        |

**Preliminary Observations**:
- 🟢 **Variant B shows +6.1pp lift** in puzzle completion (p<0.001, highly significant)
- 🔴 **Guardrail violation**: Inflation index 1.11 in Variant B (exceeds 1.08 warning threshold)
- 🟡 **Earn/spend ratio 1.07** in Variant B (within 0.9-1.1 band, but trending high)
- 🟢 **Variant A shows moderate lift** (+2.9pp) with safer guardrails (inflation 1.08, borderline)

**Week 2 Decision Criteria**:
- **Ship Variant A** IF: completion lift ≥+2.5pp AND inflation <1.08 AND earn/spend <1.10
- **Do NOT ship Variant B** (inflation violation likely to persist)
- **Consider hotfix approach**: +5% rewards (between Control and Variant A) to split the difference

---

### 2.3 Guardrail Status Summary

| Experiment          | Arm       | Guardrail Metric         | Threshold    | Observed | Status      |
|---------------------|-----------|--------------------------|--------------|----------|-------------|
| abx-coop-optin      | Variant A | prompt_dismissal_rate    | <70%         | 58.3%    | ✅ SAFE     |
| abx-coop-optin      | Variant B | prompt_dismissal_rate    | <70%         | 61.2%    | 🟡 WATCH    |
| abx-coop-optin      | All       | retention_d1             | No drop >2pp | -1.1pp   | ✅ SAFE     |
| abx-storm-reward    | Variant A | inflation_index          | <1.08        | 1.08     | 🟡 BORDERLINE |
| abx-storm-reward    | Variant B | inflation_index          | <1.08        | 1.11     | 🔴 VIOLATION |
| abx-storm-reward    | All       | earn_spend_ratio         | 0.9-1.1      | 1.07     | ✅ SAFE     |

**Guardrail Violations**:
- 🔴 **abx-storm-reward Variant B**: Inflation index 1.11 exceeds 1.08 warning threshold
- **Action**: Do NOT ship Variant B. Monitor Variant A for Week 2 data.

---

## 3. Statistical Methodology

### 3.1 Minimum Detectable Effect (MDE)

MDE is the smallest effect size we can reliably detect with our sample size and desired statistical power.

**Formula** (for proportions):
```
MDE = (z_α/2 + z_β) * sqrt( p*(1-p) * (1/n_control + 1/n_treatment) )
```

Where:
- `z_α/2` = 1.96 (for α=0.05, two-tailed)
- `z_β` = 0.84 (for β=0.20, power=80%)
- `p` = baseline proportion
- `n` = sample size per arm

**Example: abx-coop-optin**
- Baseline: p=0.25 (25% adoption)
- Sample size: n=8,400 per arm
- MDE = (1.96 + 0.84) * sqrt(0.25*0.75 * (2/8400)) = **0.020** (2.0pp)

**Interpretation**: We can detect a ≥2.0pp change in co-op adoption with 80% power.

---

### 3.2 Statistical Power

Power is the probability of detecting a true effect if it exists.

**Power Calculation** (post-hoc for Day 7 data):

| Experiment        | Observed Effect | MDE  | Achieved Power | Target Power |
|-------------------|-----------------|------|----------------|--------------|
| abx-coop-optin A  | +1.8pp          | 2.0pp| 62%            | 80%          |
| abx-coop-optin B  | +3.6pp          | 2.0pp| 94%            | 80%          |
| abx-storm-reward A| +2.9pp          | 3.0pp| 73%            | 80%          |
| abx-storm-reward B| +6.1pp          | 3.0pp| 99%            | 80%          |

**Interpretation**:
- Variant B arms (both experiments) have high achieved power (>90%) - effects are robust
- Variant A arms are underpowered at Day 7 (62-73%) - need Week 2 data to reach 80%

---

### 3.3 p-Value Thresholds & Multiple Comparisons

**Standard Threshold**: p < 0.05 (5% false positive rate)

**Bonferroni Correction** (for multiple comparisons):
- 2 variants per experiment → adjusted α = 0.05 / 2 = **0.025**
- **Decision Rule**: Require p < 0.025 to claim significance when comparing 2 variants to control

**Example**:
- abx-coop-optin Variant B: p=0.02 → **Significant** (p < 0.025)
- abx-coop-optin Variant A: p=0.08 → **Not significant** (p > 0.025)

**Sequential Testing Adjustment**:
- Since we're running 14-day experiments with Day 7 interim, apply **O'Brien-Fleming boundary**
- Day 7 interim: Require p < 0.005 to stop early (conservative)
- Day 14 final: Require p < 0.048 (spending function adjusted)

**Current Status**: No experiment meets p<0.005 for early stopping → Continue to Day 14.

---

### 3.4 Sample Ratio Mismatch (SRM) Test

SRM detects traffic allocation bugs (e.g., 40/30/30 split instead of 33/33/33).

**Chi-Square Test**:
```
χ² = Σ [(Observed - Expected)² / Expected]
```

**Example: abx-coop-optin**
- Expected: 9,117 / 9,117 / 9,117 (33.3% each, total 27,350)
- Observed: 9,124 / 9,087 / 9,139
- χ² = (9124-9117)²/9117 + (9087-9117)²/9117 + (9139-9117)²/9117 = 0.12
- p-value = 0.94 (df=2) → **No SRM detected** ✅

**Action**: If SRM p-value < 0.01, investigate traffic allocation bug before analyzing results.

---

## 4. Week 2 Decision Framework

### 4.1 Decision Tree

```
IF (Day 14 data available AND SRM pass AND guardrails safe):
    IF (primary metric lift ≥ MDE AND p < 0.048):
        IF (ALL guardrails safe):
            → SHIP variant
        ELSE:
            → DO NOT SHIP (guardrail violation)
    ELSE:
        → KEEP CONTROL (insufficient lift or not significant)
ELSE:
    → EXTEND EXPERIMENT (collect more data)
```

### 4.2 Shipping Criteria

**abx-coop-optin**:
- ✅ Ship IF: `coop_adoption_rate` lift ≥2.0pp AND p<0.048 AND `prompt_dismissal_rate`<70% AND `retention_d1` stable
- 🟡 Consider IF: lift ≥1.5pp AND p<0.05 AND all guardrails safe
- ❌ Kill IF: `prompt_dismissal_rate`≥70% OR `retention_d1` drop >2pp

**abx-storm-reward**:
- ✅ Ship IF: `puzzle_completion_rate` lift ≥3.0pp AND p<0.048 AND `inflation_index`<1.08 AND `earn_spend_ratio`<1.10
- 🟡 Consider IF: lift ≥2.5pp AND p<0.05 AND inflation <1.10
- ❌ Kill IF: `inflation_index`≥1.10 OR `earn_spend_ratio`≥1.12

**abx-boss-hp-storm**:
- ✅ Ship IF: `boss_success_rate` in 45-65% band AND p<0.048 AND `avg_attempts_to_defeat` 2.5-4.0
- 🟡 Consider IF: success rate 40-70% AND player sentiment positive
- ❌ Kill IF: success rate <40% (too hard) OR >70% (too easy)

---

### 4.3 Week 2 Timeline

| Date       | Milestone                          | Action                                      |
|------------|------------------------------------|---------------------------------------------|
| Jan 22     | Boss launch (abx-boss-hp starts)   | Monitor initial success rate                |
| Jan 25     | Day 10 check-in                    | Review trends, no decisions yet             |
| Jan 28     | Day 14 final analysis              | Generate final reports                      |
| Jan 29     | Decision meeting                   | Economy lead + LiveOps lead review          |
| Jan 30     | Ship decisions communicated        | Prepare rollout or kill experiments         |
| Feb 1-3    | Rollout (if shipping)              | Canary → GA deployment                      |

---

## 5. Risk Mitigation

### 5.1 Experiment Interactions

**Risk**: abx-coop-optin and abx-storm-reward may interact (co-op players do more puzzles).

**Mitigation**:
- Monitor `coop_adoption_rate` in abx-storm-reward arms (check for imbalance)
- If co-op rate differs >3pp across storm-reward arms, flag as confound
- Post-hoc analysis: Stratify by co-op vs solo players

**Current Status (Day 7)**:
- Co-op rate in abx-storm-reward Control: 26.1%
- Co-op rate in abx-storm-reward Variant A: 26.3%
- Co-op rate in abx-storm-reward Variant B: 26.8%
- Δ = 0.7pp (within noise) ✅ No interaction detected

---

### 5.2 Novelty Effect

**Risk**: Week 1 lifts may be due to novelty (players try new content), not sustained interest.

**Mitigation**:
- Require 14-day minimum observation (covers novelty decay)
- Monitor Day 1-7 vs Day 8-14 trends
- If Day 8-14 shows regression, flag as novelty effect

**Example**:
- IF `puzzle_completion_rate` Day 1-7: 71.3% BUT Day 8-14: 67.2% → Novelty effect, adjust expectations

---

### 5.3 Weekend vs Weekday Variance

**Risk**: Week 1 includes only 1 weekend (Jan 18-19). Week 2 adds another (Jan 25-26).

**Mitigation**:
- Segment analysis by weekday vs weekend
- Ensure both weeks capture weekend behavior
- Use mixed-effects model if weekend variance is high

**Current Status (Day 7)**:
- Weekend co-op adoption: 28.4% (vs 25.6% weekday) → +2.8pp weekend lift
- Include weekend effects in final model

---

### 5.4 External Events

**Risk**: External events (e.g., streamer promotion, competitor launch) bias results.

**Mitigation**:
- Monitor social mentions, DAU spikes
- Log external events in experiment notes
- If major event detected, extend experiment or discount data

**Current Status (Day 7)**:
- No major external events detected ✅
- DAU stable at 2,600-2,750 range

---

## 6. Observation Notes (Running Log)

### Jan 15 (Day 1)
- ✅ All experiments launched successfully at 00:00 UTC
- ✅ Traffic split verified: 33.3/33.3/33.3 per experiment
- ✅ Telemetry pipelines operational, no data loss

### Jan 16 (Day 2)
- 🟡 abx-storm-reward Variant B showing early inflation spike (1.09) - monitoring
- ✅ abx-coop-optin showing positive early trends

### Jan 17 (Day 3)
- 🟢 Sample sizes growing on target (~3,600 per arm per experiment)
- 🟡 Prompt dismissal rate in abx-coop-optin Variant B elevated (59.4%) - watch

### Jan 18 (Day 4, Weekend)
- 🟢 Weekend co-op adoption spike (+2.8pp) - expected behavior
- 🔴 abx-storm-reward Variant B inflation index 1.11 - guardrail violation flagged

### Jan 19 (Day 5, Weekend)
- 🟢 Puzzle completion rates elevated on weekend (+3-5pp across all arms)
- 🟡 Boss launch prep: abx-boss-hp-storm traffic allocation tested (ready for Day 8)

### Jan 20 (Day 6)
- 🟢 Return to weekday baseline for most metrics
- 🟡 abx-storm-reward Variant B inflation persisting at 1.10-1.11 - likely to recommend against shipping

### Jan 21 (Day 7, Interim Analysis)
- ✅ Day 7 interim report generated (this document)
- 🟢 SRM checks PASS for all experiments
- 🔴 abx-storm-reward Variant B flagged for guardrail violation (inflation 1.11)
- 🟡 abx-coop-optin Variant B showing promise (+3.6pp lift) but prompt dismissal approaching threshold
- 🔵 Decision deferred to Day 14 (Jan 28)

---

## 7. Post-Experiment Checklist (Week 2)

When Day 14 data is available:

- [ ] Run final SRM check (χ² test, p>0.01 required)
- [ ] Run final statistical tests (two-proportion z-test, Bonferroni adjusted)
- [ ] Check all guardrail metrics (flagged if any violations)
- [ ] Segment analysis (weekend vs weekday, co-op vs solo)
- [ ] Novelty effect check (Day 1-7 vs Day 8-14 trends)
- [ ] Document decision rationale (ship, kill, or extend)
- [ ] Generate rollout plan (if shipping) or kill plan (if discontinuing)
- [ ] Update experiment registry with final status
- [ ] Post-mortem report (what worked, what didn't, learnings)

---

## 8. Key Learnings & Best Practices

### Week 1 Learnings

1. **7-day data is insufficient for economy experiments**: Variance too high, need 14 days minimum
2. **Guardrail violations are decisive**: Even if primary metric wins, inflation violation = kill
3. **Weekend behavior differs significantly**: Always include 2 weekends in experiment duration
4. **Prompt frequency has limits**: abx-coop-optin Variant B approaching annoyance threshold
5. **SRM checks are critical**: Must verify traffic split before analyzing results

### Best Practices Confirmed

- ✅ **Pre-register experiments**: Documented in `/LiveOps/experiments/s2-ab/*.json`
- ✅ **Define MDE upfront**: Ensures adequate power
- ✅ **Set guardrails explicitly**: Prevents shipping harmful variants
- ✅ **Interim analysis at Day 7**: Catch critical issues early, but don't ship early
- ✅ **Bonferroni correction**: Protects against false positives in multi-arm tests

---

## 9. Week 2 Action Items

### For Data Team

- [ ] Continue daily monitoring of all 3 experiments
- [ ] Generate Day 14 final reports (Jan 28)
- [ ] Prepare decision deck for Jan 29 meeting
- [ ] Post-hoc analysis: Stratify by co-op vs solo, weekend vs weekday

### For Economy Team

- [ ] Review abx-storm-reward guardrail violation
- [ ] Prepare alternative: +5% reward hotfix (between Control and Variant A)
- [ ] If abx-boss-hp-storm shows HP too high, prepare hotfix

### For LiveOps Team

- [ ] Monitor abx-boss-hp-storm launch (Jan 22)
- [ ] Coordinate decision meeting (Jan 29)
- [ ] Prepare rollout plans for winning variants

---

## 10. Compliance & Audit

### KVKK/GDPR/PDPL Compliance

- ✅ **User consent**: Covered by ToS acceptance (users aware of experiments)
- ✅ **Anonymization**: User IDs hashed in experiment logs
- ✅ **Data retention**: 90-day limit on experiment data
- ✅ **Right to withdraw**: Users can opt out via settings (excluded from analysis)

### White-Hat Experimentation

- ✅ **No dark patterns**: Co-op prompts have clear "Dismiss" option
- ✅ **No harmful experiments**: All guardrails protect player experience
- ✅ **Transparent methodology**: This playbook documents all decisions
- ✅ **Ethical review**: Economy lead approved all experiments

### Audit Trail

| Timestamp             | Event                          | User          |
|-----------------------|--------------------------------|---------------|
| 2026-01-15 00:00 UTC  | Experiments launched           | automation    |
| 2026-01-18 10:23 UTC  | Guardrail violation flagged    | data-team     |
| 2026-01-21 18:00 UTC  | Day 7 interim report generated | data-team     |

---

## 11. References

- **Experiment Configs**: `LiveOps/experiments/s2-ab/*.json`
- **Analytics Notebook**: `Analytics/notebooks/S2-W1-review.ipynb`
- **SQL Queries**: `Analytics/queries/w1/*.sql`
- **Economy Hotfix**: `LiveOps/economy/patches/s2-w1-hotfix.yaml`
- **Balance Note**: `Docs/S2-W1-BALANCE-NOTE.md`

---

**Document Version**: 1.0
**Last Updated**: 2026-01-21 18:00 UTC
**Next Review**: 2026-01-28 (Day 14 final analysis)
**Analyst**: LiveOps Data Team
