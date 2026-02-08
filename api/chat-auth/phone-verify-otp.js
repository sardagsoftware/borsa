/**
 * Phone OTP - Verify Code & Login/Register
 * POST /api/chat-auth/phone-verify-otp
 * Verifies OTP via Twilio, creates/finds user, sets JWT cookies
 */

const { chatUsers, chatSessions } = require('./_lib/db');
const { generateAccessToken, generateRefreshToken } = require('./_lib/jwt');
const { setAuthCookies } = require('./_lib/cookies');
const { checkRateLimit } = require('./_lib/password');
const { parseBody } = require('./_lib/body-parser');
const { getCorsOrigin } = require('../_middleware/cors');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Check Twilio configuration (API Key auth - more secure than Auth Token)
    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
    const API_KEY_SID = process.env.TWILIO_API_KEY_SID;
    const API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN; // fallback
    const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!TWILIO_SID || ((!API_KEY_SID || !API_KEY_SECRET) && !TWILIO_TOKEN) || !VERIFY_SID) {
      return res.status(503).json({
        success: false,
        error: 'Telefon dogrulama servisi simdilik kullanim disi.'
      });
    }

    const body = parseBody(req);
    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: 'Telefon numarasi ve dogrulama kodu gerekli'
      });
    }

    // Rate limiting (5 per minute per IP)
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
    const rateLimit = checkRateLimit(`phone_verify:${clientIP}`);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: `Cok fazla deneme. ${rateLimit.resetIn} saniye sonra tekrar deneyin.`
      });
    }

    // Validate code format (6 digits)
    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      return res.status(400).json({
        success: false,
        error: '6 haneli dogrulama kodunu girin'
      });
    }

    // Verify OTP via Twilio (prefer API Key auth)
    const twilio = API_KEY_SID && API_KEY_SECRET
      ? require('twilio')(API_KEY_SID, API_KEY_SECRET, { accountSid: TWILIO_SID })
      : require('twilio')(TWILIO_SID, TWILIO_TOKEN);
    const verificationCheck = await twilio.verify.v2
      .services(VERIFY_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code: cleanCode
      });

    if (verificationCheck.status !== 'approved') {
      console.log('[PHONE_VERIFY] Verification failed:', verificationCheck.status);
      return res.status(401).json({
        success: false,
        error: 'Gecersiz veya suresi dolmus dogrulama kodu'
      });
    }

    console.log('[PHONE_VERIFY] OTP verified for:', phoneNumber);

    // Find or create user
    let user = await chatUsers.findByPhone(phoneNumber);
    let isNewUser = false;

    if (user) {
      // Existing user - update last login
      await chatUsers.updateLastLogin(user.id);
      console.log('[PHONE_VERIFY] Existing user logged in:', user.id);
    } else {
      // New user - create with phone number
      const displayName = 'Kullanici ' + phoneNumber.slice(-4);
      const userId = await chatUsers.create(
        '', // No email for phone-only users
        null, // No password
        displayName,
        {
          phoneNumber: phoneNumber,
          authProvider: 'phone'
        }
      );
      user = await chatUsers.findById(userId);
      isNewUser = true;
      console.log('[PHONE_VERIFY] New user created:', userId);
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await chatSessions.create(
      user.id,
      refreshToken,
      expiresAt,
      clientIP,
      req.headers['user-agent'] || 'unknown'
    );

    // Set auth cookies
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: isNewUser ? 'Hesap olusturuldu ve giris yapildi' : 'Giris basarili',
      user: {
        id: user.id,
        displayName: user.display_name,
        phoneNumber: user.phone_number,
        isNewUser
      }
    });
  } catch (error) {
    console.error('[PHONE_VERIFY] Error:', error.message);

    // Handle specific Twilio errors
    if (error.code === 60200) {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz dogrulama kodu'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Dogrulama basarisiz. Lutfen tekrar deneyin.'
    });
  }
};
