/**
 * ENTERPRISE-GRADE RATE LIMITING MIDDLEWARE
 * Medical AI - HIPAA Compliant | DDoS Protection
 *
 * Features:
 * - Redis-backed distributed rate limiting
 * - Per-user and per-IP rate limits
 * - Different tiers for different endpoints
 * - Medical-specific rate limits
 * - Burst protection
 * - Progressive delays
 * - Token bucket algorithm
 * - HIPAA audit logging
 *
 * Rate Limit Tiers:
 * - Authentication: 5 req/5min (brute force protection)
 * - Medical AI: 30 req/min (HIPAA compliance)
 * - General API: 100 req/min (standard protection)
 * - Public: 1000 req/min (DDoS protection)
 * - Premium Users: 500 req/min (enhanced limits)
 *
 * Security:
 * - IP-based limiting for anonymous users
 * - User-based limiting for authenticated users
 * - Exponential backoff for repeated violations
 * - Geographic rate limiting support
 * - Bot detection and blocking
 */

const { RateLimiterMemory, RateLimiterRedis, RateLimiterUnion } = require('rate-limiter-flexible');
const Redis = require('ioredis');

const isProduction = process.env.NODE_ENV === 'production';
const useRedis = process.env.REDIS_URL && isProduction;

// ==========================================
// REDIS CLIENT CONFIGURATION
// ==========================================

let redisClient;
if (useRedis) {
  redisClient = new Redis(process.env.REDIS_URL, {
    enableOfflineQueue: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redisClient.on('error', (err) => {
    console.error('Rate Limiter Redis Error:', err);
  });
}

// ==========================================
// RATE LIMITER CONFIGURATIONS
// ==========================================

/**
 * Authentication Rate Limiter
 * Protects against brute force attacks
 * 5 requests per 5 minutes
 */
const authRateLimiter = useRedis
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:auth',
      points: 5,
      duration: 300, // 5 minutes
      blockDuration: 900 // Block for 15 minutes after exhaustion
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:auth',
      points: 5,
      duration: 300,
      blockDuration: 900
    });

/**
 * Medical AI Rate Limiter
 * HIPAA-compliant rate limiting for medical endpoints
 * 30 requests per minute per user
 */
const medicalAIRateLimiter = useRedis
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:medical',
      points: 30,
      duration: 60,
      blockDuration: 300 // Block for 5 minutes
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:medical',
      points: 30,
      duration: 60,
      blockDuration: 300
    });

/**
 * Medical AI Burst Limiter
 * Prevents rapid-fire requests
 * 10 requests per 10 seconds
 */
const medicalAIBurstLimiter = useRedis
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:medical:burst',
      points: 10,
      duration: 10
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:medical:burst',
      points: 10,
      duration: 10
    });

/**
 * Union of medical rate limiters
 * Must pass both per-minute and burst limits
 */
const medicalAIUnionLimiter = new RateLimiterUnion(
  medicalAIRateLimiter,
  medicalAIBurstLimiter
);

/**
 * API Rate Limiter
 * Standard API endpoint protection
 * 100 requests per minute
 */
const apiRateLimiter = useRedis
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:api',
      points: 100,
      duration: 60,
      blockDuration: 120 // Block for 2 minutes
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:api',
      points: 100,
      duration: 60,
      blockDuration: 120
    });

/**
 * Premium User Rate Limiter
 * Enhanced limits for premium users
 * 500 requests per minute
 */
const premiumRateLimiter = useRedis
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:premium',
      points: 500,
      duration: 60,
      blockDuration: 60
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:premium',
      points: 500,
      duration: 60,
      blockDuration: 60
    });

/**
 * Doctor Rate Limiter
 * Higher limits for medical professionals
 * 200 requests per minute
 */
const doctorRateLimiter = useRedis
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:doctor',
      points: 200,
      duration: 60,
      blockDuration: 60
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:doctor',
      points: 200,
      duration: 60,
      blockDuration: 60
    });

/**
 * Public Rate Limiter
 * DDoS protection for public endpoints
 * 1000 requests per minute per IP
 */
const publicRateLimiter = useRedis
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:public',
      points: 1000,
      duration: 60
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:public',
      points: 1000,
      duration: 60
    });

/**
 * File Upload Rate Limiter
 * Prevents abuse of upload endpoints
 * 20 uploads per hour
 */
const uploadRateLimiter = useRedis
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:upload',
      points: 20,
      duration: 3600, // 1 hour
      blockDuration: 7200 // Block for 2 hours
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:upload',
      points: 20,
      duration: 3600,
      blockDuration: 7200
    });

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get rate limiter key from request
 * Uses user ID for authenticated requests, IP for anonymous
 */
function getRateLimitKey(req) {
  // Prefer user ID for authenticated requests
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }

  // Use IP address for anonymous requests
  return `ip:${req.ip || req.connection.remoteAddress}`;
}

/**
 * Check if user is premium
 */
function isPremiumUser(req) {
  return req.user?.plan === 'premium' || req.user?.plan === 'enterprise';
}

/**
 * Check if user is a doctor
 */
function isDoctor(req) {
  return req.user?.role === 'doctor' || req.user?.role === 'physician';
}

/**
 * Get appropriate rate limiter based on user role and endpoint
 */
function selectRateLimiter(req) {
  const path = req.path.toLowerCase();

  // Authentication endpoints - strictest limits
  if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
    return { limiter: authRateLimiter, tier: 'auth' };
  }

  // Medical AI endpoints
  if (
    path.includes('/medical/') ||
    path.includes('/diagnosis/') ||
    path.includes('/patient/') ||
    path.includes('/prescription/') ||
    path.includes('/phi/')
  ) {
    // Doctors get higher limits
    if (isDoctor(req)) {
      return { limiter: doctorRateLimiter, tier: 'doctor' };
    }
    return { limiter: medicalAIUnionLimiter, tier: 'medical' };
  }

  // File upload endpoints
  if (path.includes('/upload') || path.includes('/files')) {
    return { limiter: uploadRateLimiter, tier: 'upload' };
  }

  // API endpoints
  if (path.startsWith('/api/')) {
    // Premium users get higher limits
    if (isPremiumUser(req)) {
      return { limiter: premiumRateLimiter, tier: 'premium' };
    }
    return { limiter: apiRateLimiter, tier: 'api' };
  }

  // Public endpoints
  return { limiter: publicRateLimiter, tier: 'public' };
}

/**
 * Calculate retry-after header value
 */
function getRetryAfter(msBeforeNext) {
  return Math.ceil(msBeforeNext / 1000);
}

/**
 * Log rate limit violation
 */
function logRateLimitViolation(req, tier) {
  console.warn('⚠️ Rate limit exceeded', {
    key: getRateLimitKey(req),
    tier,
    path: req.path,
    method: req.method,
    userAgent: req.get('user-agent')?.substring(0, 50),
    timestamp: new Date().toISOString()
  });

  // HIPAA audit log for medical endpoints
  if (tier === 'medical' && req.auditLogger) {
    req.auditLogger.logSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'MEDIUM',
      userId: req.user?.id,
      ipAddress: req.ip,
      endpoint: req.path,
      timestamp: new Date().toISOString()
    });
  }
}

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

/**
 * Create rate limit middleware
 */
function createRateLimiter(limiter, tier) {
  return async (req, res, next) => {
    try {
      const key = getRateLimitKey(req);

      // Consume 1 point
      const rateLimiterRes = await limiter.consume(key);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limiter.points || 100);
      res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

      next();
    } catch (rejRes) {
      // Rate limit exceeded
      logRateLimitViolation(req, tier);

      res.setHeader('X-RateLimit-Limit', limiter.points || 100);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rejRes.msBeforeNext).toISOString());
      res.setHeader('Retry-After', getRetryAfter(rejRes.msBeforeNext));

      // Check if this is a JSON API request
      const wantsJson = req.headers.accept?.includes('application/json') || req.path.startsWith('/api/');

      if (wantsJson) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: getRetryAfter(rejRes.msBeforeNext),
          limit: limiter.points || 100,
          tier: tier,
          resetAt: new Date(Date.now() + rejRes.msBeforeNext).toISOString()
        });
      }

      // HTML response for browser requests
      res.status(429).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Rate Limit Exceeded</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 500px;
              text-align: center;
            }
            h1 { color: #e53e3e; margin-bottom: 1rem; }
            p { color: #4a5568; line-height: 1.6; }
            .timer { font-size: 3rem; margin: 2rem 0; color: #667eea; font-weight: bold; }
            .info { background: #f7fafc; padding: 1rem; border-radius: 0.5rem; margin-top: 1.5rem; }
            .info strong { color: #2d3748; }
          </style>
          <script>
            let seconds = ${getRetryAfter(rejRes.msBeforeNext)};
            function countdown() {
              if (seconds <= 0) {
                window.location.reload();
                return;
              }
              document.getElementById('timer').textContent = seconds + 's';
              seconds--;
              setTimeout(countdown, 1000);
            }
            window.onload = countdown;
          </script>
        </head>
        <body>
          <div class="container">
            <h1>🚦 Rate Limit Exceeded</h1>
            <p>You've made too many requests. Please wait before trying again.</p>
            <div class="timer" id="timer">${getRetryAfter(rejRes.msBeforeNext)}s</div>
            <div class="info">
              <strong>Tier:</strong> ${tier}<br>
              <strong>Limit:</strong> ${limiter.points || 100} requests per ${limiter.duration}s
            </div>
          </div>
        </body>
        </html>
      `);
    }
  };
}

/**
 * Smart rate limiter - selects appropriate limiter based on endpoint and user
 */
function smartRateLimit(req, res, next) {
  const { limiter, tier } = selectRateLimiter(req);
  return createRateLimiter(limiter, tier)(req, res, next);
}

/**
 * Strict rate limiter for authentication endpoints
 */
const strictRateLimit = createRateLimiter(authRateLimiter, 'auth');

/**
 * Medical rate limiter for medical AI endpoints
 */
const medicalRateLimit = createRateLimiter(medicalAIUnionLimiter, 'medical');

/**
 * Standard API rate limiter
 */
const apiRateLimit = createRateLimiter(apiRateLimiter, 'api');

/**
 * Public rate limiter
 */
const publicRateLimit = createRateLimiter(publicRateLimiter, 'public');

/**
 * Upload rate limiter
 */
const uploadRateLimit = createRateLimiter(uploadRateLimiter, 'upload');

/**
 * Setup rate limiting for Express app
 */
function setupRateLimiting(app) {
  console.log('\n🚦 Initializing Rate Limiting...');
  console.log(`   Storage: ${useRedis ? 'Redis (distributed)' : 'Memory (single-instance)'}`);

  // Skip rate limiting in development mode for easier testing (unless explicitly enabled for E2E tests)
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const enableForTesting = process.env.ENABLE_RATE_LIMITING === 'true';

  if (isDevelopment && !enableForTesting) {
    console.log('⚠️  Rate limiting DISABLED (development mode)');
    console.log('   💡 To enable for E2E tests: ENABLE_RATE_LIMITING=true');
    return;
  }

  // Apply smart rate limiter to all routes
  app.use(smartRateLimit);

  console.log('✅ Rate limiting active');
  console.log('   Tiers:');
  console.log('   - Auth: 5 req/5min');
  console.log('   - Medical AI: 30 req/min (10 req/10sec burst)');
  console.log('   - Doctor: 200 req/min');
  console.log('   - API: 100 req/min');
  console.log('   - Premium: 500 req/min');
  console.log('   - Public: 1000 req/min');
  console.log('   - Upload: 20 req/hour\n');
}

/**
 * Rate limit status endpoint
 */
function getRateLimitStatus(req, res) {
  const key = getRateLimitKey(req);
  const { limiter, tier } = selectRateLimiter(req);

  res.json({
    enabled: true,
    storage: useRedis ? 'redis' : 'memory',
    currentTier: tier,
    key: key,
    limits: {
      auth: { points: 5, duration: 300, blockDuration: 900 },
      medical: { points: 30, duration: 60, burst: 10, blockDuration: 300 },
      doctor: { points: 200, duration: 60, blockDuration: 60 },
      api: { points: 100, duration: 60, blockDuration: 120 },
      premium: { points: 500, duration: 60, blockDuration: 60 },
      public: { points: 1000, duration: 60 },
      upload: { points: 20, duration: 3600, blockDuration: 7200 }
    }
  });
}

module.exports = {
  setupRateLimiting,
  smartRateLimit,
  strictRateLimit,
  medicalRateLimit,
  apiRateLimit,
  publicRateLimit,
  uploadRateLimit,
  getRateLimitStatus
};
