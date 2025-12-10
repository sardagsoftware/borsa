/**
 * OmniReach AI Creator - X (Twitter) Platform Service
 * X/Twitter Video Publishing Integration
 *
 * @description X API v2 for video/media publishing
 * @compliance X Developer Agreement, Automation Rules
 */

const axios = require('axios');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const fs = require('fs');

class XService {
  constructor() {
    this.config = {
      apiKey: process.env.X_API_KEY,
      apiSecret: process.env.X_API_SECRET,
      accessToken: process.env.X_ACCESS_TOKEN,
      accessSecret: process.env.X_ACCESS_SECRET,
      callbackUrl: process.env.X_CALLBACK_URL || 'http://localhost:3500/api/omnireach/platforms/x/callback',
      apiUrl: 'https://api.twitter.com',
      uploadUrl: 'https://upload.twitter.com'
    };

    // OAuth 1.0a setup
    this.oauth = OAuth({
      consumer: {
        key: this.config.apiKey,
        secret: this.config.apiSecret
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64');
      }
    });

    console.log('✅ X (Twitter) service initialized');
  }

  /**
   * Get OAuth request token (Step 1 of 3-legged OAuth)
   * @returns {Object} Request token and auth URL
   */
  async getRequestToken() {
    try {
      console.log('🔐 [X] Getting request token...');

      const requestData = {
        url: `${this.config.apiUrl}/oauth/request_token`,
        method: 'POST',
        data: {
          oauth_callback: this.config.callbackUrl
        }
      };

      const response = await axios.post(
        requestData.url,
        requestData.data,
        {
          headers: this.oauth.toHeader(this.oauth.authorize(requestData))
        }
      );

      const params = new URLSearchParams(response.data);
      const oauthToken = params.get('oauth_token');
      const oauthTokenSecret = params.get('oauth_token_secret');

      const authUrl = `${this.config.apiUrl}/oauth/authenticate?oauth_token=${oauthToken}`;

      console.log('✅ [X] Request token obtained');
      return {
        success: true,
        oauthToken: oauthToken,
        oauthTokenSecret: oauthTokenSecret,
        authUrl: authUrl
      };
    } catch (error) {
      console.error('❌ [X] Failed to get request token:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Exchange OAuth verifier for access token (Step 3 of 3-legged OAuth)
   * @param {String} oauthToken - OAuth token from callback
   * @param {String} oauthVerifier - OAuth verifier from callback
   * @returns {Object} Access token and user info
   */
  async connectOAuth(oauthToken, oauthVerifier) {
    try {
      console.log('🔐 [X] Exchanging verifier for access token...');

      const requestData = {
        url: `${this.config.apiUrl}/oauth/access_token`,
        method: 'POST',
        data: {
          oauth_token: oauthToken,
          oauth_verifier: oauthVerifier
        }
      };

      const response = await axios.post(
        requestData.url,
        requestData.data,
        {
          headers: this.oauth.toHeader(this.oauth.authorize(requestData))
        }
      );

      const params = new URLSearchParams(response.data);
      const accessToken = params.get('oauth_token');
      const accessSecret = params.get('oauth_token_secret');
      const userId = params.get('user_id');
      const screenName = params.get('screen_name');

      // Get user details
      const userInfo = await this.getUserInfo(userId, accessToken, accessSecret);

      console.log('✅ [X] OAuth connection successful');
      console.log(`   User: @${screenName}`);

      return {
        success: true,
        accessToken: accessToken,
        accessSecret: accessSecret,
        user: {
          id: userId,
          screenName: screenName,
          ...userInfo
        }
      };
    } catch (error) {
      console.error('❌ [X] OAuth connection failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user information
   * @param {String} userId - User ID
   * @param {String} accessToken - Access token
   * @param {String} accessSecret - Access secret
   * @returns {Object} User information
   */
  async getUserInfo(userId, accessToken, accessSecret) {
    try {
      const token = {
        key: accessToken,
        secret: accessSecret
      };

      const requestData = {
        url: `${this.config.apiUrl}/2/users/${userId}`,
        method: 'GET'
      };

      const response = await axios.get(
        `${requestData.url}?user.fields=created_at,description,public_metrics,profile_image_url`,
        {
          headers: this.oauth.toHeader(this.oauth.authorize(requestData, token))
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('❌ [X] Failed to get user info:', error.message);
      return null;
    }
  }

  /**
   * Publish post with video to X
   * @param {Object} postData - Post text and video data
   * @returns {Object} Publish result
   */
  async publishPost(postData) {
    try {
      console.log('📤 [X] Publishing post with video...');
      console.log(`   Text: ${postData.text?.substring(0, 50)}...`);

      const { accessToken, accessSecret, text, videoPath } = postData;

      const token = {
        key: accessToken,
        secret: accessSecret
      };

      // Step 1: Upload video
      console.log('📹 Uploading video...');
      const mediaId = await this.uploadVideo(videoPath, token);

      if (!mediaId) {
        throw new Error('Video upload failed');
      }

      // Step 2: Create tweet with media
      console.log('📝 Creating tweet...');
      const tweetData = {
        text: text,
        media: {
          media_ids: [mediaId]
        }
      };

      const requestData = {
        url: `${this.config.apiUrl}/2/tweets`,
        method: 'POST',
        data: tweetData
      };

      const response = await axios.post(
        requestData.url,
        requestData.data,
        {
          headers: {
            ...this.oauth.toHeader(this.oauth.authorize(requestData, token)),
            'Content-Type': 'application/json'
          }
        }
      );

      const tweet = response.data.data;

      console.log('✅ [X] Post published successfully');
      console.log(`   Tweet ID: ${tweet.id}`);
      console.log(`   URL: https://twitter.com/i/web/status/${tweet.id}`);

      return {
        success: true,
        tweetId: tweet.id,
        url: `https://twitter.com/i/web/status/${tweet.id}`,
        text: tweet.text
      };
    } catch (error) {
      console.error('❌ [X] Post publishing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload video to X
   * @param {String} videoPath - Path to video file
   * @param {Object} token - OAuth token
   * @returns {String} Media ID
   */
  async uploadVideo(videoPath, token) {
    try {
      const videoBuffer = fs.readFileSync(videoPath);
      const videoSize = videoBuffer.length;

      console.log(`   Video size: ${(videoSize / 1024 / 1024).toFixed(2)} MB`);

      // Step 1: INIT
      console.log('   INIT: Initializing upload...');
      const initData = {
        url: `${this.config.uploadUrl}/1.1/media/upload.json`,
        method: 'POST',
        data: {
          command: 'INIT',
          total_bytes: videoSize,
          media_type: 'video/mp4',
          media_category: 'tweet_video'
        }
      };

      const initResponse = await axios.post(
        initData.url,
        new URLSearchParams(initData.data),
        {
          headers: this.oauth.toHeader(this.oauth.authorize(initData, token))
        }
      );

      const mediaId = initResponse.data.media_id_string;
      console.log(`   Media ID: ${mediaId}`);

      // Step 2: APPEND (upload chunks)
      console.log('   APPEND: Uploading chunks...');
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      let segmentIndex = 0;

      for (let i = 0; i < videoSize; i += chunkSize) {
        const chunk = videoBuffer.slice(i, Math.min(i + chunkSize, videoSize));

        const appendData = {
          url: `${this.config.uploadUrl}/1.1/media/upload.json`,
          method: 'POST'
        };

        const formData = new FormData();
        formData.append('command', 'APPEND');
        formData.append('media_id', mediaId);
        formData.append('segment_index', segmentIndex);
        formData.append('media', chunk);

        await axios.post(
          appendData.url,
          formData,
          {
            headers: {
              ...this.oauth.toHeader(this.oauth.authorize(appendData, token)),
              ...formData.getHeaders()
            }
          }
        );

        const progress = ((i + chunk.length) / videoSize * 100).toFixed(1);
        console.log(`   Segment ${segmentIndex} uploaded (${progress}%)`);
        segmentIndex++;
      }

      // Step 3: FINALIZE
      console.log('   FINALIZE: Processing video...');
      const finalizeData = {
        url: `${this.config.uploadUrl}/1.1/media/upload.json`,
        method: 'POST',
        data: {
          command: 'FINALIZE',
          media_id: mediaId
        }
      };

      const finalizeResponse = await axios.post(
        finalizeData.url,
        new URLSearchParams(finalizeData.data),
        {
          headers: this.oauth.toHeader(this.oauth.authorize(finalizeData, token))
        }
      );

      // Step 4: Check processing status (if needed)
      if (finalizeResponse.data.processing_info) {
        console.log('   STATUS: Checking processing status...');
        await this.waitForProcessing(mediaId, token);
      }

      console.log('✅ Video upload complete');
      return mediaId;
    } catch (error) {
      console.error('❌ Video upload failed:', error.message);
      return null;
    }
  }

  /**
   * Wait for video processing to complete
   * @param {String} mediaId - Media ID
   * @param {Object} token - OAuth token
   */
  async waitForProcessing(mediaId, token) {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await this.sleep(5000);

      const statusData = {
        url: `${this.config.uploadUrl}/1.1/media/upload.json`,
        method: 'GET',
        data: {
          command: 'STATUS',
          media_id: mediaId
        }
      };

      const response = await axios.get(
        statusData.url,
        {
          params: statusData.data,
          headers: this.oauth.toHeader(this.oauth.authorize(statusData, token))
        }
      );

      const processingInfo = response.data.processing_info;

      if (processingInfo.state === 'succeeded') {
        console.log('   Processing complete');
        return;
      } else if (processingInfo.state === 'failed') {
        throw new Error('Video processing failed');
      } else {
        console.log(`   Processing... (${processingInfo.state})`);
      }

      attempts++;
    }

    throw new Error('Video processing timeout');
  }

  /**
   * Helper: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { XService };
