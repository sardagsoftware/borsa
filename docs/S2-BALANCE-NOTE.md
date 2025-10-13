# Season 2: Economy Balance Note

**Version**: 2.0.0
**Date**: January 15, 2026
**Economist**: LiveOps Economy Team
**Status**: APPROVED

---

## Executive Summary

Season 2 economy applies **stricter controls** based on Season 1 inflation learnings. Daily earn limit reduced by 10%, earn/spend band tightened to 0.9-1.1, and inflation warning threshold lowered to 1.08.

### Key Changes from S1 → S2

| Parameter | S1 Value | S2 Value | Change | Reason |
|-----------|----------|----------|--------|--------|
| **Daily Earn Limit** | 5,000 CR | 4,500 CR | -10% | S1 inflation spike Week 3-4 |
| **Weekly Earn Limit** | 30,000 CR | 28,000 CR | -6.7% | Align with daily reduction |
| **Earn/Spend Target** | 1.0-1.5 | 0.9-1.1 | Stricter | Tighter control, earlier detection |
| **Inflation Warning** | 1.10 | 1.08 | -2pp | Earlier intervention trigger |
| **Common Drop Rate** | 65-75% | 68-77% | +3% | S1 player feedback: too scarce |
| **Vendor Rope Price** | 150 CR | 135 CR | -10% | Improve vendor usage (S1: 51%) |
| **Boss HP (Phase 1)** | N/A | 25,000 | New | Success target: 55% |

---

## Currency System

### Chordstone Remnants (CR) - Earnable
- **Max Cap**: 999,999 CR
- **Starting Balance**: 0 CR
- **Earn Methods**: Puzzles, bosses, quests, trials, exploration
- **Spend Sinks**: Vendor items, crafting materials

### Ancient Crystals (AC) - Premium
- **Max Cap**: 99,999 AC
- **Purchase Only**: Yes (PC, Lydian Store)
- **Use Case**: Cosmetics only (NO pay-to-win)
- **Price Points**: 500 AC ($4.99), 1200 AC ($9.99), 2500 AC ($19.99)

---

## Drop Rates (S2 Adjusted)

### Loot Table
| Rarity | Drop % | CR Range | S1 Drop % | Change |
|--------|--------|----------|-----------|--------|
| **Common** | 68-77% | 12-28 CR | 65-75% | +3% (scarcity fix) |
| **Rare** | 18-28% | 35-70 CR | 20-30% | -2% (rebalance) |
| **Epic** | 4-8% | 80-180 CR | 4-8% | No change |
| **Legendary** | 0.5-1.5% | 250-600 CR | 0.5-1.5% | No change |

### Storm Puzzle Rewards (Baseline)
| Puzzle Type | Difficulty | Base CR | Base XP | Cosmetic Token % |
|-------------|------------|---------|---------|------------------|
| **Frequency Align** | Easy | 150 | 400 | 10% |
| **Phase Chain** | Medium | 250 | 600 | 15% |
| **Echo Triangulation** | Hard | 400 | 800 | 20% |

**A/B Test**: `abx-storm-reward` tests +20% rewards (180/300/480 CR)

### Boss Rewards
#### Echo Sentinel Phase 1
- **First Completion**: 500 CR, 1200 XP, Sentinel's Shroud (legendary)
- **Subsequent**: 250 CR, 600 XP, 5% cosmetic chance

#### Echo Sentinel Phase 2
- **First Completion**: 750 CR, 1500 XP, Storm Walker (epic)
- **Subsequent**: 375 CR, 750 XP, 8% cosmetic chance

---

## Anti-Inflation Guardrails

### Target Metrics
- **Earn/Spend Ratio**: 1.0 (ideal), 0.9-1.1 (acceptable)
- **Inflation Index**: 1.0 (ideal), <1.08 (warning), <1.15 (critical)

### Soft Caps (Player-Facing)
- **Daily Earn Limit**: 4,500 CR (reduced from 5,000)
- **Weekly Earn Limit**: 28,000 CR (reduced from 30,000)
- **Diminishing Returns Threshold**: 2,800 CR/day (earn rate drops 50% after)

### Inflation Index Calculation
```
Inflation Index = Current Purchasing Power / Baseline Purchasing Power

Where:
- Purchasing Power = Average CR Holdings / Average Vendor Price
- Baseline = Season Start (Jan 15, 2026)
```

### Auto-Adjustment Mechanism
If inflation index breaches thresholds, auto-adjust:
1. **Drop Rate Scaling**: ±15% max (if index >1.10, reduce drops by 10%)
2. **Vendor Price Scaling**: ±10% max (if index >1.10, increase prices by 5%)
3. **Earn Limit Scaling**: Min 3,000 CR, Max 6,000 CR (if index >1.12, reduce to 4,000)

---

## Vendor Pricing (S2 Adjusted)

### Consumables
| Item | S1 Price | S2 Price | Change | Quantity |
|------|----------|----------|--------|----------|
| **Rope Bundle** | 150 CR | 135 CR | -10% | 10 units |
| **Torch Pack** | 100 CR | 90 CR | -10% | 20 units |
| **Storm Resist Potion** | N/A | 180 CR | New | 15 units |

### Equipment
| Item | S1 Price | S2 Price | Change | Quantity |
|------|----------|----------|--------|----------|
| **Grapple Kit** | 300 CR | 270 CR | -10% | 5 units |
| **Resonance Crystal** | N/A | 450 CR | New | 3 units |

**Rationale**: S1 vendor usage was 51%, targeting ≥60% in S2 via price reduction.

---

## Craft Costs

### Materials
| Item | Base Cost | Materials Required | Total Cost |
|------|-----------|-------------------|------------|
| **Rope** | 30 CR | 5 Fiber | ~30 CR |
| **Torch** | 20 CR | 3 Wood, 1 Oil | ~25 CR |
| **Grapple** | 80 CR | 2 Rope, 3 Metal, 1 Spring | ~110 CR |

**Economy Impact**: Crafting provides 10-15% discount vs vendor, driving material farming engagement.

---

## Earn/Spend Analysis (S1 Data)

### S1 Actual Performance
| Week | Earn/Spend Ratio | Inflation Index | Notes |
|------|------------------|-----------------|-------|
| Week 1 | 1.05 | 1.00 | Launch, low spending |
| Week 2 | 1.18 | 1.04 | Boss week, high earning |
| Week 3 | 1.32 | 1.09 | ⚠️ Warning breach, high drops |
| Week 4 | 1.28 | 1.11 | ⚠️ Sustained inflation |
| Week 5 | 1.15 | 1.07 | Vendor sale helped |
| Week 6 | 1.08 | 1.04 | Finale XP (not CR) reduced ratio |

**S1 Lessons**:
- Week 3-4 inflation spike (1.09-1.11) due to boss rewards + high drop rates
- Vendor sale (Week 5) effective at reducing ratio (1.15 → 1.08)
- Final ratio 1.18 **above target range** (1.0-1.5)

### S2 Projections (Model)
| Week | Projected Earn/Spend | Projected Inflation | Mitigation |
|------|----------------------|---------------------|------------|
| Week 1 | 1.02 | 1.00 | Launch, low earn limit |
| Week 2 | 1.12 | 1.05 | Boss rewards, A/B test active |
| Week 3 | 1.08 | 1.06 | Photo contest (no CR reward), biome exploration |
| Week 4 | 0.98 | 1.05 | Vendor sale (-10%), co-op week |
| Week 5 | 1.10 | 1.07 | Boss Phase 2, higher rewards |
| Week 6 | 1.05 | 1.06 | Finale XP (not CR), marathon CR sinks |

**Model Assumptions**:
- 10% reduction in daily earn limit applied
- Vendor sale drives 20% spending increase (Week 4)
- Boss rewards account for 15% of weekly CR distribution
- Storm puzzle A/B test (+20% rewards) may increase inflation by +0.02

---

## Canary Deployment (Economy Changes)

### Phase 1: Canary (10%, 24 hours)
- **Deploy**: Wednesday 11:00 TRT
- **Monitor**: Inflation index hourly, earn/spend ratio every 6h
- **Rollback Trigger**: Inflation >1.12, ratio <0.85 or >1.20
- **Sample Size**: ~280 players (10% of 2,800 DAU)

### Phase 2: Rollout (50%, 48 hours)
- **Deploy**: +24h after canary success
- **Monitor**: Same as Phase 1
- **Rollback Trigger**: Inflation >1.10, ratio <0.88 or >1.15

### Phase 3: Full Rollout (100%, 72 hours monitoring)
- **Deploy**: +48h after rollout success
- **Monitor**: Daily reports, weekly review
- **Adjustment**: Auto-adjust mechanism enabled

---

## Fraud Detection & Economy Security

### Earn Rate Anomaly Detection
- **Threshold**: 2x normal earn rate (>9,000 CR/day)
- **Window**: 60-minute rolling average
- **Action**: Flag account for manual review, freeze transactions

### Duplication Detection
- **Balance Jump**: ≥1,000 CR instant gain (no transaction)
- **Transaction Gap**: <5 seconds between identical transactions
- **Action**: Rollback transaction, ban account, log to security team

### Receipt Validation (AC Purchases)
- **Apple IAP**: Server-side validation via App Store API
- **Google Play**: Server-side validation via Play Console API
- **Lydian Store**: HMAC signature validation
- **Failed Validation**: Refund, flag account, alert fraud team

---

## A/B Test Impact on Economy

### abx-storm-reward (Reward Optimization)
- **Test**: +20% storm puzzle rewards (150→180, 250→300, 400→480 CR)
- **Expected Impact**: +5% completion rate, +2-3% earn/spend ratio
- **Guardrail**: If inflation >1.15, stop experiment
- **Rollout Plan**: If winner (p<0.05), rollout 10%→50%→100% over 7 days

### abx-boss-hp-storm (Boss HP Tuning)
- **Test**: Boss HP ±10% (22.5k, 25k, 27.5k)
- **Economy Impact**: Lower HP → higher success rate → more CR distribution
- **Expected**: -10% HP may increase CR distribution by +8%
- **Mitigation**: If variant wins, reduce boss rewards by 10% to offset

### abx-coop-optin (Co-op Frequency)
- **Economy Impact**: Minimal (co-op 1.25x bonus only during Week 4)
- **Monitor**: Week 4 earn/spend during co-op week

---

## Observability & Alerts

### Real-Time Dashboards (Grafana)
- **Inflation Index**: Green <1.05, Yellow 1.05-1.08, Red >1.08
- **Earn/Spend Ratio**: Green 0.95-1.05, Yellow 0.90-0.95 or 1.05-1.10, Red <0.90 or >1.10
- **Vendor Usage**: Green >50%, Yellow 40-50%, Red <40%
- **Fraud Indicators**: Green 0-2, Yellow 3-5, Red >5

### Alert Thresholds
| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| **Inflation Index** | >1.08 | >1.15 | Critical: Auto-rollback economy |
| **Earn/Spend Ratio** | <0.90 or >1.10 | <0.85 or >1.20 | Critical: Freeze drops/vendor |
| **Fraud Indicators** | >5 | >20 | Critical: Manual investigation |
| **Vendor Usage Drop** | <40% | <30% | Warning: Review pricing |

---

## Compliance & Ethical Monetization

### KVKK/GDPR/PDPL Compliance
- ✅ No PII in transaction logs (player IDs anonymized)
- ✅ Self-serve export: Economy transactions exportable via user portal
- ✅ Data retention: 180 days, then anonymized
- ✅ Transparent pricing: All AC prices shown in local currency (TRY, EUR, USD)

### White-Hat Principles
- ✅ **NO Pay-to-Win**: AC purchases are cosmetic only
- ✅ **NO Loot Boxes**: All AC purchases are direct (no RNG)
- ✅ **NO Dark Patterns**: Clear pricing, no hidden fees, 14-day refunds
- ✅ **NO Predatory Mechanics**: No limited-time FOMO for power items

---

## Rollback Scenarios

### Scenario 1: Inflation Spike (Index >1.15)
**Trigger**: Automated alert at 1.15
**Action**:
1. Freeze all drop rate increases
2. Reduce earn limits by 20% (4,500 → 3,600 CR/day)
3. Increase vendor prices by 10%
4. Notify players: "Economy balancing in progress"

### Scenario 2: Earn/Spend Ratio Violation (<0.85 or >1.20)
**Trigger**: Automated alert
**Action**:
1. Rollback last economy change (if within 48h)
2. Restore previous drop rates/vendor prices from snapshot
3. Audit recent transactions for anomalies
4. Post-mortem within 24h

### Scenario 3: Fraud Spike (>20 indicators/day)
**Trigger**: Automated alert
**Action**:
1. Freeze all transactions temporarily
2. Manual review of flagged accounts
3. Ban confirmed fraud accounts, refund victims
4. Security patch if exploit found

---

## Weekly Economy Review Checklist

**Every Monday 10:00 TRT** (after weekly reset)

- [ ] Review previous week earn/spend ratio (target: 0.9-1.1)
- [ ] Check inflation index (target: <1.08)
- [ ] Analyze vendor usage (target: ≥40%)
- [ ] Review fraud indicators (target: <5)
- [ ] Compare projected vs actual CR distribution
- [ ] Identify economy risks for upcoming week
- [ ] Update economy dashboard with insights
- [ ] Communicate findings to LiveOps team

---

## Approval & Audit Trail

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0.0 | Jan 5, 2026 | Initial S2 economy design | Economy Team |
| 1.1.0 | Jan 8, 2026 | Added A/B test impact analysis | Data Science |
| 2.0.0 | Jan 12, 2026 | Final review, stricter guardrails | LiveOps Director |

---

**Balance Note Status**: ✅ APPROVED
**Economy Model**: ✅ Validated
**Canary Pipeline**: ✅ Ready
**Rollback**: ✅ Armed

**Prepared by**: Economy Team
**Version**: 2.0.0
**Date**: January 15, 2026
