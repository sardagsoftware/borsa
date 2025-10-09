/**
 * API Endpoint: Security Analytics Dashboard
 * White-Hat Security: Provides security insights and analytics
 *
 * GET /api/security/analytics
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database/ailydian.db');

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    const timeRange = req.query.range || '24h'; // 24h, 7d, 30d
    const cutoffDate = getTimeRangeCutoff(timeRange);

    // 1. Suspicious Activity Summary
    const suspiciousActivities = db.prepare(`
      SELECT COUNT(*) as count
      FROM activity_log
      WHERE action = 'suspicious_activity_detected'
        AND createdAt > ?
    `).get(cutoffDate);

    // 2. Failed Login Attempts
    const failedLogins = db.prepare(`
      SELECT COUNT(*) as count
      FROM activity_log
      WHERE action = 'login_failed'
        AND createdAt > ?
    `).get(cutoffDate);

    // 3. Blocked IPs (from suspicious activity)
    const suspiciousIPs = db.prepare(`
      SELECT ipAddress, COUNT(*) as count
      FROM activity_log
      WHERE action = 'suspicious_activity_detected'
        AND createdAt > ?
      GROUP BY ipAddress
      ORDER BY count DESC
      LIMIT 10
    `).all(cutoffDate);

    // 4. User Risk Distribution
    const riskDistribution = db.prepare(`
      SELECT
        CASE
          WHEN json_extract(metadata, '$.riskLevel') = 'HIGH' THEN 'HIGH'
          WHEN json_extract(metadata, '$.riskLevel') = 'MEDIUM' THEN 'MEDIUM'
          WHEN json_extract(metadata, '$.riskLevel') = 'LOW' THEN 'LOW'
          ELSE 'NONE'
        END as riskLevel,
        COUNT(*) as count
      FROM activity_log
      WHERE action = 'suspicious_activity_detected'
        AND createdAt > ?
      GROUP BY riskLevel
    `).all(cutoffDate);

    // 5. Top Suspicious Activities by Type
    const topRiskTypes = db.prepare(`
      SELECT
        json_extract(metadata, '$.risks[0].type') as riskType,
        COUNT(*) as count
      FROM activity_log
      WHERE action = 'suspicious_activity_detected'
        AND createdAt > ?
        AND metadata IS NOT NULL
      GROUP BY riskType
      ORDER BY count DESC
      LIMIT 5
    `).all(cutoffDate);

    // 6. Recent Suspicious Events
    const recentEvents = db.prepare(`
      SELECT
        userId,
        ipAddress,
        description,
        metadata,
        createdAt
      FROM activity_log
      WHERE action = 'suspicious_activity_detected'
        AND createdAt > ?
      ORDER BY createdAt DESC
      LIMIT 20
    `).all(cutoffDate);

    // 7. Account Lockout Events
    const accountLockouts = db.prepare(`
      SELECT COUNT(*) as count
      FROM activity_log
      WHERE action = 'account_locked'
        AND createdAt > ?
    `).get(cutoffDate);

    // 8. 2FA Challenge Events
    const twoFAChallenges = db.prepare(`
      SELECT COUNT(*) as count
      FROM activity_log
      WHERE action IN ('2fa_required', '2fa_challenged')
        AND createdAt > ?
    `).get(cutoffDate);

    // 9. Geographic Distribution
    const geoDistribution = db.prepare(`
      SELECT ipAddress, COUNT(*) as count
      FROM activity_log
      WHERE action IN ('login_success', 'login_attempt')
        AND createdAt > ?
        AND ipAddress IS NOT NULL
      GROUP BY ipAddress
      ORDER BY count DESC
      LIMIT 20
    `).all(cutoffDate);

    // 10. Activity Timeline (hourly breakdown)
    const timeline = db.prepare(`
      SELECT
        strftime('%Y-%m-%d %H:00', createdAt) as hour,
        action,
        COUNT(*) as count
      FROM activity_log
      WHERE createdAt > ?
        AND action IN ('login_success', 'login_failed', 'suspicious_activity_detected')
      GROUP BY hour, action
      ORDER BY hour DESC
      LIMIT 100
    `).all(cutoffDate);

    db.close();

    return res.status(200).json({
      success: true,
      data: {
        timeRange: timeRange,
        summary: {
          suspiciousActivities: suspiciousActivities.count || 0,
          failedLogins: failedLogins.count || 0,
          accountLockouts: accountLockouts.count || 0,
          twoFAChallenges: twoFAChallenges.count || 0
        },
        riskDistribution: riskDistribution.map(r => ({
          level: r.riskLevel,
          count: r.count
        })),
        topRiskTypes: topRiskTypes.map(r => ({
          type: r.riskType || 'UNKNOWN',
          count: r.count
        })),
        suspiciousIPs: suspiciousIPs.map(ip => ({
          ip: ip.ipAddress,
          count: ip.count
        })),
        recentEvents: recentEvents.map(event => ({
          userId: event.userId,
          ipAddress: event.ipAddress,
          description: event.description,
          metadata: event.metadata ? JSON.parse(event.metadata) : null,
          timestamp: event.createdAt
        })),
        geoDistribution: geoDistribution,
        timeline: groupTimeline(timeline)
      }
    });

  } catch (error) {
    console.error('Security analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Get cutoff date for time range
 */
function getTimeRangeCutoff(range) {
  const now = new Date();
  let hours = 24;

  switch (range) {
    case '24h':
      hours = 24;
      break;
    case '7d':
      hours = 24 * 7;
      break;
    case '30d':
      hours = 24 * 30;
      break;
    default:
      hours = 24;
  }

  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
  return cutoff.toISOString();
}

/**
 * Group timeline data by hour and action
 */
function groupTimeline(timeline) {
  const grouped = {};

  timeline.forEach(entry => {
    if (!grouped[entry.hour]) {
      grouped[entry.hour] = {
        hour: entry.hour,
        login_success: 0,
        login_failed: 0,
        suspicious_activity_detected: 0
      };
    }
    grouped[entry.hour][entry.action] = entry.count;
  });

  return Object.values(grouped).sort((a, b) =>
    new Date(b.hour) - new Date(a.hour)
  );
}
