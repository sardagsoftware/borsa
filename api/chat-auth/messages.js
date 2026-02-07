/**
 * Chat Auth Messages API
 * POST /api/chat-auth/messages - Add message to conversation
 * POST /api/chat-auth/messages/batch - Add multiple messages at once (for syncing)
 */

const { chatConversations, chatMessages } = require('./_lib/db');
const { extractToken, verifyAccessToken } = require('./_lib/jwt');
const { parseCookies } = require('./_lib/cookies');
const { parseBody } = require('./_lib/body-parser');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Parse cookies
  req.cookies = parseCookies(req);

  // Verify authentication
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Giris yapmaniz gerekli'
    });
  }

  const authResult = verifyAccessToken(token);

  if (!authResult.valid) {
    return res.status(401).json({
      success: false,
      error: 'Oturum suresi dolmus'
    });
  }

  const userId = authResult.payload.userId;

  try {
    const body = parseBody(req);
    const { conversationId, messages, role, content, model } = body;

    // Batch mode - add multiple messages at once
    if (Array.isArray(messages) && messages.length > 0) {
      // Verify conversation belongs to user
      const conversation = await chatConversations.findById(conversationId, userId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Sohbet bulunamadi'
        });
      }

      const messageIds = [];
      for (const msg of messages) {
        const messageId = await chatMessages.create(
          conversationId,
          msg.role,
          msg.content,
          msg.model || model || 'premium',
          msg.tokensUsed || 0
        );
        messageIds.push(messageId);
      }

      return res.status(201).json({
        success: true,
        message: 'Mesajlar kaydedildi',
        messageIds
      });
    }

    // Single message mode
    if (!conversationId || !role || !content) {
      return res.status(400).json({
        success: false,
        error: 'conversationId, role ve content gerekli'
      });
    }

    // Verify conversation belongs to user
    const conversation = await chatConversations.findById(conversationId, userId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Sohbet bulunamadi'
      });
    }

    // Create message
    const messageId = await chatMessages.create(
      conversationId,
      role,
      content,
      model || 'premium',
      0
    );

    return res.status(201).json({
      success: true,
      message: 'Mesaj kaydedildi',
      messageId
    });

  } catch (error) {
    console.error('[CHAT_AUTH_MESSAGES_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Islem basarisiz'
    });
  }
};
