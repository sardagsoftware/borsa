/**
 * AILYDIAN CORS Configuration
 * Replaces wildcard (*) with domain allowlist.
 */

const ALLOWED_ORIGINS = [
  'https://ailydian.com',
  'https://www.ailydian.com',
  'https://seo.ailydian.com',
  'https://dashboard.ailydian.com',
];

function getCorsOrigin(req) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return ALLOWED_ORIGINS[1];
}

function setCorsHeaders(req, res) {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

module.exports = { getCorsOrigin, setCorsHeaders, ALLOWED_ORIGINS };
