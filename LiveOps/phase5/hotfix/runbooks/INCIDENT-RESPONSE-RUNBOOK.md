# Incident Response Runbook

**Project**: Ailydian Ultra Pro
**Owner**: LiveOps Team
**SLA**: Critical: 2h response, 24h resolution
**Last Updated**: October 12, 2025

---

## Quick Reference

| Incident Type | Priority | Response Time | Resolution Time | Escalation |
|--------------|----------|---------------|-----------------|------------|
| Server Outage | P0 | Immediate | 2h | CTO → CEO |
| Database Corruption | P0 | Immediate | 4h | Eng Manager → CTO |
| Economy Exploit | P0 | Immediate | 24h | Security → CTO |
| Boss HP Bug | P1 | 4h | 48h | LiveOps Lead |
| UI Glitch | P2 | 24h | 7d | Frontend Team |

---

## P0: Server Outage

### Detection
- Health check fails (GET /api/health returns 500+)
- PagerDuty alert triggers
- User reports spike on social media

### Immediate Actions (0-15 min)
1. **Acknowledge Incident**
   ```bash
   # Acknowledge PagerDuty alert
   pd incident acknowledge --id <incident_id>
   ```

2. **Check Server Status**
   ```bash
   # SSH to production server
   ssh user@production.ailydian.com

   # Check process
   pm2 status
   pm2 logs --lines 100

   # Check disk space
   df -h

   # Check memory
   free -h
   ```

3. **Quick Restart (if safe)**
   ```bash
   pm2 restart server
   # Wait 30 seconds
   curl https://ailydian.com/api/health
   ```

### Investigation (15-60 min)
1. **Check Logs**
   ```bash
   tail -n 1000 /var/log/ailydian/server.log | grep ERROR
   ```

2. **Database Connection**
   ```bash
   # Test database connectivity
   psql -h <db_host> -U <db_user> -c "SELECT 1;"
   ```

3. **Third-Party Services**
   - Check OpenAI API status
   - Check Azure services status
   - Check Vercel status

### Resolution
- Apply hotfix if code issue identified
- Scale resources if capacity issue
- Rollback if recent deployment caused issue

### Post-Incident
- Update status page
- Post-mortem within 48h
- Document in `LiveOps/phase5/hotfix/post-mortems/`

---

## P0: Database Corruption

### Detection
- Query errors in logs
- Data inconsistency reports
- Foreign key violations

### Immediate Actions
1. **Stop Write Operations**
   ```bash
   # Enable maintenance mode
   curl -X POST https://ailydian.com/api/admin/maintenance \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"enabled": true, "message": "Emergency maintenance"}'
   ```

2. **Create Backup Immediately**
   ```bash
   # PostgreSQL backup
   pg_dump -h <host> -U <user> -d ailydian > backup-emergency-$(date +%Y%m%d-%H%M%S).sql
   ```

3. **Assess Damage**
   ```sql
   -- Check table integrity
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';

   -- Check for orphaned records
   SELECT COUNT(*) FROM economy_transactions WHERE user_id NOT IN (SELECT user_id FROM users);
   ```

### Resolution
- Restore from latest backup if severe
- Run repair scripts if minor
- Apply data migration fixes

### Rollback Plan
```bash
# Restore from backup
psql -h <host> -U <user> -d ailydian < backup-<timestamp>.sql

# Verify restoration
psql -h <host> -U <user> -d ailydian -c "SELECT COUNT(*) FROM users;"
```

---

## P0: Economy Exploit

### Detection
- Fraud indicators spike (>20)
- Unusual earn patterns in logs
- Player reports of duplication

### Immediate Actions
1. **Identify Exploit**
   ```sql
   -- Find suspicious transactions
   SELECT user_id, SUM(amount) as total_earned
   FROM economy_transactions
   WHERE transaction_type = 'earn'
     AND transaction_time >= NOW() - INTERVAL '1 hour'
   GROUP BY user_id
   HAVING SUM(amount) > 10000
   ORDER BY total_earned DESC;
   ```

2. **Disable Affected Systems**
   ```bash
   # Disable vendor if needed
   curl -X POST https://ailydian.com/api/economy/vendor/disable \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

3. **Ban Exploiters (Temporary)**
   ```sql
   UPDATE users
   SET banned = TRUE, ban_reason = 'Economy exploit investigation'
   WHERE user_id IN (/* list of user IDs */);
   ```

### Investigation
- Review transaction logs
- Identify exploit mechanism
- Check code for vulnerabilities

### Resolution
- Deploy hotfix closing exploit
- Roll back fraudulent transactions
- Permanent ban for repeat offenders
- Appeal process for legitimate players

---

## P1: Boss HP Tuning Issue

### Detection
- Boss success rate deviates significantly from target
- Player complaints on Discord/forums

### Actions
1. **Check Current Success Rate**
   ```sql
   SELECT
     boss_id,
     COUNT(*) as attempts,
     COUNT(*) FILTER (WHERE result = 'success') as successes,
     ROUND((COUNT(*) FILTER (WHERE result = 'success')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) as success_rate
   FROM gameplay_boss_encounters
   WHERE encounter_time >= NOW() - INTERVAL '24 hours'
   GROUP BY boss_id;
   ```

2. **Apply Hotfix**
   ```bash
   # Update boss HP via API
   curl -X PATCH https://ailydian.com/api/liveops/boss/hp \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "boss_id": "colossus",
       "hp_multiplier": 0.9
     }'
   ```

3. **Monitor for 4 Hours**
   - Check success rate hourly
   - Adjust if needed
   - Document changes

---

## Emergency Maintenance Mode

### Enable
```bash
# Via API
curl -X POST https://ailydian.com/api/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "enabled": true,
    "message": "We are performing emergency maintenance. Expected downtime: 2 hours.",
    "allow_admins": true
  }'
```

### Disable
```bash
curl -X POST https://ailydian.com/api/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": false}'
```

---

## Rollback Procedures

### Code Rollback (Vercel)
```bash
# List recent deployments
vercel list

# Rollback to previous deployment
vercel rollback <deployment-url>

# Verify
curl https://ailydian.com/api/health
```

### Database Rollback
```bash
# Using rollback script
cd LiveOps/runbook
./rollback.sh economy

# Or manual restore
psql -h <host> -U <user> -d ailydian < backup-<timestamp>.sql
```

### LiveOps Event Rollback
```bash
./rollback.sh event <event_id>
```

---

## Communication Templates

### Status Page Update (Critical)
```
🚨 Service Disruption - Investigating

We are currently investigating reports of service disruption.
Our team is actively working to resolve this issue.

Updates will be posted every 15 minutes.

Last updated: [TIME] UTC
```

### Status Page Update (Resolved)
```
✅ Issue Resolved

The service disruption has been resolved. All systems are operational.

Root cause: [BRIEF DESCRIPTION]
Duration: [XX] minutes

We apologize for the inconvenience.

Post-mortem will be published within 48 hours.
```

### Discord Announcement
```
@everyone Service Update

We experienced a [INCIDENT TYPE] from [START TIME] to [END TIME] UTC.

Impact: [DESCRIPTION]
Resolution: [WHAT WAS DONE]

Affected players may receive [COMPENSATION] as a token of appreciation for your patience.

Thank you for your understanding.
```

---

## Escalation Contacts

### On-Call Rotation
- **Week 1-2**: LiveOps Lead (PagerDuty)
- **Week 3-4**: Backend Engineer (PagerDuty)
- **Week 5-6**: DevOps Engineer (PagerDuty)

### Escalation Path
1. On-call engineer (0-15 min)
2. Engineering Manager (15-30 min)
3. CTO (30-60 min)
4. CEO (security/legal incidents only)

### Emergency Contacts
- **PagerDuty**: [service key]
- **Slack**: #liveops-incidents
- **Email**: ops@ailydian.com
- **Phone**: +90-XXX-XXX-XXXX

---

## Post-Incident Checklist

- [ ] Incident resolved and verified
- [ ] Status page updated
- [ ] User communication sent
- [ ] PagerDuty incident closed
- [ ] Post-mortem scheduled (within 48h)
- [ ] Compensation plan (if applicable)
- [ ] Documentation updated
- [ ] Preventive measures identified

---

## Post-Mortem Template

```markdown
# Post-Mortem: [INCIDENT TITLE]

**Date**: YYYY-MM-DD
**Duration**: [XX] minutes
**Impact**: [Description]
**Severity**: P0 / P1 / P2

## Timeline
- [TIME] - Incident detected
- [TIME] - On-call engineer paged
- [TIME] - Root cause identified
- [TIME] - Fix deployed
- [TIME] - Incident resolved

## Root Cause
[Detailed technical explanation]

## Resolution
[What was done to fix]

## Impact
- Users affected: [NUMBER]
- Downtime: [DURATION]
- Revenue impact: [AMOUNT]

## Lessons Learned
1. What went well
2. What didn't go well
3. Where we got lucky

## Action Items
- [ ] [ACTION] - Owner: [NAME] - Due: [DATE]
- [ ] [ACTION] - Owner: [NAME] - Due: [DATE]
```

---

**Document Version**: 1.0.0
**Last Reviewed**: October 12, 2025
**Next Review**: Monthly during Season 1
