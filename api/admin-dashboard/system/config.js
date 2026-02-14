/**
 * AILYDIAN Admin Dashboard - System Configuration API
 *
 * GET /api/admin-dashboard/system/config
 *
 * Read-only system configuration endpoint.
 * Returns non-sensitive config values:
 *   - Configured CORS origins
 *   - Available AI models (names only, no keys)
 *   - Feature flags
 *   - Rate limit settings
 *   - Service connectivity status (boolean only)
 *   - Platform version and security info
 *
 * NEVER exposes API keys, secrets, or tokens.
 * Only super_admin can access.
 *
 * Protected by triple-layer admin authentication middleware.
 */

const { withAdminAuth } = require('../_middleware');
const { applySanitization } = require('../../_middleware/sanitize');

// ---------------------------------------------------------------------------
// Upstash Redis REST helper (for feature flags stored in Redis)
// ---------------------------------------------------------------------------

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command, ...args) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;

  try {
    const response = await fetch(`${UPSTASH_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([command, ...args]),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  } catch (err) {
    console.error('[SYSTEM_CONFIG_REDIS]', err.message);
    return null;
  }
}

function arrayToObject(arr) {
  if (!arr || arr.length === 0) return null;
  const obj = {};
  for (let i = 0; i < arr.length; i += 2) {
    obj[arr[i]] = arr[i + 1];
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Static configuration (non-sensitive)
// ---------------------------------------------------------------------------

const PLATFORM_VERSION = '2.4.0';

const CORS_ORIGINS = [
  'https://ailydian.com',
  'https://www.ailydian.com',
  'https://ailydian-ultra-pro.vercel.app',
  'https://seo.ailydian.com',
  'https://dashboard.ailydian.com',
];

const AVAILABLE_AI_MODELS = [
  { name: 'LyDian Primary Engine', code: 'OX7A3F8D', category: 'lydian-labs', active: true },
  { name: 'LyDian Fast Engine', code: 'OX7A3F8D-mini', category: 'lydian-labs', active: true },
  { name: 'LyDian Turbo Engine', code: 'OX5C9E2B', category: 'lydian-labs', active: true },
  { name: 'LyDian Reasoning Engine', code: 'OX1E9R4P', category: 'lydian-labs', active: true },
  { name: 'LyDian Advanced Engine', code: 'AX9F7E2B', category: 'lydian-advanced', active: true },
  { name: 'LyDian Vision Engine', code: 'VX2F8A0E', category: 'lydian-vision', active: true },
  { name: 'LyDian Velocity Engine', code: 'GX8E2D9A', category: 'lydian-velocity', active: true },
  { name: 'LyDian Code Engine', code: 'ZX4B1C7D', category: 'lydian-code', active: true },
];

const RATE_LIMITS = {
  adminApi: {
    windowMs: 60000,
    maxRequests: 30,
    description: 'Admin API - dakikada 30 istek',
  },
  chatApi: {
    windowMs: 60000,
    maxRequests: 20,
    description: 'Chat API - dakikada 20 istek',
  },
  authApi: {
    windowMs: 900000,
    maxRequests: 10,
    description: 'Auth API - 15 dakikada 10 istek',
  },
  guestQueries: {
    maxPerDay: 10,
    description: 'Misafir sorgu limiti - gunde 10',
  },
};

const DEFAULT_FEATURE_FLAGS = {
  webSearch: true,
  voiceChat: true,
  codeWrite: true,
  imageGeneration: true,
  pushNotifications: true,
  analytics: true,
  chatExport: true,
  googleOAuth: true,
  phoneAuth: true,
  twoFactorAuth: true,
  guestMode: true,
};

// ---------------------------------------------------------------------------
// Detect which services are configured (without exposing keys)
// ---------------------------------------------------------------------------

function getServiceStatus() {
  return {
    upstashRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    sendGrid: !!process.env.SENDGRID_API_KEY,
    twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    googleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    azureSpeech: !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION),
    zaiCoding: !!process.env.ZAI_CODING_API_KEY,
    dashboardAuth: !!(process.env.DASHBOARD_ADMIN_API_KEY && process.env.DASHBOARD_JWT_SECRET),
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = withAdminAuth(async (req, res) => {
  // Apply response sanitization (strips AI model names from all responses)
  applySanitization(req, res);

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Yalnizca GET istegi desteklenir',
    });
  }

  // Only super_admin can access system config
  if (!req.adminUser || req.adminUser.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Sistem yapilandirmasina erisim icin super_admin yetkisi gereklidir',
    });
  }

  try {
    // Try to load feature flags from Redis (if stored there)
    let featureFlags = { ...DEFAULT_FEATURE_FLAGS };

    if (UPSTASH_URL && UPSTASH_TOKEN) {
      const storedFlags = await redis('HGETALL', 'system:feature_flags');
      const flagsObj = arrayToObject(storedFlags);

      if (flagsObj) {
        for (const [key, value] of Object.entries(flagsObj)) {
          featureFlags[key] = value === 'true';
        }
      }
    }

    // Service connectivity status (boolean only, no keys)
    const serviceStatus = getServiceStatus();

    // Redis info (non-sensitive)
    let redisInfo = null;
    if (UPSTASH_URL && UPSTASH_TOKEN) {
      try {
        const dbSize = await redis('DBSIZE');
        redisInfo = {
          connected: true,
          totalKeys: dbSize || 0,
        };
      } catch (_redisErr) {
        redisInfo = {
          connected: false,
          totalKeys: 0,
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        platform: {
          name: 'AILYDIAN',
          version: PLATFORM_VERSION,
          provider: 'LyDian AI',
          environment: process.env.NODE_ENV || 'production',
          region: process.env.VERCEL_REGION || 'unknown',
        },
        cors: {
          allowedOrigins: CORS_ORIGINS,
        },
        aiModels: AVAILABLE_AI_MODELS,
        rateLimits: RATE_LIMITS,
        featureFlags,
        services: serviceStatus,
        database: redisInfo,
        security: {
          adminAuthLayers: 3,
          jwtAlgorithm: 'HS256',
          signatureDriftSeconds: 300,
          sessionMaxAge: '7 gun',
          auditRetentionDays: 90,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[ADMIN_SYSTEM_CONFIG]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Sistem yapilandirmasi alinamadi',
    });
  }
});
