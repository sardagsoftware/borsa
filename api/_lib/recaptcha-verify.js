/**
 * 🔒 GOOGLE reCAPTCHA v3 VERIFICATION
 * Server-side verification for robot protection
 *
 * @version 1.0.0
 * White-hat compliant security implementation
 */

const https = require('https');
const { URLSearchParams } = require('url');

/**
 * reCAPTCHA Secret Key
 * Set as environment variable: RECAPTCHA_SECRET_KEY
 */
const RECAPTCHA_SECRET_KEY =
  process.env.RECAPTCHA_SECRET_KEY || '6LfGUKAqAAAAAMVc-XZR8sW4x6KZtL_PQVnhX3zA';

/**
 * Minimum score threshold for reCAPTCHA v3
 * Score ranges from 0.0 (bot) to 1.0 (human)
 * Recommended threshold: 0.5
 */
const RECAPTCHA_THRESHOLD = parseFloat(process.env.RECAPTCHA_THRESHOLD) || 0.5;

/**
 * Verify reCAPTCHA token with Google
 *
 * @param {string} token - reCAPTCHA token from client
 * @param {string} remoteIp - User's IP address (optional but recommended)
 * @returns {Promise<{success: boolean, score: number, action: string, error?: string}>}
 */
async function verifyRecaptcha(token, remoteIp = null) {
  return new Promise(resolve => {
    // Validation: token required
    if (!token) {
      return resolve({
        success: false,
        error: 'reCAPTCHA token is required',
        code: 'MISSING_TOKEN',
      });
    }

    // Validation: secret key configured
    if (!RECAPTCHA_SECRET_KEY || RECAPTCHA_SECRET_KEY.includes('your-secret-key')) {
      console.warn('[⚠️ reCAPTCHA] Secret key not configured. Bypassing verification in dev mode.');
      // In development, allow requests to pass through
      if (process.env.NODE_ENV !== 'production') {
        return resolve({
          success: true,
          score: 0.9,
          action: 'dev_bypass',
          warning: 'Development mode - reCAPTCHA bypassed',
        });
      }
      return resolve({
        success: false,
        error: 'reCAPTCHA not configured on server',
        code: 'SERVER_CONFIG_ERROR',
      });
    }

    // Build request payload
    const params = new URLSearchParams({
      secret: RECAPTCHA_SECRET_KEY,
      response: token,
    });

    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    const postData = params.toString();

    // HTTPS request to Google reCAPTCHA API
    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          // Google reCAPTCHA response format:
          // {
          //   "success": true|false,
          //   "score": 0.0-1.0,
          //   "action": "login|register|...",
          //   "challenge_ts": "timestamp",
          //   "hostname": "yourdomain.com",
          //   "error-codes": []
          // }

          if (!response.success) {
            console.error('[❌ reCAPTCHA] Verification failed:', response['error-codes']);
            return resolve({
              success: false,
              error: 'reCAPTCHA verification failed',
              code: 'VERIFICATION_FAILED',
              details: response['error-codes'],
            });
          }

          // Check score threshold (v3 only)
          if (response.score !== undefined && response.score < RECAPTCHA_THRESHOLD) {
            console.warn(
              `[⚠️ reCAPTCHA] Low score: ${response.score} (threshold: ${RECAPTCHA_THRESHOLD})`
            );
            return resolve({
              success: false,
              error: 'Suspicious activity detected. Please try again.',
              code: 'LOW_SCORE',
              score: response.score,
              threshold: RECAPTCHA_THRESHOLD,
            });
          }

          // Success
          console.log(
            `[✅ reCAPTCHA] Verified: score=${response.score}, action=${response.action}`
          );
          return resolve({
            success: true,
            score: response.score,
            action: response.action,
            hostname: response.hostname,
            challengeTs: response.challenge_ts,
          });
        } catch (parseError) {
          console.error('[❌ reCAPTCHA] Parse error:', parseError);
          return resolve({
            success: false,
            error: 'Failed to parse reCAPTCHA response',
            code: 'PARSE_ERROR',
          });
        }
      });
    });

    req.on('error', error => {
      console.error('[❌ reCAPTCHA] Request error:', error);
      resolve({
        success: false,
        error: 'Failed to contact reCAPTCHA server',
        code: 'REQUEST_ERROR',
        details: error.message,
      });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Express/Vercel middleware for reCAPTCHA verification
 *
 * Usage:
 * const { requireRecaptcha } = require('./_lib/recaptcha-verify');
 *
 * module.exports = async (req, res) => {
 *   const recaptchaResult = await requireRecaptcha(req);
 *   if (!recaptchaResult.success) {
 *     return res.status(400).json({ error: recaptchaResult.error });
 *   }
 *   // Continue with request...
 * };
 */
async function requireRecaptcha(req) {
  const token = req.body?.recaptchaToken;
  const remoteIp = req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress;

  return await verifyRecaptcha(token, remoteIp);
}

module.exports = {
  verifyRecaptcha,
  requireRecaptcha,
  RECAPTCHA_THRESHOLD,
};
