# AZURE MIGRATION RUNBOOK
## Ailydian Ultra Pro - Zero-Downtime Cutover

**Last Updated:** 2025-10-04
**Owner:** Sardag Engineering Team
**Criticality:** P0 - Production Migration

---

## 📋 EXECUTIVE SUMMARY

This runbook guides the zero-downtime migration of Ailydian Ultra Pro from current infrastructure to Azure, supporting 30K concurrent users across 6 domains.

**Migration Strategy:** Shadow Traffic → Canary Deployment → Full Cutover
**Estimated Duration:** 4-6 hours
**Rollback Time:** < 5 minutes

---

## 🎯 PRE-MIGRATION CHECKLIST

### Prerequisites

- [ ] Azure subscription active (Cost Management alerts configured)
- [ ] All infrastructure deployed via Bicep/Terraform
- [ ] DNS configured with low TTL (60 seconds)
- [ ] Monitoring dashboards configured
- [ ] Rollback scripts tested
- [ ] Team on standby (2x engineers minimum)

### Infrastructure Validation

```bash
# Run region check
./infra/scripts/region-check.sh

# Verify all services deployed
az containerapp list --resource-group ailydian-production-rg --query "[].{Name:name,Status:properties.provisioningState}" -o table

# Test health endpoints
curl https://<container-app-fqdn>/api/health
```

---

## 📊 PHASE 1: SHADOW TRAFFIC (30 minutes)

### Objective
Mirror 10% of production traffic to Azure without affecting users.

### Steps

1. **Deploy Shadow Traffic Policy**
   ```bash
   az deployment group create \
     --resource-group ailydian-production-rg \
     --template-file infra/scripts/shadow-traffic.bicep \
     --parameters primaryBackend=current-production shadowBackend=azure-backend shadowPercentage=10
   ```

2. **Monitor Shadow Metrics** (20 minutes)
   - Open Azure Dashboard: `Ailydian-Production-Dashboard`
   - Watch for:
     - Error rate parity (< 0.5% difference)
     - Latency parity (< 10% difference)
     - Zero 5xx errors

3. **Validation Queries**
   ```kusto
   // Application Insights - Compare error rates
   requests
   | where timestamp > ago(20m)
   | extend isShadow = tostring(customDimensions["X-Shadow-Request"])
   | summarize ErrorRate = countif(success == false) * 100.0 / count() by isShadow
   ```

### Success Criteria
✅ Shadow error rate ≤ primary + 0.5%
✅ Shadow p95 latency ≤ 120ms
✅ No database connection issues

### Rollback
```bash
# Disable shadow traffic
az deployment group create \
  --resource-group ailydian-production-rg \
  --template-file infra/scripts/shadow-traffic.bicep \
  --parameters shadowPercentage=0
```

---

## 🐤 PHASE 2: CANARY DEPLOYMENT (90 minutes)

### Objective
Gradually shift real traffic: 10% → 25% → 50% → 75% → 100%

### Steps

1. **Start Canary Script**
   ```bash
   export RESOURCE_GROUP=ailydian-production-rg
   export CONTAINER_APP=ailydian-production-api
   ./infra/scripts/canary_set.sh
   ```

   The script will:
   - Set traffic to 10% Azure, wait 5 min, check metrics
   - Increase to 25%, wait, check
   - Continue through 50%, 75%, 100%
   - Auto-rollback if errors spike

2. **Manual Monitoring**
   - Watch dashboard every 5 minutes
   - Check Slack alerts (#prod-alerts channel)
   - Monitor user-reported issues (if any)

### Canary Metrics Table

| Step | Azure % | Wait Time | Error Threshold | Latency Threshold |
|------|---------|-----------|-----------------|-------------------|
| 1    | 10%     | 5 min     | < 1%            | p95 < 200ms       |
| 2    | 25%     | 5 min     | < 1%            | p95 < 200ms       |
| 3    | 50%     | 5 min     | < 1%            | p95 < 200ms       |
| 4    | 75%     | 5 min     | < 1%            | p95 < 200ms       |
| 5    | 100%    | -         | < 1%            | p95 < 200ms       |

### Emergency Rollback
```bash
# Instant rollback to previous revision
./infra/scripts/rollback.sh
```

---

## 🌍 PHASE 3: DNS CUTOVER (15 minutes)

### Objective
Point all 6 domains to Azure Front Door.

### DNS Changes

**Before:**
```
ailydian.com            → Current Load Balancer
travel.ailydian.com     → Current LB
borsa.ailydian.com      → Current LB
blockchain.ailydian.com → Current LB
video.ailydian.com      → Current LB
docs.ailydian.com       → Current LB
```

**After:**
```
ailydian.com            → Azure Front Door (CNAME)
travel.ailydian.com     → Azure Front Door
borsa.ailydian.com      → Azure Front Door
blockchain.ailydian.com → Azure Front Door
video.ailydian.com      → Azure Front Door
docs.ailydian.com       → Azure Front Door
```

### Steps

1. **Get Front Door FQDN**
   ```bash
   az afd endpoint list \
     --profile-name ailydian-production-fd \
     --resource-group ailydian-production-rg \
     --query "[0].hostName" -o tsv
   ```

2. **Update DNS (Gradual Rollout)**
   - Update 1 domain at a time
   - Wait 2 minutes between each
   - Monitor traffic shift

3. **Verify SSL Certificates**
   ```bash
   for domain in ailydian.com travel.ailydian.com borsa.ailydian.com blockchain.ailydian.com video.ailydian.com docs.ailydian.com; do
     echo "Checking $domain..."
     curl -I https://$domain
   done
   ```

---

## 🧪 PHASE 4: POST-MIGRATION VALIDATION (30 minutes)

### Smoke Tests

```bash
# Run automated smoke tests
BASE_URL=https://ailydian.com npx playwright test tests/smoke/production.spec.ts
```

### Manual Validation Checklist

- [ ] Homepage loads < 2s
- [ ] User login works
- [ ] AI chat responds
- [ ] File upload works (< 10MB)
- [ ] Dashboard shows real data
- [ ] All 6 domains accessible

### Load Test

```bash
# Run k6 load test (200 RPS sustained)
k6 run --vus 200 --duration 5m infra/load-testing/k6-load-test.js
```

**Success Criteria:**
- p95 latency < 200ms
- Error rate < 0.5%
- Zero database deadlocks

---

## 🔄 ROLLBACK PROCEDURES

### Scenario 1: High Error Rate (> 5%)

```bash
# Emergency rollback
./infra/scripts/rollback.sh

# Revert DNS immediately
# Update DNS CNAME back to old infrastructure
```

**Expected Recovery Time:** 3-5 minutes

### Scenario 2: Database Issues

```bash
# Rollback application
./infra/scripts/rollback.sh

# Check database connections
az postgres flexible-server show \
  --resource-group ailydian-production-rg \
  --name ailydian-production-psql
```

### Scenario 3: Complete Azure Outage

```bash
# DNS failover to old infrastructure
# Manual DNS update required
# Estimated recovery: 10-15 minutes (DNS TTL)
```

---

## 📊 MONITORING & SLO TRACKING

### Key Metrics

| Metric                  | Target         | Alert Threshold |
|-------------------------|----------------|-----------------|
| Availability            | 99.9%          | < 99.5%         |
| p95 Latency             | < 120ms        | > 200ms         |
| Error Rate              | < 0.5%         | > 1%            |
| Database Latency        | < 10ms         | > 50ms          |
| Container Restart Count | 0              | > 3/hour        |

### Dashboards

- **Azure Monitor:** `Ailydian-Production-Dashboard`
- **Application Insights:** Live Metrics Stream
- **Grafana:** `https://grafana.ailydian.com` (if configured)

---

## 💰 COST OPTIMIZATION

### Post-Migration Actions (Week 1)

- [ ] Review Azure Cost Management daily
- [ ] Identify unused resources
- [ ] Right-size container instances
- [ ] Enable reserved capacity (savings: 30-50%)

### Reserved Capacity Recommendations

```bash
# Calculate savings
az consumption reservation recommendation list \
  --resource-group ailydian-production-rg \
  --query "[].{Service:properties.sku, Savings:properties.totalCostWithReservedInstances}"
```

---

## 📞 CONTACTS & ESCALATION

### Team Roster

| Role                | Name   | Contact           |
|---------------------|--------|-------------------|
| Lead Engineer       | Sardag | sardag@ailydian.com |
| Backend Lead        | TBD    | -                 |
| DevOps Lead         | TBD    | -                 |
| Database Admin      | TBD    | -                 |

### Escalation Path

1. **P3 (Low):** Team Slack → Resolution within 24h
2. **P2 (Medium):** Team call → Resolution within 4h
3. **P1 (High):** Immediate call + rollback consideration
4. **P0 (Critical):** Instant rollback + all hands

---

## ✅ POST-MIGRATION CHECKLIST

### Day 1
- [ ] Monitor error rates every hour
- [ ] Review cost dashboard
- [ ] Verify all alerts working
- [ ] Test rollback procedure

### Week 1
- [ ] Daily cost review
- [ ] Performance optimization
- [ ] User feedback collection
- [ ] Documentation updates

### Month 1
- [ ] Cost optimization (reserved capacity)
- [ ] SLO/SLA review
- [ ] Disaster recovery drill
- [ ] Decommission old infrastructure

---

## 📚 APPENDIX

### Useful Commands

```bash
# Get all container app FQDNs
az containerapp list -g ailydian-production-rg --query "[].{Name:name,FQDN:properties.configuration.ingress.fqdn}" -o table

# Check scaling status
az containerapp revision list -n ailydian-production-api -g ailydian-production-rg --query "[].{Name:name,Replicas:properties.replicas,Traffic:properties.trafficWeight}" -o table

# View logs (last 1 hour)
az containerapp logs show -n ailydian-production-api -g ailydian-production-rg --follow --tail 100
```

### Architecture Diagrams

See: `docs/architecture/azure-production.md`

---

**END OF RUNBOOK**
