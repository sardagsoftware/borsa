/**
 * Update Privacy Settings
 * Updates user privacy preferences
 * Vercel Serverless Function
 */

const User = require('../../../backend/models/User');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../../../database/init-db');
const { handleCORS } = require('../../../middleware/cors-handler');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    const userId = decoded.id;

    // Get privacy settings from request
    const {
      usageStatistics = true,
      chatHistory = true,
      personalization = true,
      emailNotifications = true,
      securityAlerts = true,
      marketingEmails = false
    } = req.body;

    // Create user_privacy table if it doesn't exist
    db.prepare(`
      CREATE TABLE IF NOT EXISTS user_privacy (
        userId INTEGER PRIMARY KEY,
        usageStatistics INTEGER DEFAULT 1,
        chatHistory INTEGER DEFAULT 1,
        personalization INTEGER DEFAULT 1,
        emailNotifications INTEGER DEFAULT 1,
        securityAlerts INTEGER DEFAULT 1,
        marketingEmails INTEGER DEFAULT 0,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `).run();

    // Check if privacy settings exist
    const existing = db.prepare('SELECT * FROM user_privacy WHERE userId = ?').get(userId);

    if (existing) {
      // Update existing settings
      db.prepare(`
        UPDATE user_privacy
        SET
          usageStatistics = ?,
          chatHistory = ?,
          personalization = ?,
          emailNotifications = ?,
          securityAlerts = ?,
          marketingEmails = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE userId = ?
      `).run(
        usageStatistics ? 1 : 0,
        chatHistory ? 1 : 0,
        personalization ? 1 : 0,
        emailNotifications ? 1 : 0,
        securityAlerts ? 1 : 0,
        marketingEmails ? 1 : 0,
        userId
      );
    } else {
      // Insert new settings
      db.prepare(`
        INSERT INTO user_privacy (
          userId, usageStatistics, chatHistory, personalization,
          emailNotifications, securityAlerts, marketingEmails
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        usageStatistics ? 1 : 0,
        chatHistory ? 1 : 0,
        personalization ? 1 : 0,
        emailNotifications ? 1 : 0,
        securityAlerts ? 1 : 0,
        marketingEmails ? 1 : 0
      );
    }

    // Log activity
    User.logActivity({
      userId,
      action: 'privacy_settings_updated',
      description: 'Privacy settings updated'
    });

    // Get updated settings
    const updated = db.prepare('SELECT * FROM user_privacy WHERE userId = ?').get(userId);

    return res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: {
        usageStatistics: !!updated.usageStatistics,
        chatHistory: !!updated.chatHistory,
        personalization: !!updated.personalization,
        emailNotifications: !!updated.emailNotifications,
        securityAlerts: !!updated.securityAlerts,
        marketingEmails: !!updated.marketingEmails,
        updatedAt: updated.updatedAt
      }
    });

  } catch (error) {
    console.error('Update privacy settings error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings'
    });
  } finally {
    db.close();
  }
};
