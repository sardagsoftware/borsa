/**
 * Password Validation Endpoint
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Real-time password strength checker
 */

const User = require('../../backend/models/User');
const { handleCORS } = require('../../middleware/cors-handler');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Validate password strength using User model
    const validation = User.validatePasswordStrength(password);

    // Calculate password strength score (0-100)
    let score = 0;

    // Length score (max 40 points)
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Complexity score (max 40 points)
    if (/[A-Z]/.test(password)) score += 10; // Uppercase
    if (/[a-z]/.test(password)) score += 10; // Lowercase
    if (/[0-9]/.test(password)) score += 10; // Numbers
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10; // Special chars

    // Security checks (max 20 points)
    const commonPasswords = [
      'password', 'password123', '12345678', 'qwerty', 'abc123',
      'password1', '111111', '123123', 'admin', 'letmein'
    ];

    if (!commonPasswords.includes(password.toLowerCase())) score += 10;
    if (!/(.)\1{2,}/.test(password)) score += 5; // No repeated chars
    if (!/(?:abc|bcd|cde|123|234|345)/i.test(password)) score += 5; // No sequential

    // Determine strength level
    let strength = 'weak';
    if (score >= 80) strength = 'strong';
    else if (score >= 60) strength = 'medium';

    return res.status(200).json({
      success: true,
      data: {
        valid: validation.valid,
        errors: validation.errors,
        score: Math.min(score, 100),
        strength: strength,
        requirements: {
          minLength: password.length >= 8,
          maxLength: password.length <= 128,
          hasUppercase: /[A-Z]/.test(password),
          hasLowercase: /[a-z]/.test(password),
          hasNumber: /[0-9]/.test(password),
          hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
          notCommon: !commonPasswords.includes(password.toLowerCase()),
          noSequential: !/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password),
          noRepeated: !/(.)\1{2,}/.test(password)
        }
      }
    });

  } catch (error) {
    console.error('Password validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Validation failed'
    });
  }
};
