/**
 * Generate API Key for User
 * Creates a new API key with specified permissions
 * Vercel Serverless Function
 */

const User = require('../../../backend/models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getDatabase } = require('../../../database/init-db');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    // Get key name and permissions from request
    const { name, permissions = 'read,write' } = req.body;

    // 🔒 SECURITY: Validate key name
    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'API key name must be at least 3 characters'
      });
    }

    // 🔒 SECURITY: Rate limiting - Check how many keys user has
    const existingKeys = db.prepare(`
      SELECT COUNT(*) as count FROM api_keys WHERE userId = ? AND status = 'active'
    `).get(userId);

    if (existingKeys.count >= 10) {
      return res.status(429).json({
        success: false,
        message: 'Maximum number of API keys reached (10)'
      });
    }

    // Generate API key with prefix
    const keyValue = crypto.randomBytes(32).toString('hex');
    const apiKey = `sk-LyDian-${keyValue}`;

    // Hash the key for storage (store only hash, not the key itself)
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Calculate expiration (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

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

    // Insert API key
    const result = db.prepare(`
      INSERT INTO api_keys (userId, name, keyHash, keyPrefix, permissions, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, name.trim(), keyHash, apiKey.substring(0, 20), permissions, expiresAt.toISOString());

    // Log activity
    User.logActivity({
      userId,
      action: 'api_key_generated',
      description: `API key generated: ${name}`,
      metadata: { keyId: result.lastInsertRowid }
    });

    // 🔒 SECURITY: Return the full key only once (can't be retrieved again)
    return res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      data: {
        id: result.lastInsertRowid,
        name: name.trim(),
        apiKey: apiKey, // ⚠️ ONLY TIME the full key is shown
        keyPrefix: apiKey.substring(0, 20) + '...',
        permissions: permissions.split(','),
        expiresAt: expiresAt.toISOString(),
        warning: 'Save this key now. You won\'t be able to see it again!'
      }
    });

  } catch (error) {
    console.error('Generate API key error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to generate API key'
    });
  } finally {
    db.close();
  }
};
