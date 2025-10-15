/**
 * Revoke API Key
 * Deactivates an API key (doesn't delete for audit trail)
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

    // Get key ID from request
    const { keyId } = req.body;

    if (!keyId) {
      return res.status(400).json({
        success: false,
        message: 'API key ID is required'
      });
    }

    // 🔒 SECURITY: Validate that the key belongs to the user
    const key = db.prepare(`
      SELECT * FROM api_keys WHERE id = ? AND userId = ?
    `).get(keyId, userId);

    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'API key not found or does not belong to you'
      });
    }

    // Check if already revoked
    if (key.status === 'revoked') {
      return res.status(400).json({
        success: false,
        message: 'API key is already revoked'
      });
    }

    // Revoke the key (soft delete - keep for audit trail)
    db.prepare(`
      UPDATE api_keys
      SET status = 'revoked'
      WHERE id = ? AND userId = ?
    `).run(keyId, userId);

    // Log activity
    User.logActivity({
      userId,
      action: 'api_key_revoked',
      description: `API key revoked: ${key.name}`,
      metadata: { keyId: keyId }
    });

    return res.status(200).json({
      success: true,
      message: 'API key has been successfully revoked'
    });

  } catch (error) {
    console.error('Revoke API key error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to revoke API key'
    });
  } finally {
    db.close();
  }
};
