// CSRF Token Generation Endpoint
// White-hat compliant: secure token generation for CSRF protection

const crypto = require('crypto');

module.exports = (req, res) => {
  try {
    // Generate cryptographically secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set CSRF token in cookie (httpOnly for security)
    res.setHeader('Set-Cookie', [
      `csrf-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600; Path=/`
    ]);
    
    // Also return in response body for client-side access
    res.status(200).json({
      token,
      expiresIn: 3600, // 1 hour
      message: 'CSRF token generated successfully'
    });
    
  } catch (error) {
    console.error('[CSRF Token Error]', error.message);
    
    res.status(500).json({
      error: 'Failed to generate CSRF token',
      message: 'Internal server error'
    });
  }
};
