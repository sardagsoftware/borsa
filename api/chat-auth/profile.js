/**
 * Chat Auth Profile API
 * GET /api/chat-auth/profile - Get user profile
 * PUT /api/chat-auth/profile - Update user profile
 */

const { chatUsers } = require('./_lib/db');
const { extractToken, verifyAccessToken } = require('./_lib/jwt');
const { parseCookies } = require('./_lib/cookies');
const { validateDisplayName } = require('./_lib/password');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
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
    if (req.method === 'GET') {
      // Get profile
      const user = await chatUsers.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Kullanıcı bulunamadı'
        });
      }

      return res.status(200).json({
        success: true,
        profile: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at
        }
      });
    }

    if (req.method === 'PUT') {
      // Update profile
      const { displayName, avatarUrl } = req.body;

      // Validate display name if provided
      if (displayName) {
        const nameValidation = validateDisplayName(displayName);
        if (!nameValidation.valid) {
          return res.status(400).json({
            success: false,
            error: nameValidation.error
          });
        }
      }

      // Validate avatar URL if provided
      if (avatarUrl && avatarUrl.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Avatar URL çok uzun'
        });
      }

      // Update profile
      const updateData = {};
      if (displayName) updateData.displayName = displayName;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Güncellenecek bir alan belirtilmedi'
        });
      }

      await chatUsers.updateProfile(userId, updateData);

      // Get updated user
      const user = await chatUsers.findById(userId);

      return res.status(200).json({
        success: true,
        message: 'Profil güncellendi',
        profile: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url
        }
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('[CHAT_AUTH_PROFILE_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'İşlem başarısız'
    });
  }
};
