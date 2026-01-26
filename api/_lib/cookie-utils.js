/**
 * 🔒 SECURE COOKIE UTILITIES
 * httpOnly cookies for JWT token storage
 * Protection against XSS attacks
 */

/**
 * Set httpOnly cookie with security flags
 * @param {Object} res - Response object
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Cookie options
 */
function setSecureCookie(res, name, value, options = {}) {
  const defaultOptions = {
    httpOnly: true, // Cannot be accessed by JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    path: '/',
    maxAge: options.maxAge || 900000, // 15 minutes default
  };

  const cookieOptions = { ...defaultOptions, ...options };

  const cookieParts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${cookieOptions.path}`,
    `Max-Age=${cookieOptions.maxAge}`,
    `SameSite=${cookieOptions.sameSite}`,
  ];

  if (cookieOptions.httpOnly) {
    cookieParts.push('HttpOnly');
  }

  if (cookieOptions.secure) {
    cookieParts.push('Secure');
  }

  if (cookieOptions.domain) {
    cookieParts.push(`Domain=${cookieOptions.domain}`);
  }

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

/**
 * Set multiple cookies at once
 * @param {Object} res - Response object
 * @param {Array} cookies - Array of cookie objects
 */
function setMultipleCookies(res, cookies) {
  const cookieStrings = cookies.map(({ name, value, options }) => {
    const defaultOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: options?.maxAge || 900000,
    };

    const cookieOptions = { ...defaultOptions, ...options };

    const cookieParts = [
      `${name}=${encodeURIComponent(value)}`,
      `Path=${cookieOptions.path}`,
      `Max-Age=${cookieOptions.maxAge}`,
      `SameSite=${cookieOptions.sameSite}`,
    ];

    if (cookieOptions.httpOnly) {
      cookieParts.push('HttpOnly');
    }

    if (cookieOptions.secure) {
      cookieParts.push('Secure');
    }

    if (cookieOptions.domain) {
      cookieParts.push(`Domain=${cookieOptions.domain}`);
    }

    return cookieParts.join('; ');
  });

  res.setHeader('Set-Cookie', cookieStrings);
}

/**
 * Get cookie value from request
 * @param {Object} req - Request object
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null
 */
function getCookie(req, name) {
  const cookies = parseCookies(req);
  return cookies[name] || null;
}

/**
 * Parse all cookies from request
 * @param {Object} req - Request object
 * @returns {Object} Cookies object
 */
function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};

  if (!cookieHeader) {
    return cookies;
  }

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    const value = rest.join('=').trim();
    if (name && value) {
      cookies[name.trim()] = decodeURIComponent(value);
    }
  });

  return cookies;
}

/**
 * Delete cookie by setting expiry to past
 * @param {Object} res - Response object
 * @param {string} name - Cookie name
 * @param {Object} options - Cookie options
 */
function deleteCookie(res, name, options = {}) {
  const defaultOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // Expire immediately
  };

  const cookieOptions = { ...defaultOptions, ...options };

  const cookieParts = [
    `${name}=`,
    `Path=${cookieOptions.path}`,
    'Max-Age=0',
    `SameSite=${cookieOptions.sameSite}`,
  ];

  if (cookieOptions.httpOnly) {
    cookieParts.push('HttpOnly');
  }

  if (cookieOptions.secure) {
    cookieParts.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

/**
 * Delete multiple cookies at once
 * @param {Object} res - Response object
 * @param {Array} names - Array of cookie names
 */
function deleteMultipleCookies(res, names) {
  const cookieStrings = names.map(name => {
    return [
      `${name}=`,
      'Path=/',
      'Max-Age=0',
      'SameSite=strict',
      'HttpOnly',
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ');
  });

  res.setHeader('Set-Cookie', cookieStrings);
}

/**
 * Set authentication tokens as httpOnly cookies
 * @param {Object} res - Response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
function setAuthTokens(res, accessToken, refreshToken) {
  setMultipleCookies(res, [
    {
      name: 'accessToken',
      value: accessToken,
      options: {
        maxAge: 900000, // 15 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      },
    },
    {
      name: 'refreshToken',
      value: refreshToken,
      options: {
        maxAge: 604800000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      },
    },
  ]);
}

/**
 * Clear authentication tokens
 * @param {Object} res - Response object
 */
function clearAuthTokens(res) {
  deleteMultipleCookies(res, ['accessToken', 'refreshToken']);
}

/**
 * Get access token from request
 * @param {Object} req - Request object
 * @returns {string|null} Access token or null
 */
function getAccessToken(req) {
  return getCookie(req, 'accessToken');
}

/**
 * Get refresh token from request
 * @param {Object} req - Request object
 * @returns {string|null} Refresh token or null
 */
function getRefreshToken(req) {
  return getCookie(req, 'refreshToken');
}

module.exports = {
  setSecureCookie,
  setMultipleCookies,
  getCookie,
  parseCookies,
  deleteCookie,
  deleteMultipleCookies,
  setAuthTokens,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
};
