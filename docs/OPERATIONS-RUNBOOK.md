# LYDIAN-IQ v3.0 - OPERATIONS RUNBOOK

**Version**: 3.0.0
**Last Updated**: October 9, 2025
**Status**: ✅ PRODUCTION READY

---

## TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Deployment Procedures](#deployment-procedures)
3. [Auto-Scaling Configuration](#auto-scaling-configuration)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Security Verification](#security-verification)
6. [Incident Response](#incident-response)
7. [Rollback Procedures](#rollback-procedures)
8. [Maintenance Windows](#maintenance-windows)
9. [Troubleshooting](#troubleshooting)
10. [Contacts & Escalation](#contacts--escalation)

---

## SYSTEM OVERVIEW

### Architecture

```
                     ┌─────────────────┐
                     │  Azure Front    │
                     │     Door        │
                     │  (HTTPS/mTLS)   │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  NGINX Load     │
                     │    Balancer     │
                     │ (Health Checks) │
                     └────────┬────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
      ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
      │ API Pod │      │  API Pod  │     │  API Pod  │
      │ (2-10)  │      │  (Auto)   │     │  (Scale)  │
      └────┬────┘      └─────┬─────┘     └─────┬─────┘
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
      ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
      │PostgreSQL│      │   Redis   │     │   Vault   │
      │ (Primary)│      │ (Upstash) │     │   (KMS)   │
      └──────────┘      └───────────┘     └───────────┘
```

### Components

| Component | Technology | Purpose | Replicas | Resource Limits |
|-----------|------------|---------|----------|----------------|
| **API Server** | Node.js 20 | Main application | 2-10 (HPA) | 2GB RAM, 1 CPU |
| **Database** | PostgreSQL 14+ | Data persistence | 1 (primary + 2 replicas) | 4GB RAM, 2 CPU |
| **Cache** | Redis 7 (Upstash) | Caching layer | 1 (managed) | 1GB RAM |
| **Secrets** | Azure Vault/KMS | Secret management | - | - |
| **Load Balancer** | NGINX | Traffic distribution | 2 | 512MB RAM |
| **Monitoring** | Prometheus + Grafana | Observability | 1 each | 1GB RAM |

### URLs & Endpoints

- **Production Console**: https://iq.ailydian.com
- **Production API**: https://iq.ailydian.com/api
- **Grafana Dashboard**: https://grafana.ailydian.com/d/LydianIQProd
- **Prometheus**: https://prometheus.ailydian.com
- **Health Check**: https://iq.ailydian.com/api/health

---

## DEPLOYMENT PROCEDURES

### Pre-Deployment Checklist

- [ ] All tests passing (v3.0 certification ≥93% pass rate)
- [ ] Performance tests completed (all SLOs met)
- [ ] Security scan completed (OSV, SBOM, SLSA)
- [ ] Database migrations tested
- [ ] Backup created (database + Redis state)
- [ ] Change notification sent (24h advance)
- [ ] Rollback plan reviewed
- [ ] On-call engineer identified

### Step 1: Build & Sign

```bash
# Build Docker image
cd /home/lydian/Desktop/ailydian-ultra-pro
docker build -t ghcr.io/ailydian/lydian-iq:v3.0.0 .

# Sign with cosign (keyless)
export COSIGN_EXPERIMENTAL=1
cosign sign ghcr.io/ailydian/lydian-iq:v3.0.0

# Verify signature
cosign verify ghcr.io/ailydian/lydian-iq:v3.0.0

# Generate SBOM
syft ghcr.io/ailydian/lydian-iq:v3.0.0 -o cyclonedx-json > sbom-v3.0.0.json

# Push to registry
docker push ghcr.io/ailydian/lydian-iq:v3.0.0
```

### Step 2: Infrastructure Deployment (Terraform)

```bash
cd ops/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file=production.tfvars -out=deploy.plan

# Review plan
less deploy.plan

# Apply (with approval)
terraform apply deploy.plan

# Save outputs
terraform output -json > deployment-outputs.json

# Extract DNS
export DNS_NAME=$(terraform output -raw dns_name)
echo "Deployment DNS: $DNS_NAME"
```

### Step 3: Database Migration

```bash
# Run migrations (with transaction)
npm run migrate:up

# Verify migration status
npm run migrate:status

# If rollback needed
npm run migrate:rollback
```

### Step 4: Application Deployment

```bash
# Deploy to Azure Container Apps
az containerapp update \
  --name lydian-iq-api \
  --resource-group lydian-production \
  --image ghcr.io/ailydian/lydian-iq:v3.0.0 \
  --set-env-vars \
    NODE_ENV=production \
    DATABASE_URL=$DATABASE_URL \
    REDIS_URL=$REDIS_URL \
    VAULT_URL=$VAULT_URL

# Wait for deployment
az containerapp revision list \
  --name lydian-iq-api \
  --resource-group lydian-production \
  --query "[0].{Name:name, Status:provisioningState, Traffic:trafficWeight}"

# Verify health
curl https://iq.ailydian.com/api/health | jq .
```

### Step 5: DNS & Certificate Configuration

```bash
# Update DNS (Azure DNS)
az network dns record-set cname set-record \
  --resource-group lydian-dns \
  --zone-name ailydian.com \
  --record-set-name iq \
  --cname $DNS_NAME

# Verify DNS propagation
dig iq.ailydian.com

# Configure SSL (Let's Encrypt via Azure Front Door)
az afd custom-domain create \
  --resource-group lydian-production \
  --profile-name lydian-afd \
  --custom-domain-name iq-ailydian-com \
  --host-name iq.ailydian.com \
  --certificate-type ManagedCertificate

# Verify HTTPS
curl -I https://iq.ailydian.com | grep "HTTP/2 200"
```

### Step 6: Post-Deployment Verification

```bash
# Run smoke tests
./ops/scripts/smoke-test-production.sh

# Expected output:
# ✅ Health check OK
# ✅ Economy Optimizer OK
# ✅ Federated Learning OK
# ✅ ESG Carbon OK
# ✅ Marketplace (auth) OK
# ✅ All systems operational
```

---

## AUTO-SCALING CONFIGURATION

### Horizontal Pod Autoscaler (HPA)

```yaml
# ops/k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: lydian-iq-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: lydian-iq-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 65
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 75
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "50"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30
```

Apply HPA:
```bash
kubectl apply -f ops/k8s/hpa.yaml

# Verify HPA status
kubectl get hpa lydian-iq-api-hpa -w
```

### Database Scaling

**Read Replicas**: Automatically provision when load > 100 RPS
```bash
# Add read replica
az postgres flexible-server replica create \
  --replica-name lydian-db-replica-1 \
  --source-server lydian-db-primary \
  --resource-group lydian-production
```

**Connection Pooling** (PgBouncer):
```bash
# Deploy PgBouncer
kubectl apply -f ops/k8s/pgbouncer.yaml

# Update DATABASE_URL
export DATABASE_URL="postgresql://pgbouncer:6432/ailydian"
```

---

## MONITORING & ALERTS

### Grafana Dashboards

**Main Dashboard**: "Lydian-IQ Production"

Panels:
1. **Request Rate** (RPS by endpoint)
2. **Latency** (p50, p95, p99)
3. **Error Rate** (4xx, 5xx)
4. **SLO Compliance** (% of requests meeting SLO)
5. **HPA Status** (current replicas, CPU %)
6. **Database** (connections, query time)
7. **Cache** (hit rate, memory usage)
8. **FL Rounds** (active rounds, privacy budget)
9. **ESG Metrics** (carbon calculations/hr)

Access: https://grafana.ailydian.com/d/LydianIQProd

### Prometheus Alerts

Critical Alerts (PagerDuty):
```yaml
# High p95 Latency
- alert: HighP95Latency
  expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1.6
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "p95 latency exceeds 80% of SLO"
    runbook: "https://docs.ailydian.com/runbooks/high-latency"

# Error Budget Exhaustion
- alert: ErrorBudgetExhaustion
  expr: (sum(rate(http_requests_total{status=~"5.."}[24h])) / sum(rate(http_requests_total[24h]))) > 0.01
  for: 15m
  labels:
    severity: critical
  annotations:
    summary: "Error budget exceeded (>1% over 24h)"

# High Rate Limit Rejects
- alert: HighRateLimitRejects
  expr: (sum(rate(http_requests_total{status="429"}[15m])) / sum(rate(http_requests_total[15m]))) > 0.02
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Rate limit rejects > 2%"
```

Warning Alerts (Slack):
```yaml
# Low Cache Hit Rate
- alert: LowCacheHitRate
  expr: (sum(rate(cache_hits[5m])) / (sum(rate(cache_hits[5m])) + sum(rate(cache_misses[5m])))) < 0.75
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Cache hit rate below 75%"

# Database Connection Pool Saturation
- alert: DBConnectionPoolSaturation
  expr: (db_connections_active / db_connections_max) > 0.85
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "DB connection pool >85% utilized"
```

### Log Aggregation

**Loki Query Examples**:
```logql
# Errors in last hour
{app="lydian-iq"} |= "error" | json

# Auth failures
{app="lydian-iq"} |= "unauthorized" | json | status="401"

# Slow requests (>2s)
{app="lydian-iq"} | json | duration > 2000
```

---

## SECURITY VERIFICATION

### Post-Deployment Security Tests

```bash
# 1. OIDC Discovery
curl https://iq.ailydian.com/.well-known/openid-configuration | jq .
# Expected: issuer, endpoints, scopes

# 2. JWKS Verification
curl https://iq.ailydian.com/oidc/jwks.json | jq '.keys | length'
# Expected: >= 1 (active keys)

# 3. HMAC Webhook Test
# Invalid signature → 401
curl -X POST https://iq.ailydian.com/webhook/test \
  -H "X-Signature: invalid" \
  -d '{"test": "data"}'
# Expected: 401 Unauthorized

# Valid signature → 200
PAYLOAD='{"test":"data"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -binary | base64)
curl -X POST https://iq.ailydian.com/webhook/test \
  -H "X-Signature: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
# Expected: 200 OK

# 4. SSRF Protection
curl https://iq.ailydian.com/api/test-ssrf?url=file:///etc/passwd
# Expected: 400 Bad Request (blocked)

curl https://iq.ailydian.com/api/test-ssrf?url=http://169.254.169.254/
# Expected: 400 Bad Request (AWS metadata blocked)

# 5. Rate Limiting
for i in {1..100}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://iq.ailydian.com/api/health
done | grep 429
# Expected: Some 429 responses after threshold

# 6. Tenant Authentication
# No token → 401
curl https://iq.ailydian.com/api/marketplace/plugins
# Expected: 401 Unauthorized

# With valid token → 200
curl -H "Authorization: Bearer $VALID_TOKEN" \
  https://iq.ailydian.com/api/marketplace/plugins
# Expected: 200 OK with plugin list

# 7. Differential Privacy Verification
curl -H "X-Institution-API-Key: $INST_KEY" \
  "https://iq.ailydian.com/api/insights/price-trend?category=electronics"
# Expected: 200 with privacy_guarantee field (ε < 1.0)
```

### Scheduled Security Scans

**Daily**:
- Vulnerability scan (OSV)
- Dependency audit (npm audit)
- Certificate expiry check

**Weekly**:
- Penetration test (automated)
- OWASP ZAP scan
- Secret rotation verification

**Monthly**:
- Security audit
- Compliance review (KVKK/GDPR/PDPL)
- Incident response drill

---

## INCIDENT RESPONSE

### Severity Levels

| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| **P0 - Critical** | System down, data loss, security breach | 15 min | Immediate, all hands |
| **P1 - High** | Major feature down, >1% error rate | 1 hour | On-call engineer |
| **P2 - Medium** | Minor feature degraded, <1% error | 4 hours | Business hours |
| **P3 - Low** | Cosmetic issue, no user impact | 24 hours | Next sprint |

### Incident Response Flow

1. **Detection** (Automated alerts or user report)
2. **Triage** (Assess severity, assign owner)
3. **Investigation** (Check logs, metrics, recent changes)
4. **Mitigation** (Rollback, scale up, disable feature)
5. **Communication** (Status page update, customer email)
6. **Resolution** (Fix deployed, verified)
7. **Postmortem** (Root cause, action items)

### Common Incidents & Resolutions

#### High Latency (p95 > 2s)

```bash
# 1. Check current p95
curl https://prometheus.ailydian.com/api/v1/query?query=histogram_quantile(0.95,http_request_duration_seconds_bucket)

# 2. Check HPA status
kubectl get hpa lydian-iq-api-hpa

# 3. Manual scale if needed
kubectl scale deployment lydian-iq-api --replicas=10

# 4. Check slow queries
psql $DATABASE_URL -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# 5. Clear cache if stale
redis-cli FLUSHDB
```

#### Database Connection Pool Exhaustion

```bash
# 1. Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# 2. Kill long-running queries
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';"

# 3. Increase pool size (temporary)
kubectl set env deployment/lydian-iq-api DATABASE_POOL_MAX=40

# 4. Add read replica (permanent)
terraform apply -var="read_replicas=2"
```

#### Memory Leak

```bash
# 1. Identify leaking pod
kubectl top pods -l app=lydian-iq-api

# 2. Restart leaking pod
kubectl delete pod <pod-name>

# 3. Get heap dump (before restart if possible)
kubectl exec <pod-name> -- node --expose-gc --inspect=0.0.0.0:9229 server.js &
# Then use Chrome DevTools to capture heap snapshot

# 4. Monitor for recurrence
watch kubectl top pods
```

---

## ROLLBACK PROCEDURES

### Automated Rollback (Canary Failure)

```bash
# Canary automatically rolls back if:
# - p95 latency > 150% of baseline
# - Error rate > 3% for 3 minutes
# - Health check fails 3 consecutive times

# Manual verification
az containerapp revision list \
  --name lydian-iq-api \
  --resource-group lydian-production \
  --query "[?trafficWeight>0].{Name:name, Traffic:trafficWeight, Status:healthState}"
```

### Manual Rollback

```bash
# 1. List available revisions
az containerapp revision list \
  --name lydian-iq-api \
  --resource-group lydian-production

# 2. Get previous stable revision
export PREVIOUS_REVISION="lydian-iq-api--v3.0.0-abcdef"

# 3. Shift 100% traffic to previous revision
az containerapp ingress traffic set \
  --name lydian-iq-api \
  --resource-group lydian-production \
  --revision-weight $PREVIOUS_REVISION=100

# 4. Verify health
curl https://iq.ailydian.com/api/health | jq .

# 5. Deactivate failed revision
az containerapp revision deactivate \
  --name lydian-iq-api \
  --resource-group lydian-production \
  --revision <failed-revision>
```

### Database Rollback

```bash
# 1. Stop application traffic
kubectl scale deployment lydian-iq-api --replicas=0

# 2. Restore from backup
pg_restore -d $DATABASE_URL backup-v3.0.0-pre-deploy.dump

# 3. Verify data integrity
psql $DATABASE_URL -c "SELECT count(*) FROM tenants;"

# 4. Resume traffic
kubectl scale deployment lydian-iq-api --replicas=2
```

---

## MAINTENANCE WINDOWS

### Scheduled Maintenance

**Standard Window**: Sunday 02:00-04:00 UTC (off-peak)

**Pre-Maintenance Checklist**:
- [ ] Notification sent (72h advance)
- [ ] Backup completed
- [ ] Rollback plan documented
- [ ] On-call team briefed

**Post-Maintenance Checklist**:
- [ ] All services healthy
- [ ] Performance metrics normal
- [ ] No error spike
- [ ] Customer notification (completion)

### Zero-Downtime Deployment

```bash
# Blue-Green Deployment
# 1. Deploy to "green" environment
terraform apply -var="environment=green"

# 2. Run smoke tests on green
./ops/scripts/smoke-test.sh https://green.iq.ailydian.com

# 3. Switch DNS to green (0 downtime)
az network dns record-set cname set-record \
  --resource-group lydian-dns \
  --zone-name ailydian.com \
  --record-set-name iq \
  --cname green-lydian-iq.azurecontainerapps.io

# 4. Monitor for issues (15 min)
watch curl -s https://iq.ailydian.com/api/health

# 5. Decommission blue (after 24h)
terraform destroy -var="environment=blue"
```

---

## TROUBLESHOOTING

### Quick Diagnostics

```bash
# Check overall system health
kubectl get pods,svc,hpa -n lydian-production

# View recent logs
kubectl logs -l app=lydian-iq-api --tail=100 -f

# Check resource usage
kubectl top pods -n lydian-production

# Database status
psql $DATABASE_URL -c "SELECT version(); SELECT pg_database_size('ailydian');"

# Redis status
redis-cli INFO | grep "used_memory_human\|connected_clients"
```

### Common Issues

**Issue**: 502 Bad Gateway
- **Cause**: All pods unhealthy or crashed
- **Fix**: Check pod logs, restart deployment
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl rollout restart deployment lydian-iq-api
```

**Issue**: Database connection timeout
- **Cause**: Connection pool exhausted or network issue
- **Fix**: Check connections, increase pool size
```bash
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
kubectl set env deployment/lydian-iq-api DATABASE_POOL_MAX=50
```

**Issue**: Cache miss rate high (>30%)
- **Cause**: Redis restarted or TTL too short
- **Fix**: Check Redis uptime, adjust TTL
```bash
redis-cli INFO | grep uptime_in_seconds
# Update TTL in code if needed
```

---

## CONTACTS & ESCALATION

### On-Call Rotation

| Role | Name | Contact | Backup |
|------|------|---------|--------|
| **Primary Engineer** | TBD | TBD | TBD |
| **DevOps Lead** | TBD | TBD | TBD |
| **Security Lead** | TBD | TBD | TBD |
| **Product Owner** | TBD | TBD | TBD |

### Escalation Path

1. **P3/P2**: On-call engineer resolves
2. **P1**: Escalate to DevOps Lead after 30 min
3. **P0**: Immediate all-hands, notify Product Owner

### Communication Channels

- **Incident Channel**: #lydian-incidents (Slack)
- **Status Page**: https://status.ailydian.com
- **PagerDuty**: Lydian-IQ Production
- **Email**: ops@ailydian.com

---

## APPENDIX

### Useful Commands

```bash
# Quick health check
curl -s https://iq.ailydian.com/api/health | jq '.status, .version'

# Current traffic distribution
az containerapp revision list --name lydian-iq-api -g lydian-production --query "[].{Name:name, Traffic:trafficWeight}"

# Scale manually
kubectl scale deployment lydian-iq-api --replicas=<N>

# View Grafana dashboard
open https://grafana.ailydian.com/d/LydianIQProd

# SSH to pod (debugging)
kubectl exec -it <pod-name> -- /bin/sh

# Export logs (last hour)
kubectl logs -l app=lydian-iq-api --since=1h > logs-$(date +%Y%m%d-%H%M%S).txt
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `REDIS_URL` | Redis connection | `redis://...` |
| `VAULT_URL` | Vault endpoint | `https://vault...` |
| `LOG_LEVEL` | Logging level | `info` |

---

**Document Owner**: DevOps Team
**Last Reviewed**: October 9, 2025
**Next Review**: January 9, 2026
**Status**: ✅ ACTIVE
