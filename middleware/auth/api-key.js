/**
 * API Key Authentication Middleware
 * Validates X-API-Key header against database
 *
 * White-Hat Policy: Real API key validation, secure hashing
 */

import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * Hash API key for secure storage/comparison
 */
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * API Key authentication middleware
 * Usage: app.use(apiKeyAuth)
 */
export async function apiKeyAuth(req, res, next) {
  try {
    // Skip OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    const apiKey = req.headers['x-api-key'];

    // Check if API key is provided
    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key is required. Provide X-API-Key header.',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate API key format (should start with 'lyd_')
    if (!apiKey.startsWith('lyd_')) {
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY_FORMAT',
          message: 'Invalid API key format',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Hash the API key for database lookup
    const hashedKey = hashApiKey(apiKey);

    // Query database for API key
    const { data: keyRecord, error: dbError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', hashedKey)
      .single();

    if (dbError || !keyRecord) {
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if key is active
    if (keyRecord.status !== 'active') {
      return res.status(401).json({
        error: {
          code: 'API_KEY_INACTIVE',
          message: `API key is ${keyRecord.status}`,
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if key is expired
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return res.status(401).json({
        error: {
          code: 'API_KEY_EXPIRED',
          message: 'API key has expired',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check rate limit for this key
    const now = new Date();
    const windowStart = new Date(now.getTime() - 3600000); // 1 hour window

    const { data: usageData } = await supabase
      .from('api_key_usage')
      .select('id')
      .eq('api_key_id', keyRecord.id)
      .gte('timestamp', windowStart.toISOString());

    const requestCount = usageData?.length || 0;

    if (requestCount >= keyRecord.rate_limit_per_hour) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'API key rate limit exceeded',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
        headers: {
          'Retry-After': '3600',
          'X-RateLimit-Limit': keyRecord.rate_limit_per_hour.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.floor((now.getTime() + 3600000) / 1000).toString(),
        },
      });
    }

    // Log API key usage
    await supabase.from('api_key_usage').insert({
      api_key_id: keyRecord.id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
      timestamp: now.toISOString(),
    });

    // Attach user/organization info to request
    req.auth = {
      type: 'api_key',
      apiKeyId: keyRecord.id,
      userId: keyRecord.user_id,
      organizationId: keyRecord.organization_id,
      scopes: keyRecord.scopes || [],
      rateLimit: {
        limit: keyRecord.rate_limit_per_hour,
        remaining: keyRecord.rate_limit_per_hour - requestCount - 1,
        reset: Math.floor((now.getTime() + 3600000) / 1000),
      },
    };

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', keyRecord.rate_limit_per_hour.toString());
    res.setHeader('X-RateLimit-Remaining', (keyRecord.rate_limit_per_hour - requestCount - 1).toString());
    res.setHeader('X-RateLimit-Reset', Math.floor((now.getTime() + 3600000) / 1000).toString());

    next();
  } catch (error) {
    console.error('API Key auth error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication error',
        correlationId: nanoid(),
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Generate a new API key
 */
export function generateApiKey() {
  const randomPart = crypto.randomBytes(32).toString('base64url');
  return `lyd_${randomPart}`;
}

/**
 * Create API key in database
 */
export async function createApiKey(userId, organizationId, name, scopes = [], rateLimitPerHour = 1000) {
  const apiKey = generateApiKey();
  const hashedKey = hashApiKey(apiKey);

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      key_hash: hashedKey,
      user_id: userId,
      organization_id: organizationId,
      name,
      scopes: JSON.stringify(scopes),
      rate_limit_per_hour: rateLimitPerHour,
      status: 'active',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    keyId: data.id,
    apiKey, // Return plaintext key only once
    name: data.name,
    scopes: JSON.parse(data.scopes),
    rateLimitPerHour: data.rate_limit_per_hour,
    createdAt: data.created_at,
  };
}

export default apiKeyAuth;
