/**
 * OAuth Configuration
 * Passport strategies for Google, GitHub, Apple, Microsoft
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const AppleStrategy = require('passport-apple');
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Google OAuth Strategy
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3100/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findByEmail(profile.emails[0].value);

      if (!user) {
        // Create new user
        user = await User.createUser({
          email: profile.emails[0].value,
          name: profile.displayName,
          password: null, // OAuth users don't have password
          oauth_provider: 'lydian-vision',
          oauth_id: profile.id,
          avatar: profile.photos[0]?.value,
          emailVerified: true // Google emails are verified
        });
      } else if (!user.oauth_provider) {
        // Link existing email user with Google
        await User.update(user.id, {
          oauth_provider: 'lydian-vision',
          oauth_id: profile.id,
          avatar: profile.photos[0]?.value
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

/**
 * GitHub OAuth Strategy
 */
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3100/api/auth/github/callback',
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await User.findByEmail(email);

      if (!user) {
        user = await User.createUser({
          email,
          name: profile.displayName || profile.username,
          password: null,
          oauth_provider: 'github',
          oauth_id: profile.id,
          avatar: profile.photos[0]?.value,
          emailVerified: true
        });
      } else if (!user.oauth_provider) {
        await User.update(user.id, {
          oauth_provider: 'github',
          oauth_id: profile.id,
          avatar: profile.photos[0]?.value
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

/**
 * Apple OAuth Strategy
 */
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID) {
  passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    callbackURL: process.env.APPLE_CALLBACK_URL || 'http://localhost:3100/api/auth/apple/callback',
    keyID: process.env.APPLE_KEY_ID,
    privateKeyString: process.env.APPLE_PRIVATE_KEY
  },
  async (accessToken, refreshToken, idToken, profile, done) => {
    try {
      const email = profile.email;
      let user = await User.findByEmail(email);

      if (!user) {
        user = await User.createUser({
          email,
          name: profile.name?.firstName + ' ' + profile.name?.lastName || 'Apple User',
          password: null,
          oauth_provider: 'apple',
          oauth_id: profile.sub,
          emailVerified: true
        });
      } else if (!user.oauth_provider) {
        await User.update(user.id, {
          oauth_provider: 'apple',
          oauth_id: profile.sub
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

module.exports = passport;
