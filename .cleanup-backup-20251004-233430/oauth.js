/**
 * OAuth Routes
 * Handles Google, GitHub, Apple, Microsoft authentication
 */

const express = require('express');
const session = require('express-session');
const router = express.Router();
const passport = require('../../backend/config/oauth');
const jwt = require('jsonwebtoken');

// Setup express-session middleware
router.use(session({
  secret: process.env.SESSION_SECRET || 'ailydian-oauth-session-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
router.use(passport.initialize());
router.use(passport.session());

/**
 * Google OAuth Routes
 */
router.get('/google',
  passport.authenticate('lydian-vision', {
    scope: ['profile', 'email']
  })
);

router.get('/google/callback',
  passport.authenticate('lydian-vision', { failureRedirect: '/auth.html?error=google_failed' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Redirect to dashboard with token
    res.redirect(`/dashboard.html?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

/**
 * GitHub OAuth Routes
 */
router.get('/github',
  passport.authenticate('github', {
    scope: ['user:email']
  })
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth.html?error=github_failed' }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.redirect(`/dashboard.html?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

/**
 * Apple OAuth Routes
 */
router.get('/apple',
  passport.authenticate('apple')
);

router.post('/apple/callback',
  passport.authenticate('apple', { failureRedirect: '/auth.html?error=apple_failed' }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.redirect(`/dashboard.html?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

/**
 * Microsoft OAuth Routes
 * Note: Microsoft OAuth requires additional setup with Azure AD
 */
router.get('/microsoft', (req, res) => {
  // Redirect to Microsoft OAuth consent screen
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3100/api/auth/microsoft/callback');
  const scope = encodeURIComponent('openid profile email');

  if (!clientId) {
    return res.redirect('/auth.html?error=microsoft_not_configured');
  }

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
  res.redirect(authUrl);
});

router.get('/microsoft/callback', async (req, res) => {
  // Handle Microsoft OAuth callback
  // This is a placeholder - full implementation requires Azure AD SDK
  res.redirect('/auth.html?error=microsoft_in_development');
});

module.exports = router;
