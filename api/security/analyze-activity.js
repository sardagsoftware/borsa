/**
 * API Endpoint: Analyze Activity for Suspicious Behavior
 * White-Hat Security: Real-time suspicious activity detection
 *
 * POST /api/security/analyze-activity
 */

const SuspiciousActivityDetector = require('../../security/suspicious-activity-detector');
const Database = require('better-sqlite3');
const path = require('path');
const { applySanitization } = require('../_middleware/sanitize');

const DB_PATH = path.join(__dirname, '../../database/ailydian.db');

module.exports = async (req, res) => {
  applySanitization(req, res);
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { userId, action = 'login_attempt' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    // Get client information
    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      'unknown';

    const userAgent = req.headers['user-agent'] || 'unknown';

    // Initialize detector
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    const detector = new SuspiciousActivityDetector(db);

    // Analyze activity
    const assessment = await detector.analyzeLoginAttempt({
      userId: parseInt(userId),
      ipAddress: ipAddress,
      userAgent: userAgent,
      timestamp: new Date(),
    });

    // Log if suspicious
    if (assessment.suspicious && assessment.riskScore > 0.5) {
      await detector.logSuspiciousActivity(userId, assessment, ipAddress);
    }

    db.close();

    return res.status(200).json({
      success: true,
      data: {
        suspicious: assessment.suspicious,
        riskLevel: assessment.riskLevel,
        riskScore: assessment.riskScore,
        recommendation: assessment.recommendation,
        risks: assessment.risks,
        timestamp: assessment.timestamp,
      },
    });
  } catch (error) {
    console.error('Activity analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Güvenlik analizi hatası',
    });
  }
};
