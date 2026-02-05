/**
 * Chat Auth Database Connection
 * Supabase connection for chat user system (Vercel-compatible)
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

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
  create: async (email, passwordHash, displayName) => {
    const id = generateId();
    const { error } = await supabase
      .from('chat_users')
      .insert({
        id,
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        display_name: displayName.trim(),
        status: 'active',
        created_at: now(),
        updated_at: now()
      });

    if (error) throw error;
    return id;
  },

  findByEmail: async (email) => {
    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  findById: async (id) => {
    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  updateLastLogin: async (id) => {
    const { error } = await supabase
      .from('chat_users')
      .update({ last_login_at: now(), updated_at: now() })
      .eq('id', id);

    if (error) throw error;
  },

  updateProfile: async (id, data) => {
    const updates = { updated_at: now() };

    if (data.displayName) updates.display_name = data.displayName.trim();
    if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;

    if (Object.keys(updates).length === 1) return false;

    const { error } = await supabase
      .from('chat_users')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  updatePassword: async (id, passwordHash) => {
    const { error } = await supabase
      .from('chat_users')
      .update({ password_hash: passwordHash, updated_at: now() })
      .eq('id', id);

    if (error) throw error;
  }
};

/**
 * Chat Session Operations
 */
const chatSessions = {
  create: async (userId, refreshToken, expiresAt, ipAddress, userAgent) => {
    const id = generateId();
    const { error } = await supabase
      .from('chat_user_sessions')
      .insert({
        id,
        user_id: userId,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_valid: true,
        created_at: now()
      });

    if (error) throw error;
    return id;
  },

  findByToken: async (refreshToken) => {
    const { data, error } = await supabase
      .from('chat_user_sessions')
      .select('*')
      .eq('refresh_token', refreshToken)
      .eq('is_valid', true)
      .gt('expires_at', now())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  invalidate: async (refreshToken) => {
    const { error } = await supabase
      .from('chat_user_sessions')
      .update({ is_valid: false })
      .eq('refresh_token', refreshToken);

    if (error) throw error;
  },

  invalidateAllForUser: async (userId) => {
    const { error } = await supabase
      .from('chat_user_sessions')
      .update({ is_valid: false })
      .eq('user_id', userId);

    if (error) throw error;
  },

  cleanup: async () => {
    const { error } = await supabase
      .from('chat_user_sessions')
      .delete()
      .lt('expires_at', now());

    if (error) throw error;
  }
};

/**
 * Chat Settings Operations
 */
const chatSettings = {
  create: async (userId) => {
    const { error } = await supabase
      .from('chat_user_settings')
      .upsert({
        user_id: userId,
        theme: 'dark',
        language: 'tr',
        preferred_model: 'premium',
        auto_save_history: true,
        notifications_enabled: true,
        sound_enabled: true,
        created_at: now(),
        updated_at: now()
      });

    if (error) throw error;
  },

  get: async (userId) => {
    const { data, error } = await supabase
      .from('chat_user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  update: async (userId, settings) => {
    const updates = { updated_at: now() };
    const allowedFields = ['theme', 'language', 'font_size', 'preferred_model', 'auto_save_history', 'notifications_enabled', 'sound_enabled'];

    for (const field of allowedFields) {
      if (settings[field] !== undefined) {
        updates[field] = settings[field];
      }
    }

    if (settings.customSettings) {
      updates.custom_settings = JSON.stringify(settings.customSettings);
    }

    if (Object.keys(updates).length === 1) return false;

    const { error } = await supabase
      .from('chat_user_settings')
      .update(updates)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }
};

/**
 * Chat Conversations Operations
 */
const chatConversations = {
  create: async (userId, title = null, model = 'premium') => {
    const id = generateId();
    const { error } = await supabase
      .from('chat_conversations')
      .insert({
        id,
        user_id: userId,
        title,
        model_used: model,
        message_count: 0,
        created_at: now(),
        updated_at: now()
      });

    if (error) throw error;
    return id;
  },

  findByUser: async (userId, limit = 50) => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  findById: async (id, userId) => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  update: async (id, userId, updateData) => {
    const updates = { updated_at: now() };

    if (updateData.title) updates.title = updateData.title;
    if (updateData.messageCount !== undefined) updates.message_count = updateData.messageCount;

    const { error } = await supabase
      .from('chat_conversations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  delete: async (id, userId) => {
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }
};

/**
 * Chat Messages Operations
 */
const chatMessages = {
  create: async (conversationId, role, content, model = null, tokensUsed = 0, metadata = null) => {
    const id = generateId();
    const { error: msgError } = await supabase
      .from('chat_messages')
      .insert({
        id,
        conversation_id: conversationId,
        role,
        content,
        model,
        tokens_used: tokensUsed,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: now()
      });

    if (msgError) throw msgError;

    // Update conversation message count
    const { error: updateError } = await supabase
      .rpc('increment_message_count', { conv_id: conversationId });

    // Fallback if RPC doesn't exist
    if (updateError) {
      await supabase
        .from('chat_conversations')
        .update({ updated_at: now() })
        .eq('id', conversationId);
    }

    return id;
  },

  findByConversation: async (conversationId) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

/**
 * Password Reset Operations
 */
const passwordResets = {
  create: async (userId, token, expiresAt) => {
    const id = generateId();
    const { error } = await supabase
      .from('chat_password_resets')
      .insert({
        id,
        user_id: userId,
        token,
        expires_at: expiresAt,
        used: false,
        created_at: now()
      });

    if (error) throw error;
    return id;
  },

  findByToken: async (token) => {
    const { data, error } = await supabase
      .from('chat_password_resets')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', now())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  markUsed: async (token) => {
    const { error } = await supabase
      .from('chat_password_resets')
      .update({ used: true })
      .eq('token', token);

    if (error) throw error;
  },

  invalidateForUser: async (userId) => {
    const { error } = await supabase
      .from('chat_password_resets')
      .update({ used: true })
      .eq('user_id', userId)
      .eq('used', false);

    if (error) throw error;
  },

  cleanup: async () => {
    const { error } = await supabase
      .from('chat_password_resets')
      .delete()
      .or(`expires_at.lt.${now()},used.eq.true`);

    if (error) throw error;
  }
};

module.exports = {
  supabase,
  generateId,
  now,
  chatUsers,
  chatSessions,
  chatSettings,
  chatConversations,
  chatMessages,
  passwordResets
};
