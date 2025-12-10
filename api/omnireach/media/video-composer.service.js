/**
 * OmniReach AI Creator - Video Composer Service
 * FFmpeg-Based Video Composition Engine
 *
 * @description Compose final videos from avatar, voice, and script
 * @dependencies FFmpeg for video processing, Azure Media Services
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const execPromise = promisify(exec);

class VideoComposerService {
  constructor() {
    this.config = {
      // FFmpeg settings
      ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
      tempDir: process.env.TEMP_DIR || '/tmp/omnireach',

      // Video presets
      presets: {
        youtube: {
          resolution: '1920x1080',
          fps: 30,
          videoBitrate: '5000k',
          audioBitrate: '192k',
          format: 'mp4',
          codec: 'libx264'
        },
        'youtube-shorts': {
          resolution: '1080x1920',
          fps: 30,
          videoBitrate: '4000k',
          audioBitrate: '192k',
          format: 'mp4',
          codec: 'libx264'
        },
        instagram: {
          resolution: '1080x1920',
          fps: 30,
          videoBitrate: '3500k',
          audioBitrate: '128k',
          format: 'mp4',
          codec: 'libx264'
        },
        tiktok: {
          resolution: '1080x1920',
          fps: 30,
          videoBitrate: '3000k',
          audioBitrate: '128k',
          format: 'mp4',
          codec: 'libx264'
        },
        facebook: {
          resolution: '1920x1080',
          fps: 30,
          videoBitrate: '4000k',
          audioBitrate: '192k',
          format: 'mp4',
          codec: 'libx264'
        },
        x: {
          resolution: '1280x720',
          fps: 30,
          videoBitrate: '2500k',
          audioBitrate: '128k',
          format: 'mp4',
          codec: 'libx264'
        }
      },

      // Watermark settings
      watermark: {
        enabled: true,
        text: 'AI Generated',
        position: 'bottom-right',
        fontSize: 24,
        fontColor: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)'
      }
    };

    // Ensure temp directory exists
    this.ensureTempDir();

    console.log('✅ Video Composer Service initialized');
  }

  /**
   * Ensure temp directory exists
   */
  ensureTempDir() {
    if (!fs.existsSync(this.config.tempDir)) {
      fs.mkdirSync(this.config.tempDir, { recursive: true });
      console.log(`📁 Created temp directory: ${this.config.tempDir}`);
    }
  }

  /**
   * Compose video from components
   * @param {Object} components - Video components (avatar, voice, script)
   * @param {Object} options - Composition options
   * @returns {Object} Composed video data
   */
  async composeVideo(components, options) {
    try {
      console.log('🎬 [VideoComposer] Starting video composition...');
      console.log(`   Platform: ${options.platform || 'youtube'}`);
      console.log(`   Duration: ${options.duration || 'auto'}s`);

      const jobId = this.generateJobId();
      const preset = this.config.presets[options.platform] || this.config.presets.youtube;

      // Step 1: Prepare assets
      console.log('📦 Preparing assets...');
      const assets = await this.prepareAssets(components, jobId);

      // Step 2: Create video composition
      console.log('🎨 Creating video composition...');
      const videoPath = await this.createComposition(assets, preset, options, jobId);

      // Step 3: Add audio
      console.log('🎵 Adding audio track...');
      const videoWithAudio = await this.addAudioTrack(videoPath, assets.audioPath, preset, jobId);

      // Step 4: Add watermark (if enabled)
      if (options.watermark !== false) {
        console.log('🏷️ Adding AI watermark...');
        const finalVideo = await this.addWatermark(videoWithAudio, preset, jobId);

        // Clean up intermediate files
        this.cleanupFile(videoPath);
        this.cleanupFile(videoWithAudio);

        videoPath = finalVideo;
      }

      // Step 5: Get video metadata
      const metadata = await this.getVideoMetadata(videoPath);

      console.log('✅ Video composition complete');
      console.log(`   Output: ${videoPath}`);
      console.log(`   Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Duration: ${metadata.duration}s`);

      return {
        success: true,
        jobId: jobId,
        videoPath: videoPath,
        metadata: metadata,
        preset: preset
      };
    } catch (error) {
      console.error('❌ [VideoComposer] Composition failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepare assets for composition
   * @param {Object} components - Video components
   * @param {String} jobId - Job ID
   * @returns {Object} Prepared asset paths
   */
  async prepareAssets(components, jobId) {
    const assets = {};

    // Save avatar image
    if (components.avatar) {
      assets.avatarPath = path.join(this.config.tempDir, `${jobId}_avatar.png`);

      if (components.avatar.imageUrl) {
        await this.downloadFile(components.avatar.imageUrl, assets.avatarPath);
      } else if (components.avatar.imageBase64) {
        const buffer = Buffer.from(components.avatar.imageBase64, 'base64');
        fs.writeFileSync(assets.avatarPath, buffer);
      }

      console.log(`   ✅ Avatar prepared: ${assets.avatarPath}`);
    }

    // Save audio
    if (components.voice) {
      assets.audioPath = path.join(this.config.tempDir, `${jobId}_audio.mp3`);

      if (components.voice.audioBuffer) {
        fs.writeFileSync(assets.audioPath, components.voice.audioBuffer);
      }

      console.log(`   ✅ Audio prepared: ${assets.audioPath}`);
    }

    // Save script
    if (components.script) {
      assets.scriptPath = path.join(this.config.tempDir, `${jobId}_script.txt`);
      fs.writeFileSync(assets.scriptPath, components.script.text);
      console.log(`   ✅ Script prepared: ${assets.scriptPath}`);
    }

    return assets;
  }

  /**
   * Create video composition with avatar
   * @param {Object} assets - Asset paths
   * @param {Object} preset - Video preset
   * @param {Object} options - Composition options
   * @param {String} jobId - Job ID
   * @returns {String} Video path
   */
  async createComposition(assets, preset, options, jobId) {
    const outputPath = path.join(this.config.tempDir, `${jobId}_video_noaudio.mp4`);

    // Get audio duration to set video duration
    const audioDuration = await this.getAudioDuration(assets.audioPath);

    // FFmpeg command to create video from static image
    const command = [
      this.config.ffmpegPath,
      '-loop 1',
      `-i "${assets.avatarPath}"`,
      '-c:v', preset.codec,
      '-t', audioDuration,
      '-pix_fmt yuv420p',
      '-vf', `scale=${preset.resolution.replace('x', ':')}:force_original_aspect_ratio=decrease,pad=${preset.resolution.replace('x', ':')}:(ow-iw)/2:(oh-ih)/2`,
      '-r', preset.fps,
      '-b:v', preset.videoBitrate,
      '-y',
      `"${outputPath}"`
    ].join(' ');

    console.log(`   Executing FFmpeg...`);
    await execPromise(command);

    return outputPath;
  }

  /**
   * Add audio track to video
   * @param {String} videoPath - Video file path
   * @param {String} audioPath - Audio file path
   * @param {Object} preset - Video preset
   * @param {String} jobId - Job ID
   * @returns {String} Video with audio path
   */
  async addAudioTrack(videoPath, audioPath, preset, jobId) {
    const outputPath = path.join(this.config.tempDir, `${jobId}_video_withaudio.mp4`);

    const command = [
      this.config.ffmpegPath,
      `-i "${videoPath}"`,
      `-i "${audioPath}"`,
      '-c:v copy',
      '-c:a aac',
      '-b:a', preset.audioBitrate,
      '-shortest',
      '-y',
      `"${outputPath}"`
    ].join(' ');

    await execPromise(command);

    return outputPath;
  }

  /**
   * Add watermark to video
   * @param {String} videoPath - Video file path
   * @param {Object} preset - Video preset
   * @param {String} jobId - Job ID
   * @returns {String} Video with watermark path
   */
  async addWatermark(videoPath, preset, jobId) {
    const outputPath = path.join(this.config.tempDir, `${jobId}_final.mp4`);

    const watermarkSettings = this.config.watermark;

    // Position calculation
    let position = 'x=W-w-10:y=H-h-10'; // bottom-right
    if (watermarkSettings.position === 'top-right') {
      position = 'x=W-w-10:y=10';
    } else if (watermarkSettings.position === 'top-left') {
      position = 'x=10:y=10';
    } else if (watermarkSettings.position === 'bottom-left') {
      position = 'x=10:y=H-h-10';
    }

    const drawtext = [
      'drawtext',
      `text='${watermarkSettings.text}'`,
      `fontsize=${watermarkSettings.fontSize}`,
      `fontcolor=${watermarkSettings.fontColor}`,
      `box=1`,
      `boxcolor=${watermarkSettings.backgroundColor}`,
      `boxborderw=5`,
      position
    ].join(':');

    const command = [
      this.config.ffmpegPath,
      `-i "${videoPath}"`,
      '-vf', `"${drawtext}"`,
      '-codec:a copy',
      '-y',
      `"${outputPath}"`
    ].join(' ');

    await execPromise(command);

    return outputPath;
  }

  /**
   * Add subtitles/captions to video
   * @param {String} videoPath - Video file path
   * @param {Array} subtitles - Subtitle entries
   * @param {String} jobId - Job ID
   * @returns {String} Video with subtitles path
   */
  async addSubtitles(videoPath, subtitles, jobId) {
    console.log('📝 [VideoComposer] Adding subtitles...');

    const srtPath = path.join(this.config.tempDir, `${jobId}_subtitles.srt`);
    const outputPath = path.join(this.config.tempDir, `${jobId}_with_subs.mp4`);

    // Generate SRT file
    const srtContent = this.generateSRT(subtitles);
    fs.writeFileSync(srtPath, srtContent);

    // Burn subtitles into video
    const command = [
      this.config.ffmpegPath,
      `-i "${videoPath}"`,
      `-vf "subtitles='${srtPath}'"`,
      '-c:a copy',
      '-y',
      `"${outputPath}"`
    ].join(' ');

    await execPromise(command);

    return outputPath;
  }

  /**
   * Generate SRT subtitle format
   * @param {Array} subtitles - Subtitle entries [{start, end, text}]
   * @returns {String} SRT content
   */
  generateSRT(subtitles) {
    let srt = '';

    subtitles.forEach((sub, index) => {
      srt += `${index + 1}\n`;
      srt += `${this.formatSRTTime(sub.start)} --> ${this.formatSRTTime(sub.end)}\n`;
      srt += `${sub.text}\n\n`;
    });

    return srt;
  }

  /**
   * Format time for SRT (HH:MM:SS,mmm)
   */
  formatSRTTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  /**
   * Get audio duration in seconds
   * @param {String} audioPath - Audio file path
   * @returns {Number} Duration in seconds
   */
  async getAudioDuration(audioPath) {
    try {
      const command = `${this.config.ffmpegPath} -i "${audioPath}" 2>&1 | grep "Duration"`;
      const { stdout } = await execPromise(command);

      const match = stdout.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = parseInt(match[3]);
        return hours * 3600 + minutes * 60 + seconds;
      }

      return 60; // Default fallback
    } catch (error) {
      console.warn('⚠️ Could not determine audio duration, using default');
      return 60;
    }
  }

  /**
   * Get video metadata
   * @param {String} videoPath - Video file path
   * @returns {Object} Video metadata
   */
  async getVideoMetadata(videoPath) {
    try {
      const stats = fs.statSync(videoPath);
      const duration = await this.getVideoDuration(videoPath);

      return {
        path: videoPath,
        size: stats.size,
        duration: duration,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      console.error('❌ Failed to get video metadata:', error.message);
      return null;
    }
  }

  /**
   * Get video duration
   * @param {String} videoPath - Video file path
   * @returns {Number} Duration in seconds
   */
  async getVideoDuration(videoPath) {
    try {
      const command = `${this.config.ffmpegPath} -i "${videoPath}" 2>&1 | grep "Duration"`;
      const { stdout } = await execPromise(command);

      const match = stdout.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = parseInt(match[3]);
        return hours * 3600 + minutes * 60 + seconds;
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Download file from URL
   * @param {String} url - File URL
   * @param {String} outputPath - Output path
   */
  async downloadFile(url, outputPath) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(outputPath, response.data);
  }

  /**
   * Clean up temporary file
   * @param {String} filePath - File path to delete
   */
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`   🗑️ Cleaned up: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not cleanup ${filePath}:`, error.message);
    }
  }

  /**
   * Clean up job files
   * @param {String} jobId - Job ID
   */
  cleanupJob(jobId) {
    console.log(`🗑️ [VideoComposer] Cleaning up job ${jobId}...`);

    const files = fs.readdirSync(this.config.tempDir);
    const jobFiles = files.filter(file => file.startsWith(jobId));

    jobFiles.forEach(file => {
      this.cleanupFile(path.join(this.config.tempDir, file));
    });

    console.log(`✅ Cleaned up ${jobFiles.length} files`);
  }

  /**
   * Generate unique job ID
   * @returns {String} Job ID
   */
  generateJobId() {
    return `omnireach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check FFmpeg availability
   * @returns {Boolean} FFmpeg available
   */
  async checkFFmpeg() {
    try {
      await execPromise(`${this.config.ffmpegPath} -version`);
      console.log('✅ FFmpeg is available');
      return true;
    } catch (error) {
      console.error('❌ FFmpeg is not available');
      console.error('   Install FFmpeg: https://ffmpeg.org/download.html');
      return false;
    }
  }
}

module.exports = { VideoComposerService };
