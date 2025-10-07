// ============================================
// 💬 REDIS CONVERSATION STORE
// Conversation & Message Management with Redis
// No PostgreSQL dependency!
// ============================================

const { Redis } = require('@upstash/redis');

// Initialize Upstash Redis
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || 'https://sincere-tahr-6713.upstash.io',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || 'ARo5AAImcDIxZTRhZTdhNzVjODQ0YmU0YmNiODU0MTU5MTA2NzRkMXAyNjcxMw'
});

// ============================================
// 💬 CONVERSATION MANAGEMENT
// ============================================

/**
 * Create new conversation
 * @param {string} userId - User ID
 * @param {Object} metadata - Conversation metadata { title, domain, language }
 * @returns {Object} Conversation object
 */
async function createConversation(userId, metadata = {}) {
    try {
        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const conversation = {
            id: conversationId,
            userId: userId,
            title: metadata.title || 'New Conversation',
            domain: metadata.domain || 'general',
            language: metadata.language || 'tr-TR',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastMessageAt: null,
            messageCount: 0
        };

        // Save conversation
        await redis.setex(`conversation:${conversationId}`, 90 * 24 * 60 * 60, JSON.stringify(conversation)); // 90 days

        // Add to user's conversation list
        await redis.zadd(`user:${userId}:conversations`, {
            score: Date.now(),
            member: conversationId
        });

        console.log(`✅ Conversation created: ${conversationId}`);

        return conversation;
    } catch (error) {
        console.error('❌ Error creating conversation:', error);
        throw error;
    }
}

/**
 * Get conversation by ID
 */
async function getConversation(conversationId) {
    try {
        const data = await redis.get(`conversation:${conversationId}`);

        if (!data) {
            return null;
        }

        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
        console.error('❌ Error getting conversation:', error);
        return null;
    }
}

/**
 * Update conversation
 */
async function updateConversation(conversationId, updates) {
    try {
        const conversation = await getConversation(conversationId);

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        const updated = {
            ...conversation,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await redis.setex(`conversation:${conversationId}`, 90 * 24 * 60 * 60, JSON.stringify(updated));

        console.log(`✅ Conversation updated: ${conversationId}`);

        return updated;
    } catch (error) {
        console.error('❌ Error updating conversation:', error);
        throw error;
    }
}

/**
 * List user's conversations (paginated)
 */
async function listConversations(userId, options = {}) {
    try {
        const { limit = 20, offset = 0 } = options;

        // Get conversation IDs (sorted by last activity, newest first)
        const conversationIds = await redis.zrevrange(
            `user:${userId}:conversations`,
            offset,
            offset + limit - 1
        );

        if (!conversationIds || conversationIds.length === 0) {
            return {
                conversations: [],
                total: 0,
                hasMore: false
            };
        }

        // Get conversation details
        const conversations = await Promise.all(
            conversationIds.map(id => getConversation(id))
        );

        // Filter out null values (deleted conversations)
        const validConversations = conversations.filter(c => c !== null);

        // Get total count
        const total = await redis.zcard(`user:${userId}:conversations`);

        return {
            conversations: validConversations,
            total: total,
            hasMore: offset + limit < total
        };
    } catch (error) {
        console.error('❌ Error listing conversations:', error);
        return {
            conversations: [],
            total: 0,
            hasMore: false
        };
    }
}

/**
 * Delete conversation (and all its messages)
 */
async function deleteConversation(conversationId, userId) {
    try {
        // Delete conversation
        await redis.del(`conversation:${conversationId}`);

        // Remove from user's conversation list
        await redis.zrem(`user:${userId}:conversations`, conversationId);

        // Delete all messages (scan and delete)
        const messageIds = await redis.smembers(`conversation:${conversationId}:messages`);

        if (messageIds && messageIds.length > 0) {
            const deletePromises = messageIds.map(id => redis.del(`message:${id}`));
            await Promise.all(deletePromises);
        }

        // Delete message index
        await redis.del(`conversation:${conversationId}:messages`);

        console.log(`✅ Conversation deleted: ${conversationId}`);

        return true;
    } catch (error) {
        console.error('❌ Error deleting conversation:', error);
        return false;
    }
}

// ============================================
// 📨 MESSAGE MANAGEMENT
// ============================================

/**
 * Add message to conversation
 * @param {string} conversationId - Conversation ID
 * @param {Object} message - Message data { role, content, metadata, fileReferences }
 */
async function addMessage(conversationId, message) {
    try {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const messageData = {
            id: messageId,
            conversationId: conversationId,
            userId: message.userId,
            role: message.role, // 'user' or 'assistant'
            content: message.content,
            metadata: message.metadata || {},
            fileReferences: message.fileReferences || [],
            createdAt: new Date().toISOString()
        };

        // Save message
        await redis.setex(`message:${messageId}`, 90 * 24 * 60 * 60, JSON.stringify(messageData)); // 90 days

        // Add to conversation's message list
        await redis.sadd(`conversation:${conversationId}:messages`, messageId);

        // Update conversation metadata
        const conversation = await getConversation(conversationId);
        if (conversation) {
            await updateConversation(conversationId, {
                lastMessageAt: messageData.createdAt,
                messageCount: (conversation.messageCount || 0) + 1
            });

            // Update last activity in user's conversation list
            await redis.zadd(`user:${conversation.userId}:conversations`, {
                score: Date.now(),
                member: conversationId
            });
        }

        console.log(`✅ Message added: ${messageId}`);

        return messageData;
    } catch (error) {
        console.error('❌ Error adding message:', error);
        throw error;
    }
}

/**
 * Get message by ID
 */
async function getMessage(messageId) {
    try {
        const data = await redis.get(`message:${messageId}`);

        if (!data) {
            return null;
        }

        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
        console.error('❌ Error getting message:', error);
        return null;
    }
}

/**
 * Get all messages in a conversation
 */
async function getMessages(conversationId, options = {}) {
    try {
        const { limit = 50, offset = 0 } = options;

        // Get all message IDs
        const messageIds = await redis.smembers(`conversation:${conversationId}:messages`);

        if (!messageIds || messageIds.length === 0) {
            return {
                messages: [],
                total: 0,
                hasMore: false
            };
        }

        // Get message details
        const messages = await Promise.all(
            messageIds.map(id => getMessage(id))
        );

        // Filter out null values and sort by createdAt
        const validMessages = messages
            .filter(m => m !== null)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Apply pagination
        const paginatedMessages = validMessages.slice(offset, offset + limit);

        return {
            messages: paginatedMessages,
            total: validMessages.length,
            hasMore: offset + limit < validMessages.length
        };
    } catch (error) {
        console.error('❌ Error getting messages:', error);
        return {
            messages: [],
            total: 0,
            hasMore: false
        };
    }
}

/**
 * Search conversations (simple text search)
 */
async function searchConversations(userId, query) {
    try {
        // Get all user's conversations
        const { conversations } = await listConversations(userId, { limit: 100 });

        // Filter by title or last message content
        const results = conversations.filter(conv => {
            const titleMatch = conv.title?.toLowerCase().includes(query.toLowerCase());
            return titleMatch;
        });

        return results;
    } catch (error) {
        console.error('❌ Error searching conversations:', error);
        return [];
    }
}

// ============================================
// 📤 EXPORT
// ============================================

module.exports = {
    redis,
    // Conversation functions
    createConversation,
    getConversation,
    updateConversation,
    listConversations,
    deleteConversation,
    // Message functions
    addMessage,
    getMessage,
    getMessages,
    // Search
    searchConversations
};
