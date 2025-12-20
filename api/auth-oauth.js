/**
 * 🔐 OAuth Authentication API
 * Supports: Google, Microsoft, GitHub, Apple
 */

const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// In-memory storage (replace with database in production)
const users = new Map();
const sessions = new Map();
const oauthStates = new Map();

// JWT Secret (use env variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// OAuth Configuration
const OAUTH_CONFIGS = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/auth/google/callback',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile'
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID || 'your-microsoft-client-id',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'your-microsoft-client-secret',
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5001/api/auth/microsoft/callback',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scope: 'openid email profile User.Read'
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || 'your-github-client-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret',
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5001/api/auth/github/callback',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    emailUrl: 'https://api.github.com/user/emails',
    scope: 'read:user user:email'
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || 'your-apple-client-id',
    teamId: process.env.APPLE_TEAM_ID || 'your-apple-team-id',
    keyId: process.env.APPLE_KEY_ID || 'your-apple-key-id',
    privateKey: process.env.APPLE_PRIVATE_KEY || 'your-apple-private-key',
    redirectUri: process.env.APPLE_REDIRECT_URI || 'http://localhost:5001/api/auth/apple/callback',
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    scope: 'name email'
  }
};

// Helper: Generate secure state token
function generateState() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper: Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Helper: Create or update user
function createOrUpdateUser(profile, provider) {
  const userId = `${provider}_${profile.id || profile.sub}`;

  let user = users.get(userId);

  if (!user) {
    user = {
      id: userId,
      email: profile.email,
      name: profile.name || profile.displayName || profile.login,
      avatar: profile.picture || profile.avatar_url,
      provider: provider,
      createdAt: new Date(),
      lastLogin: new Date()
    };
    users.set(userId, user);
  } else {
    user.lastLogin = new Date();
    user.name = profile.name || user.name;
    user.avatar = profile.picture || profile.avatar_url || user.avatar;
  }

  return user;
}

// ========================================
// GOOGLE OAUTH
// ========================================

async function handleGoogleAuth(req, res) {
  // 🔒 SECURITY: Check if OAuth is configured
  if (!OAUTH_CONFIGS.google.clientId || OAUTH_CONFIGS.google.clientId.includes('your-')) {
    return res.redirect('/auth.html?error=oauth_not_configured&provider=google');
  }

  const state = generateState();
  oauthStates.set(state, { provider: 'lydian-vision', timestamp: Date.now() });

  const params = new URLSearchParams({
    client_id: OAUTH_CONFIGS.google.clientId,
    redirect_uri: OAUTH_CONFIGS.google.redirectUri,
    response_type: 'code',
    scope: OAUTH_CONFIGS.google.scope,
    state: state,
    access_type: 'offline',
    prompt: 'consent'
  });

  res.redirect(`${OAUTH_CONFIGS.google.authUrl}?${params.toString()}`);
}

async function handleGoogleCallback(req, res) {
  const { code, state } = req.query;

  if (!state || !oauthStates.has(state)) {
    return res.status(400).json({ success: false, message: 'Invalid state parameter' });
  }

  oauthStates.delete(state);

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(OAUTH_CONFIGS.google.tokenUrl, {
      code,
      client_id: OAUTH_CONFIGS.google.clientId,
      client_secret: OAUTH_CONFIGS.google.clientSecret,
      redirect_uri: OAUTH_CONFIGS.google.redirectUri,
      grant_type: 'authorization_code'
    });

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(OAUTH_CONFIGS.google.userInfoUrl, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const user = createOrUpdateUser(userResponse.data, 'lydian-vision');
    const token = generateToken(user);

    // Redirect to frontend with token
    res.redirect(`/dashboard.html?token=${token}&name=${encodeURIComponent(user.name)}`);
  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    res.redirect('/auth.html?error=google_auth_failed');
  }
}

// ========================================
// MICROSOFT OAUTH
// ========================================

async function handleMicrosoftAuth(req, res) {
  // 🔒 SECURITY: Check if OAuth is configured
  if (!OAUTH_CONFIGS.microsoft.clientId || OAUTH_CONFIGS.microsoft.clientId.includes('your-')) {
    return res.redirect('/auth.html?error=oauth_not_configured&provider=microsoft');
  }

  const state = generateState();
  oauthStates.set(state, { provider: 'microsoft', timestamp: Date.now() });

  const params = new URLSearchParams({
    client_id: OAUTH_CONFIGS.microsoft.clientId,
    redirect_uri: OAUTH_CONFIGS.microsoft.redirectUri,
    response_type: 'code',
    scope: OAUTH_CONFIGS.microsoft.scope,
    state: state,
    response_mode: 'query'
  });

  res.redirect(`${OAUTH_CONFIGS.microsoft.authUrl}?${params.toString()}`);
}

async function handleMicrosoftCallback(req, res) {
  const { code, state } = req.query;

  if (!state || !oauthStates.has(state)) {
    return res.status(400).json({ success: false, message: 'Invalid state parameter' });
  }

  oauthStates.delete(state);

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      OAUTH_CONFIGS.microsoft.tokenUrl,
      new URLSearchParams({
        code,
        client_id: OAUTH_CONFIGS.microsoft.clientId,
        client_secret: OAUTH_CONFIGS.microsoft.clientSecret,
        redirect_uri: OAUTH_CONFIGS.microsoft.redirectUri,
        grant_type: 'authorization_code'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(OAUTH_CONFIGS.microsoft.userInfoUrl, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const profile = {
      id: userResponse.data.id,
      email: userResponse.data.mail || userResponse.data.userPrincipalName,
      name: userResponse.data.displayName,
      picture: null
    };

    const user = createOrUpdateUser(profile, 'microsoft');
    const token = generateToken(user);

    res.redirect(`/dashboard.html?token=${token}&name=${encodeURIComponent(user.name)}`);
  } catch (error) {
    console.error('Microsoft OAuth error:', error.response?.data || error.message);
    res.redirect('/auth.html?error=microsoft_auth_failed');
  }
}

// ========================================
// GITHUB OAUTH
// ========================================

async function handleGithubAuth(req, res) {
  // 🔒 SECURITY: Check if OAuth is configured
  if (!OAUTH_CONFIGS.github.clientId || OAUTH_CONFIGS.github.clientId.includes('your-')) {
    return res.redirect('/auth.html?error=oauth_not_configured&provider=github');
  }

  const state = generateState();
  oauthStates.set(state, { provider: 'github', timestamp: Date.now() });

  const params = new URLSearchParams({
    client_id: OAUTH_CONFIGS.github.clientId,
    redirect_uri: OAUTH_CONFIGS.github.redirectUri,
    scope: OAUTH_CONFIGS.github.scope,
    state: state,
    allow_signup: 'true'
  });

  res.redirect(`${OAUTH_CONFIGS.github.authUrl}?${params.toString()}`);
}

async function handleGithubCallback(req, res) {
  const { code, state } = req.query;

  if (!state || !oauthStates.has(state)) {
    return res.status(400).json({ success: false, message: 'Invalid state parameter' });
  }

  oauthStates.delete(state);

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      OAUTH_CONFIGS.github.tokenUrl,
      {
        code,
        client_id: OAUTH_CONFIGS.github.clientId,
        client_secret: OAUTH_CONFIGS.github.clientSecret,
        redirect_uri: OAUTH_CONFIGS.github.redirectUri
      },
      {
        headers: { Accept: 'application/json' }
      }
    );

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(OAUTH_CONFIGS.github.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json'
      }
    });

    // Get email (GitHub may not return it in profile)
    let email = userResponse.data.email;
    if (!email) {
      const emailResponse = await axios.get(OAUTH_CONFIGS.github.emailUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/json'
        }
      });
      const primaryEmail = emailResponse.data.find(e => e.primary);
      email = primaryEmail ? primaryEmail.email : emailResponse.data[0]?.email;
    }

    const profile = {
      id: userResponse.data.id,
      email: email,
      name: userResponse.data.name || userResponse.data.login,
      login: userResponse.data.login,
      avatar_url: userResponse.data.avatar_url
    };

    const user = createOrUpdateUser(profile, 'github');
    const token = generateToken(user);

    res.redirect(`/dashboard.html?token=${token}&name=${encodeURIComponent(user.name)}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error.response?.data || error.message);
    res.redirect('/auth.html?error=github_auth_failed');
  }
}

// ========================================
// APPLE OAUTH (Sign in with Apple)
// ========================================

async function handleAppleAuth(req, res) {
  // 🔒 SECURITY: Check if OAuth is configured
  if (!OAUTH_CONFIGS.apple.clientId || OAUTH_CONFIGS.apple.clientId.includes('your-')) {
    return res.redirect('/auth.html?error=oauth_not_configured&provider=apple');
  }

  const state = generateState();
  oauthStates.set(state, { provider: 'apple', timestamp: Date.now() });

  const params = new URLSearchParams({
    client_id: OAUTH_CONFIGS.apple.clientId,
    redirect_uri: OAUTH_CONFIGS.apple.redirectUri,
    response_type: 'code id_token',
    response_mode: 'form_post',
    scope: OAUTH_CONFIGS.apple.scope,
    state: state
  });

  res.redirect(`${OAUTH_CONFIGS.apple.authUrl}?${params.toString()}`);
}

async function handleAppleCallback(req, res) {
  const { code, state, id_token, user } = req.body;

  if (!state || !oauthStates.has(state)) {
    return res.status(400).json({ success: false, message: 'Invalid state parameter' });
  }

  oauthStates.delete(state);

  try {
    // Decode ID token to get user info
    const decodedToken = jwt.decode(id_token);

    let profile = {
      id: decodedToken.sub,
      email: decodedToken.email,
      name: decodedToken.email // Apple doesn't always provide name
    };

    // If user data is provided (first time only)
    if (user) {
      const userData = JSON.parse(user);
      profile.name = `${userData.name.firstName} ${userData.name.lastName}`;
    }

    const createdUser = createOrUpdateUser(profile, 'apple');
    const token = generateToken(createdUser);

    res.redirect(`/dashboard.html?token=${token}&name=${encodeURIComponent(createdUser.name)}`);
  } catch (error) {
    console.error('Apple OAuth error:', error.message);
    res.redirect('/auth.html?error=apple_auth_failed');
  }
}

// ========================================
// UTILITY ENDPOINTS
// ========================================

async function handleCheckEmail(req, res) {
  const { email } = req.body;

  // Check if user exists with this email
  const existingUser = Array.from(users.values()).find(u => u.email === email);

  res.json({
    success: true,
    exists: !!existingUser,
    provider: existingUser?.provider
  });
}

async function handleLogout(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    sessions.delete(token);
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}

async function handleVerifyToken(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          provider: user.provider
        }
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Google
  handleGoogleAuth,
  handleGoogleCallback,

  // Microsoft
  handleMicrosoftAuth,
  handleMicrosoftCallback,

  // GitHub
  handleGithubAuth,
  handleGithubCallback,

  // Apple
  handleAppleAuth,
  handleAppleCallback,

  // Utilities
  handleCheckEmail,
  handleLogout,
  handleVerifyToken
};
