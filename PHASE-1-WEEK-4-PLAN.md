# 🎯 Phase 1 Week 4: Database Migrations & Advanced Security Analytics

**Project:** Ailydian Ultra Pro
**Phase:** Security Hardening (Beyaz Şapkalı) - Week 4 (FINAL)
**Date:** October 9, 2025
**Status:** 📋 **PLANNING**

---

## 📋 Overview

Phase 1 Week 4 is the **final week** of the Security Hardening phase. This week focuses on:

1. **Database Migrations** - Update schema for OAuth, email verification, and security features
2. **Suspicious Activity Detection** - ML-based anomaly detection for security threats
3. **Security Analytics Dashboard** - Admin dashboard for monitoring security events
4. **Phase 1 Complete Summary** - Comprehensive documentation of entire Phase 1

---

## 🎯 Goals

### Primary Goals:

✅ **Database Schema Updates**
- OAuth columns (googleId, githubId, avatar)
- Email verification table structure
- Session table enhancements
- Performance indexes
- Data migration scripts

✅ **Suspicious Activity Detection**
- Geographic anomaly detection
- Unusual login time patterns
- Device fingerprinting
- Behavior-based risk scoring
- Automated alerts and actions

✅ **Security Analytics Dashboard**
- Real-time security event monitoring
- Rate limit violation tracking
- Account lockout statistics
- Login anomaly visualization
- Admin action logs

✅ **Phase 1 Summary**
- Complete feature documentation
- Architecture overview
- Deployment guide
- Security best practices
- Production readiness checklist

---

## 📊 Task Breakdown

### Task 1: Database Migrations (Priority: CRITICAL)

**Estimated Time:** 4-6 hours

#### 1.1 Schema Analysis & Planning

**Current Schema Issues:**
- OAuth columns may not exist in users table
- Email verification table structure unknown
- Session table needs OAuth support
- Missing indexes for performance

**Required Tables/Columns:**

```sql
-- Users Table Updates
ALTER TABLE users ADD COLUMN IF NOT EXISTS googleId VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS githubId VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerified BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastLogin TIMESTAMP;

-- Email Verification Table
CREATE TABLE IF NOT EXISTS email_verification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiresAt TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Password Reset Table
CREATE TABLE IF NOT EXISTS password_reset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiresAt TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions Table Updates
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS oauthAccessToken TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS oauthRefreshToken TEXT;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_googleId ON users(googleId);
CREATE INDEX IF NOT EXISTS idx_users_githubId ON users(githubId);
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_sessionId ON sessions(sessionId);
CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions(expiresAt);
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_userId ON email_verification(userId);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset(token);
```

#### 1.2 Migration Script Creation

**Files to Create:**
- `/database/migrations/011_oauth_columns.sql`
- `/database/migrations/012_email_verification_table.sql`
- `/database/migrations/013_password_reset_table.sql`
- `/database/migrations/014_session_oauth_columns.sql`
- `/database/migrations/015_performance_indexes.sql`
- `/database/migrate.js` (migration runner)

#### 1.3 Data Migration Safety

**Strategies:**
1. **Backup First:** Always backup database before migration
2. **Idempotent Migrations:** Use `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`
3. **Rollback Scripts:** Create rollback for each migration
4. **Testing:** Test on development database first
5. **Validation:** Verify data integrity after migration

---

### Task 2: Suspicious Activity Detection (Priority: HIGH)

**Estimated Time:** 6-8 hours

#### 2.1 Detection Modules

**Module 1: Geographic Anomaly Detection**

```javascript
// Detect unusual login locations
async function detectGeographicAnomaly(userId, currentIp) {
    const db = getDatabase();

    // Get user's typical locations (last 30 days)
    const typicalLocations = db.prepare(`
        SELECT DISTINCT ipAddress, COUNT(*) as count
        FROM sessions
        WHERE userId = ? AND createdAt > datetime('now', '-30 days')
        GROUP BY ipAddress
        ORDER BY count DESC
        LIMIT 5
    `).all(userId);

    // Check if current IP is in typical locations
    const isTypical = typicalLocations.some(loc => loc.ipAddress === currentIp);

    if (!isTypical) {
        // Calculate risk score based on:
        // - Distance from typical locations
        // - Time since last login from this location
        // - Recent failed login attempts

        return {
            anomaly: true,
            riskScore: calculateRiskScore(userId, currentIp),
            reason: 'New geographic location'
        };
    }

    return { anomaly: false, riskScore: 0 };
}
```

**Module 2: Unusual Login Time Detection**

```javascript
// Detect logins at unusual times
async function detectTimeAnomaly(userId) {
    const db = getDatabase();

    // Get user's typical login hours
    const typicalHours = db.prepare(`
        SELECT
            CAST(strftime('%H', createdAt) AS INTEGER) as hour,
            COUNT(*) as count
        FROM sessions
        WHERE userId = ? AND createdAt > datetime('now', '-30 days')
        GROUP BY hour
        ORDER BY count DESC
    `).all(userId);

    const currentHour = new Date().getHours();

    // Check if current hour is in typical login times
    const isTypical = typicalHours.slice(0, 8).some(h => h.hour === currentHour);

    if (!isTypical) {
        return {
            anomaly: true,
            riskScore: 30,
            reason: `Login at unusual time (${currentHour}:00)`
        };
    }

    return { anomaly: false, riskScore: 0 };
}
```

**Module 3: Device Fingerprinting**

```javascript
// Detect new or suspicious devices
async function detectDeviceAnomaly(userId, userAgent) {
    const db = getDatabase();

    // Get known devices
    const knownDevices = db.prepare(`
        SELECT DISTINCT userAgent
        FROM sessions
        WHERE userId = ? AND createdAt > datetime('now', '-90 days')
    `).all(userId);

    // Simple device fingerprint comparison
    const isKnownDevice = knownDevices.some(d =>
        similarUserAgent(d.userAgent, userAgent)
    );

    if (!isKnownDevice) {
        return {
            anomaly: true,
            riskScore: 40,
            reason: 'New device detected'
        };
    }

    return { anomaly: false, riskScore: 0 };
}
```

**Module 4: Behavior-Based Risk Scoring**

```javascript
// Calculate overall risk score
function calculateOverallRiskScore(detections) {
    const {
        geographic,
        time,
        device,
        recentFailedLogins,
        accountAge
    } = detections;

    let riskScore = 0;

    // Geographic anomaly: 0-50 points
    riskScore += geographic.riskScore;

    // Time anomaly: 0-30 points
    riskScore += time.riskScore;

    // Device anomaly: 0-40 points
    riskScore += device.riskScore;

    // Recent failed logins: 10 points per failure
    riskScore += recentFailedLogins * 10;

    // New account (< 7 days): +20 points
    if (accountAge < 7) {
        riskScore += 20;
    }

    return {
        score: Math.min(riskScore, 100),
        level: getRiskLevel(riskScore),
        detections: {
            geographic,
            time,
            device,
            recentFailedLogins,
            accountAge
        }
    };
}

function getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'NONE';
}
```

#### 2.2 Automated Actions

**Actions Based on Risk Level:**

```javascript
async function handleSuspiciousActivity(userId, riskScore) {
    const actions = [];

    if (riskScore.level === 'CRITICAL') {
        // Require 2FA re-verification
        actions.push('REQUIRE_2FA');

        // Send immediate email alert
        actions.push('SEND_ALERT_EMAIL');

        // Notify admins
        actions.push('NOTIFY_ADMINS');

        // Temporarily lock account (5 minutes)
        actions.push('TEMPORARY_LOCK');
    } else if (riskScore.level === 'HIGH') {
        // Require email verification
        actions.push('REQUIRE_EMAIL_VERIFY');

        // Send warning email
        actions.push('SEND_WARNING_EMAIL');
    } else if (riskScore.level === 'MEDIUM') {
        // Send notification email
        actions.push('SEND_NOTIFICATION_EMAIL');

        // Log for review
        actions.push('LOG_FOR_REVIEW');
    }

    return actions;
}
```

#### 2.3 Files to Create

- `/lib/security/suspicious-activity-detector.js` (main detection engine)
- `/lib/security/geographic-detector.js`
- `/lib/security/time-anomaly-detector.js`
- `/lib/security/device-fingerprint.js`
- `/lib/security/risk-scorer.js`
- `/api/security/activity-check.js` (endpoint for checking activity)

---

### Task 3: Security Analytics Dashboard (Priority: MEDIUM)

**Estimated Time:** 4-6 hours

#### 3.1 Dashboard Features

**Metrics to Display:**

1. **Real-Time Security Events**
   - Failed login attempts (last hour)
   - Rate limit violations (last hour)
   - Account lockouts (last hour)
   - Suspicious activity detections (last hour)

2. **Historical Trends**
   - Failed logins over time (7 days, 30 days)
   - Rate limit violations trend
   - Top blocked IPs
   - Geographic login distribution

3. **User Security Status**
   - Users with 2FA enabled (%)
   - Users with email verified (%)
   - Active sessions count
   - Locked accounts count

4. **Admin Activity Log**
   - Recent admin actions
   - Account unlocks
   - Manual overrides

#### 3.2 Dashboard API Endpoints

**Endpoints to Create:**

1. **GET** `/api/security/dashboard/overview`
   ```json
   {
     "failedLogins": { "lastHour": 42, "last24Hours": 312 },
     "rateLimitViolations": { "lastHour": 15, "last24Hours": 89 },
     "accountLockouts": { "lastHour": 3, "last24Hours": 21 },
     "suspiciousActivities": { "lastHour": 8, "last24Hours": 54 }
   }
   ```

2. **GET** `/api/security/dashboard/trends?period=7d`
   ```json
   {
     "failedLogins": [12, 15, 8, 22, 18, 25, 19],
     "rateLimitViolations": [3, 5, 2, 8, 6, 9, 4],
     "dates": ["2025-10-03", "2025-10-04", ...]
   }
   ```

3. **GET** `/api/security/dashboard/top-ips?limit=10`
   ```json
   {
     "blockedIps": [
       { "ip": "203.0.113.42", "violations": 45, "lastSeen": "2025-10-09T14:23:45Z" },
       { "ip": "198.51.100.15", "violations": 38, "lastSeen": "2025-10-09T13:15:22Z" }
     ]
   }
   ```

4. **GET** `/api/security/dashboard/user-stats`
   ```json
   {
     "totalUsers": 1234,
     "twoFactorEnabled": 456,
     "emailVerified": 987,
     "activeSessions": 342,
     "lockedAccounts": 5
   }
   ```

#### 3.3 Dashboard UI

**Files to Create:**
- `/public/admin/security-dashboard.html`
- `/public/js/security-dashboard.js`
- `/public/css/security-dashboard.css`

**UI Components:**
- Real-time event ticker
- Line charts for trends (Chart.js)
- Top blocked IPs table
- User security stats cards
- Admin activity log

---

### Task 4: Phase 1 Complete Summary (Priority: MEDIUM)

**Estimated Time:** 2-3 hours

#### 4.1 Documentation Structure

**File:** `/PHASE-1-COMPLETE-SECURITY-HARDENING-SUMMARY.md`

**Sections:**

1. **Executive Summary**
   - Phase 1 overview
   - Total features implemented
   - Security improvements achieved

2. **Week-by-Week Breakdown**
   - Week 1: CSRF, Sessions, Passwords, 2FA
   - Week 2: OAuth, Email Service, Verification
   - Week 3: Rate Limiting, Account Lockout, Notifications
   - Week 4: Database Migrations, Anomaly Detection, Analytics

3. **Technical Architecture**
   - Complete system architecture diagram
   - Technology stack
   - Integration points

4. **Security Features**
   - Complete feature list
   - Security improvements metrics
   - Threat mitigation coverage

5. **Deployment Guide**
   - Environment setup
   - Database migrations
   - Production deployment
   - Post-deployment verification

6. **Testing & Validation**
   - Complete test suite
   - Security audit checklist
   - Performance benchmarks

7. **Future Enhancements (Phase 2+)**
   - Recommended next steps
   - Advanced features roadmap

---

## 📅 Timeline

**Total Estimated Time:** 16-23 hours

### Day 1-2: Database Migrations (6 hours)
- [ ] Schema analysis
- [ ] Migration script creation
- [ ] Testing migrations
- [ ] Database backup strategy
- [ ] Production migration plan

### Day 3-4: Suspicious Activity Detection (8 hours)
- [ ] Geographic anomaly detection
- [ ] Time anomaly detection
- [ ] Device fingerprinting
- [ ] Risk scoring algorithm
- [ ] Automated action handlers
- [ ] Integration with login flow

### Day 5: Security Analytics Dashboard (6 hours)
- [ ] Dashboard API endpoints
- [ ] Dashboard UI design
- [ ] Real-time event monitoring
- [ ] Historical trend charts
- [ ] Admin activity log

### Day 6: Documentation & Testing (3 hours)
- [ ] Phase 1 complete summary
- [ ] Testing all new features
- [ ] Production deployment
- [ ] Final verification

---

## 🎯 Success Criteria

### Database Migrations:
- [ ] All migrations run successfully
- [ ] No data loss
- [ ] All indexes created
- [ ] Performance improved
- [ ] Rollback tested

### Suspicious Activity Detection:
- [ ] Geographic anomaly detection working
- [ ] Time anomaly detection working
- [ ] Device fingerprinting working
- [ ] Risk scoring accurate
- [ ] Automated actions triggered correctly
- [ ] False positive rate < 5%

### Security Analytics Dashboard:
- [ ] All metrics displayed correctly
- [ ] Real-time updates working
- [ ] Charts rendering properly
- [ ] Admin-only access enforced
- [ ] Performance < 2 seconds load time

### Documentation:
- [ ] Complete Phase 1 summary created
- [ ] Deployment guide tested
- [ ] All features documented
- [ ] Architecture diagrams included

---

## 🚀 Deployment Plan

### Pre-Deployment:

1. **Database Backup:**
   ```bash
   # Backup production database
   sqlite3 production.db ".backup production-backup-$(date +%Y%m%d).db"
   ```

2. **Test Migrations Locally:**
   ```bash
   node database/migrate.js
   ```

3. **Environment Variables:**
   - Ensure all required env vars are set
   - Test on staging environment

### Deployment:

1. **Run Migrations:**
   ```bash
   # Production migration
   NODE_ENV=production node database/migrate.js
   ```

2. **Deploy Code:**
   ```bash
   git push origin main
   vercel --prod
   ```

3. **Verify:**
   - Check all endpoints
   - Test suspicious activity detection
   - View security dashboard
   - Check email notifications

### Post-Deployment:

1. **Monitoring:**
   - Watch for errors
   - Check database performance
   - Monitor suspicious activity alerts

2. **Validation:**
   - Run automated tests
   - Check all migrations applied
   - Verify dashboard data

---

## 📋 Checklist

### Database Migrations:
- [ ] Create migration scripts (011-015)
- [ ] Create migration runner
- [ ] Test on development database
- [ ] Create rollback scripts
- [ ] Backup production database
- [ ] Run production migrations
- [ ] Verify data integrity
- [ ] Check performance improvements

### Suspicious Activity Detection:
- [ ] Implement geographic anomaly detection
- [ ] Implement time anomaly detection
- [ ] Implement device fingerprinting
- [ ] Create risk scoring algorithm
- [ ] Add automated action handlers
- [ ] Integrate with login endpoints
- [ ] Test all detection modules
- [ ] Configure alert thresholds

### Security Analytics Dashboard:
- [ ] Create dashboard API endpoints
- [ ] Build dashboard UI
- [ ] Add real-time event monitoring
- [ ] Create historical trend charts
- [ ] Add admin activity log
- [ ] Implement admin-only access
- [ ] Test dashboard performance
- [ ] Deploy to production

### Documentation:
- [ ] Write Phase 1 complete summary
- [ ] Document all new features
- [ ] Create architecture diagrams
- [ ] Update deployment guide
- [ ] Create testing checklist
- [ ] Document best practices

---

## 🎓 Learning Objectives

By the end of Phase 1 Week 4, you will have:

1. **Database Skills:**
   - Schema design and migrations
   - Index optimization
   - Data integrity management

2. **Security Skills:**
   - Anomaly detection algorithms
   - Risk scoring systems
   - Automated threat response

3. **Analytics Skills:**
   - Real-time monitoring
   - Data visualization
   - Admin dashboard design

4. **Documentation Skills:**
   - Comprehensive technical writing
   - Architecture documentation
   - Deployment guides

---

**Ready to begin Phase 1 Week 4!** 🚀

This is the final week of Security Hardening phase. After completion, the Ailydian platform will have **enterprise-grade security** with comprehensive monitoring and anomaly detection.
