// ============================================
// 📦 REDIS SESSION STORE
// Upstash Redis for session management
// No database required!
// ============================================

const { Redis } = require('@upstash/redis');

// Initialize Upstash Redis
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || 'https://sincere-tahr-6713.upstash.io',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || 'ARo5AAImcDIxZTRhZTdhNzVjODQ0YmU0YmNiODU0MTU5MTA2NzRkMXAyNjcxMw'
});

// ============================================
// 👤 USER MANAGEMENT (Redis-based)
// ============================================

/**
 * Save user to Redis
 * @param {Object} user - User object { id, email, name, avatarUrl, provider }
 * @param {number} ttl - Time to live in seconds (default: 30 days)
 */
async function saveUser(user, ttl = 30 * 24 * 60 * 60) {
    try {
        const userId = user.id || user.email.replace(/[^a-zA-Z0-9]/g, '_');

        const userData = {
            id: userId,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl || null,
            provider: user.provider || 'unknown',
            createdAt: user.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save user data
        await redis.setex(`user:${userId}`, ttl, JSON.stringify(userData));

        // Index by email for quick lookup
        await redis.setex(`user:email:${user.email}`, ttl, userId);

        console.log(`✅ User saved to Redis: ${user.email}`);

        return userData;
    } catch (error) {
        console.error('❌ Error saving user to Redis:', error);
        throw error;
    }
}

/**
 * Get user by ID from Redis
 */
async function getUserById(userId) {
    try {
        const userData = await redis.get(`user:${userId}`);

        if (!userData) {
            return null;
        }

        return typeof userData === 'string' ? JSON.parse(userData) : userData;
    } catch (error) {
        console.error('❌ Error getting user from Redis:', error);
        return null;
    }
}

/**
 * Get user by email from Redis
 */
async function getUserByEmail(email) {
    try {
        const userId = await redis.get(`user:email:${email}`);

        if (!userId) {
            return null;
        }

        return await getUserById(userId);
    } catch (error) {
        console.error('❌ Error getting user by email from Redis:', error);
        return null;
    }
}

/**
 * Update user in Redis
 */
async function updateUser(userId, updates, ttl = 30 * 24 * 60 * 60) {
    try {
        const existingUser = await getUserById(userId);

        if (!existingUser) {
            throw new Error('User not found');
        }

        const updatedUser = {
            ...existingUser,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await redis.setex(`user:${userId}`, ttl, JSON.stringify(updatedUser));

        console.log(`✅ User updated in Redis: ${userId}`);

        return updatedUser;
    } catch (error) {
        console.error('❌ Error updating user in Redis:', error);
        throw error;
    }
}

// ============================================
// 🔐 SESSION MANAGEMENT (Redis-based)
// ============================================

/**
 * Create session for user
 * @param {string} userId - User ID
 * @param {Object} sessionData - Additional session data
 * @param {number} ttl - Session TTL in seconds (default: 30 days)
 * @returns {string} sessionId
 */
async function createSession(userId, sessionData = {}, ttl = 30 * 24 * 60 * 60) {
    try {
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const session = {
            sessionId,
            userId,
            ...sessionData,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + ttl * 1000).toISOString()
        };

        await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(session));

        // Index by user ID for quick lookup
        await redis.sadd(`user:${userId}:sessions`, sessionId);
        await redis.expire(`user:${userId}:sessions`, ttl);

        console.log(`✅ Session created for user: ${userId}`);

        return sessionId;
    } catch (error) {
        console.error('❌ Error creating session:', error);
        throw error;
    }
}

/**
 * Get session by ID
 */
async function getSession(sessionId) {
    try {
        const sessionData = await redis.get(`session:${sessionId}`);

        if (!sessionData) {
            return null;
        }

        return typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    } catch (error) {
        console.error('❌ Error getting session:', error);
        return null;
    }
}

/**
 * Refresh session (extend TTL)
 */
async function refreshSession(sessionId, ttl = 30 * 24 * 60 * 60) {
    try {
        const session = await getSession(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        session.expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

        await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(session));

        console.log(`✅ Session refreshed: ${sessionId}`);

        return session;
    } catch (error) {
        console.error('❌ Error refreshing session:', error);
        throw error;
    }
}

/**
 * Delete session
 */
async function deleteSession(sessionId) {
    try {
        const session = await getSession(sessionId);

        if (session) {
            // Remove session
            await redis.del(`session:${sessionId}`);

            // Remove from user's session list
            if (session.userId) {
                await redis.srem(`user:${session.userId}:sessions`, sessionId);
            }

            console.log(`✅ Session deleted: ${sessionId}`);
        }

        return true;
    } catch (error) {
        console.error('❌ Error deleting session:', error);
        return false;
    }
}

/**
 * Get all sessions for a user
 */
async function getUserSessions(userId) {
    try {
        const sessionIds = await redis.smembers(`user:${userId}:sessions`);

        if (!sessionIds || sessionIds.length === 0) {
            return [];
        }

        const sessions = await Promise.all(
            sessionIds.map(id => getSession(id))
        );

        return sessions.filter(s => s !== null);
    } catch (error) {
        console.error('❌ Error getting user sessions:', error);
        return [];
    }
}

// ============================================
// 📤 EXPORT
// ============================================

module.exports = {
    redis,
    // User functions
    saveUser,
    getUserById,
    getUserByEmail,
    updateUser,
    // Session functions
    createSession,
    getSession,
    refreshSession,
    deleteSession,
    getUserSessions
};
