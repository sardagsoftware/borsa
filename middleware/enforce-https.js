/**
 * HTTPS Enforcement Middleware
 * Redirects all HTTP traffic to HTTPS in production
 *
 * Security Headers:
 * - Strict-Transport-Security (HSTS)
 * - Force HTTPS redirect
 * - Secure cookies enforcement
 */

const isProduction = process.env.NODE_ENV === 'production';
const enableHttpsRedirect = process.env.ENABLE_HTTPS_REDIRECT === 'true' || isProduction;

/**
 * Force HTTPS redirect middleware
 */
function enforceHTTPS(req, res, next) {
  // Skip if not production or HTTPS enforcement disabled
  if (!enableHttpsRedirect) {
    return next();
  }

  // Check if request is already HTTPS
  const isHTTPS = req.secure ||
                  req.headers['x-forwarded-proto'] === 'https' ||
                  req.protocol === 'https';

  if (!isHTTPS) {
    // Redirect to HTTPS
    const httpsUrl = `https://${req.hostname}${req.url}`;

    console.log(`🔒 Redirecting HTTP → HTTPS: ${req.url}`);

    return res.redirect(301, httpsUrl);
  }

  next();
}

/**
 * Setup HSTS (HTTP Strict Transport Security)
 * Forces browsers to use HTTPS for all future requests
 */
function setupHSTS(app) {
  if (!isProduction) {
    console.log('⚠️  HSTS disabled (not in production mode)');
    return;
  }

  app.use((req, res, next) => {
    // Set HSTS header
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    next();
  });

  console.log('✅ HSTS enabled (1 year max-age)');
}

/**
 * Ensure secure cookies in production
 */
function ensureSecureCookies(app) {
  if (isProduction) {
    app.use((req, res, next) => {
      const originalSetCookie = res.cookie;

      res.cookie = function(name, value, options = {}) {
        // Force secure options in production
        const secureOptions = {
          ...options,
          secure: true,
          httpOnly: true,
          sameSite: 'strict'
        };

        return originalSetCookie.call(this, name, value, secureOptions);
      };

      next();
    });

    console.log('✅ Secure cookies enforced');
  }
}

/**
 * Initialize all HTTPS security
 */
function initializeHTTPSSecurity(app) {
  console.log('\n🔒 Initializing HTTPS Security...');
  console.log(`   Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`   HTTPS Redirect: ${enableHttpsRedirect ? 'ENABLED' : 'DISABLED'}`);

  if (enableHttpsRedirect) {
    app.use(enforceHTTPS);
    console.log('✅ HTTPS redirect middleware active');
  }

  setupHSTS(app);
  ensureSecureCookies(app);

  console.log('✅ HTTPS security initialized\n');
}

module.exports = {
  enforceHTTPS,
  setupHSTS,
  ensureSecureCookies,
  initializeHTTPSSecurity
};
