/**
 * 2FA Disable API
 * POST /api/chat-auth/2fa-disable
 * Disables 2FA on the account (requires current TOTP code or password)
 */

const { chatUsers } = require('./_lib/db');
const { extractToken, verifyAccessToken } = require('./_lib/jwt');
const { parseCookies } = require('./_lib/cookies');
const { parseBody } = require('./_lib/body-parser');
const speakeasy = require('speakeasy');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
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

    const body = parseBody(req);
    const { code } = body;

    const sanitizedCode = (code || '').replace(/\D/g, '');
    if (!sanitizedCode || sanitizedCode.length !== 6) {
      return res.status(400).json({ success: false, error: '6 haneli doğrulama kodu gerekli' });
    }

    const user = await chatUsers.findById(result.payload.userId);
    if (!user) return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });

    if (user.two_factor_enabled !== 'true') {
      return res.status(400).json({ success: false, error: '2FA zaten pasif' });
    }

    // Verify current TOTP code before disabling (trim secret, explicit algorithm)
    const verified = speakeasy.totp.verify({
      secret: (user.totp_secret || '').trim(),
      encoding: 'base32',
      token: sanitizedCode,
      algorithm: 'sha1',
      step: 30,
      window: 3
    });

    if (!verified) {
      return res.status(400).json({ success: false, error: 'Dogrulama kodu hatali' });
    }

    // Disable 2FA and clear secret
    await chatUsers.update2FA(user.id, '', false);

    return res.status(200).json({
      success: true,
      message: '2FA basariyla devre disi birakildi'
    });

  } catch (error) {
    console.error('[2FA_DISABLE_ERROR]', error.message);
    return res.status(500).json({ success: false, error: '2FA devre disi birakma basarisiz' });
  }
};
