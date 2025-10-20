/**
 * 🛡️ Demo Route Guard Middleware
 * Blocks demo/test routes in production environment
 *
 * @module middleware/demo-route-guard
 * @white-hat Compliant - Security best practice
 */

/**
 * Demo routes that should be blocked in production
 */
const DEMO_ROUTES = [
  // Test pages
  '/test-auto-translate.html',
  '/test-chat-api.html',
  '/test-i18n-demo.html',
  '/test-language-system.html',
  '/test-legal.html',
  '/test-translation.html',

  // Demo pages
  '/cyborg-demo.html',
  '/hero-cinematic-demo.html',
  '/realistic-characters-demo.html',

  // Old/backup pages
  '/dashboard-old.html',
  '/index-new.html',

  // Development pages
  '/cache-dashboard.html',
  '/email-dashboard.html',
  '/performance-dashboard.html',
  '/security-analytics.html',
  '/seo-monitoring.html',
];

/**
 * Test route patterns (regex)
 */
const TEST_ROUTE_PATTERNS = [
  /^\/test-.+\.html$/,              // All test-*.html files
  /^\/demo-.+\.html$/,              // All demo-*.html files
  /^\/.*-demo\.html$/,              // All *-demo.html files
  /^\/.*-test\.html$/,              // All *-test.html files
  /^\/.*-backup.*\.html$/,          // All *-backup*.html files
  /^\/.*-old\.html$/,               // All *-old.html files
];

/**
 * Check if route is a demo/test route
 */
function isDemoRoute(pathname) {
  // Direct match
  if (DEMO_ROUTES.includes(pathname)) {
    return true;
  }

  // Pattern match
  return TEST_ROUTE_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Check if environment is production
 */
function isProduction() {
  const env = process.env.NODE_ENV || 'development';
  const vercelEnv = process.env.VERCEL_ENV;

  // Vercel production check
  if (vercelEnv === 'production') {
    return true;
  }

  // NODE_ENV check
  if (env === 'production') {
    return true;
  }

  // Custom AILYDIAN_ENV check
  if (process.env.AILYDIAN_ENV === 'production') {
    return true;
  }

  return false;
}

/**
 * Check if demo mode is explicitly enabled
 */
function isDemoModeEnabled() {
  return process.env.ENABLE_DEMO_ROUTES === 'true';
}

/**
 * Demo Route Guard Middleware
 */
function demoRouteGuard(req, res, next) {
  const pathname = req.path;

  // Skip if not a demo route
  if (!isDemoRoute(pathname)) {
    return next();
  }

  // Allow in development
  if (!isProduction()) {
    console.log(`[Demo Guard] Allowing demo route in development: ${pathname}`);
    return next();
  }

  // Allow if demo mode explicitly enabled (override)
  if (isDemoModeEnabled()) {
    console.log(`[Demo Guard] Allowing demo route (ENABLE_DEMO_ROUTES=true): ${pathname}`);
    return next();
  }

  // Block in production
  console.warn(`[Demo Guard] Blocking demo route in production: ${pathname}`);

  // Return 404
  res.status(404).json({
    error: 'Not Found',
    message: 'This demo/test page is not available in production.',
    code: 'DEMO_ROUTE_BLOCKED',
    pathname,
    environment: process.env.NODE_ENV || 'production',
  });
}

/**
 * Get all demo routes (for documentation)
 */
function getAllDemoRoutes() {
  return [...DEMO_ROUTES];
}

/**
 * Get demo route patterns (for documentation)
 */
function getDemoRoutePatterns() {
  return TEST_ROUTE_PATTERNS.map(pattern => pattern.source);
}

module.exports = {
  demoRouteGuard,
  isDemoRoute,
  isProduction,
  isDemoModeEnabled,
  getAllDemoRoutes,
  getDemoRoutePatterns,
  DEMO_ROUTES,
  TEST_ROUTE_PATTERNS,
};

console.log('✅ Demo route guard middleware initialized');
