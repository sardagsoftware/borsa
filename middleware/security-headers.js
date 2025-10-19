/**
 * AILYDIAN SECURITY HEADERS MIDDLEWARE
 * Implements OWASP secure headers best practices
 * https://owasp.org/www-project-secure-headers/
 */

function securityHeaders(req, res, next) {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME-sniffing attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Enforce HTTPS (when in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com https://unpkg.com https://cdn.jsdelivr.net https://d3js.org",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "media-src 'self' https://videos.pexels.com https://assets.mixkit.co https:",
    "connect-src 'self' https://vercel.live https://*.pusher.com https://*.ailydian.com https://tile.openstreetmap.org https://*.basemaps.cartocdn.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com https://d3js.org",
    "frame-src 'self' https://ailydian-messaging.vercel.app https://messaging.ailydian.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);

  // Permissions Policy (Feature Policy)
  const permissions = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ');
  res.setHeader('Permissions-Policy', permissions);

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Additional security headers
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Download-Options', 'noopen');

  // Remove fingerprinting headers
  res.removeHeader('X-Powered-By');

  next();
}

module.exports = securityHeaders;
