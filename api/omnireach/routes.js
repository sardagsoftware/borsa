/**
 * OmniReach AI Creator - Main API Routes
 * Express Router for OmniReach endpoints
 *
 * @description REST API for content creation workflow
 */

const express = require('express');
const router = express.Router();

// Import services
const { EthicsGuard } = require('./ethics-guard');
const { AvatarService } = require('./ai/avatar.service');
const { ScriptService } = require('./ai/script.service');
const { VoiceService } = require('./ai/voice.service');
const { VideoComposerService } = require('./media/video-composer.service');
const { YouTubeService } = require('./platforms/youtube.service');
const { InstagramService } = require('./platforms/instagram.service');
const { FacebookService } = require('./platforms/facebook.service');
const { TikTokService } = require('./platforms/tiktok.service');
const { XService } = require('./platforms/x.service');

// Initialize services
const ethicsGuard = new EthicsGuard();
const avatarService = new AvatarService();
const scriptService = new ScriptService();
const voiceService = new VoiceService();
const videoComposer = new VideoComposerService();

// Platform services
const platformServices = {
  youtube: new YouTubeService(),
  instagram: new InstagramService(),
  facebook: new FacebookService(),
  tiktok: new TikTokService(),
  x: new XService()
};

console.log('🎬 OmniReach API Routes initialized');

/**
 * ========================================
 * AI GENERATION ENDPOINTS
 * ========================================
 */

/**
 * POST /api/omnireach/avatar/generate
 * Generate AI avatar
 */
router.post('/avatar/generate', async (req, res) => {
  try {
    console.log('📥 [API] Avatar generation request');

    const { style, gender, age, ethnicity, provider } = req.body;

    const result = await avatarService.generateAvatar({
      style,
      gender,
      age,
      ethnicity,
      provider
    });

    if (result.success) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ [API] Avatar generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/omnireach/script/generate
 * Generate video script
 */
router.post('/script/generate', async (req, res) => {
  try {
    console.log('📥 [API] Script generation request');

    const { topic, style, platform, tone, keyPoints, duration, provider } = req.body;

    const result = await scriptService.generateScript({
      topic,
      style,
      platform,
      tone,
      keyPoints,
      duration,
      provider
    });

    if (result.success) {
      // Validate script for compliance
      const validation = await scriptService.validateScript(result.script);

      res.json({
        success: true,
        data: result,
        compliance: validation
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ [API] Script generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/omnireach/voice/generate
 * Generate voice from text
 */
router.post('/voice/generate', async (req, res) => {
  try {
    console.log('📥 [API] Voice generation request');

    const { text, voice, language, speed, pitch, provider } = req.body;

    const result = await voiceService.generateVoice({
      text,
      voice,
      language,
      speed,
      pitch,
      provider
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          audioBase64: result.audioBase64,
          metadata: result.metadata
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ [API] Voice generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ========================================
 * CONTENT CREATION WORKFLOW
 * ========================================
 */

/**
 * POST /api/omnireach/create
 * Create complete content (orchestration endpoint)
 */
router.post('/create', async (req, res) => {
  try {
    console.log('📥 [API] Content creation request');

    const {
      topic,
      style,
      platform,
      avatarSettings,
      voiceSettings,
      scriptSettings
    } = req.body;

    // Step 1: Generate script
    console.log('📝 Step 1: Generating script...');
    const scriptResult = await scriptService.generateScript({
      topic,
      style,
      platform,
      ...scriptSettings
    });

    if (!scriptResult.success) {
      throw new Error('Script generation failed: ' + scriptResult.error);
    }

    // Step 2: Validate script compliance
    console.log('🛡️ Step 2: Validating compliance...');
    const scriptValidation = await scriptService.validateScript(scriptResult.script);

    if (!scriptValidation.passed) {
      return res.status(400).json({
        success: false,
        error: 'Script failed compliance checks',
        validation: scriptValidation
      });
    }

    // Step 3: Generate avatar
    console.log('🎨 Step 3: Generating avatar...');
    const avatarResult = await avatarService.generateAvatar(avatarSettings);

    if (!avatarResult.success) {
      throw new Error('Avatar generation failed: ' + avatarResult.error);
    }

    // Step 4: Generate voice
    console.log('🎙️ Step 4: Generating voice...');
    const voiceResult = await voiceService.generateVoice({
      text: scriptResult.script,
      ...voiceSettings
    });

    if (!voiceResult.success) {
      throw new Error('Voice generation failed: ' + voiceResult.error);
    }

    // Step 5: Compose video
    console.log('🎬 Step 5: Composing video...');
    const videoResult = await videoComposer.composeVideo(
      {
        avatar: avatarResult,
        voice: voiceResult,
        script: { text: scriptResult.script }
      },
      {
        platform: platform,
        watermark: true
      }
    );

    if (!videoResult.success) {
      throw new Error('Video composition failed: ' + videoResult.error);
    }

    // Return complete job data
    res.json({
      success: true,
      jobId: videoResult.jobId,
      data: {
        script: scriptResult,
        avatar: avatarResult,
        voice: {
          duration: voiceResult.metadata.duration
        },
        video: {
          path: videoResult.videoPath,
          metadata: videoResult.metadata
        }
      },
      message: 'Content created successfully'
    });

  } catch (error) {
    console.error('❌ [API] Content creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ========================================
 * PLATFORM PUBLISHING ENDPOINTS
 * ========================================
 */

/**
 * GET /api/omnireach/platforms/:platform/auth
 * Get OAuth authorization URL
 */
router.get('/platforms/:platform/auth', (req, res) => {
  try {
    const { platform } = req.params;
    const service = platformServices[platform];

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Platform not supported'
      });
    }

    const authUrl = service.getAuthUrl();

    res.json({
      success: true,
      authUrl: authUrl,
      platform: platform
    });
  } catch (error) {
    console.error('❌ [API] Auth URL error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/omnireach/platforms/:platform/connect
 * Connect platform account (OAuth callback handler)
 */
router.post('/platforms/:platform/connect', async (req, res) => {
  try {
    const { platform } = req.params;
    const { code, ...otherParams } = req.body;

    const service = platformServices[platform];

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Platform not supported'
      });
    }

    const result = await service.connectOAuth(code, otherParams);

    res.json(result);
  } catch (error) {
    console.error('❌ [API] Platform connect error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/omnireach/publish
 * Publish video to platforms
 */
router.post('/publish', async (req, res) => {
  try {
    console.log('📥 [API] Publish request');

    const {
      jobId,
      videoPath,
      platforms,
      metadata
    } = req.body;

    const publishResults = {};

    // Publish to each selected platform
    for (const platformConfig of platforms) {
      const { platform, credentials, settings } = platformConfig;
      const service = platformServices[platform];

      if (!service) {
        publishResults[platform] = {
          success: false,
          error: 'Platform not supported'
        };
        continue;
      }

      console.log(`📤 Publishing to ${platform}...`);

      try {
        let result;

        switch (platform) {
          case 'youtube':
            result = await service.uploadVideo({
              filePath: videoPath,
              title: metadata.title,
              description: metadata.description,
              tags: metadata.tags,
              privacyStatus: settings.privacyStatus || 'private'
            });
            break;

          case 'instagram':
            result = await service.publishReel({
              videoUrl: metadata.videoUrl,
              caption: metadata.caption,
              accessToken: credentials.accessToken,
              igAccountId: credentials.igAccountId
            });
            break;

          case 'facebook':
            result = await service.publishVideoSimple({
              videoUrl: metadata.videoUrl,
              title: metadata.title,
              description: metadata.description,
              pageAccessToken: credentials.pageAccessToken,
              pageId: credentials.pageId
            });
            break;

          case 'tiktok':
            result = await service.publishVideo({
              filePath: videoPath,
              caption: metadata.caption,
              accessToken: credentials.accessToken,
              fileSize: metadata.fileSize
            });
            break;

          case 'x':
            result = await service.publishPost({
              text: metadata.text,
              videoPath: videoPath,
              accessToken: credentials.accessToken,
              accessSecret: credentials.accessSecret
            });
            break;

          default:
            result = {
              success: false,
              error: 'Platform handler not implemented'
            };
        }

        publishResults[platform] = result;

      } catch (error) {
        console.error(`❌ ${platform} publish error:`, error);
        publishResults[platform] = {
          success: false,
          error: error.message
        };
      }
    }

    res.json({
      success: true,
      jobId: jobId,
      results: publishResults
    });

  } catch (error) {
    console.error('❌ [API] Publish error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ========================================
 * COMPLIANCE & VALIDATION
 * ========================================
 */

/**
 * POST /api/omnireach/validate
 * Validate content for compliance
 */
router.post('/validate', async (req, res) => {
  try {
    console.log('📥 [API] Validation request');

    const { script, avatar, settings } = req.body;

    const validation = await ethicsGuard.validateContent({
      script,
      avatar,
      settings
    });

    res.json({
      success: true,
      validation: validation
    });
  } catch (error) {
    console.error('❌ [API] Validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ========================================
 * UTILITY ENDPOINTS
 * ========================================
 */

/**
 * GET /api/omnireach/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      avatar: 'online',
      script: 'online',
      voice: 'online',
      video: 'online',
      ethics: 'online'
    }
  });
});

/**
 * GET /api/omnireach/voices
 * Get available voices
 */
router.get('/voices', async (req, res) => {
  try {
    const { provider, language } = req.query;

    const result = await voiceService.getAvailableVoices(provider, language);

    res.json(result);
  } catch (error) {
    console.error('❌ [API] Get voices error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/omnireach/jobs/:jobId
 * Clean up job files
 */
router.delete('/jobs/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;

    videoComposer.cleanupJob(jobId);

    res.json({
      success: true,
      message: `Job ${jobId} cleaned up`
    });
  } catch (error) {
    console.error('❌ [API] Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
