# LyDian Platform Runbook
**Generated:** 2025-10-08 by Claude SRE Agent
**Version:** 1.0.0

---

## 🚨 INCIDENT RESPONSE

### P1 - Critical (Production Down)
1. Check https://www.ailydian.com/api/health
2. If 5xx > 5% for 5 min → **ROLLBACK**
3. Run: `./ops/scripts/ROLLBACK.sh`
4. Notify: Founder + DevOps team
5. Post-mortem within 24h

### P2 - High (Degraded Performance)
1. Check AppInsights dashboard
2. If p95 > 250ms → Investigate slow queries
3. If memory > 80% → Restart PM2: `pm2 restart all`
4. Monitor for 10 minutes

---

## 🔄 ROLLBACK PROCEDURE

```bash
# Automatic rollback to previous Vercel deployment
cd /Users/sardag/Desktop/ailydian-ultra-pro
./ops/scripts/ROLLBACK.sh

# Verify
curl https://www.ailydian.com/api/health
```

**Rollback Time:** ≤ 2 minutes
**Zero Data Loss:** Yes (Vercel immutable deployments)

---

## 🔐 SECRET ROTATION

### JWT_SECRET Rotation
1. Generate new secret:
   ```bash
   openssl rand -base64 48 | tr -d '\n' | head -c 64
   ```

2. Update Azure Key Vault:
   ```bash
   az keyvault secret set \
     --vault-name <vault> \
     --name JWT-SECRET \
     --value "<new-secret>"
   ```

3. Update .env file

4. Restart services:
   ```bash
   pm2 restart all
   ```

5. Verify auth still works

---

## 🧹 CACHE PURGE

```bash
./ops/scripts/PURGE.sh
```

Purges:
- Vercel Edge cache
- Redis cache (Upstash)

---

## 📊 MONITORING

### Key Metrics
- **p95 latency:** < 120ms (target)
- **5xx rate:** < 0.5% (threshold)
- **Memory usage:** < 70% (warning at 80%)
- **CPU usage:** < 60% (warning at 75%)

### Dashboards
- Application Insights: https://portal.azure.com
- Vercel Analytics: https://vercel.com/dashboard/analytics

---

## 🔥 DISASTER RECOVERY

### Database Backup
- Automated: Daily at 02:00 UTC
- Retention: 7 days
- Location: Azure Blob Storage

### Restore Procedure
1. Identify backup: `az storage blob list ...`
2. Download: `az storage blob download ...`
3. Restore: `psql < backup.sql`
4. Verify: Check row counts

**RTO:** 2 hours
**RPO:** 24 hours

---

## 🧪 HEALTH CHECKS

```bash
# API Health
curl https://www.ailydian.com/api/health

# Expected Response
{
  "status": "healthy",
  "models_count": 23,
  "environment": "production"
}
```

---

## 📞 CONTACTS

- **Founder:** Emrah Sardag (sardagemrah@gmail.com)
- **On-Call:** TBD
- **Vercel Support:** https://vercel.com/support

---

*This runbook is living documentation. Update after each incident.*
