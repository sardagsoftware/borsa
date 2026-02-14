/**
 * Phone OTP - Send Verification Code
 * POST /api/chat-auth/phone-send-otp
 * Uses Twilio Verify API to send SMS OTP
 */

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
    return res.status(405).json({ success: false, error: 'Bu istek yöntemi desteklenmiyor' });
  }

  try {
    // Check Twilio configuration (API Key auth - more secure than Auth Token)
    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
    const API_KEY_SID = process.env.TWILIO_API_KEY_SID;
    const API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN; // fallback
    const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!TWILIO_SID || ((!API_KEY_SID || !API_KEY_SECRET) && !TWILIO_TOKEN) || !VERIFY_SID) {
      console.error('[PHONE_OTP] Twilio not configured');
      return res.status(503).json({
        success: false,
        error: 'Telefon dogrulama servisi simdilik kullanim disi.',
      });
    }

    const body = parseBody(req);
    const { phoneNumber, countryCode } = body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Telefon numarasi gerekli',
      });
    }

    // Rate limiting (3 per minute per IP)
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
    const rateLimit = checkRateLimit(`phone_otp:${clientIP}`, 3, 60);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: `Cok fazla deneme. ${rateLimit.resetIn} saniye sonra tekrar deneyin.`,
      });
    }

    // Format to E.164
    let fullNumber = phoneNumber.replace(/\D/g, '');
    const code = (countryCode || '+90').replace(/\D/g, '');

    if (!fullNumber.startsWith(code)) {
      fullNumber = code + fullNumber;
    }
    fullNumber = '+' + fullNumber;

    // Basic validation
    if (fullNumber.length < 10 || fullNumber.length > 16) {
      return res.status(400).json({
        success: false,
        error: 'Gecerli bir telefon numarasi girin',
      });
    }

    // Send OTP via Twilio Verify (prefer API Key auth)
    const twilio =
      API_KEY_SID && API_KEY_SECRET
        ? require('twilio')(API_KEY_SID, API_KEY_SECRET, { accountSid: TWILIO_SID })
        : require('twilio')(TWILIO_SID, TWILIO_TOKEN);
    const verification = await twilio.verify.v2.services(VERIFY_SID).verifications.create({
      to: fullNumber,
      channel: 'sms',
    });

    console.log('[PHONE_OTP] Verification sent:', verification.status, 'to:', fullNumber);

    return res.status(200).json({
      success: true,
      message: 'Dogrulama kodu gonderildi',
      phoneNumber: fullNumber,
    });
  } catch (error) {
    console.error('[PHONE_OTP] Error:', error.message);

    // Handle specific Twilio errors
    if (error.code === 60200) {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz telefon numarasi',
      });
    }
    if (error.code === 60203) {
      return res.status(429).json({
        success: false,
        error: 'Cok fazla OTP istegi. Lutfen bekleyin.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Dogrulama kodu gonderilemedi. Lutfen tekrar deneyin.',
    });
  }
};
