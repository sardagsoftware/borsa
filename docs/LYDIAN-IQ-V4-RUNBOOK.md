# 📘 Lydian-IQ v4.0 Operational Runbook

**Version:** 4.0.0
**Last Updated:** 2025-10-10
**On-Call:** Lydian-IQ Operations Team
**Escalation:** security@ailydian.com

---

## 🎯 Quick Reference

### System Health Check

```bash
# Check if all services are running
curl https://ailydian.com/api/health

# Expected response:
{
  "status": "healthy",
  "version": "4.0.0",
  "timestamp": "2025-10-10T12:00:00Z",
  "services": {
    "intentEngine": "ok",
    "connectorAdapter": "ok",
    "telemetry": "ok"
  }
}
```

### Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| On-Call Engineer | ops@ailydian.com | 24/7 |
| Security Team | security@ailydian.com | 24/7 |
| Legal Team | legal@ailydian.com | Business Hours |
| Product Owner | product@ailydian.com | Business Hours |

---

## 🔄 System Flow Diagrams

### End-to-End User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                                   │
│ User types: "trendyol fiyatları %5 düşür"                       │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. INTENT NORMALIZATION (intent-normalize.js)                  │
│                                                                 │
│ • safeText() → null/undefined guard                            │
│ • toTRLower() → "trendyol fiyatlari %5 dusur"                  │
│ • normalize() → "trendyol fiyatlari 5 dusur"                   │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. INTENT PARSING (intent-engine.js)                           │
│                                                                 │
│ • Pattern matching against 5 core intents                      │
│ • Best match: price.sync (confidence: 0.90)                    │
│ • Extracted params: { vendor: "trendyol", percent: 5 }         │
│ • Top-3 ranked: [price.sync, connector.show]                   │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CONNECTOR ADAPTER (connector-api-adapter.js)                │
│                                                                 │
│ • Check partner status: trendyol-tr → "partner_required"       │
│ • Check rate limit: 15/1000 (OK)                               │
│ • Decision: Use mock fallback (partner approval needed)        │
│ • Record telemetry: { source: "mock", latency: 35ms }          │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CONNECTOR MANAGER (connector-manager.js)                    │
│                                                                 │
│ • Fetch connector metadata: trendyol-tr                        │
│ • Health status: { uptime: 99.9, latency: 45ms }               │
│ • Generate inline card with price sync preview                 │
│ • Add partner CTA: "Apply for Partner Access"                  │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. UI RENDERING (lydian-iq.html)                               │
│                                                                 │
│ • Display AI message with PriceCard inline                     │
│ • Show partner approval gate                                   │
│ • Render simulation: "100 TL → 95 TL (-5%)"                    │
│ • Update dock panel with connector details                     │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. TELEMETRY (POST /api/ui-telemetry)                         │
│                                                                 │
│ • Fire-and-forget async log                                    │
│ • Metrics: success=true, latency=35ms, source=mock             │
│ • Grafana dashboard updates                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Procedures

### Standard Deployment

```bash
# 1. Verify all modules loaded
open http://localhost:3100/lydian-iq
# Press F12 → Console tab
# Look for:
# ✅ Intent Normalization loaded (TR-aware, null-safe)
# ✅ Intent Engine loaded (5 intents)
# ✅ Connector API Adapter initialized (white-hat mode)

# 2. Deploy to Vercel
cd /home/lydian/Desktop/ailydian-ultra-pro
vercel --prod --yes

# 3. Verify production
curl https://ailydian.com/lydian-iq
curl https://ailydian.com/api/health

# 4. Test natural language queries
# Open: https://ailydian.com/lydian-iq
# Try: "trendyol göster"
# Verify: Connector card appears with partner gate
```

---

## 🔍 Troubleshooting

### Console Verification

Open browser console on https://ailydian.com/lydian-iq and run:

```javascript
// Test 1: Check all modules loaded
console.log('IntentNormalize:', typeof window.IntentNormalize);
console.log('IntentEngine:', typeof window.IntentEngine);
console.log('ConnectorAPIAdapter:', typeof window.ConnectorAPIAdapter);
console.log('connectorManager:', typeof window.connectorManager);
// All should return 'object' or 'function'

// Test 2: Parse a query
IntentEngine.parseUtterance("trendyol fiyatları göster");
// Should return array with intent objects

// Test 3: Fetch connector data
await window.connectorAPIAdapter.fetchData('trendyol-tr', '/health');
// Should return { success: true/false, data: {...}, source: 'mock' }

// Test 4: Check telemetry
window.connectorAPIAdapter.getTelemetryStats();
// Should return { total, successful, failed, avgLatency }
```

---

## 📊 Success Criteria

**Zero-Error Validation:**
- ✅ No console errors on page load
- ✅ All 4 modules loaded successfully
- ✅ Intent parsing works for all 5 intents
- ✅ Connector cards render inline
- ✅ Partner gates show for partner_required connectors
- ✅ Telemetry system recording events

---

**Document Version:** 1.0.0
**Maintained By:** Lydian-IQ Operations Team

---

📘 **Lydian-IQ v4.0 Runbook - Quick Operations Guide**
