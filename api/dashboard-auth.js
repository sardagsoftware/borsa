// Ultra Secure Dashboard Authentication API
// Rate limiting + Brute force protection + IP tracking

const rateLimit = new Map();
const blockedIPs = new Set();
const MAX_REQUESTS_PER_MINUTE = 5;
const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes

// Emrah's private access key
const PRIVATE_ACCESS_KEY = process.env.DASHBOARD_ACCESS_KEY || 'Xrubyphyton1985.!?';

module.exports = async (req, res) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get client IP
  const clientIP = req.headers['x-forwarded-for'] ||
                   req.headers['x-real-ip'] ||
                   req.socket.remoteAddress ||
                   'unknown';

  // Check if IP is blocked
  if (blockedIPs.has(clientIP)) {
    console.log(`🚫 Blocked IP attempted access: ${clientIP}`);
    return res.status(403).json({
      error: 'Access denied',
      message: 'Your IP has been temporarily blocked due to suspicious activity'
    });
  }

  // Rate limiting
  const now = Date.now();
  const ipData = rateLimit.get(clientIP) || { count: 0, firstRequest: now };

  // Reset counter if minute has passed
  if (now - ipData.firstRequest > 60000) {
    ipData.count = 0;
    ipData.firstRequest = now;
  }

  ipData.count++;
  rateLimit.set(clientIP, ipData);

  // Block if too many requests
  if (ipData.count > MAX_REQUESTS_PER_MINUTE) {
    blockedIPs.add(clientIP);
    setTimeout(() => blockedIPs.delete(clientIP), BLOCK_DURATION);

    console.log(`⚠️  IP blocked due to rate limit: ${clientIP}`);

    return res.status(429).json({
      error: 'Too many requests',
      message: 'Your IP has been temporarily blocked. Try again in 30 minutes.'
    });
  }

  // Validate access key
  const { accessKey } = req.body;

  if (!accessKey) {
    return res.status(400).json({ error: 'Access key required' });
  }

  // Check access key
  if (accessKey === PRIVATE_ACCESS_KEY) {
    // Success - generate session token
    const sessionToken = Buffer.from(`${clientIP}-${Date.now()}-${Math.random()}`).toString('base64');

    console.log(`✅ Successful dashboard access from IP: ${clientIP}`);

    return res.status(200).json({
      success: true,
      message: 'Access granted',
      sessionToken,
      redirectUrl: process.env.DASHBOARD_URL || 'http://localhost:3002'
    });
  } else {
    console.log(`❌ Failed dashboard access attempt from IP: ${clientIP}`);

    return res.status(401).json({
      error: 'Invalid access key',
      remainingAttempts: MAX_REQUESTS_PER_MINUTE - ipData.count
    });
  }
};
