/**
 * OmniReach AI Creator - Instagram Platform Service
 * Instagram Reels Publishing Integration
 *
 * @description Instagram Graph API for Reels and content publishing
 * @compliance Instagram Platform Terms, Content Publishing guidelines
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const crypto = require('crypto');

class InstagramService {
  constructor() {
    this.stateStore = new Map(); // Temporary state storage for CSRF protection

    this.config = {
      appId: process.env.INSTAGRAM_CLIENT_ID || process.env.INSTAGRAM_APP_ID,
      appSecret: process.env.INSTAGRAM_CLIENT_SECRET || process.env.INSTAGRAM_APP_SECRET,
      redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3500/api/omnireach/platforms/instagram/callback',
      graphApiUrl: 'https://graph.facebook.com/v18.0'
    };

    console.log('✅ Instagram service initialized');
  }

  /**
   * Generate CSRF state token
   * @returns {String} State token
   */
  generateState() {
    const state = crypto.randomBytes(32).toString('hex');
    this.stateStore.set(state, {
      createdAt: Date.now(),
      validated: false
    });

    // Auto-cleanup after 10 minutes
    setTimeout(() => {
      this.stateStore.delete(state);
    }, 10 * 60 * 1000);

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
      console.warn('⚠️ [Instagram] Invalid or expired state token');
      return false;
    }

    if (stateData.validated) {
      console.warn('⚠️ [Instagram] State token already used');
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
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement'
    ].join(',');

    const state = this.generateState();

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${this.config.appId}` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
      `&scope=${scopes}` +
      `&response_type=code` +
      `&state=${state}`;

    console.log('🔗 Instagram Auth URL generated with state protection');
    return { authUrl, state };
  }

  /**
   * Exchange authorization code for access token
   * @param {String} code - Authorization code from OAuth callback
   * @param {Object} params - Additional parameters (state, etc.)
   * @returns {Object} Token data with Instagram Business Account ID
   */
  async connectOAuth(code, params = {}) {
    try {
      console.log('🔐 [Instagram] Exchanging auth code for tokens...');

      // Validate CSRF state token if provided
      if (params.state) {
        if (!this.validateState(params.state)) {
          throw new Error('Invalid or expired state token (CSRF protection)');
        }
        console.log('✅ [Instagram] State token validated');
      }

      // Step 1: Exchange code for access token
      const tokenResponse = await axios.get(`${this.config.graphApiUrl}/oauth/access_token`, {
        params: {
          client_id: this.config.appId,
          client_secret: this.config.appSecret,
          redirect_uri: this.config.redirectUri,
          code: code
        }
      });

      const accessToken = tokenResponse.data.access_token;

      // Step 2: Get user's Facebook Pages
      const pagesResponse = await axios.get(`${this.config.graphApiUrl}/me/accounts`, {
        params: {
          access_token: accessToken
        }
      });

      if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
        throw new Error('No Facebook Pages found. Please connect a Facebook Page to your Instagram Business Account.');
      }

      const page = pagesResponse.data.data[0];
      const pageAccessToken = page.access_token;

      // Step 3: Get Instagram Business Account ID
      const igAccountResponse = await axios.get(`${this.config.graphApiUrl}/${page.id}`, {
        params: {
          fields: 'instagram_business_account',
          access_token: pageAccessToken
        }
      });

      if (!igAccountResponse.data.instagram_business_account) {
        throw new Error('No Instagram Business Account linked to this Facebook Page.');
      }

      const igAccountId = igAccountResponse.data.instagram_business_account.id;

      // Step 4: Get Instagram account details
      const igDetailsResponse = await axios.get(`${this.config.graphApiUrl}/${igAccountId}`, {
        params: {
          fields: 'username,name,profile_picture_url,followers_count,follows_count,media_count',
          access_token: pageAccessToken
        }
      });

      const igAccount = igDetailsResponse.data;

      console.log('✅ [Instagram] OAuth connection successful');
      console.log(`   Username: @${igAccount.username}`);
      console.log(`   Followers: ${igAccount.followers_count}`);

      return {
        success: true,
        tokens: {
          access_token: pageAccessToken,
          token_type: 'bearer'
        },
        accountName: `@${igAccount.username}`,
        username: igAccount.username,
        igAccountId: igAccountId,
        account: {
          id: igAccountId,
          username: igAccount.username,
          name: igAccount.name,
          profilePicture: igAccount.profile_picture_url,
          followers: igAccount.followers_count,
          following: igAccount.follows_count,
          mediaCount: igAccount.media_count
        }
      };
    } catch (error) {
      console.error('❌ [Instagram] OAuth connection failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh long-lived access token
   * @param {String} accessToken - Short-lived access token
   * @returns {Object} Long-lived token
   */
  async refreshAccessToken(accessToken) {
    try {
      console.log('🔄 [Instagram] Refreshing access token to long-lived...');

      const response = await axios.get(`${this.config.graphApiUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.config.appId,
          client_secret: this.config.appSecret,
          fb_exchange_token: accessToken
        }
      });

      console.log('✅ [Instagram] Access token refreshed (valid for ~60 days)');

      return {
        success: true,
        tokens: {
          access_token: response.data.access_token,
          token_type: response.data.token_type,
          expires_in: response.data.expires_in
        }
      };
    } catch (error) {
      console.error('❌ [Instagram] Token refresh failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Publish Reel to Instagram
   * @param {Object} reelData - Reel video and metadata
   * @returns {Object} Publish result
   */
  async publishReel(reelData) {
    try {
      console.log('📤 [Instagram] Publishing Reel...');
      console.log(`   Caption: ${reelData.caption?.substring(0, 50)}...`);
      console.log(`   Video URL: ${reelData.videoUrl}`);

      const { accessToken, igAccountId } = reelData;

      // Step 1: Create Reel container
      console.log('🎬 Creating Reel container...');
      const containerResponse = await axios.post(
        `${this.config.graphApiUrl}/${igAccountId}/media`,
        {
          media_type: 'REELS',
          video_url: reelData.videoUrl,
          caption: reelData.caption || '',
          share_to_feed: reelData.shareToFeed !== false, // Default true
          access_token: accessToken
        }
      );

      const containerId = containerResponse.data.id;
      console.log(`   Container ID: ${containerId}`);

      // Step 2: Wait for video processing (poll status)
      console.log('⏳ Waiting for video processing...');
      let isProcessed = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts = 5 minutes max

      while (!isProcessed && attempts < maxAttempts) {
        await this.sleep(10000); // Wait 10 seconds

        const statusResponse = await axios.get(
          `${this.config.graphApiUrl}/${containerId}`,
          {
            params: {
              fields: 'status_code',
              access_token: accessToken
            }
          }
        );

        const statusCode = statusResponse.data.status_code;

        if (statusCode === 'FINISHED') {
          isProcessed = true;
          console.log('✅ Video processing complete');
        } else if (statusCode === 'ERROR') {
          throw new Error('Video processing failed');
        } else {
          console.log(`   Processing... (${statusCode})`);
        }

        attempts++;
      }

      if (!isProcessed) {
        throw new Error('Video processing timeout');
      }

      // Step 3: Publish the Reel
      console.log('🚀 Publishing Reel...');
      const publishResponse = await axios.post(
        `${this.config.graphApiUrl}/${igAccountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: accessToken
        }
      );

      const mediaId = publishResponse.data.id;

      // Step 4: Get published media details
      const mediaResponse = await axios.get(
        `${this.config.graphApiUrl}/${mediaId}`,
        {
          params: {
            fields: 'id,media_type,permalink,thumbnail_url,timestamp',
            access_token: accessToken
          }
        }
      );

      const media = mediaResponse.data;

      console.log('✅ [Instagram] Reel published successfully');
      console.log(`   Media ID: ${mediaId}`);
      console.log(`   URL: ${media.permalink}`);

      return {
        success: true,
        mediaId: mediaId,
        permalink: media.permalink,
        thumbnailUrl: media.thumbnail_url,
        timestamp: media.timestamp
      };
    } catch (error) {
      console.error('❌ [Instagram] Reel publishing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get media insights (after 24 hours)
   * @param {String} mediaId - Instagram media ID
   * @param {String} accessToken - Access token
   * @returns {Object} Media insights
   */
  async getMediaInsights(mediaId, accessToken) {
    try {
      const response = await axios.get(
        `${this.config.graphApiUrl}/${mediaId}/insights`,
        {
          params: {
            metric: 'impressions,reach,likes,comments,shares,saves,plays,total_interactions',
            access_token: accessToken
          }
        }
      );

      const insights = {};
      response.data.data.forEach(metric => {
        insights[metric.name] = metric.values[0].value;
      });

      console.log('✅ [Instagram] Media insights retrieved');
      return {
        success: true,
        insights: insights
      };
    } catch (error) {
      console.error('❌ [Instagram] Failed to get insights:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get account insights
   * @param {String} igAccountId - Instagram Business Account ID
   * @param {String} accessToken - Access token
   * @returns {Object} Account insights
   */
  async getAccountInsights(igAccountId, accessToken) {
    try {
      const response = await axios.get(
        `${this.config.graphApiUrl}/${igAccountId}/insights`,
        {
          params: {
            metric: 'impressions,reach,profile_views,follower_count',
            period: 'day',
            access_token: accessToken
          }
        }
      );

      const insights = {};
      response.data.data.forEach(metric => {
        insights[metric.name] = metric.values[0].value;
      });

      console.log('✅ [Instagram] Account insights retrieved');
      return {
        success: true,
        insights: insights
      };
    } catch (error) {
      console.error('❌ [Instagram] Failed to get account insights:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { InstagramService };
