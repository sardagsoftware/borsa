// ============================================
// 📊 REDIS ANALYTICS STORE
// Usage Tracking & Analytics with Redis
// Track conversations, messages, tokens, costs
// ============================================

const { Redis } = require('@upstash/redis');

// Initialize Upstash Redis
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis credentials not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
}

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// ============================================
// 💰 COST CALCULATION
// ============================================

// Token costs per 1M tokens (USD) - Phase 1 Week 2: Anonymized model IDs
const TOKEN_COSTS = {
    'm1': { input: 2.50, output: 10.00 },      // Premium model
    'm2': { input: 2.50, output: 10.00 },      // Premium model (alternative)
    'm3': { input: 0.15, output: 0.60 },       // Standard model
    'm4': { input: 3.00, output: 15.00 },      // Reasoning model
    'm5': { input: 0.00, output: 0.00 },       // Experimental/free model
    'm6': { input: 0.05, output: 0.15 },       // Fast model
    'm7': { input: 0.10, output: 0.30 },       // Basic model
    'default': { input: 0.15, output: 0.60 }   // Fallback
};

/**
 * Calculate cost for token usage
 */
function calculateCost(model, inputTokens, outputTokens) {
    const costs = TOKEN_COSTS[model] || TOKEN_COSTS['default'];

    const inputCost = (inputTokens / 1000000) * costs.input;
    const outputCost = (outputTokens / 1000000) * costs.output;

    return {
        inputCost: inputCost,
        outputCost: outputCost,
        totalCost: inputCost + outputCost
    };
}

// ============================================
// 📈 TRACK USAGE EVENT
// ============================================

/**
 * Track usage event
 * @param {string} userId - User ID
 * @param {Object} event - Event data
 */
async function trackUsage(userId, event) {
    try {
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const timestamp = new Date().toISOString();
        const dateKey = timestamp.split('T')[0]; // YYYY-MM-DD

        const usageEvent = {
            id: eventId,
            userId: userId,
            type: event.type, // 'message', 'conversation', 'file_upload', etc.
            timestamp: timestamp,
            metadata: event.metadata || {},
            tokens: event.tokens || { input: 0, output: 0, total: 0 },
            model: event.model || 'OX7A3F8D-mini',
            cost: event.tokens ? calculateCost(
                event.model || 'OX7A3F8D-mini',
                event.tokens.input || 0,
                event.tokens.output || 0
            ) : { inputCost: 0, outputCost: 0, totalCost: 0 }
        };

        // Save event (30 days TTL)
        await redis.setex(
            `usage:event:${eventId}`,
            30 * 24 * 60 * 60,
            JSON.stringify(usageEvent)
        );

        // Add to user's daily usage list
        await redis.zadd(`usage:user:${userId}:${dateKey}`, {
            score: Date.now(),
            member: eventId
        });
        await redis.expire(`usage:user:${userId}:${dateKey}`, 90 * 24 * 60 * 60); // 90 days

        // Update counters
        await incrementCounter(userId, event.type, dateKey);

        // Update token counters
        if (event.tokens) {
            await incrementTokens(userId, event.tokens, dateKey);
        }

        console.log(`✅ Usage tracked: ${eventId} (${event.type})`);

        return usageEvent;
    } catch (error) {
        console.error('❌ Error tracking usage:', error);
        return null;
    }
}

// ============================================
// 🔢 COUNTERS
// ============================================

/**
 * Increment usage counter
 */
async function incrementCounter(userId, type, dateKey) {
    try {
        // Daily counter
        await redis.hincrby(`usage:counters:${userId}:${dateKey}`, type, 1);
        await redis.expire(`usage:counters:${userId}:${dateKey}`, 90 * 24 * 60 * 60);

        // All-time counter
        await redis.hincrby(`usage:counters:${userId}:all`, type, 1);
    } catch (error) {
        console.error('❌ Error incrementing counter:', error);
    }
}

/**
 * Increment token counters
 */
async function incrementTokens(userId, tokens, dateKey) {
    try {
        // Daily tokens
        await redis.hincrby(`usage:tokens:${userId}:${dateKey}`, 'input', tokens.input || 0);
        await redis.hincrby(`usage:tokens:${userId}:${dateKey}`, 'output', tokens.output || 0);
        await redis.hincrby(`usage:tokens:${userId}:${dateKey}`, 'total', tokens.total || 0);
        await redis.expire(`usage:tokens:${userId}:${dateKey}`, 90 * 24 * 60 * 60);

        // All-time tokens
        await redis.hincrby(`usage:tokens:${userId}:all`, 'input', tokens.input || 0);
        await redis.hincrby(`usage:tokens:${userId}:all`, 'output', tokens.output || 0);
        await redis.hincrby(`usage:tokens:${userId}:all`, 'total', tokens.total || 0);
    } catch (error) {
        console.error('❌ Error incrementing tokens:', error);
    }
}

// ============================================
// 📊 GET ANALYTICS
// ============================================

/**
 * Get user analytics for date range
 */
async function getUserAnalytics(userId, options = {}) {
    try {
        const { startDate, endDate, period = 'daily' } = options;

        // Default to last 30 days
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const analytics = {
            userId: userId,
            period: period,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            summary: {
                conversations: 0,
                messages: 0,
                files: 0,
                tokens: { input: 0, output: 0, total: 0 },
                cost: 0
            },
            daily: []
        };

        // Get daily stats
        const currentDate = new Date(start);
        while (currentDate <= end) {
            const dateKey = currentDate.toISOString().split('T')[0];

            // Get counters
            const counters = await redis.hgetall(`usage:counters:${userId}:${dateKey}`) || {};

            // Get tokens
            const tokens = await redis.hgetall(`usage:tokens:${userId}:${dateKey}`) || {};

            const dailyStats = {
                date: dateKey,
                conversations: parseInt(counters.conversation || 0),
                messages: parseInt(counters.message || 0),
                files: parseInt(counters.file_upload || 0),
                tokens: {
                    input: parseInt(tokens.input || 0),
                    output: parseInt(tokens.output || 0),
                    total: parseInt(tokens.total || 0)
                }
            };

            // Calculate cost (estimate using OX7A3F8D-mini as average)
            const cost = calculateCost('OX7A3F8D-mini', dailyStats.tokens.input, dailyStats.tokens.output);
            dailyStats.cost = cost.totalCost;

            // Add to daily array
            analytics.daily.push(dailyStats);

            // Update summary
            analytics.summary.conversations += dailyStats.conversations;
            analytics.summary.messages += dailyStats.messages;
            analytics.summary.files += dailyStats.files;
            analytics.summary.tokens.input += dailyStats.tokens.input;
            analytics.summary.tokens.output += dailyStats.tokens.output;
            analytics.summary.tokens.total += dailyStats.tokens.total;
            analytics.summary.cost += dailyStats.cost;

            // Next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return analytics;
    } catch (error) {
        console.error('❌ Error getting analytics:', error);
        return null;
    }
}

/**
 * Get all-time user statistics
 */
async function getAllTimeStats(userId) {
    try {
        // Get all-time counters
        const counters = await redis.hgetall(`usage:counters:${userId}:all`) || {};

        // Get all-time tokens
        const tokens = await redis.hgetall(`usage:tokens:${userId}:all`) || {};

        const stats = {
            userId: userId,
            conversations: parseInt(counters.conversation || 0),
            messages: parseInt(counters.message || 0),
            files: parseInt(counters.file_upload || 0),
            tokens: {
                input: parseInt(tokens.input || 0),
                output: parseInt(tokens.output || 0),
                total: parseInt(tokens.total || 0)
            }
        };

        // Calculate cost
        const cost = calculateCost('OX7A3F8D-mini', stats.tokens.input, stats.tokens.output);
        stats.estimatedCost = cost.totalCost;

        return stats;
    } catch (error) {
        console.error('❌ Error getting all-time stats:', error);
        return null;
    }
}

/**
 * Get top users (admin only)
 */
async function getTopUsers(limit = 10) {
    try {
        // This would require scanning all user keys
        // For production, implement proper aggregation
        console.warn('⚠️ getTopUsers requires Redis SCAN - not implemented yet');
        return [];
    } catch (error) {
        console.error('❌ Error getting top users:', error);
        return [];
    }
}

// ============================================
// 📈 SYSTEM-WIDE ANALYTICS
// ============================================

/**
 * Track system-wide event
 */
async function trackSystemEvent(event) {
    try {
        const timestamp = new Date().toISOString();
        const dateKey = timestamp.split('T')[0];

        // Increment system counter
        await redis.hincrby(`usage:system:${dateKey}`, event.type, 1);
        await redis.expire(`usage:system:${dateKey}`, 90 * 24 * 60 * 60);

        // Increment all-time system counter
        await redis.hincrby('usage:system:all', event.type, 1);
    } catch (error) {
        console.error('❌ Error tracking system event:', error);
    }
}

/**
 * Get system-wide stats
 */
async function getSystemStats() {
    try {
        const stats = await redis.hgetall('usage:system:all') || {};

        return {
            totalConversations: parseInt(stats.conversation || 0),
            totalMessages: parseInt(stats.message || 0),
            totalFiles: parseInt(stats.file_upload || 0),
            totalUsers: parseInt(stats.user_signup || 0)
        };
    } catch (error) {
        console.error('❌ Error getting system stats:', error);
        return null;
    }
}

// ============================================
// 📤 EXPORT
// ============================================

module.exports = {
    redis,
    // Usage tracking
    trackUsage,
    trackSystemEvent,
    // Analytics
    getUserAnalytics,
    getAllTimeStats,
    getTopUsers,
    getSystemStats,
    // Utilities
    calculateCost,
    TOKEN_COSTS
};
