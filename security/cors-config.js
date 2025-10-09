/**
 * CORS Configuration
 * Fixes: MEDIUM - CORS policy too permissive (wildcard *)
 */

// Whitelist of allowed origins
const ALLOWED_ORIGINS = [
  'https://ailydian.com',
  'https://www.ailydian.com',
  'https://ailydian-ultra-pro.vercel.app',
  'http://localhost:3100',
  'http://localhost:3000',
  'http://localhost:5000'
];

// Add development origins in non-production
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push(
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3901',
    'http://localhost:4444',
    'http://127.0.0.1:3100'
  );
}

/**
 * CORS configuration options
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check whitelist
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-API-Key'
  ],
  exposedHeaders: [
    'X-CSRF-Token',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400 // 24 hours
};

/**
 * Strict CORS for payment endpoints
 */
const strictCorsOptions = {
  origin: function (origin, callback) {
    // Only allow production origins for payment endpoints
    const productionOrigins = [
      'https://ailydian.com',
      'https://www.ailydian.com',
      'https://ailydian-ultra-pro.vercel.app'
    ];

    if (!origin || productionOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Payment endpoints only accessible from production domains'));
    }
  },
  credentials: true,
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};

/**
 * Middleware to set additional security headers
 */
function setSecurityHeaders(req, res, next) {
  // X-Frame-Options handled by Helmet (configured as DENY in middleware/security.js)

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}

/**
 * Content Security Policy
 */
function setCSP(req, res, next) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://ailydian.com https://www.ailydian.com wss:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  next();
}

/**
 * Simple CORS middleware for Vercel serverless functions
 * Use this in API endpoints: handleCORS(req, res)
 */
function handleCORS(req, res) {
  const origin = req.headers.origin;

  // Set CORS headers based on whitelist
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    // Allow requests with no origin (mobile apps, Postman)
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-API-Key');
  res.setHeader('Access-Control-Expose-Headers', 'X-CSRF-Token, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // Signal that request was handled
  }

  return false; // Continue processing
}

/**
 * Strict CORS for sensitive endpoints (payments, admin, etc.)
 * Blocks all non-production origins
 */
function handleStrictCORS(req, res) {
  const origin = req.headers.origin;
  const productionOrigins = [
    'https://ailydian.com',
    'https://www.ailydian.com',
    'https://ailydian-ultra-pro.vercel.app'
  ];

  if (origin && productionOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    // Block non-production origins
    return res.status(403).json({
      error: 'Access denied',
      message: 'This endpoint only accepts requests from production domains'
    });
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

module.exports = {
  corsOptions,
  strictCorsOptions,
  setSecurityHeaders,
  setCSP,
  ALLOWED_ORIGINS,
  handleCORS,
  handleStrictCORS
};
