/**
 * OAuth2 Authentication Middleware
 * Validates Bearer tokens (JWT)
 *
 * White-Hat Policy: Secure JWT validation with proper expiry checks
 */

import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// JWT_SECRET is validated by middleware/security.js - no fallback allowed
if (!process.env.JWT_SECRET) {
  throw new Error('🚨 CRITICAL: JWT_SECRET must be set in environment variables!');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'https://auth.lydian.com';

/**
 * OAuth2 Bearer token authentication middleware
 * Usage: app.use(oauth2Auth)
 */
export async function oauth2Auth(req, res, next) {
  try {
    // Skip OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    const authHeader = req.headers['authorization'];

    // Check if Authorization header is provided
    if (!authHeader) {
      return res.status(401).json({
        error: {
          code: 'MISSING_AUTHORIZATION',
          message: 'Authorization header is required',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'INVALID_AUTHORIZATION_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        algorithms: ['HS256'],
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired',
            correlationId: nanoid(),
            timestamp: new Date().toISOString(),
          },
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid access token',
            correlationId: nanoid(),
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        throw err;
      }
    }

    // Check if token is in blacklist (revoked)
    const { data: blacklisted } = await supabase
      .from('token_blacklist')
      .select('id')
      .eq('token_jti', decoded.jti)
      .single();

    if (blacklisted) {
      return res.status(401).json({
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Access token has been revoked',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Fetch user info from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.sub)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        error: {
          code: 'USER_INACTIVE',
          message: `User account is ${user.status}`,
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Attach user info to request
    req.auth = {
      type: 'oauth2',
      userId: user.id,
      email: user.email,
      organizationId: user.organization_id,
      scopes: decoded.scope ? decoded.scope.split(' ') : [],
      tokenId: decoded.jti,
      issuedAt: decoded.iat,
      expiresAt: decoded.exp,
    };

    // Attach user object for convenience
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organization_id,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    console.error('OAuth2 auth error:', error);
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
 * Generate JWT access token
 */
export function generateAccessToken(userId, email, scopes = [], organizationId = null) {
  const payload = {
    sub: userId,
    email,
    scope: scopes.join(' '),
    org_id: organizationId,
    jti: nanoid(),
  };

  return jwt.sign(payload, JWT_SECRET, {
    issuer: JWT_ISSUER,
    expiresIn: '1h', // 1 hour
    algorithm: 'HS256',
  });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(userId) {
  const payload = {
    sub: userId,
    type: 'refresh',
    jti: nanoid(),
  };

  return jwt.sign(payload, JWT_SECRET, {
    issuer: JWT_ISSUER,
    expiresIn: '30d', // 30 days
    algorithm: 'HS256',
  });
}

/**
 * Revoke token (add to blacklist)
 */
export async function revokeToken(tokenJti, reason = 'user_requested') {
  const { data, error } = await supabase
    .from('token_blacklist')
    .insert({
      token_jti: tokenJti,
      reason,
      revoked_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Require specific scopes middleware
 */
export function requireScopes(...requiredScopes) {
  return (req, res, next) => {
    if (!req.auth || !req.auth.scopes) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const hasAllScopes = requiredScopes.every(scope => req.auth.scopes.includes(scope));

    if (!hasAllScopes) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_SCOPES',
          message: `Required scopes: ${requiredScopes.join(', ')}`,
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  };
}

export default oauth2Auth;
