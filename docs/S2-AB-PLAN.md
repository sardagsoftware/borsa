# Season 2: A/B Testing Plan

**Version**: 2.0.0
**Date**: January 15, 2026
**Data Science Team**: LiveOps Analytics
**Status**: APPROVED

---

## Overview

Season 2 runs **3 experiments** over 6 weeks to optimize storm puzzle rewards, boss difficulty, and co-op adoption. All experiments follow strict statistical rigor (p<0.05, power 0.80) and ethical A/B principles (fair allocation, transparent methodology, opt-out available).

---

## Experiment 1: Storm Reward Optimization

### Metadata
- **ID**: `abx-storm-reward`
- **Hypothesis**: Increasing storm puzzle rewards by 20% will improve completion rates to 70% without causing inflation
- **Duration**: Jan 15 - Jan 29 (14 days)
- **Status**: Active

### Design

#### Arms
| Arm | Allocation | Description | Parameters |
|-----|------------|-------------|------------|
| **Control** | 50% | Standard S2 rewards | Frequency: 150 CR, Phase: 250 CR, Echo: 400 CR |
| **Variant A** | 50% | Increased rewards (+20%) | Frequency: 180 CR, Phase: 300 CR, Echo: 480 CR |

#### Stratification
- **Keys**: Region (TR/EU/US/RU/MENA), Age Band (<18, 18-25, 26-35, 36+), Play Style (casual/core/hardcore)
- **Method**: Stratified random sampling ensures balanced allocation

### Metrics

#### Primary Metric
- **Name**: `puzzle_completion_rate`
- **Type**: Proportion
- **Baseline**: 0.65 (S1 data)
- **Target**: 0.70 (+5pp improvement)
- **Success Criteria**: ≥0.70 AND p-value <0.05

#### Secondary Metrics
- **Inflation Index**: Guardrail (threshold: 1.15)
- **Earn/Spend Ratio**: Guardrail (range: 0.9-1.1)
- **Daily Active Users**: Directional (expect neutral or up)

### Statistical Parameters
- **MDE** (Minimum Detectable Effect): 0.05
- **Statistical Power**: 0.80
- **Alpha**: 0.05
- **Two-Tailed**: Yes
- **Sample Size**: 1,200 per arm (2,400 total)

### Interim Analysis
- **Days**: 3, 7, 10
- **Method**: Sequential testing disabled (prevent peeking bias)
- **Action**: Check guardrails only, no early stopping unless breach

### Guardrails
| Metric | Operator | Threshold | Action |
|--------|----------|-----------|--------|
| `inflation_index` | < | 1.15 | Stop experiment |
| `earn_spend_ratio` | between | 0.85-1.15 | Alert (not stop) |
| `fraud_indicators` | > | 20 | Stop experiment |

### Rollout Plan (If Winner)
**Winner**: Variant A (if p<0.05 AND completion ≥0.70)
1. **10%** rollout (24h): Jan 30-31
2. **50%** rollout (48h): Feb 1-2
3. **100%** rollout (72h monitor): Feb 3+

**If No Winner**: Keep control (avoid UX churn)

---

## Experiment 2: Boss HP Tuning

### Metadata
- **ID**: `abx-boss-hp-storm`
- **Hypothesis**: Reducing Echo Sentinel HP by 10% will improve success rate to 55% target without trivializing content
- **Duration**: Jan 22 - Feb 5 (14 days)
- **Status**: Scheduled

### Design

#### Arms (3-way test)
| Arm | Allocation | Description | HP |
|-----|------------|-------------|-----|
| **Control** | 33% | Base HP | 25,000 |
| **Variant A** | 33% | Reduced HP (-10%) | 22,500 |
| **Variant B** | 34% | Increased HP (+10%) | 27,500 |

#### Stratification
- **Keys**: Region, Player Level (1-10, 11-20, 21-30), Previous Boss Experience (yes/no)

### Metrics

#### Primary Metric
- **Name**: `boss_success_rate`
- **Type**: Proportion
- **Baseline**: 0.48 (S1 boss data)
- **Target**: 0.55 (+7pp)
- **Success Criteria**: ≥0.55 AND p-value <0.05

#### Secondary Metrics
- **Average Attempts**: Target 2.5 (baseline 3.2)
- **Player Satisfaction**: Post-fight survey (1-5 scale), target ≥3.5
- **Retention D1**: Guardrail (≥0.40)

### Statistical Parameters
- **MDE**: 0.05
- **Power**: 0.80
- **Alpha**: 0.05
- **Two-Tailed**: No (one-tailed, looking for improvement)
- **Sample Size**: 800 per arm (2,400 total)

### Interim Analysis
- **Days**: 2, 5, 8, 11
- **Method**: Sequential testing **enabled** (can stop early if clear winner)
- **Action**: Stop arm if guardrail breach

### Guardrails
| Metric | Operator | Threshold | Action | Applies To |
|--------|----------|-----------|--------|------------|
| `success_rate` | < | 0.30 | Stop arm | Variant B (+10% HP) |
| `success_rate` | > | 0.75 | Alert | Variant A (-10% HP) |
| `retention_d1` | < | 0.38 | Stop experiment | All |

**Rationale**: If Variant B makes boss too hard (<30% success), stop that arm. If Variant A makes it too easy (>75%), alert but don't stop (data still valuable).

### Rollout Plan (If Winner)
**Expected Winner**: Variant A (-10% HP)
1. **10%** rollout (12h): Feb 6 morning
2. **50%** rollout (24h): Feb 6 evening - Feb 7
3. **100%** rollout (48h monitor): Feb 8+

**Apply To**: Echo Sentinel Phase 1 & 2

---

## Experiment 3: Co-op Opt-in Frequency

### Metadata
- **ID**: `abx-coop-optin`
- **Hypothesis**: Showing co-op opt-in prompts more frequently will increase adoption to 30% without annoying players (dismissal <70%)
- **Duration**: Feb 5 - Feb 19 (14 days)
- **Status**: Scheduled

### Design

#### Arms (3-way test)
| Arm | Allocation | Description | Frequency | Cooldown | Max/Day |
|-----|------------|-------------|-----------|----------|---------|
| **Control** | 33% | Standard (1 prompt per area) | once_per_area | 24h | 1 |
| **Variant A** | 33% | Moderate (2 prompts per session) | twice_per_session | 12h | 2 |
| **Variant B** | 34% | High (3 context-aware prompts) | context_aware | 6h | 3 |

**Variant B Context Triggers**: entering_hard_puzzle, failing_puzzle_twice, near_other_players

#### Stratification
- **Keys**: Region, Solo Player Profile (always-solo/sometimes-group/prefers-group), Social Activity Level (low/medium/high)

### Metrics

#### Primary Metric
- **Name**: `coop_adoption_rate`
- **Type**: Proportion
- **Baseline**: 0.25
- **Target**: 0.30 (+5pp)
- **Success Criteria**: ≥0.30 AND p-value <0.05

#### Secondary Metrics
- **Prompt Dismissal Rate**: Guardrail (≤0.70)
- **Co-op Completion Rate**: Baseline 0.75, expect neutral
- **Player Satisfaction**: Weekly survey (1-5), target ≥3.0
- **Session Length**: Expect neutral or up

### Statistical Parameters
- **MDE**: 0.05
- **Power**: 0.80
- **Alpha**: 0.05
- **Two-Tailed**: No
- **Sample Size**: 1,000 per arm (3,000 total)

### Interim Analysis
- **Days**: 3, 7, 10
- **Method**: Standard (no early stopping)

### Guardrails
| Metric | Operator | Threshold | Action | Applies To |
|--------|----------|-----------|--------|------------|
| `prompt_dismissal_rate` | > | 0.70 | Stop arm | Variant B (high freq) |
| `player_satisfaction` | < | 3.0 | Alert | All |
| `retention_d1` | < | 0.40 | Stop experiment | All |

**Rationale**: If Variant B annoys players (>70% dismiss rate), stop that arm to preserve UX.

### Rollout Plan (If Winner)
**Expected Winner**: Variant A (moderate frequency)
1. **10%** rollout (24h): Feb 20-21
2. **50%** rollout (48h): Feb 22-23
3. **100%** rollout (72h monitor): Feb 24+

---

## Experiment Platform & Infrastructure

### Allocation Service
- **Method**: Stratified random hashing (murmur3)
- **Persistence**: User ID hashed to arm, stored in Redis cache
- **Re-randomization**: Disabled (user stays in same arm for duration)
- **Contamination Prevention**: Arms isolated, no cross-exposure

### Telemetry Tracking
```json
{
  "experiment_id": "abx-storm-reward",
  "user_id": "hashed_user_123",
  "arm": "variant_a",
  "session_id": "session_456",
  "metrics": {
    "puzzles_attempted": 5,
    "puzzles_completed": 4,
    "cr_earned": 720,
    "session_duration_sec": 1800
  },
  "timestamp": "2026-01-15T14:32:00Z"
}
```

### Statistical Analysis Pipeline
1. **Data Export**: Daily at 04:00 TRT (after daily reset)
2. **Analysis**: Python (scipy.stats), Jupyter notebooks
3. **Reporting**: Automated email to stakeholders
4. **Dashboard**: Grafana panel at `/kpis/s2` (Experiment section)

---

## Ethical A/B Testing Principles

### Compliance
- ✅ **Fair Allocation**: Stratified by region/age/play style, no discrimination
- ✅ **Transparent**: Experiment IDs logged, methodology documented
- ✅ **Opt-Out Available**: Settings toggle to disable participation
- ✅ **No Harm**: Guardrails prevent negative player impact
- ✅ **Data Privacy**: User IDs anonymized, KVKK/GDPR/PDPL compliant

### Ethical Labels
- `abx-storm-reward`: "AB_TEST_PARTICIPANT"
- `abx-boss-hp-storm`: "DIFFICULTY_TUNING_TEST"
- `abx-coop-optin`: "UX_OPTIMIZATION_TEST"

### Player Communication
- **Silent**: Players not notified of experiment (standard A/B practice)
- **Opt-Out**: Settings > Privacy > "Participate in A/B Tests" toggle
- **Post-Experiment**: Results shared in blog post (anonymized)

---

## RBAC & Access Control

| Role | Permissions |
|------|-------------|
| `experiments.admin` | Start, stop, view results |
| `experiments.analyst` | View results only |
| `liveops.admin` | Emergency stop |

---

## Rollback & Emergency Stop

### Auto-Stop Triggers
- Guardrail metric breach (e.g., inflation >1.15)
- Crash rate spike (>2% in experiment arm vs control)
- Player complaint spike (5x baseline)

### Manual Stop
```bash
# Stop specific arm
curl -X POST /api/experiments/abx-storm-reward/stop-arm \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"arm": "variant_a", "reason": "Manual intervention"}'

# Stop entire experiment
curl -X POST /api/experiments/abx-storm-reward/stop \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "Guardrail breach: inflation 1.16"}'
```

---

## Results Interpretation & Reporting

### Statistical Test
- **Method**: Two-proportion z-test (for proportions), Welch's t-test (for continuous)
- **Confidence Interval**: 95%
- **P-value**: <0.05 for significance

### Winner Declaration Criteria
1. Primary metric improvement ≥ MDE (0.05)
2. P-value < 0.05
3. No guardrail breaches
4. Sustained over ≥7 days

### Report Template
```markdown
## Experiment: [Name]
**ID**: [abx-id]
**Duration**: [dates]
**Status**: ✅ Complete

### Results
- **Winner**: Variant A
- **Primary Metric**: 72% (control: 65%), +7pp lift, p=0.003
- **Guardrails**: All PASS
- **Recommendation**: Rollout to 100%

### Insights
[Key learnings, player behavior observations]

### Next Steps
[Rollout plan, S3 considerations]
```

---

## Experiment Calendar

| Experiment | Start | End | Status | Priority |
|------------|-------|-----|--------|----------|
| `abx-storm-reward` | Jan 15 | Jan 29 | ✅ Active | High |
| `abx-boss-hp-storm` | Jan 22 | Feb 5 | ⏳ Scheduled | Critical |
| `abx-coop-optin` | Feb 5 | Feb 19 | ⏳ Scheduled | Medium |

---

## Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Data Science Lead** | - | ✅ Approved | Jan 10, 2026 |
| **Product Lead** | - | ✅ Approved | Jan 10, 2026 |
| **Legal/Ethics** | - | ✅ Approved (KVKK/GDPR) | Jan 12, 2026 |

---

**A/B Plan Status**: ✅ FINALIZED
**Experiments**: 3 scheduled
**Ethical Review**: ✅ PASS

**Version**: 2.0.0
**Prepared by**: Data Science Team
