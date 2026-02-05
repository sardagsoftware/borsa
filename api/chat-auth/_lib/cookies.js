/**
 * Chat Auth Cookie Utilities
 * Secure httpOnly cookie management for chat authentication
 */

// Cookie names (different from main auth to avoid conflicts)
const CHAT_ACCESS_COOKIE = 'chatAccessToken';
const CHAT_REFRESH_COOKIE = 'chatRefreshToken';

// Cookie options
const isProduction = process.env.NODE_ENV === 'production';

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/'
};

/**
 * Set auth cookies
 */
function setAuthCookies(res, accessToken, refreshToken) {
  // Access token - 30 minutes
  const accessCookie = `${CHAT_ACCESS_COOKIE}=${accessToken}; ${formatOptions({
    ...BASE_COOKIE_OPTIONS,
    maxAge: 30 * 60 // 30 minutes in seconds
  })}`;

  // Refresh token - 30 days
  const refreshCookie = `${CHAT_REFRESH_COOKIE}=${refreshToken}; ${formatOptions({
    ...BASE_COOKIE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
  })}`;

  // Set both cookies
  const existingCookies = res.getHeader('Set-Cookie') || [];
  const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies];

  res.setHeader('Set-Cookie', [...cookies.filter(Boolean), accessCookie, refreshCookie]);
}

/**
 * Clear auth cookies
 */
function clearAuthCookies(res) {
  // Set expired cookies to clear them
  const accessCookie = `${CHAT_ACCESS_COOKIE}=; ${formatOptions({
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0).toUTCString()
  })}`;

  const refreshCookie = `${CHAT_REFRESH_COOKIE}=; ${formatOptions({
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0).toUTCString()
  })}`;

  const existingCookies = res.getHeader('Set-Cookie') || [];
  const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies];

  res.setHeader('Set-Cookie', [...cookies.filter(Boolean), accessCookie, refreshCookie]);
}

/**
 * Update access token cookie only
 */
function updateAccessCookie(res, accessToken) {
  const accessCookie = `${CHAT_ACCESS_COOKIE}=${accessToken}; ${formatOptions({
    ...BASE_COOKIE_OPTIONS,
    maxAge: 30 * 60 // 30 minutes in seconds
  })}`;

  const existingCookies = res.getHeader('Set-Cookie') || [];
  const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies];

  res.setHeader('Set-Cookie', [...cookies.filter(Boolean), accessCookie]);
}

/**
 * Parse cookies from request
 */
function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  });

  return cookies;
}

/**
 * Get specific cookie value
 */
function getCookie(req, name) {
  const cookies = parseCookies(req);
  return cookies[name] || null;
}

/**
 * Format cookie options to string
 */
function formatOptions(options) {
  const parts = [];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.expires) {
    parts.push(`Expires=${options.expires}`);
  }
  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }
  if (options.path) {
    parts.push(`Path=${options.path}`);
  }
  if (options.secure) {
    parts.push('Secure');
  }
  if (options.httpOnly) {
    parts.push('HttpOnly');
  }
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)}`);
  }

  return parts.join('; ');
}

/**
 * Middleware to parse cookies and attach to request
 */
function cookieParser(req, res, next) {
  req.cookies = parseCookies(req);
  next();
}

module.exports = {
  CHAT_ACCESS_COOKIE,
  CHAT_REFRESH_COOKIE,
  setAuthCookies,
  clearAuthCookies,
  updateAccessCookie,
  parseCookies,
  getCookie,
  cookieParser
};
