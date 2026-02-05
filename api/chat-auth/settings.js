/**
 * Chat Auth Settings API
 * GET /api/chat-auth/settings - Get user settings
 * PUT /api/chat-auth/settings - Update user settings
 */

const { chatSettings } = require('./_lib/db');
const { extractToken, verifyAccessToken } = require('./_lib/jwt');
const { parseCookies } = require('./_lib/cookies');
const { parseBody } = require('./_lib/body-parser');

// Allowed themes
const ALLOWED_THEMES = ['dark', 'light', 'system'];
const ALLOWED_LANGUAGES = ['tr', 'en'];
const ALLOWED_MODELS = ['premium', 'standard', 'fast'];
const ALLOWED_FONT_SIZES = ['small', 'medium', 'large'];

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
      // Get settings
      let settings = await chatSettings.get(userId);

      // Create default settings if not exist
      if (!settings) {
        await chatSettings.create(userId);
        settings = await chatSettings.get(userId);
      }

      return res.status(200).json({
        success: true,
        settings: {
          theme: settings.theme,
          language: settings.language,
          fontSize: settings.font_size,
          preferredModel: settings.preferred_model,
          autoSaveHistory: Boolean(settings.auto_save_history),
          notificationsEnabled: Boolean(settings.notifications_enabled),
          soundEnabled: Boolean(settings.sound_enabled),
          customSettings: settings.custom_settings ? JSON.parse(settings.custom_settings) : null
        }
      });
    }

    if (req.method === 'PUT') {
      // Update settings
      const body = parseBody(req);
      const {
        theme,
        language,
        fontSize,
        preferredModel,
        autoSaveHistory,
        notificationsEnabled,
        soundEnabled,
        customSettings
      } = body;

      const updateData = {};

      // Validate and set theme
      if (theme !== undefined) {
        if (!ALLOWED_THEMES.includes(theme)) {
          return res.status(400).json({
            success: false,
            error: 'Geçersiz tema seçimi'
          });
        }
        updateData.theme = theme;
      }

      // Validate and set language
      if (language !== undefined) {
        if (!ALLOWED_LANGUAGES.includes(language)) {
          return res.status(400).json({
            success: false,
            error: 'Geçersiz dil seçimi'
          });
        }
        updateData.language = language;
      }

      // Validate and set font size
      if (fontSize !== undefined) {
        if (!ALLOWED_FONT_SIZES.includes(fontSize)) {
          return res.status(400).json({
            success: false,
            error: 'Geçersiz font boyutu'
          });
        }
        updateData.font_size = fontSize;
      }

      // Validate and set preferred model
      if (preferredModel !== undefined) {
        if (!ALLOWED_MODELS.includes(preferredModel)) {
          return res.status(400).json({
            success: false,
            error: 'Geçersiz model seçimi'
          });
        }
        updateData.preferred_model = preferredModel;
      }

      // Boolean settings
      if (autoSaveHistory !== undefined) {
        updateData.auto_save_history = autoSaveHistory ? 1 : 0;
      }
      if (notificationsEnabled !== undefined) {
        updateData.notifications_enabled = notificationsEnabled ? 1 : 0;
      }
      if (soundEnabled !== undefined) {
        updateData.sound_enabled = soundEnabled ? 1 : 0;
      }

      // Custom settings
      if (customSettings !== undefined) {
        updateData.customSettings = customSettings;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Güncellenecek bir ayar belirtilmedi'
        });
      }

      // Ensure settings record exists
      await chatSettings.create(userId);

      // Update settings
      await chatSettings.update(userId, updateData);

      // Get updated settings
      const settings = await chatSettings.get(userId);

      return res.status(200).json({
        success: true,
        message: 'Ayarlar güncellendi',
        settings: {
          theme: settings.theme,
          language: settings.language,
          fontSize: settings.font_size,
          preferredModel: settings.preferred_model,
          autoSaveHistory: Boolean(settings.auto_save_history),
          notificationsEnabled: Boolean(settings.notifications_enabled),
          soundEnabled: Boolean(settings.sound_enabled)
        }
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('[CHAT_AUTH_SETTINGS_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'İşlem başarısız'
    });
  }
};
