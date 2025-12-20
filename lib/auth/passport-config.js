// ============================================
// 🔐 PASSPORT.JS AUTHENTICATION CONFIGURATION
// Google, GitHub, Apple OAuth Integration
// ============================================

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

// Import Prisma client (will be available once database is setup)
let prisma;
try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
} catch (error) {
    console.warn('⚠️ Prisma client not available yet. Database setup pending.');
    prisma = null;
}

// ============================================
// 🔧 PASSPORT CONFIGURATION
// ============================================

/**
 * Serialize user for session
 */
passport.serializeUser((user, done) => {
    done(null, user.id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id, done) => {
    if (!prisma) {
        return done(new Error('Database not configured'), null);
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: id }
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// ============================================
// 🔵 GOOGLE OAUTH STRATEGY
// ============================================

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://www.ailydian.com/api/auth/google/callback',
        scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            if (!prisma) {
                // Temporary user object when database is not ready
                return done(null, {
                    id: profile.id,
                    email: profile.emails[0].value,
                    name: profile.displayName,
                    avatarUrl: profile.photos[0]?.value,
                    provider: 'lydian-vision',
                    temporary: true
                });
            }

            // Find or create user in database
            let user = await prisma.user.findUnique({
                where: { email: profile.emails[0].value }
            });

            if (!user) {
                // Create new user
                user = await prisma.user.create({
                    data: {
                        email: profile.emails[0].value,
                        name: profile.displayName,
                        avatarUrl: profile.photos[0]?.value
                    }
                });

                console.log('✅ New user created via Google OAuth:', user.email);
            } else {
                // Update user info
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        name: profile.displayName,
                        avatarUrl: profile.photos[0]?.value,
                        updatedAt: new Date()
                    }
                });

                console.log('✅ Existing user logged in via Google:', user.email);
            }

            return done(null, user);
        } catch (error) {
            console.error('❌ Google OAuth error:', error);
            return done(error, null);
        }
    }));

    console.log('✅ Google OAuth strategy configured');
} else {
    console.warn('⚠️ Google OAuth not configured (missing credentials)');
}

// ============================================
// 🐙 GITHUB OAUTH STRATEGY
// ============================================

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'https://www.ailydian.com/api/auth/github/callback',
        scope: ['user:email']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            if (!prisma) {
                // Temporary user object when database is not ready
                return done(null, {
                    id: profile.id,
                    email: profile.emails?.[0]?.value || `${profile.username}@github.local`,
                    name: profile.displayName || profile.username,
                    avatarUrl: profile.photos?.[0]?.value,
                    provider: 'github',
                    temporary: true
                });
            }

            const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;

            // Find or create user in database
            let user = await prisma.user.findUnique({
                where: { email: email }
            });

            if (!user) {
                // Create new user
                user = await prisma.user.create({
                    data: {
                        email: email,
                        name: profile.displayName || profile.username,
                        avatarUrl: profile.photos?.[0]?.value
                    }
                });

                console.log('✅ New user created via GitHub OAuth:', user.email);
            } else {
                // Update user info
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        name: profile.displayName || profile.username,
                        avatarUrl: profile.photos?.[0]?.value,
                        updatedAt: new Date()
                    }
                });

                console.log('✅ Existing user logged in via GitHub:', user.email);
            }

            return done(null, user);
        } catch (error) {
            console.error('❌ GitHub OAuth error:', error);
            return done(error, null);
        }
    }));

    console.log('✅ GitHub OAuth strategy configured');
} else {
    console.warn('⚠️ GitHub OAuth not configured (missing credentials)');
}

// ============================================
// 📤 EXPORT CONFIGURATION
// ============================================

module.exports = {
    passport,
    initializePassport: (app) => {
        app.use(passport.initialize());
        app.use(passport.session());
        console.log('✅ Passport.js initialized');
    }
};
