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

class YouTubeService {
  constructor() {
    this.oauth2Client = null;
    this.youtube = null;

    this.config = {
      clientId: process.env.YOUTUBE_CLIENT_ID,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
      redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3500/api/omnireach/platforms/youtube/callback'
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
        auth: this.oauth2Client
      });

      console.log('✅ YouTube OAuth2 client initialized');
    } catch (error) {
      console.error('❌ YouTube client initialization failed:', error.message);
    }
  }

  /**
   * Get OAuth authorization URL
   * @returns {String} Authorization URL
   */
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    console.log('🔗 YouTube Auth URL generated');
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   * @param {String} code - Authorization code from OAuth callback
   * @returns {Object} Token data
   */
  async connectOAuth(code) {
    try {
      console.log('🔐 [YouTube] Exchanging auth code for tokens...');

      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get channel info
      const channelResponse = await this.youtube.channels.list({
        part: 'snippet,contentDetails,statistics',
        mine: true
      });

      const channel = channelResponse.data.items[0];

      console.log('✅ [YouTube] OAuth connection successful');
      console.log(`   Channel: ${channel.snippet.title}`);
      console.log(`   Subscribers: ${channel.statistics.subscriberCount}`);

      return {
        success: true,
        tokens: tokens,
        channel: {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          customUrl: channel.snippet.customUrl,
          thumbnails: channel.snippet.thumbnails,
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount,
          viewCount: channel.statistics.viewCount
        }
      };
    } catch (error) {
      console.error('❌ [YouTube] OAuth connection failed:', error.message);
      return {
        success: false,
        error: error.message
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
          defaultAudioLanguage: 'tr'
        },
        status: {
          privacyStatus: videoData.privacyStatus || 'private', // private, unlisted, public
          selfDeclaredMadeForKids: videoData.madeForKids || false,
          embeddable: true,
          publicStatsViewable: true
        }
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
          body: fs.createReadStream(videoData.filePath)
        }
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
        publishedAt: uploadedVideo.snippet.publishedAt
      };
    } catch (error) {
      console.error('❌ [YouTube] Video upload failed:', error.message);
      return {
        success: false,
        error: error.message
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
          body: fs.createReadStream(thumbnailPath)
        }
      });

      console.log('✅ [YouTube] Thumbnail uploaded successfully');

      return {
        success: true,
        thumbnails: response.data.items[0]
      };
    } catch (error) {
      console.error('❌ [YouTube] Thumbnail upload failed:', error.message);
      return {
        success: false,
        error: error.message
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
          ...updates
        }
      });

      console.log('✅ [YouTube] Video updated successfully');
      return {
        success: true,
        video: response.data
      };
    } catch (error) {
      console.error('❌ [YouTube] Video update failed:', error.message);
      return {
        success: false,
        error: error.message
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
        id: videoId
      });

      const video = response.data.items[0];

      return {
        success: true,
        stats: {
          views: video.statistics.viewCount,
          likes: video.statistics.likeCount,
          comments: video.statistics.commentCount,
          title: video.snippet.title,
          publishedAt: video.snippet.publishedAt
        }
      };
    } catch (error) {
      console.error('❌ [YouTube] Failed to get video stats:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = { YouTubeService };
