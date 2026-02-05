/**
 * Chat Auth JWT Utilities
 * Separate JWT secrets from main auth system
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Chat-specific JWT secrets (independent from main auth)
const CHAT_JWT_SECRET = process.env.CHAT_JWT_SECRET || crypto.randomBytes(64).toString('hex');
const CHAT_JWT_REFRESH_SECRET = process.env.CHAT_JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');

// Token expiration times
const ACCESS_TOKEN_EXPIRY = process.env.CHAT_JWT_EXPIRATION || '30m';
const REFRESH_TOKEN_EXPIRY = process.env.CHAT_JWT_REFRESH_EXPIRATION || '30d';

/**
 * Generate access token
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      displayName: user.display_name || user.displayName,
      type: 'chat_access'
    },
    CHAT_JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'ailydian-chat',
      audience: 'ailydian-chat-api'
    }
  );
}

/**
 * Generate refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: 'chat_refresh'
    },
    CHAT_JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'ailydian-chat',
      audience: 'ailydian-chat-api'
    }
  );
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, CHAT_JWT_SECRET, {
      issuer: 'ailydian-chat',
      audience: 'ailydian-chat-api'
    });

    if (decoded.type !== 'chat_access') {
      throw new Error('Invalid token type');
    }

    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, CHAT_JWT_REFRESH_SECRET, {
      issuer: 'ailydian-chat',
      audience: 'ailydian-chat-api'
    });

    if (decoded.type !== 'chat_refresh') {
      throw new Error('Invalid token type');
    }

    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Extract token from request
 * Priority: httpOnly cookie > Authorization header
 */
function extractToken(req) {
  // Check httpOnly cookie first (secure)
  if (req.cookies?.chatAccessToken) {
    return req.cookies.chatAccessToken;
  }

  // Check Authorization header (for API clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

/**
 * Extract refresh token from request
 */
function extractRefreshToken(req) {
  if (req.cookies?.chatRefreshToken) {
    return req.cookies.chatRefreshToken;
  }

  // Also check body for refresh endpoint
  if (req.body?.refreshToken) {
    return req.body.refreshToken;
  }

  return null;
}

/**
 * Get refresh token expiry date
 */
function getRefreshTokenExpiry() {
  const match = REFRESH_TOKEN_EXPIRY.match(/^(\d+)([dhms])$/);
  if (!match) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
  }

  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return new Date(Date.now() + value * multipliers[unit]);
}

/**
 * Authentication middleware for chat auth
 */
function authenticateChatUser(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const result = verifyAccessToken(token);

  if (!result.valid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }

  // Attach user info to request
  req.chatUser = result.payload;
  next();
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
function optionalChatAuth(req, res, next) {
  const token = extractToken(req);

  if (token) {
    const result = verifyAccessToken(token);
    if (result.valid) {
      req.chatUser = result.payload;
    }
  }

  next();
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractToken,
  extractRefreshToken,
  getRefreshTokenExpiry,
  authenticateChatUser,
  optionalChatAuth
};
