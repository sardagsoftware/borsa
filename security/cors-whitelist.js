/**
 * CORS WHITELIST CONFIGURATION
 * Secure origin validation - replaces wildcard (*)
 * SECURITY FIX: CVE-CORS-WILDCARD-2025
 */

const allowedOrigins = [
  // Production domains
  'https://www.ailydian.com',
  'https://ailydian.com',

  // Vercel deployments
  'https://ailydian.vercel.app',

  // Development (only if not production)
  ...(process.env.NODE_ENV !== 'production' ? [
    'http://localhost:3100',
    'http://localhost:3000',
    'http://127.0.0.1:3100',
    'http://127.0.0.1:3000'
  ] : [])
];

/**
 * Check if origin matches wildcard pattern
 */
function matchesWildcard(origin, pattern) {
  if (!pattern.includes('*')) {
    return origin === pattern;
  }
  const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
  return regex.test(origin);
}

/**
 * CORS options with origin whitelist
 */
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Check exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check wildcard patterns (Vercel preview deployments)
    const wildcardPatterns = [
      'https://ailydian-*.vercel.app'
    ];

    for (const pattern of wildcardPatterns) {
      if (matchesWildcard(origin, pattern)) {
        return callback(null, true);
      }
    }

    // Reject unauthorized origin
    const msg = `CORS policy: Origin ${origin} is not allowed`;
    console.warn(msg);
    return callback(new Error(msg), false);
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-CSRF-Token',
    'Idempotency-Key',
    'X-Requested-With'
  ],

  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining'
  ],

  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204
};

module.exports = { corsOptions, allowedOrigins };
