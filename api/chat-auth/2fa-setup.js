/**
 * 2FA Setup API
 * POST /api/chat-auth/2fa-setup
 * Generates TOTP secret and QR code for authenticator app
 */

const { chatUsers } = require('./_lib/db');
const { extractToken, verifyAccessToken } = require('./_lib/jwt');
const { parseCookies } = require('./_lib/cookies');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { getCorsOrigin } = require('../_middleware/cors');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    req.cookies = parseCookies(req);
    const token = extractToken(req);
    if (!token) return res.status(401).json({ success: false, error: 'Oturum gerekli' });

    const result = verifyAccessToken(token);
    if (!result.valid) return res.status(401).json({ success: false, error: 'Oturum gecersiz' });

    const user = await chatUsers.findById(result.payload.userId);
    if (!user) return res.status(404).json({ success: false, error: 'Kullanici bulunamadi' });

    // Check if 2FA is already enabled
    if (user.two_factor_enabled === 'true') {
      return res.status(400).json({ success: false, error: '2FA zaten aktif' });
    }

    // Generate TOTP secret (SHA1 + 32 bytes for Google Authenticator compatibility)
    const secret = speakeasy.generateSecret({
      name: `AILYDIAN:${user.email}`,
      issuer: 'AILYDIAN',
      length: 32,
      algorithm: 'sha1'
    });

    // Store temp secret (not enabled yet - will be enabled after verification)
    await chatUsers.update2FA(user.id, secret.base32, false);

    // Generate QR code as data URL
    const otpauthUrl = secret.otpauth_url;
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    return res.status(200).json({
      success: true,
      qrCode: qrDataUrl,
      manualKey: secret.base32,
      otpauthUrl: otpauthUrl
    });

  } catch (error) {
    console.error('[2FA_SETUP_ERROR]', error.message);
    return res.status(500).json({ success: false, error: '2FA kurulumu basarisiz' });
  }
};
