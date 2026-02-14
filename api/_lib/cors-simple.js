/**
 * Simple CORS Handler for Vercel Serverless Functions
 * No external dependencies
 */

const ALLOWED_ORIGINS = [
  'https://www.ailydian.com',
  'https://ailydian.com',
  'https://seo.ailydian.com',
  'https://dashboard.ailydian.com',
];

function handleCORS(req, res) {
  const origin = req.headers.origin;

  // Check if origin is allowed (exact match only, no wildcards)
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin);

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.ailydian.com');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

module.exports = {
  handleCORS,
  ALLOWED_ORIGINS,
};
