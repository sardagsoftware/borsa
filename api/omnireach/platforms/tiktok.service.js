/**
 * OmniReach AI Creator - TikTok Platform Service
 * TikTok Video Publishing Integration
 *
 * @description TikTok API for video publishing and content sharing
 * @compliance TikTok Developer Terms, Community Guidelines
 */

const axios = require('axios');
const crypto = require('crypto');

class TikTokService {
  constructor() {
    this.config = {
      clientKey: process.env.TIKTOK_CLIENT_KEY,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET,
      redirectUri: process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3500/api/omnireach/platforms/tiktok/callback',
      apiUrl: 'https://open.tiktokapis.com/v2'
    };

    console.log('✅ TikTok service initialized');
  }

  /**
   * Get OAuth authorization URL
   * @returns {String} Authorization URL
   */
  getAuthUrl() {
    const csrfState = crypto.randomBytes(16).toString('hex');

    const scopes = [
      'user.info.basic',
      'video.upload',
      'video.publish'
    ].join(',');

    const authUrl = `https://www.tiktok.com/v2/auth/authorize?` +
      `client_key=${this.config.clientKey}` +
      `&scope=${scopes}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
      `&state=${csrfState}`;

    console.log('🔗 TikTok Auth URL generated');
    console.log(`   CSRF State: ${csrfState}`);

    return {
      authUrl: authUrl,
      csrfState: csrfState
    };
  }

  /**
   * Exchange authorization code for access token
   * @param {String} code - Authorization code from OAuth callback
   * @returns {Object} Token data and user information
   */
  async connectOAuth(code) {
    try {
      console.log('🔐 [TikTok] Exchanging auth code for tokens...');

      // Get access token
      const tokenResponse = await axios.post(
        'https://open.tiktokapis.com/v2/oauth/token/',
        {
          client_key: this.config.clientKey,
          client_secret: this.config.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokenData = tokenResponse.data;
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;
      const openId = tokenData.open_id;

      // Get user info
      const userResponse = await axios.get(
        `${this.config.apiUrl}/user/info/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: {
            fields: 'open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count'
          }
        }
      );

      const user = userResponse.data.data.user;

      console.log('✅ [TikTok] OAuth connection successful');
      console.log(`   User: ${user.display_name}`);
      console.log(`   Followers: ${user.follower_count}`);

      return {
        success: true,
        accessToken: accessToken,
        refreshToken: refreshToken,
        openId: openId,
        user: {
          openId: user.open_id,
          unionId: user.union_id,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          followerCount: user.follower_count,
          followingCount: user.following_count,
          likesCount: user.likes_count,
          videoCount: user.video_count
        }
      };
    } catch (error) {
      console.error('❌ [TikTok] OAuth connection failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh access token
   * @param {String} refreshToken - Refresh token
   * @returns {Object} New token data
   */
  async refreshAccessToken(refreshToken) {
    try {
      console.log('🔄 [TikTok] Refreshing access token...');

      const response = await axios.post(
        'https://open.tiktokapis.com/v2/oauth/token/',
        {
          client_key: this.config.clientKey,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log('✅ [TikTok] Token refreshed successfully');
      return {
        success: true,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token
      };
    } catch (error) {
      console.error('❌ [TikTok] Token refresh failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Publish video to TikTok
   * @param {Object} videoData - Video file and metadata
   * @returns {Object} Publish result
   */
  async publishVideo(videoData) {
    try {
      console.log('📤 [TikTok] Publishing video...');
      console.log(`   Caption: ${videoData.caption?.substring(0, 50)}...`);

      const { accessToken } = videoData;

      // Step 1: Initialize video upload
      console.log('🎬 Initializing video upload...');
      const initResponse = await axios.post(
        `${this.config.apiUrl}/post/publish/video/init/`,
        {
          post_info: {
            title: videoData.caption || '',
            privacy_level: videoData.privacyLevel || 'PUBLIC_TO_EVERYONE', // PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, SELF_ONLY
            disable_duet: videoData.disableDuet || false,
            disable_comment: videoData.disableComment || false,
            disable_stitch: videoData.disableStitch || false,
            video_cover_timestamp_ms: videoData.coverTimestamp || 1000
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: videoData.fileSize,
            chunk_size: videoData.chunkSize || 5000000, // 5MB chunks
            total_chunk_count: Math.ceil(videoData.fileSize / (videoData.chunkSize || 5000000))
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const uploadUrl = initResponse.data.data.upload_url;
      const publishId = initResponse.data.data.publish_id;

      console.log(`   Upload URL received`);
      console.log(`   Publish ID: ${publishId}`);

      // Step 2: Upload video chunks
      console.log('📦 Uploading video chunks...');
      const fs = require('fs');
      const videoBuffer = fs.readFileSync(videoData.filePath);
      const chunkSize = videoData.chunkSize || 5000000;
      let startOffset = 0;
      let chunkNumber = 0;

      while (startOffset < videoBuffer.length) {
        const endOffset = Math.min(startOffset + chunkSize, videoBuffer.length);
        const chunk = videoBuffer.slice(startOffset, endOffset);

        await axios.put(
          uploadUrl,
          chunk,
          {
            headers: {
              'Content-Type': 'video/mp4',
              'Content-Range': `bytes ${startOffset}-${endOffset - 1}/${videoBuffer.length}`,
              'Content-Length': chunk.length
            }
          }
        );

        const progress = ((endOffset / videoBuffer.length) * 100).toFixed(1);
        console.log(`   Chunk ${++chunkNumber} uploaded (${progress}%)`);

        startOffset = endOffset;
      }

      // Step 3: Check upload status
      console.log('⏳ Checking upload status...');
      let uploadComplete = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!uploadComplete && attempts < maxAttempts) {
        await this.sleep(5000); // Wait 5 seconds

        const statusResponse = await axios.post(
          `${this.config.apiUrl}/post/publish/status/fetch/`,
          {
            publish_id: publishId
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const status = statusResponse.data.data.status;

        if (status === 'PUBLISH_COMPLETE') {
          uploadComplete = true;
          console.log('✅ Video published successfully');
        } else if (status === 'FAILED') {
          throw new Error('Video publishing failed');
        } else {
          console.log(`   Status: ${status}`);
        }

        attempts++;
      }

      if (!uploadComplete) {
        throw new Error('Video publishing timeout');
      }

      console.log('✅ [TikTok] Video published successfully');
      console.log(`   Publish ID: ${publishId}`);

      return {
        success: true,
        publishId: publishId,
        message: 'Video published to TikTok'
      };
    } catch (error) {
      console.error('❌ [TikTok] Video publishing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get video info
   * @param {String} accessToken - Access token
   * @param {Array} videoIds - Array of video IDs
   * @returns {Object} Video information
   */
  async getVideoInfo(accessToken, videoIds) {
    try {
      const response = await axios.post(
        `${this.config.apiUrl}/video/query/`,
        {
          filters: {
            video_ids: videoIds
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ [TikTok] Video info retrieved');
      return {
        success: true,
        videos: response.data.data.videos
      };
    } catch (error) {
      console.error('❌ [TikTok] Failed to get video info:', error.message);
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

module.exports = { TikTokService };
