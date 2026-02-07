/**
 * Chat Auth Database - Upstash Redis + In-Memory Fallback
 * Serverless-compatible, works with Vercel
 */

const crypto = require('crypto');

// Upstash Redis REST API configuration
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Check if Upstash is configured
const useUpstash = !!(UPSTASH_URL && UPSTASH_TOKEN);

// In-memory fallback storage (for development/demo)
const memoryStore = {
  users: new Map(),
  sessions: new Map(),
  settings: new Map(),
  conversations: new Map(),
  messages: new Map(),
  passwordResets: new Map()
};

/**
 * Redis REST API helper
 */
async function redis(command, ...args) {
  if (!useUpstash) {
    return null;
  }

  try {
    const response = await fetch(`${UPSTASH_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([command, ...args])
    });

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('[REDIS_ERROR]', error.message);
    return null;
  }
}

/**
 * Generate UUID
 */
function generateId() {
  return crypto.randomUUID();
}

/**
 * Get current timestamp in ISO format
 */
function now() {
  return new Date().toISOString();
}

/**
 * Chat User Operations
 */
const chatUsers = {
  create: async (email, passwordHash, displayName, options = {}) => {
    const id = generateId();
    const user = {
      id,
      email: email ? email.toLowerCase().trim() : '',
      password_hash: passwordHash || '',
      display_name: (displayName || '').trim(),
      phone_number: options.phoneNumber || '',
      avatar_url: options.avatarUrl || '',
      auth_provider: options.authProvider || 'email',
      status: 'active',
      created_at: now(),
      updated_at: now()
    };

    if (useUpstash) {
      await redis('HSET', `chat:user:${id}`, ...Object.entries(user).flat());
      if (user.email) {
        await redis('SET', `chat:email:${user.email}`, id);
      }
      if (user.phone_number) {
        await redis('SET', `chat:phone:${user.phone_number}`, id);
      }
    } else {
      memoryStore.users.set(id, user);
      if (user.email) {
        memoryStore.users.set(`email:${user.email}`, id);
      }
      if (user.phone_number) {
        memoryStore.users.set(`phone:${user.phone_number}`, id);
      }
    }

    return id;
  },

  findByPhone: async (phoneNumber) => {
    const normalized = phoneNumber.replace(/\s/g, '');

    if (useUpstash) {
      const userId = await redis('GET', `chat:phone:${normalized}`);
      if (!userId) return null;
      const userData = await redis('HGETALL', `chat:user:${userId}`);
      if (!userData || userData.length === 0) return null;

      const user = {};
      for (let i = 0; i < userData.length; i += 2) {
        user[userData[i]] = userData[i + 1];
      }
      return user.status === 'active' ? user : null;
    } else {
      const userId = memoryStore.users.get(`phone:${normalized}`);
      if (!userId) return null;
      const user = memoryStore.users.get(userId);
      return user?.status === 'active' ? user : null;
    }
  },

  findByEmail: async (email) => {
    const normalizedEmail = email.toLowerCase().trim();

    if (useUpstash) {
      const userId = await redis('GET', `chat:email:${normalizedEmail}`);
      if (!userId) return null;
      const userData = await redis('HGETALL', `chat:user:${userId}`);
      if (!userData || userData.length === 0) return null;

      // Convert array to object
      const user = {};
      for (let i = 0; i < userData.length; i += 2) {
        user[userData[i]] = userData[i + 1];
      }
      return user.status === 'active' ? user : null;
    } else {
      const userId = memoryStore.users.get(`email:${normalizedEmail}`);
      if (!userId) return null;
      const user = memoryStore.users.get(userId);
      return user?.status === 'active' ? user : null;
    }
  },

  findById: async (id) => {
    if (useUpstash) {
      const userData = await redis('HGETALL', `chat:user:${id}`);
      if (!userData || userData.length === 0) return null;

      const user = {};
      for (let i = 0; i < userData.length; i += 2) {
        user[userData[i]] = userData[i + 1];
      }
      return user.status === 'active' ? user : null;
    } else {
      const user = memoryStore.users.get(id);
      return user?.status === 'active' ? user : null;
    }
  },

  updateLastLogin: async (id) => {
    const timestamp = now();
    if (useUpstash) {
      await redis('HSET', `chat:user:${id}`, 'last_login_at', timestamp, 'updated_at', timestamp);
    } else {
      const user = memoryStore.users.get(id);
      if (user) {
        user.last_login_at = timestamp;
        user.updated_at = timestamp;
      }
    }
  },

  updateProfile: async (id, data) => {
    const updates = { updated_at: now() };
    if (data.displayName) updates.display_name = data.displayName.trim();
    if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;
    if (data.googleLinked !== undefined) updates.google_linked = data.googleLinked ? 'true' : 'false';

    if (Object.keys(updates).length === 1) return false;

    if (useUpstash) {
      await redis('HSET', `chat:user:${id}`, ...Object.entries(updates).flat());
    } else {
      const user = memoryStore.users.get(id);
      if (user) Object.assign(user, updates);
    }
    return true;
  },

  updatePassword: async (id, passwordHash) => {
    const timestamp = now();
    if (useUpstash) {
      await redis('HSET', `chat:user:${id}`, 'password_hash', passwordHash, 'updated_at', timestamp);
    } else {
      const user = memoryStore.users.get(id);
      if (user) {
        user.password_hash = passwordHash;
        user.updated_at = timestamp;
      }
    }
  },

  deactivate: async (id) => {
    const timestamp = now();
    if (useUpstash) {
      await redis('HSET', `chat:user:${id}`, 'status', 'deleted', 'updated_at', timestamp);
    } else {
      const user = memoryStore.users.get(id);
      if (user) {
        user.status = 'deleted';
        user.updated_at = timestamp;
      }
    }
  },

  update2FA: async (id, totpSecret, enabled) => {
    const timestamp = now();
    if (useUpstash) {
      await redis('HSET', `chat:user:${id}`,
        'totp_secret', totpSecret || '',
        'two_factor_enabled', enabled ? 'true' : 'false',
        'updated_at', timestamp
      );
    } else {
      const user = memoryStore.users.get(id);
      if (user) {
        user.totp_secret = totpSecret || '';
        user.two_factor_enabled = enabled ? 'true' : 'false';
        user.updated_at = timestamp;
      }
    }
  }
};

/**
 * Chat Session Operations
 */
const chatSessions = {
  create: async (userId, refreshToken, expiresAt, ipAddress, userAgent) => {
    const id = generateId();
    const session = {
      id,
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_valid: 'true',
      created_at: now()
    };

    if (useUpstash) {
      await redis('HSET', `chat:session:${refreshToken}`, ...Object.entries(session).flat());
      // Set expiry based on expiresAt
      const ttl = Math.floor((new Date(expiresAt) - new Date()) / 1000);
      if (ttl > 0) {
        await redis('EXPIRE', `chat:session:${refreshToken}`, ttl);
      }
    } else {
      memoryStore.sessions.set(refreshToken, session);
    }

    return id;
  },

  findByToken: async (refreshToken) => {
    if (useUpstash) {
      const sessionData = await redis('HGETALL', `chat:session:${refreshToken}`);
      if (!sessionData || sessionData.length === 0) return null;

      const session = {};
      for (let i = 0; i < sessionData.length; i += 2) {
        session[sessionData[i]] = sessionData[i + 1];
      }

      if (session.is_valid !== 'true') return null;
      if (new Date(session.expires_at) < new Date()) return null;
      return session;
    } else {
      const session = memoryStore.sessions.get(refreshToken);
      if (!session || session.is_valid !== 'true') return null;
      if (new Date(session.expires_at) < new Date()) return null;
      return session;
    }
  },

  invalidate: async (refreshToken) => {
    if (useUpstash) {
      await redis('HSET', `chat:session:${refreshToken}`, 'is_valid', 'false');
    } else {
      const session = memoryStore.sessions.get(refreshToken);
      if (session) session.is_valid = 'false';
    }
  },

  invalidateAllForUser: async (userId) => {
    // For Upstash, we'd need to track sessions by user - simplified for now
    if (!useUpstash) {
      for (const [token, session] of memoryStore.sessions) {
        if (session.user_id === userId) {
          session.is_valid = 'false';
        }
      }
    }
  },

  cleanup: async () => {
    // Redis handles TTL automatically
    if (!useUpstash) {
      const now = new Date();
      for (const [token, session] of memoryStore.sessions) {
        if (new Date(session.expires_at) < now) {
          memoryStore.sessions.delete(token);
        }
      }
    }
  }
};

/**
 * Chat Settings Operations
 */
const chatSettings = {
  create: async (userId) => {
    const settings = {
      user_id: userId,
      theme: 'dark',
      language: 'tr',
      preferred_model: 'premium',
      auto_save_history: 'true',
      notifications_enabled: 'true',
      sound_enabled: 'true',
      created_at: now(),
      updated_at: now()
    };

    if (useUpstash) {
      await redis('HSETNX', `chat:settings:${userId}`, ...Object.entries(settings).flat());
    } else {
      if (!memoryStore.settings.has(userId)) {
        memoryStore.settings.set(userId, settings);
      }
    }
  },

  get: async (userId) => {
    if (useUpstash) {
      const data = await redis('HGETALL', `chat:settings:${userId}`);
      if (!data || data.length === 0) return null;

      const settings = {};
      for (let i = 0; i < data.length; i += 2) {
        settings[data[i]] = data[i + 1];
      }
      // Convert string booleans
      settings.auto_save_history = settings.auto_save_history === 'true';
      settings.notifications_enabled = settings.notifications_enabled === 'true';
      settings.sound_enabled = settings.sound_enabled === 'true';
      settings.email_notifications = settings.email_notifications === 'true';
      settings.use_history = settings.use_history === 'true';
      settings.analytics = settings.analytics === 'true';
      return settings;
    } else {
      const settings = memoryStore.settings.get(userId);
      if (settings) {
        return {
          ...settings,
          auto_save_history: settings.auto_save_history === 'true',
          notifications_enabled: settings.notifications_enabled === 'true',
          sound_enabled: settings.sound_enabled === 'true',
          email_notifications: settings.email_notifications === 'true',
          use_history: settings.use_history === 'true',
          analytics: settings.analytics === 'true'
        };
      }
      return null;
    }
  },

  update: async (userId, updates) => {
    const data = { updated_at: now() };
    const allowedFields = ['theme', 'language', 'font_size', 'preferred_model', 'auto_save_history', 'notifications_enabled', 'sound_enabled', 'email_notifications', 'use_history', 'analytics', 'custom_settings'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        data[field] = typeof updates[field] === 'boolean' ? String(updates[field]) : updates[field];
      }
    }

    if (Object.keys(data).length === 1) return false;

    if (useUpstash) {
      await redis('HSET', `chat:settings:${userId}`, ...Object.entries(data).flat());
    } else {
      const settings = memoryStore.settings.get(userId);
      if (settings) Object.assign(settings, data);
    }
    return true;
  },

  delete: async (userId) => {
    if (useUpstash) {
      await redis('DEL', `chat:settings:${userId}`);
    } else {
      memoryStore.settings.delete(userId);
    }
  }
};

/**
 * Chat Conversations Operations
 */
const chatConversations = {
  create: async (userId, title = null, model = 'premium') => {
    const id = generateId();
    const conversation = {
      id,
      user_id: userId,
      title: title || '',
      model_used: model,
      message_count: '0',
      created_at: now(),
      updated_at: now()
    };

    if (useUpstash) {
      await redis('HSET', `chat:conv:${id}`, ...Object.entries(conversation).flat());
      await redis('LPUSH', `chat:user:${userId}:convs`, id);
    } else {
      memoryStore.conversations.set(id, conversation);
      const userConvs = memoryStore.conversations.get(`user:${userId}`) || [];
      userConvs.unshift(id);
      memoryStore.conversations.set(`user:${userId}`, userConvs);
    }

    return id;
  },

  findByUser: async (userId, limit = 50) => {
    if (useUpstash) {
      const convIds = await redis('LRANGE', `chat:user:${userId}:convs`, 0, limit - 1);
      if (!convIds || convIds.length === 0) return [];

      const conversations = [];
      for (const id of convIds) {
        const data = await redis('HGETALL', `chat:conv:${id}`);
        if (data && data.length > 0) {
          const conv = {};
          for (let i = 0; i < data.length; i += 2) {
            conv[data[i]] = data[i + 1];
          }
          conv.message_count = parseInt(conv.message_count) || 0;
          conversations.push(conv);
        }
      }
      return conversations;
    } else {
      const userConvs = memoryStore.conversations.get(`user:${userId}`) || [];
      return userConvs.slice(0, limit).map(id => {
        const conv = memoryStore.conversations.get(id);
        return conv ? { ...conv, message_count: parseInt(conv.message_count) || 0 } : null;
      }).filter(Boolean);
    }
  },

  findById: async (id, userId) => {
    if (useUpstash) {
      const data = await redis('HGETALL', `chat:conv:${id}`);
      if (!data || data.length === 0) return null;

      const conv = {};
      for (let i = 0; i < data.length; i += 2) {
        conv[data[i]] = data[i + 1];
      }
      if (conv.user_id !== userId) return null;
      conv.message_count = parseInt(conv.message_count) || 0;
      return conv;
    } else {
      const conv = memoryStore.conversations.get(id);
      if (!conv || conv.user_id !== userId) return null;
      return { ...conv, message_count: parseInt(conv.message_count) || 0 };
    }
  },

  update: async (id, userId, updateData) => {
    const updates = { updated_at: now() };
    if (updateData.title) updates.title = updateData.title;
    if (updateData.messageCount !== undefined) updates.message_count = String(updateData.messageCount);

    if (useUpstash) {
      // Verify ownership first
      const ownerId = await redis('HGET', `chat:conv:${id}`, 'user_id');
      if (ownerId !== userId) return;
      await redis('HSET', `chat:conv:${id}`, ...Object.entries(updates).flat());
    } else {
      const conv = memoryStore.conversations.get(id);
      if (conv && conv.user_id === userId) {
        Object.assign(conv, updates);
      }
    }
  },

  delete: async (id, userId) => {
    if (useUpstash) {
      const ownerId = await redis('HGET', `chat:conv:${id}`, 'user_id');
      if (ownerId !== userId) return;
      await redis('DEL', `chat:conv:${id}`);
      await redis('LREM', `chat:user:${userId}:convs`, 0, id);
    } else {
      const conv = memoryStore.conversations.get(id);
      if (conv && conv.user_id === userId) {
        memoryStore.conversations.delete(id);
        const userConvs = memoryStore.conversations.get(`user:${userId}`) || [];
        const index = userConvs.indexOf(id);
        if (index > -1) userConvs.splice(index, 1);
      }
    }
  },

  deleteAllForUser: async (userId) => {
    if (useUpstash) {
      const convIds = await redis('LRANGE', `chat:user:${userId}:convs`, 0, -1);
      if (convIds && convIds.length > 0) {
        for (const id of convIds) {
          // Delete messages for this conversation
          const msgIds = await redis('LRANGE', `chat:conv:${id}:msgs`, 0, -1);
          if (msgIds) {
            for (const msgId of msgIds) {
              await redis('DEL', `chat:msg:${msgId}`);
            }
          }
          await redis('DEL', `chat:conv:${id}:msgs`);
          await redis('DEL', `chat:conv:${id}`);
        }
        await redis('DEL', `chat:user:${userId}:convs`);
      }
    } else {
      const userConvs = memoryStore.conversations.get(`user:${userId}`) || [];
      for (const id of userConvs) {
        // Delete messages
        const convMsgs = memoryStore.messages.get(`conv:${id}`) || [];
        for (const msgId of convMsgs) {
          memoryStore.messages.delete(msgId);
        }
        memoryStore.messages.delete(`conv:${id}`);
        memoryStore.conversations.delete(id);
      }
      memoryStore.conversations.delete(`user:${userId}`);
    }
  }
};

/**
 * Chat Messages Operations
 */
const chatMessages = {
  create: async (conversationId, role, content, model = null, tokensUsed = 0, metadata = null) => {
    const id = generateId();
    const message = {
      id,
      conversation_id: conversationId,
      role,
      content,
      model: model || '',
      tokens_used: String(tokensUsed),
      created_at: now()
    };

    if (useUpstash) {
      await redis('HSET', `chat:msg:${id}`, ...Object.entries(message).flat());
      await redis('RPUSH', `chat:conv:${conversationId}:msgs`, id);
      await redis('HINCRBY', `chat:conv:${conversationId}`, 'message_count', 1);
      await redis('HSET', `chat:conv:${conversationId}`, 'updated_at', now());
    } else {
      memoryStore.messages.set(id, message);
      const convMsgs = memoryStore.messages.get(`conv:${conversationId}`) || [];
      convMsgs.push(id);
      memoryStore.messages.set(`conv:${conversationId}`, convMsgs);

      const conv = memoryStore.conversations.get(conversationId);
      if (conv) {
        conv.message_count = String((parseInt(conv.message_count) || 0) + 1);
        conv.updated_at = now();
      }
    }

    return id;
  },

  findByConversation: async (conversationId) => {
    if (useUpstash) {
      const msgIds = await redis('LRANGE', `chat:conv:${conversationId}:msgs`, 0, -1);
      if (!msgIds || msgIds.length === 0) return [];

      const messages = [];
      for (const id of msgIds) {
        const data = await redis('HGETALL', `chat:msg:${id}`);
        if (data && data.length > 0) {
          const msg = {};
          for (let i = 0; i < data.length; i += 2) {
            msg[data[i]] = data[i + 1];
          }
          messages.push(msg);
        }
      }
      return messages;
    } else {
      const convMsgs = memoryStore.messages.get(`conv:${conversationId}`) || [];
      return convMsgs.map(id => memoryStore.messages.get(id)).filter(Boolean);
    }
  }
};

/**
 * Password Reset Operations
 */
const passwordResets = {
  create: async (userId, token, expiresAt) => {
    const id = generateId();
    const reset = {
      id,
      user_id: userId,
      token,
      expires_at: expiresAt,
      used: 'false',
      created_at: now()
    };

    if (useUpstash) {
      await redis('HSET', `chat:reset:${token}`, ...Object.entries(reset).flat());
      const ttl = Math.floor((new Date(expiresAt) - new Date()) / 1000);
      if (ttl > 0) {
        await redis('EXPIRE', `chat:reset:${token}`, ttl);
      }
    } else {
      memoryStore.passwordResets.set(token, reset);
    }

    return id;
  },

  findByToken: async (token) => {
    if (useUpstash) {
      const data = await redis('HGETALL', `chat:reset:${token}`);
      if (!data || data.length === 0) return null;

      const reset = {};
      for (let i = 0; i < data.length; i += 2) {
        reset[data[i]] = data[i + 1];
      }
      if (reset.used === 'true') return null;
      if (new Date(reset.expires_at) < new Date()) return null;
      return reset;
    } else {
      const reset = memoryStore.passwordResets.get(token);
      if (!reset || reset.used === 'true') return null;
      if (new Date(reset.expires_at) < new Date()) return null;
      return reset;
    }
  },

  markUsed: async (token) => {
    if (useUpstash) {
      await redis('HSET', `chat:reset:${token}`, 'used', 'true');
    } else {
      const reset = memoryStore.passwordResets.get(token);
      if (reset) reset.used = 'true';
    }
  },

  invalidateForUser: async (userId) => {
    // Simplified - in production would need index
    if (!useUpstash) {
      for (const [token, reset] of memoryStore.passwordResets) {
        if (reset.user_id === userId) {
          reset.used = 'true';
        }
      }
    }
  },

  cleanup: async () => {
    // Redis handles TTL automatically
    if (!useUpstash) {
      const now = new Date();
      for (const [token, reset] of memoryStore.passwordResets) {
        if (new Date(reset.expires_at) < now || reset.used === 'true') {
          memoryStore.passwordResets.delete(token);
        }
      }
    }
  }
};

// Log database mode on startup
console.log(`[CHAT_AUTH_DB] Mode: ${useUpstash ? 'Upstash Redis' : 'In-Memory (demo mode)'}`);

module.exports = {
  generateId,
  now,
  chatUsers,
  chatSessions,
  chatSettings,
  chatConversations,
  chatMessages,
  passwordResets,
  useUpstash
};
