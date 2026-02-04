/* global window, document, navigator, MediaRecorder, AudioContext, fetch, Blob, FileReader, atob, URL, Audio, alert */
/**
 * AILYDIAN Voice Chat Client
 * Voice-to-Voice conversation in Turkish
 *
 * @version 1.0.0
 */

(function () {
  'use strict';

  const CONFIG = {
    apiEndpoint: '/api/voice/chat',
    maxRecordingTime: 30000, // 30 seconds max
    silenceTimeout: 2000, // Stop after 2 seconds of silence
  };

  // Cross-browser MIME type detection
  function getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(type)) {
        return type;
      }
    }
    return 'audio/webm'; // Fallback
  }

  // Browser detection for compatibility
  function getBrowserInfo() {
    const ua = navigator.userAgent;
    return {
      isChrome: /Chrome/.test(ua) && !/Edge/.test(ua),
      isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
      isFirefox: /Firefox/.test(ua),
      isEdge: /Edg/.test(ua),
      isMobile: /Mobile|Android|iPhone|iPad/.test(ua),
      isIOS: /iPhone|iPad|iPod/.test(ua),
    };
  }

  // Permission error messages in Turkish
  const PERMISSION_ERRORS = {
    NotAllowedError: 'Mikrofon izni reddedildi. Lütfen tarayıcı ayarlarından mikrofon iznini verin.',
    NotFoundError: 'Mikrofon bulunamadı. Lütfen cihazınıza mikrofon bağlayın.',
    NotReadableError: 'Mikrofon başka bir uygulama tarafından kullanılıyor. Lütfen diğer uygulamaları kapatın.',
    OverconstrainedError: 'Mikrofon ayarları uyumsuz. Lütfen farklı bir tarayıcı deneyin.',
    SecurityError: 'Güvenli bağlantı (HTTPS) gerekli. Lütfen site adresini kontrol edin.',
    AbortError: 'Mikrofon bağlantısı kesildi. Lütfen tekrar deneyin.',
    TypeError: 'Tarayıcınız ses kaydını desteklemiyor.',
    default: 'Mikrofon erişimi başarısız oldu. Lütfen tarayıcı ayarlarını kontrol edin.',
  };

  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  let _isPlaying = false; // eslint-disable-line no-unused-vars
  let _audioContext = null; // eslint-disable-line no-unused-vars
  let conversationHistory = [];

  // UI Elements
  let voiceBtn = null;
  let voiceOverlay = null;
  let statusText = null;
  let _waveContainer = null; // eslint-disable-line no-unused-vars

  /**
   * Initialize voice chat
   */
  function init() {
    voiceBtn = document.getElementById('voiceChatBtn');
    if (!voiceBtn) {
      console.warn('[VoiceChat] Voice button not found');
      return;
    }

    createVoiceOverlay();
    setupEventListeners();
    console.log('[VoiceChat] Initialized');
  }

  /**
   * Create voice chat overlay UI
   */
  function createVoiceOverlay() {
    // Check if already exists
    if (document.getElementById('voiceChatOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'voiceChatOverlay';
    overlay.className = 'voice-chat-overlay';
    overlay.innerHTML = `
      <div class="voice-chat-modal">
        <button class="voice-close-btn" id="voiceCloseBtn">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        <div class="voice-avatar">
          <div class="voice-avatar-inner">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
          <div class="voice-pulse"></div>
        </div>

        <div class="voice-wave-container" id="voiceWaveContainer">
          <div class="voice-wave"></div>
          <div class="voice-wave"></div>
          <div class="voice-wave"></div>
          <div class="voice-wave"></div>
          <div class="voice-wave"></div>
        </div>

        <p class="voice-status" id="voiceStatus">Mikrofona dokunun ve konusmaya baslayin</p>

        <button class="voice-record-btn" id="voiceRecordBtn">
          <svg class="mic-icon" viewBox="0 0 24 24" width="32" height="32">
            <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
          <svg class="stop-icon" viewBox="0 0 24 24" width="32" height="32" style="display:none">
            <path fill="currentColor" d="M6 6h12v12H6z"/>
          </svg>
        </button>

        <p class="voice-hint">Konusurken butonu basili tutun veya bir kez dokunup konusun</p>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.id = 'voice-chat-styles';
    style.textContent = `
      .voice-chat-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.95);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        padding: 1rem;
        backdrop-filter: blur(10px);
      }
      .voice-chat-overlay.active {
        display: flex;
      }
      .voice-chat-modal {
        background: linear-gradient(135deg, #0a0b0d 0%, #1a1a2e 100%);
        border: 1px solid rgba(16, 163, 127, 0.3);
        border-radius: 24px;
        padding: 2rem;
        max-width: 400px;
        width: 100%;
        text-align: center;
        position: relative;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(16, 163, 127, 0.1);
      }
      .voice-close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
        transition: all 0.2s;
      }
      .voice-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
      .voice-avatar {
        width: 120px;
        height: 120px;
        margin: 0 auto 1.5rem;
        position: relative;
      }
      .voice-avatar-inner {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #10a37f 0%, #00d4aa 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        position: relative;
        z-index: 2;
      }
      .voice-pulse {
        position: absolute;
        inset: -10px;
        border-radius: 50%;
        background: rgba(16, 163, 127, 0.3);
        animation: voicePulse 2s ease-in-out infinite;
        opacity: 0;
      }
      .voice-chat-overlay.recording .voice-pulse {
        opacity: 1;
      }
      @keyframes voicePulse {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.2); opacity: 0.1; }
      }
      .voice-wave-container {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 4px;
        height: 40px;
        margin-bottom: 1rem;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .voice-chat-overlay.recording .voice-wave-container,
      .voice-chat-overlay.playing .voice-wave-container {
        opacity: 1;
      }
      .voice-wave {
        width: 4px;
        height: 20px;
        background: linear-gradient(to top, #10a37f, #00d4aa);
        border-radius: 2px;
        animation: voiceWave 1s ease-in-out infinite;
      }
      .voice-wave:nth-child(1) { animation-delay: 0s; }
      .voice-wave:nth-child(2) { animation-delay: 0.1s; }
      .voice-wave:nth-child(3) { animation-delay: 0.2s; }
      .voice-wave:nth-child(4) { animation-delay: 0.3s; }
      .voice-wave:nth-child(5) { animation-delay: 0.4s; }
      @keyframes voiceWave {
        0%, 100% { height: 10px; }
        50% { height: 35px; }
      }
      .voice-status {
        color: #fff;
        font-size: 1.1rem;
        margin: 0 0 1.5rem;
        min-height: 1.5rem;
      }
      .voice-record-btn {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10a37f 0%, #00d4aa 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        margin: 0 auto 1rem;
        transition: all 0.2s;
        box-shadow: 0 4px 20px rgba(16, 163, 127, 0.4);
      }
      .voice-record-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 30px rgba(16, 163, 127, 0.5);
      }
      .voice-record-btn:active {
        transform: scale(0.95);
      }
      .voice-chat-overlay.recording .voice-record-btn {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
      }
      .voice-chat-overlay.recording .mic-icon { display: none; }
      .voice-chat-overlay.recording .stop-icon { display: block; }
      .voice-hint {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.85rem;
        margin: 0;
      }
      .voice-chat-overlay.processing .voice-record-btn {
        pointer-events: none;
        opacity: 0.5;
      }
      .voice-chat-overlay.playing .voice-avatar-inner {
        animation: speaking 0.5s ease-in-out infinite;
      }
      @keyframes speaking {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    voiceOverlay = overlay;
    statusText = document.getElementById('voiceStatus');
    _waveContainer = document.getElementById('voiceWaveContainer');
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Main voice button
    voiceBtn.addEventListener('click', openVoiceChat);

    // Overlay controls
    document.getElementById('voiceCloseBtn')?.addEventListener('click', closeVoiceChat);
    document.getElementById('voiceRecordBtn')?.addEventListener('click', toggleRecording);

    // Close on escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && voiceOverlay?.classList.contains('active')) {
        closeVoiceChat();
      }
    });
  }

  /**
   * Open voice chat overlay with permission pre-check
   */
  async function openVoiceChat() {
    if (!voiceOverlay) return;

    // Check browser support first
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Tarayıcınız ses kaydını desteklemiyor. Lütfen Chrome, Firefox veya Safari kullanın.');
      return;
    }

    voiceOverlay.classList.add('active');

    // Check permission status and show appropriate message
    const permissionStatus = await checkMicrophonePermission();

    if (permissionStatus === 'denied') {
      showPermissionGuidance('NotAllowedError');
    } else if (permissionStatus === 'prompt') {
      updateStatus('Mikrofon butonuna dokunun. İlk kullanımda izin isteyeceğiz.');
    } else {
      updateStatus('Mikrofon butonuna dokunun ve konuşmaya başlayın.');
    }
  }

  /**
   * Close voice chat overlay
   */
  function closeVoiceChat() {
    if (isRecording) {
      stopRecording();
    }
    voiceOverlay?.classList.remove('active', 'recording', 'playing', 'processing');
    conversationHistory = []; // Reset conversation
  }

  /**
   * Toggle recording state
   */
  async function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }

  /**
   * Check microphone permission status
   */
  async function checkMicrophonePermission() {
    try {
      // Check if permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' });
        return result.state; // 'granted', 'denied', 'prompt'
      }
      return 'prompt'; // Assume prompt if API not available
    } catch {
      return 'prompt'; // Fallback
    }
  }

  /**
   * Show permission guidance modal
   */
  function showPermissionGuidance(errorType) {
    const browser = getBrowserInfo();
    let guidance = '';

    if (browser.isIOS) {
      guidance = 'iOS cihazlarda: Ayarlar > Safari > Mikrofon iznini açın.';
    } else if (browser.isSafari) {
      guidance = 'Safari: Adres çubuğundaki site ayarlarından mikrofon iznini verin.';
    } else if (browser.isChrome) {
      guidance = 'Chrome: Adres çubuğundaki kilit ikonuna tıklayıp mikrofon iznini verin.';
    } else if (browser.isFirefox) {
      guidance = 'Firefox: Adres çubuğundaki izinler ikonundan mikrofon iznini verin.';
    } else {
      guidance = 'Tarayıcı ayarlarından mikrofon iznini kontrol edin.';
    }

    const errorMessage = PERMISSION_ERRORS[errorType] || PERMISSION_ERRORS.default;
    updateStatus(`${errorMessage}\n\n${guidance}`);
  }

  /**
   * Start recording audio with enhanced permission handling
   */
  async function startRecording() {
    const browser = getBrowserInfo();

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      updateStatus('Tarayıcınız ses kaydını desteklemiyor. Lütfen modern bir tarayıcı kullanın.');
      return;
    }

    // Check MediaRecorder support
    if (typeof MediaRecorder === 'undefined') {
      updateStatus('Tarayıcınız ses kaydını desteklemiyor. Lütfen Chrome, Firefox veya Safari kullanın.');
      return;
    }

    try {
      // First check permission status
      const permissionStatus = await checkMicrophonePermission();

      if (permissionStatus === 'denied') {
        showPermissionGuidance('NotAllowedError');
        return;
      }

      updateStatus('Mikrofon izni isteniyor...');

      // Request microphone with cross-browser compatible constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      // Add Safari-specific constraints
      if (browser.isSafari || browser.isIOS) {
        constraints.audio.sampleRate = 44100;
        constraints.audio.channelCount = 1;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Get supported MIME type
      const mimeType = getSupportedMimeType();
      console.log('[VoiceChat] Using MIME type:', mimeType);

      audioChunks = [];

      // Create MediaRecorder with fallback options
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType });
      } catch {
        // Fallback without mimeType specification
        console.warn('[VoiceChat] MIME type not supported, using default');
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processRecording();
      };

      mediaRecorder.onerror = event => {
        console.error('[VoiceChat] MediaRecorder error:', event.error);
        stopRecording();
        updateStatus('Ses kaydı sırasında hata oluştu. Lütfen tekrar deneyin.');
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      isRecording = true;
      voiceOverlay?.classList.add('recording');
      updateStatus('Dinliyorum... Konuşabilirsiniz.');

      // Auto-stop after max time
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, CONFIG.maxRecordingTime);

    } catch (error) {
      console.error('[VoiceChat] Microphone error:', error.name, error.message);
      showPermissionGuidance(error.name);
    }
  }

  /**
   * Stop recording
   */
  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    isRecording = false;
    voiceOverlay?.classList.remove('recording');
  }

  /**
   * Process recorded audio
   */
  async function processRecording() {
    if (audioChunks.length === 0) {
      updateStatus('Ses algılanamadı. Lütfen tekrar deneyin.');
      return;
    }

    voiceOverlay?.classList.add('processing');
    updateStatus('İşleniyor...');

    try {
      // Create audio blob with detected MIME type
      const mimeType = getSupportedMimeType();
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      const base64Audio = await blobToBase64(audioBlob);

      // Send to API
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: base64Audio,
          conversationHistory,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed');
      }

      // Update conversation history
      conversationHistory.push({ role: 'user', content: result.userMessage });
      conversationHistory.push({ role: 'assistant', content: result.response });

      // Play response
      updateStatus(result.response.substring(0, 100) + (result.response.length > 100 ? '...' : ''));

      if (result.audio) {
        await playAudio(result.audio, result.audioFormat || 'mp3');
      }
    } catch (error) {
      console.error('[VoiceChat] Processing error:', error);
      updateStatus('Bir hata olustu, tekrar deneyin');
    } finally {
      voiceOverlay?.classList.remove('processing');
    }
  }

  /**
   * Convert blob to base64
   */
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Play audio response
   */
  async function playAudio(base64Audio, format) {
    try {
      _isPlaying = true;
      voiceOverlay?.classList.add('playing');

      const audioData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioData], { type: `audio/${format}` });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audio.onended = () => {
        _isPlaying = false;
        voiceOverlay?.classList.remove('playing');
        URL.revokeObjectURL(audioUrl);
        updateStatus('Konusmak icin mikrofona dokunun');
      };

      await audio.play();
    } catch (error) {
      console.error('[VoiceChat] Audio playback error:', error);
      _isPlaying = false;
      voiceOverlay?.classList.remove('playing');
    }
  }

  /**
   * Update status text
   */
  function updateStatus(text) {
    if (statusText) {
      statusText.textContent = text;
    }
  }

  // Export to global
  window.VoiceChat = {
    init,
    open: openVoiceChat,
    close: closeVoiceChat,
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();
