/**
 * Export User Data
 * GDPR compliance - Right to data portability
 * Vercel Serverless Function
 */

const User = require('../../../backend/models/User');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../../../database/init-db');
const { handleCORS } = require('../../../middleware/cors-handler');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const db = getDatabase();

  try {
    // 🔒 SECURITY: Get user from auth token
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Get user data
    const user = db.prepare(`
      SELECT id, email, name, phone, subscription, credits, role, status, createdAt, lastLogin
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get privacy settings
    const privacy = db.prepare('SELECT * FROM user_privacy WHERE userId = ?').get(userId);

    // Get usage statistics
    const usageStats = db.prepare(`
      SELECT * FROM usage_stats WHERE userId = ?
      ORDER BY date DESC LIMIT 30
    `).all(userId);

    // Get activity log
    const activityLog = db.prepare(`
      SELECT action, description, ipAddress, createdAt
      FROM activity_log WHERE userId = ?
      ORDER BY createdAt DESC LIMIT 100
    `).all(userId);

    // Get API keys (without sensitive data)
    const apiKeys = db.prepare(`
      SELECT id, name, keyPrefix, permissions, status, createdAt, expiresAt
      FROM api_keys WHERE userId = ?
    `).all(userId);

    // Get sessions
    const sessions = db.prepare(`
      SELECT ipAddress, userAgent, createdAt, expiresAt
      FROM sessions WHERE userId = ? AND expiresAt > datetime('now')
    `).all(userId);

    // Compile all data
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        subscription: user.subscription,
        credits: user.credits,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      privacy: privacy ? {
        usageStatistics: !!privacy.usageStatistics,
        chatHistory: !!privacy.chatHistory,
        personalization: !!privacy.personalization,
        emailNotifications: !!privacy.emailNotifications,
        securityAlerts: !!privacy.securityAlerts,
        marketingEmails: !!privacy.marketingEmails,
        updatedAt: privacy.updatedAt
      } : null,
      usage: {
        statistics: usageStats,
        totalDays: usageStats.length
      },
      activity: {
        log: activityLog,
        totalEvents: activityLog.length
      },
      apiKeys: {
        keys: apiKeys.map(key => ({
          name: key.name,
          keyPrefix: key.keyPrefix,
          permissions: key.permissions.split(','),
          status: key.status,
          createdAt: key.createdAt,
          expiresAt: key.expiresAt
        })),
        total: apiKeys.length
      },
      sessions: {
        active: sessions,
        total: sessions.length
      }
    };

    // Log activity
    User.logActivity({
      userId,
      action: 'data_exported',
      description: 'User data exported (GDPR)'
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="lydian-data-export-${userId}-${Date.now()}.json"`);

    return res.status(200).json(exportData);

  } catch (error) {
    console.error('Export data error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to export data'
    });
  } finally {
    db.close();
  }
};
