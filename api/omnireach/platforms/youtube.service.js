/**
 * OmniReach AI Creator - YouTube Platform Service
 * YouTube Shorts & Video Publishing Integration
 *
 * @description YouTube OAuth, upload, and metadata management
 * @compliance YouTube API Terms of Service, Content ID system
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class YouTubeService {
  constructor() {
    this.oauth2Client = null;
    this.youtube = null;
    this.stateStore = new Map(); // Temporary state storage for CSRF protection

    this.config = {
      clientId: process.env.YOUTUBE_CLIENT_ID,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
      redirectUri:
        process.env.YOUTUBE_REDIRECT_URI ||
        'http://localhost:3500/api/omnireach/platforms/youtube/callback',
    };

    this.initializeClient();
  }

  /**
   * Initialize OAuth2 client
   */
  initializeClient() {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri
      );

      this.youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client,
      });

      console.log('✅ YouTube OAuth2 client initialized');
    } catch (error) {
      console.error('❌ YouTube client initialization failed:', error.message);
    }
  }

  /**
   * Generate CSRF state token
   * @returns {String} State token
   */
  generateState() {
    const state = crypto.randomBytes(32).toString('hex');
    this.stateStore.set(state, {
      createdAt: Date.now(),
      validated: false,
    });

    // Auto-cleanup after 10 minutes
    setTimeout(
      () => {
        this.stateStore.delete(state);
      },
      10 * 60 * 1000
    );

    return state;
  }

  /**
   * Validate CSRF state token
   * @param {String} state - State token to validate
   * @returns {Boolean} Valid or not
   */
  validateState(state) {
    const stateData = this.stateStore.get(state);

    if (!stateData) {
      console.warn('⚠️ [YouTube] Invalid or expired state token');
      return false;
    }

    if (stateData.validated) {
      console.warn('⚠️ [YouTube] State token already used');
      return false;
    }

    // Mark as validated and delete
    this.stateStore.delete(state);
    return true;
  }

  /**
   * Get OAuth authorization URL
   * @returns {Object} Authorization URL and state
   */
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl',
    ];

    const state = this.generateState();

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state,
    });

    console.log('🔗 YouTube Auth URL generated with state protection');
    return { authUrl, state };
  }

  /**
   * Exchange authorization code for tokens
   * @param {String} code - Authorization code from OAuth callback
   * @param {Object} params - Additional parameters (state, etc.)
   * @returns {Object} Token data
   */
  async connectOAuth(code, params = {}) {
    try {
      console.log('🔐 [YouTube] Exchanging auth code for tokens...');

      // Validate CSRF state token if provided
      if (params.state) {
        if (!this.validateState(params.state)) {
          throw new Error('Invalid or expired state token (CSRF protection)');
        }
        console.log('✅ [YouTube] State token validated');
      }

      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get channel info
      const channelResponse = await this.youtube.channels.list({
        part: 'snippet,contentDetails,statistics',
        mine: true,
      });

      const channel = channelResponse.data.items[0];

      console.log('✅ [YouTube] OAuth connection successful');
      console.log(`   Channel: ${channel.snippet.title}`);
      console.log(`   Subscribers: ${channel.statistics.subscriberCount}`);

      return {
        success: true,
        tokens: tokens,
        accountName: channel.snippet.title,
        channel: {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          customUrl: channel.snippet.customUrl,
          thumbnails: channel.snippet.thumbnails,
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount,
          viewCount: channel.statistics.viewCount,
        },
      };
    } catch (error) {
      console.error('❌ [YouTube] OAuth connection failed:', error.message);
      return {
        success: false,
        error: 'Platform işlem hatası',
      };
    }
  }

  /**
   * Refresh access token
   * @param {Object} tokens - Current tokens with refresh_token
   * @returns {Object} New tokens
   */
  async refreshAccessToken(tokens) {
    try {
      console.log('🔄 [YouTube] Refreshing access token...');

      this.oauth2Client.setCredentials(tokens);
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      console.log('✅ [YouTube] Access token refreshed');

      return {
        success: true,
        tokens: credentials,
      };
    } catch (error) {
      console.error('❌ [YouTube] Token refresh failed:', error.message);
      return {
        success: false,
        error: 'Platform işlem hatası',
      };
    }
  }

  /**
   * Set credentials from stored tokens
   * @param {Object} tokens - Stored OAuth tokens
   */
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
    console.log('🔐 [YouTube] Credentials set from stored tokens');
  }

  /**
   * Upload video to YouTube
   * @param {Object} videoData - Video file and metadata
   * @returns {Object} Upload result
   */
  async uploadVideo(videoData) {
    try {
      console.log('📤 [YouTube] Starting video upload...');
      console.log(`   Title: ${videoData.title}`);
      console.log(`   File: ${videoData.filePath}`);

      const fileSize = fs.statSync(videoData.filePath).size;
      console.log(`   Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      // Prepare metadata
      const videoMetadata = {
        snippet: {
          title: videoData.title,
          description: videoData.description || '',
          tags: videoData.tags || [],
          categoryId: videoData.categoryId || '22', // People & Blogs
          defaultLanguage: 'tr',
          defaultAudioLanguage: 'tr',
        },
        status: {
          privacyStatus: videoData.privacyStatus || 'private', // private, unlisted, public
          selfDeclaredMadeForKids: videoData.madeForKids || false,
          embeddable: true,
          publicStatsViewable: true,
        },
      };

      // If it's a Short, add #Shorts to description
      if (videoData.isShort) {
        videoMetadata.snippet.description += '\n\n#Shorts';
      }

      // Upload video
      const response = await this.youtube.videos.insert({
        part: 'snippet,status',
        requestBody: videoMetadata,
        media: {
          body: fs.createReadStream(videoData.filePath),
        },
      });

      const uploadedVideo = response.data;

      console.log('✅ [YouTube] Video uploaded successfully');
      console.log(`   Video ID: ${uploadedVideo.id}`);
      console.log(`   URL: https://www.youtube.com/watch?v=${uploadedVideo.id}`);

      return {
        success: true,
        videoId: uploadedVideo.id,
        url: `https://www.youtube.com/watch?v=${uploadedVideo.id}`,
        embedUrl: `https://www.youtube.com/embed/${uploadedVideo.id}`,
        title: uploadedVideo.snippet.title,
        publishedAt: uploadedVideo.snippet.publishedAt,
      };
    } catch (error) {
      console.error('❌ [YouTube] Video upload failed:', error.message);
      return {
        success: false,
        error: 'Platform işlem hatası',
      };
    }
  }

  /**
   * Upload custom thumbnail
   * @param {String} videoId - YouTube video ID
   * @param {String} thumbnailPath - Path to thumbnail image
   * @returns {Object} Upload result
   */
  async uploadThumbnail(videoId, thumbnailPath) {
    try {
      console.log('🖼️ [YouTube] Uploading custom thumbnail...');
      console.log(`   Video ID: ${videoId}`);
      console.log(`   Thumbnail: ${thumbnailPath}`);

      const response = await this.youtube.thumbnails.set({
        videoId: videoId,
        media: {
          body: fs.createReadStream(thumbnailPath),
        },
      });

      console.log('✅ [YouTube] Thumbnail uploaded successfully');

      return {
        success: true,
        thumbnails: response.data.items[0],
      };
    } catch (error) {
      console.error('❌ [YouTube] Thumbnail upload failed:', error.message);
      return {
        success: false,
        error: 'Platform işlem hatası',
      };
    }
  }

  /**
   * Update video metadata
   * @param {String} videoId - YouTube video ID
   * @param {Object} updates - Metadata updates
   * @returns {Object} Update result
   */
  async updateVideo(videoId, updates) {
    try {
      console.log('📝 [YouTube] Updating video metadata...');

      const response = await this.youtube.videos.update({
        part: 'snippet,status',
        requestBody: {
          id: videoId,
          ...updates,
        },
      });

      console.log('✅ [YouTube] Video updated successfully');
      return {
        success: true,
        video: response.data,
      };
    } catch (error) {
      console.error('❌ [YouTube] Video update failed:', error.message);
      return {
        success: false,
        error: 'Platform işlem hatası',
      };
    }
  }

  /**
   * Get video statistics
   * @param {String} videoId - YouTube video ID
   * @returns {Object} Video statistics
   */
  async getVideoStats(videoId) {
    try {
      const response = await this.youtube.videos.list({
        part: 'statistics,snippet',
        id: videoId,
      });

      const video = response.data.items[0];

      return {
        success: true,
        stats: {
          views: video.statistics.viewCount,
          likes: video.statistics.likeCount,
          comments: video.statistics.commentCount,
          title: video.snippet.title,
          publishedAt: video.snippet.publishedAt,
        },
      };
    } catch (error) {
      console.error('❌ [YouTube] Failed to get video stats:', error.message);
      return {
        success: false,
        error: 'Platform işlem hatası',
      };
    }
  }
}

module.exports = { YouTubeService };
