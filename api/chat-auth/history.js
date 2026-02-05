/**
 * Chat Auth History API
 * GET /api/chat-auth/history - Get user's conversation history
 * GET /api/chat-auth/history?id=xxx - Get specific conversation with messages
 * POST /api/chat-auth/history - Create new conversation
 * PUT /api/chat-auth/history - Update conversation
 * DELETE /api/chat-auth/history?id=xxx - Delete conversation
 */

const { chatConversations, chatMessages } = require('./_lib/db');
const { extractToken, verifyAccessToken } = require('./_lib/jwt');
const { parseCookies } = require('./_lib/cookies');
const { parseBody } = require('./_lib/body-parser');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse cookies
  req.cookies = parseCookies(req);

  // Verify authentication
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Giriş yapmanız gerekli'
    });
  }

  const authResult = verifyAccessToken(token);

  if (!authResult.valid) {
    return res.status(401).json({
      success: false,
      error: 'Oturum süresi dolmuş'
    });
  }

  const userId = authResult.payload.userId;

  try {
    // GET - List conversations or get specific conversation
    if (req.method === 'GET') {
      const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
      const conversationId = req.query?.id || urlParams.get('id');

      if (conversationId) {
        // Get specific conversation with messages
        const conversation = await chatConversations.findById(conversationId, userId);

        if (!conversation) {
          return res.status(404).json({
            success: false,
            error: 'Sohbet bulunamadı'
          });
        }

        const messages = await chatMessages.findByConversation(conversationId);

        return res.status(200).json({
          success: true,
          conversation: {
            id: conversation.id,
            title: conversation.title,
            model: conversation.model_used,
            messageCount: conversation.message_count,
            createdAt: conversation.created_at,
            updatedAt: conversation.updated_at
          },
          messages: messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            model: m.model,
            createdAt: m.created_at
          }))
        });
      }

      // List all conversations
      const limit = parseInt(req.query?.limit || urlParams.get('limit')) || 50;
      const conversations = await chatConversations.findByUser(userId, Math.min(limit, 100));

      return res.status(200).json({
        success: true,
        conversations: conversations.map(c => ({
          id: c.id,
          title: c.title,
          model: c.model_used,
          messageCount: c.message_count,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        }))
      });
    }

    // POST - Create new conversation
    if (req.method === 'POST') {
      const body = parseBody(req);
      const { title, model } = body;

      const conversationId = await chatConversations.create(
        userId,
        title || null,
        model || 'premium'
      );

      return res.status(201).json({
        success: true,
        message: 'Sohbet oluşturuldu',
        conversationId
      });
    }

    // PUT - Update conversation (title)
    if (req.method === 'PUT') {
      const body = parseBody(req);
      const { id, title } = body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Sohbet ID gerekli'
        });
      }

      const conversation = await chatConversations.findById(id, userId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Sohbet bulunamadı'
        });
      }

      if (title) {
        await chatConversations.update(id, userId, { title });
      }

      return res.status(200).json({
        success: true,
        message: 'Sohbet güncellendi'
      });
    }

    // DELETE - Delete conversation
    if (req.method === 'DELETE') {
      const deleteParams = new URLSearchParams(req.url?.split('?')[1] || '');
      const conversationId = req.query?.id || deleteParams.get('id');

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: 'Sohbet ID gerekli'
        });
      }

      const conversation = await chatConversations.findById(conversationId, userId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Sohbet bulunamadı'
        });
      }

      await chatConversations.delete(conversationId, userId);

      return res.status(200).json({
        success: true,
        message: 'Sohbet silindi'
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('[CHAT_AUTH_HISTORY_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'İşlem başarısız'
    });
  }
};
