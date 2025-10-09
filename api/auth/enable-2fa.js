/**
 * Enable 2FA (Two-Factor Authentication)
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Generate TOTP secret and QR code
 */

const User = require('../../backend/models/User');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 🔒 SECURITY: Extract user from JWT token
    const cookies = req.headers.cookie || '';
    const tokenMatch = cookies.match(/auth_token=([^;]+)/);
    const authHeader = req.headers.authorization;

    let token = null;
    if (tokenMatch) {
      token = tokenMatch[1];
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const userId = decoded.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled. Please disable it first to re-configure.'
      });
    }

    // 🔒 BEYAZ ŞAPKALI: Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Ailydian (${user.email})`,
      issuer: 'Ailydian Ultra Pro',
      length: 32
    });

    // Save secret to database (but don't enable yet - needs confirmation)
    const { getDatabase } = require('../../database/init-db');
    const db = getDatabase();
    try {
      db.prepare(`
        UPDATE users
        SET twoFactorSecret = ?, twoFactorEnabled = 0
        WHERE id = ?
      `).run(secret.base32, userId);
    } finally {
      db.close();
    }

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Log activity
    User.logActivity({
      userId,
      action: '2fa_setup_initiated',
      description: '2FA setup initiated',
      ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: '2FA secret generated. Scan the QR code with your authenticator app.',
      data: {
        secret: secret.base32,
        qrCode: qrCodeDataUrl,
        otpauthUrl: secret.otpauth_url,
        instructions: [
          '1. Open your authenticator app (Google Authenticator, Authy, etc.)',
          '2. Scan the QR code or enter the secret manually',
          '3. Enter the 6-digit code to confirm setup'
        ]
      }
    });

  } catch (error) {
    console.error('Enable 2FA error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA'
    });
  }
};
