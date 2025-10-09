/**
 * List User's API Keys
 * Returns all API keys for the authenticated user
 * Vercel Serverless Function
 */

const User = require('../../../backend/models/User');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../../../database/init-db');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    const userId = decoded.id;

    // Create API keys table if it doesn't exist
    db.prepare(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        name TEXT NOT NULL,
        keyHash TEXT NOT NULL UNIQUE,
        keyPrefix TEXT NOT NULL,
        permissions TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        lastUsed DATETIME,
        expiresAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `).run();

    // Get all API keys for user
    const keys = db.prepare(`
      SELECT
        id,
        name,
        keyPrefix,
        permissions,
        status,
        lastUsed,
        expiresAt,
        createdAt
      FROM api_keys
      WHERE userId = ?
      ORDER BY createdAt DESC
    `).all(userId);

    // Format the keys
    const formattedKeys = keys.map(key => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix + '...',
      permissions: key.permissions.split(','),
      status: key.status,
      lastUsed: key.lastUsed,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      isExpired: new Date(key.expiresAt) < new Date()
    }));

    return res.status(200).json({
      success: true,
      data: {
        keys: formattedKeys,
        total: formattedKeys.length,
        active: formattedKeys.filter(k => k.status === 'active' && !k.isExpired).length
      }
    });

  } catch (error) {
    console.error('List API keys error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to list API keys'
    });
  } finally {
    db.close();
  }
};
