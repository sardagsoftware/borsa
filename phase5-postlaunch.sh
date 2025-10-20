#!/usr/bin/env bash
set -euo pipefail
echo "🚀 Lydian-AAA Phase-5 | Post-Launch & Season-2 Discovery"

DATE=$(date +%Y%m%d-%H%M)
mkdir -p logs telemetry Analytics Docs LiveOps/reports

# 1️⃣ Telemetry & KPI export
echo "📊 Exporting KPIs..."
curl -fsS http://localhost:3100/telemetry/kpis > telemetry/kpis-$DATE.json || echo "{}" > telemetry/kpis-$DATE.json
jq '. + {"timestamp":"'"$DATE"'"}' telemetry/kpis-$DATE.json > telemetry/tmp.json && mv telemetry/tmp.json telemetry/kpis-$DATE.json

# 2️⃣ Analytics notebook / SQL queries
echo "📈 Generating S1 summary..."
python3 Analytics/scripts/s1_summary.py telemetry/kpis-$DATE.json > Analytics/notebooks/S1-review-$DATE.ipynb 2>/dev/null || true

# 3️⃣ A/B experiments close-out
echo "🧮 Consolidating A/B experiments..."
python3 LiveOps/tools/ab_finalize.py experiments/ab > Docs/AB-EXPERIMENTS-$DATE.md 2>/dev/null || true

# 4️⃣ Economy rebalance patch (canary)
echo "💰 Rebalancing economy..."
curl -X POST http://localhost:3100/economy/rebalance \
  -H "Content-Type: application/json" \
  -d '{"phase":"canary","percent":10}' || true

# 5️⃣ Weekly S1 report
echo "🗂  Creating weekly report..."
cat > Docs/S1-WEEKLY-REPORT-$DATE.md <<EOF
# Season-1 Weekly Report ($DATE)
- Crash-free: $(jq '.crash_free // "N/A"' telemetry/kpis-$DATE.json)
- p95 GPU: $(jq '.p95_gpu // "N/A"' telemetry/kpis-$DATE.json)
- Retention D1/D7/D30: $(jq '.retention // "N/A"' telemetry/kpis-$DATE.json)
- Economy Inflation: $(jq '.inflation // "N/A"' telemetry/kpis-$DATE.json)
EOF

# 6️⃣ Season-2 Discovery draft
echo "🧭 Drafting Season-2 brief..."
cat > Docs/S2-DISCOVERY-BRIEF-$DATE.md <<EOF
# Season-2 Discovery Brief
## Theme
New resonance anomaly spreading into Eastern Aegean — introduces "Echo Storms".
## Mechanics
Dynamic weather resonance, cooperative puzzles, stealth-co-op.
## Goals
- Reduce early friction (retention boost)
- Introduce co-op narrative beats
- Expand photo-mode community events
EOF

# 7️⃣ LiveOps verification
echo "🛰  Verifying LiveOps..."
curl -fsS http://localhost:3100/liveops/season/current | jq '.id,.start,.end' || true

# 8️⃣ Archive + log
tar -czf logs/phase5-$DATE.tar.gz telemetry Docs Analytics 2>/dev/null || true
echo "✅ Phase-5 complete at $DATE — logs/phase5-$DATE.tar.gz"

