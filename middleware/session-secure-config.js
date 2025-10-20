/**
 * SECURE SESSION CONFIGURATION
 * Implements secure, httpOnly, sameSite flags
 * SECURITY FIX: SESSION-SECURITY-2025
 */

const session = require('express-session');

// Session store configuration
let sessionStore;

try {
  // Try SQLite store
  const SQLiteStore = require('connect-sqlite3')(session);
  sessionStore = new SQLiteStore({
    db: 'sessions.db',
    dir: './database',
    table: 'sessions',
    concurrentDB: true
  });
} catch (error) {
  // Fallback to memory store (development only)
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Using MemoryStore for sessions (dev only)');
    sessionStore = new session.MemoryStore();
  } else {
    throw new Error('Production requires persistent session store');
  }
}

/**
 * Generate secure session secret
 */
function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable must be set in production');
    }
    console.warn('⚠️  Using default session secret (development only)');
    return 'dev-secret-change-this-in-production';
  }

  // Validate secret strength
  if (secret.length < 32) {
    console.warn('⚠️  Session secret should be at least 32 characters');
  }

  return secret;
}

/**
 * Secure session configuration
 */
const sessionConfig = {
  // Secret key for signing session ID
  secret: getSessionSecret(),

  // Session store
  store: sessionStore,

  // Don't save uninitialized sessions
  resave: false,
  saveUninitialized: false,

  // Refresh session on activity
  rolling: true,

  // Cookie configuration (SECURE)
  cookie: {
    // SECURITY: HTTPS only in production
    secure: process.env.NODE_ENV === 'production',

    // SECURITY: Prevent JavaScript access (XSS protection)
    httpOnly: true,

    // SECURITY: CSRF protection
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',

    // Session lifetime: 24 hours
    maxAge: 24 * 60 * 60 * 1000,

    // Cookie path
    path: '/',

    // Domain (allow subdomains in production)
    domain: process.env.NODE_ENV === 'production'
      ? '.ailydian.com'
      : undefined
  },

  // Custom session ID name (don't use default 'connect.sid')
  name: 'lydian.sid',

  // Trust proxy (required for Vercel, Heroku, etc.)
  proxy: process.env.NODE_ENV === 'production',

  // Generate secure session ID
  genid: function(req) {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
};

/**
 * Session cleanup middleware
 * Remove expired sessions periodically
 */
function setupSessionCleanup(store) {
  if (store && typeof store.all === 'function') {
    // Clean expired sessions every hour
    setInterval(() => {
      store.all((err, sessions) => {
        if (err) return;

        const now = Date.now();
        Object.keys(sessions || {}).forEach(sessionId => {
          const session = sessions[sessionId];
          if (session && session.cookie && session.cookie.expires) {
            const expires = new Date(session.cookie.expires).getTime();
            if (expires < now) {
              store.destroy(sessionId);
            }
          }
        });
      });
    }, 60 * 60 * 1000); // Every hour
  }
}

// Auto-setup cleanup
if (sessionStore) {
  setupSessionCleanup(sessionStore);
}

module.exports = {
  sessionConfig,
  setupSessionCleanup
};
