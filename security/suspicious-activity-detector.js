/**
 * Suspicious Activity Detection System
 * White-Hat Security: Detects anomalous login patterns and suspicious behavior
 *
 * Features:
 * - Geographic anomaly detection
 * - Time-based anomaly detection
 * - Device fingerprinting
 * - Risk scoring system
 */

const geoip = require('geoip-lite');
const crypto = require('crypto');

class SuspiciousActivityDetector {
  constructor(db) {
    this.db = db;
    this.RISK_THRESHOLDS = {
      LOW: 0.3,
      MEDIUM: 0.6,
      HIGH: 0.85
    };
  }

  /**
   * Analyze login attempt for suspicious activity
   * @param {Object} params - Login parameters
   * @returns {Object} Risk assessment result
   */
  async analyzeLoginAttempt({ userId, ipAddress, userAgent, timestamp = new Date() }) {
    const risks = [];
    let totalRiskScore = 0;

    try {
      // Get user's activity history
      const userHistory = await this.getUserActivityHistory(userId);

      // 1. Geographic Anomaly Detection
      const geoRisk = await this.detectGeographicAnomaly(userId, ipAddress, userHistory);
      if (geoRisk.suspicious) {
        risks.push(geoRisk);
        totalRiskScore += geoRisk.score;
      }

      // 2. Time-based Anomaly Detection
      const timeRisk = await this.detectTimeAnomaly(userId, timestamp, userHistory);
      if (timeRisk.suspicious) {
        risks.push(timeRisk);
        totalRiskScore += timeRisk.score;
      }

      // 3. Device Fingerprint Analysis
      const deviceRisk = await this.analyzeDeviceFingerprint(userId, userAgent, userHistory);
      if (deviceRisk.suspicious) {
        risks.push(deviceRisk);
        totalRiskScore += deviceRisk.score;
      }

      // 4. Velocity Check (rapid login attempts from different locations)
      const velocityRisk = await this.checkLoginVelocity(userId, ipAddress, timestamp);
      if (velocityRisk.suspicious) {
        risks.push(velocityRisk);
        totalRiskScore += velocityRisk.score;
      }

      // Normalize risk score (0-1 range)
      const normalizedScore = Math.min(totalRiskScore, 1.0);

      return {
        suspicious: normalizedScore > this.RISK_THRESHOLDS.LOW,
        riskScore: normalizedScore,
        riskLevel: this.getRiskLevel(normalizedScore),
        risks: risks,
        recommendation: this.getRecommendation(normalizedScore),
        timestamp: timestamp
      };

    } catch (error) {
      console.error('Suspicious activity detection error:', error);
      return {
        suspicious: false,
        riskScore: 0,
        riskLevel: 'UNKNOWN',
        risks: [],
        recommendation: 'ALLOW',
        error: error.message
      };
    }
  }

  /**
   * Detect geographic anomalies
   */
  async detectGeographicAnomaly(userId, ipAddress, userHistory) {
    const currentLocation = geoip.lookup(ipAddress);

    if (!currentLocation) {
      return { suspicious: false, score: 0, type: 'GEOGRAPHIC' };
    }

    // Get user's recent login locations
    const recentLocations = this.extractLocations(userHistory);

    // Check if this is a new country
    const isNewCountry = !recentLocations.some(loc =>
      loc.country === currentLocation.country
    );

    // Calculate distance from last known location
    let maxDistance = 0;
    if (recentLocations.length > 0) {
      const lastLocation = recentLocations[0];
      maxDistance = this.calculateDistance(
        lastLocation.ll[0], lastLocation.ll[1],
        currentLocation.ll[0], currentLocation.ll[1]
      );
    }

    // Risk scoring
    let score = 0;
    const reasons = [];

    if (isNewCountry && recentLocations.length > 0) {
      score += 0.3;
      reasons.push(`Login from new country: ${currentLocation.country}`);
    }

    // Impossible travel detection (>500km in < 1 hour)
    if (recentLocations.length > 0 && userHistory.length > 0) {
      const lastLoginTime = new Date(userHistory[0].createdAt);
      const timeDiff = (Date.now() - lastLoginTime) / (1000 * 60 * 60); // hours

      if (maxDistance > 500 && timeDiff < 1) {
        score += 0.5;
        reasons.push(`Impossible travel: ${Math.round(maxDistance)}km in ${Math.round(timeDiff * 60)} minutes`);
      }
    }

    return {
      suspicious: score > 0,
      score: score,
      type: 'GEOGRAPHIC',
      details: {
        currentCountry: currentLocation.country,
        currentCity: currentLocation.city,
        isNewCountry: isNewCountry,
        distance: Math.round(maxDistance),
        reasons: reasons
      }
    };
  }

  /**
   * Detect time-based anomalies
   */
  async detectTimeAnomaly(userId, timestamp, userHistory) {
    if (userHistory.length < 5) {
      return { suspicious: false, score: 0, type: 'TIME' };
    }

    const hour = new Date(timestamp).getHours();

    // Analyze user's typical login hours
    const typicalHours = userHistory.map(activity =>
      new Date(activity.createdAt).getHours()
    );

    const hourCounts = {};
    typicalHours.forEach(h => {
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });

    // Check if current hour is unusual
    const currentHourFrequency = (hourCounts[hour] || 0) / userHistory.length;

    let score = 0;
    const reasons = [];

    // Login during unusual hours (user rarely logs in at this time)
    if (currentHourFrequency < 0.1 && userHistory.length > 10) {
      score += 0.2;
      reasons.push(`Unusual login time: ${hour}:00 (rarely used hour)`);
    }

    // Login during typically inactive hours (2 AM - 5 AM) if user has no history at these times
    if (hour >= 2 && hour <= 5) {
      const nightLogins = typicalHours.filter(h => h >= 2 && h <= 5).length;
      if (nightLogins === 0 && userHistory.length > 20) {
        score += 0.15;
        reasons.push('Login during inactive hours (2 AM - 5 AM)');
      }
    }

    return {
      suspicious: score > 0,
      score: score,
      type: 'TIME',
      details: {
        loginHour: hour,
        typicalHourFrequency: currentHourFrequency,
        reasons: reasons
      }
    };
  }

  /**
   * Analyze device fingerprint
   */
  async analyzeDeviceFingerprint(userId, userAgent, userHistory) {
    const deviceFingerprint = this.generateDeviceFingerprint(userAgent);

    // Get unique devices from history
    const knownDevices = new Set(
      userHistory.map(activity => this.generateDeviceFingerprint(activity.userAgent))
    );

    const isNewDevice = !knownDevices.has(deviceFingerprint);

    let score = 0;
    const reasons = [];

    if (isNewDevice && userHistory.length > 5) {
      score += 0.25;
      reasons.push('Login from new device');
    }

    // Detect suspicious user agents (bots, scrapers)
    if (this.isSuspiciousUserAgent(userAgent)) {
      score += 0.4;
      reasons.push('Suspicious user agent detected');
    }

    return {
      suspicious: score > 0,
      score: score,
      type: 'DEVICE',
      details: {
        isNewDevice: isNewDevice,
        deviceFingerprint: deviceFingerprint,
        knownDevicesCount: knownDevices.size,
        reasons: reasons
      }
    };
  }

  /**
   * Check login velocity (rapid attempts from different locations)
   */
  async checkLoginVelocity(userId, ipAddress, timestamp) {
    // Get recent login attempts (last 15 minutes)
    const fifteenMinutesAgo = new Date(timestamp.getTime() - 15 * 60 * 1000);

    const recentAttempts = this.db.prepare(`
      SELECT ipAddress, createdAt
      FROM activity_log
      WHERE userId = ?
        AND action = 'login_attempt'
        AND createdAt > ?
      ORDER BY createdAt DESC
    `).all(userId, fifteenMinutesAgo.toISOString());

    if (recentAttempts.length < 3) {
      return { suspicious: false, score: 0, type: 'VELOCITY' };
    }

    // Check for different IPs
    const uniqueIPs = new Set(recentAttempts.map(a => a.ipAddress));

    let score = 0;
    const reasons = [];

    // Multiple IPs in short time frame
    if (uniqueIPs.size >= 3) {
      score += 0.5;
      reasons.push(`${uniqueIPs.size} different IPs in 15 minutes`);
    }

    // High frequency of attempts
    if (recentAttempts.length >= 5) {
      score += 0.3;
      reasons.push(`${recentAttempts.length} login attempts in 15 minutes`);
    }

    return {
      suspicious: score > 0,
      score: score,
      type: 'VELOCITY',
      details: {
        recentAttempts: recentAttempts.length,
        uniqueIPs: uniqueIPs.size,
        timeWindow: '15 minutes',
        reasons: reasons
      }
    };
  }

  /**
   * Get user's activity history
   */
  async getUserActivityHistory(userId) {
    try {
      return this.db.prepare(`
        SELECT action, ipAddress, userAgent, createdAt
        FROM activity_log
        WHERE userId = ? AND action IN ('login_success', 'login_attempt')
        ORDER BY createdAt DESC
        LIMIT 50
      `).all(userId);
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract geographic locations from activity history
   */
  extractLocations(history) {
    const locations = [];
    for (const activity of history) {
      if (activity.ipAddress) {
        const geo = geoip.lookup(activity.ipAddress);
        if (geo) {
          locations.push(geo);
        }
      }
    }
    return locations;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate device fingerprint from user agent
   */
  generateDeviceFingerprint(userAgent) {
    if (!userAgent) return 'unknown';
    return crypto.createHash('md5').update(userAgent).digest('hex').substring(0, 16);
  }

  /**
   * Detect suspicious user agents
   */
  isSuspiciousUserAgent(userAgent) {
    if (!userAgent) return true;

    const suspiciousPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i,
      /scanner/i, /automation/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Get risk level from score
   */
  getRiskLevel(score) {
    if (score >= this.RISK_THRESHOLDS.HIGH) return 'HIGH';
    if (score >= this.RISK_THRESHOLDS.MEDIUM) return 'MEDIUM';
    if (score >= this.RISK_THRESHOLDS.LOW) return 'LOW';
    return 'NONE';
  }

  /**
   * Get recommendation based on risk score
   */
  getRecommendation(score) {
    if (score >= this.RISK_THRESHOLDS.HIGH) {
      return 'BLOCK'; // Require additional verification
    }
    if (score >= this.RISK_THRESHOLDS.MEDIUM) {
      return 'CHALLENGE'; // Require 2FA or email verification
    }
    if (score >= this.RISK_THRESHOLDS.LOW) {
      return 'MONITOR'; // Allow but log for review
    }
    return 'ALLOW'; // Normal activity
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(userId, assessment, ipAddress) {
    try {
      this.db.prepare(`
        INSERT INTO activity_log (userId, action, description, ipAddress, metadata, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        'suspicious_activity_detected',
        `Risk Level: ${assessment.riskLevel} (Score: ${assessment.riskScore.toFixed(2)})`,
        ipAddress,
        JSON.stringify({
          riskScore: assessment.riskScore,
          riskLevel: assessment.riskLevel,
          risks: assessment.risks,
          recommendation: assessment.recommendation
        }),
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Failed to log suspicious activity:', error);
    }
  }
}

module.exports = SuspiciousActivityDetector;
