/**
 * OmniReach AI Creator - Facebook Platform Service
 * Facebook Video Publishing Integration
 *
 * @description Facebook Graph API for video publishing
 * @compliance Facebook Platform Terms, Community Standards
 */

const axios = require('axios');
const fs = require('fs');

class FacebookService {
  constructor() {
    this.config = {
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3500/api/omnireach/platforms/facebook/callback',
      graphApiUrl: 'https://graph.facebook.com/v18.0'
    };

    console.log('✅ Facebook service initialized');
  }

  /**
   * Get OAuth authorization URL
   * @returns {String} Authorization URL
   */
  getAuthUrl() {
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'pages_manage_engagement',
      'publish_video'
    ].join(',');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${this.config.appId}` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
      `&scope=${scopes}` +
      `&response_type=code`;

    console.log('🔗 Facebook Auth URL generated');
    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   * @param {String} code - Authorization code from OAuth callback
   * @returns {Object} Token data and page information
   */
  async connectOAuth(code) {
    try {
      console.log('🔐 [Facebook] Exchanging auth code for tokens...');

      // Step 1: Exchange code for user access token
      const tokenResponse = await axios.get(`${this.config.graphApiUrl}/oauth/access_token`, {
        params: {
          client_id: this.config.appId,
          client_secret: this.config.appSecret,
          redirect_uri: this.config.redirectUri,
          code: code
        }
      });

      const userAccessToken = tokenResponse.data.access_token;

      // Step 2: Get user's Facebook Pages
      const pagesResponse = await axios.get(`${this.config.graphApiUrl}/me/accounts`, {
        params: {
          access_token: userAccessToken,
          fields: 'id,name,access_token,category,fan_count,picture'
        }
      });

      if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
        throw new Error('No Facebook Pages found. Please create a Facebook Page first.');
      }

      const pages = pagesResponse.data.data.map(page => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        category: page.category,
        fanCount: page.fan_count,
        picture: page.picture?.data?.url
      }));

      console.log('✅ [Facebook] OAuth connection successful');
      console.log(`   Pages found: ${pages.length}`);
      pages.forEach(page => {
        console.log(`   - ${page.name} (${page.fanCount} fans)`);
      });

      return {
        success: true,
        userAccessToken: userAccessToken,
        pages: pages
      };
    } catch (error) {
      console.error('❌ [Facebook] OAuth connection failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Publish video to Facebook Page
   * @param {Object} videoData - Video file and metadata
   * @returns {Object} Publish result
   */
  async publishVideo(videoData) {
    try {
      console.log('📤 [Facebook] Publishing video...');
      console.log(`   Page ID: ${videoData.pageId}`);
      console.log(`   Title: ${videoData.title}`);

      const { pageAccessToken, pageId } = videoData;

      // Step 1: Initialize video upload
      console.log('🎬 Initializing video upload...');
      const initResponse = await axios.post(
        `${this.config.graphApiUrl}/${pageId}/videos`,
        {
          upload_phase: 'start',
          file_size: videoData.fileSize,
          access_token: pageAccessToken
        }
      );

      const uploadSessionId = initResponse.data.upload_session_id;
      const videoId = initResponse.data.video_id;
      console.log(`   Upload Session ID: ${uploadSessionId}`);

      // Step 2: Upload video chunks
      console.log('📦 Uploading video chunks...');
      const videoBuffer = fs.readFileSync(videoData.filePath);
      const chunkSize = 1024 * 1024 * 5; // 5MB chunks
      let startOffset = 0;

      while (startOffset < videoBuffer.length) {
        const endOffset = Math.min(startOffset + chunkSize, videoBuffer.length);
        const chunk = videoBuffer.slice(startOffset, endOffset);

        await axios.post(
          `${this.config.graphApiUrl}/${pageId}/videos`,
          {
            upload_phase: 'transfer',
            start_offset: startOffset,
            upload_session_id: uploadSessionId,
            video_file_chunk: chunk.toString('base64'),
            access_token: pageAccessToken
          }
        );

        const progress = ((endOffset / videoBuffer.length) * 100).toFixed(1);
        console.log(`   Progress: ${progress}%`);

        startOffset = endOffset;
      }

      // Step 3: Finalize upload
      console.log('✅ Finalizing upload...');
      const finalResponse = await axios.post(
        `${this.config.graphApiUrl}/${pageId}/videos`,
        {
          upload_phase: 'finish',
          upload_session_id: uploadSessionId,
          title: videoData.title,
          description: videoData.description || '',
          access_token: pageAccessToken
        }
      );

      const publishSuccess = finalResponse.data.success;

      if (publishSuccess) {
        // Get video details
        const videoDetailsResponse = await axios.get(
          `${this.config.graphApiUrl}/${videoId}`,
          {
            params: {
              fields: 'id,permalink_url,created_time,picture',
              access_token: pageAccessToken
            }
          }
        );

        const video = videoDetailsResponse.data;

        console.log('✅ [Facebook] Video published successfully');
        console.log(`   Video ID: ${video.id}`);
        console.log(`   URL: ${video.permalink_url}`);

        return {
          success: true,
          videoId: video.id,
          url: video.permalink_url,
          thumbnailUrl: video.picture,
          createdTime: video.created_time
        };
      } else {
        throw new Error('Video publishing failed');
      }
    } catch (error) {
      console.error('❌ [Facebook] Video publishing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Publish video using simple upload (for smaller videos)
   * @param {Object} videoData - Video URL and metadata
   * @returns {Object} Publish result
   */
  async publishVideoSimple(videoData) {
    try {
      console.log('📤 [Facebook] Publishing video (simple method)...');

      const { pageAccessToken, pageId } = videoData;

      const response = await axios.post(
        `${this.config.graphApiUrl}/${pageId}/videos`,
        {
          title: videoData.title,
          description: videoData.description || '',
          file_url: videoData.videoUrl, // Publicly accessible URL
          published: videoData.published !== false, // Default true
          access_token: pageAccessToken
        }
      );

      const videoId = response.data.id;

      // Get video details
      const videoDetailsResponse = await axios.get(
        `${this.config.graphApiUrl}/${videoId}`,
        {
          params: {
            fields: 'id,permalink_url,created_time,picture',
            access_token: pageAccessToken
          }
        }
      );

      const video = videoDetailsResponse.data;

      console.log('✅ [Facebook] Video published successfully');
      console.log(`   Video ID: ${video.id}`);
      console.log(`   URL: ${video.permalink_url}`);

      return {
        success: true,
        videoId: video.id,
        url: video.permalink_url,
        thumbnailUrl: video.picture,
        createdTime: video.created_time
      };
    } catch (error) {
      console.error('❌ [Facebook] Video publishing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get video insights
   * @param {String} videoId - Facebook video ID
   * @param {String} pageAccessToken - Page access token
   * @returns {Object} Video insights
   */
  async getVideoInsights(videoId, pageAccessToken) {
    try {
      const response = await axios.get(
        `${this.config.graphApiUrl}/${videoId}/video_insights`,
        {
          params: {
            metric: 'total_video_views,total_video_impressions,total_video_reactions,total_video_comments,total_video_shares',
            access_token: pageAccessToken
          }
        }
      );

      const insights = {};
      response.data.data.forEach(metric => {
        insights[metric.name] = metric.values[0].value;
      });

      console.log('✅ [Facebook] Video insights retrieved');
      return {
        success: true,
        insights: insights
      };
    } catch (error) {
      console.error('❌ [Facebook] Failed to get insights:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get page insights
   * @param {String} pageId - Facebook page ID
   * @param {String} pageAccessToken - Page access token
   * @returns {Object} Page insights
   */
  async getPageInsights(pageId, pageAccessToken) {
    try {
      const response = await axios.get(
        `${this.config.graphApiUrl}/${pageId}/insights`,
        {
          params: {
            metric: 'page_views_total,page_fans,page_impressions,page_engaged_users',
            period: 'day',
            access_token: pageAccessToken
          }
        }
      );

      const insights = {};
      response.data.data.forEach(metric => {
        insights[metric.name] = metric.values[0].value;
      });

      console.log('✅ [Facebook] Page insights retrieved');
      return {
        success: true,
        insights: insights
      };
    } catch (error) {
      console.error('❌ [Facebook] Failed to get page insights:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = { FacebookService };
