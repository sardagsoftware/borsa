/* global window, document, navigator, MediaRecorder, fetch, Blob, FileReader, Audio, alert, CustomEvent */
/**
 * AILYDIAN Voice Chat Client - Siri-Like Holographic Interface
 * Voice-to-Voice conversation in Turkish
 *
 * @version 2.0.0 - Inline Siri-style holographic interface
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
    NotAllowedError:
      'Mikrofon izni reddedildi. Lutfen tarayici ayarlarindan mikrofon iznini verin.',
    NotFoundError: 'Mikrofon bulunamadi. Lutfen cihaziniza mikrofon baglayin.',
    NotReadableError:
      'Mikrofon baska bir uygulama tarafindan kullaniliyor. Lutfen diger uygulamalari kapatin.',
    OverconstrainedError: 'Mikrofon ayarlari uyumsuz. Lutfen farkli bir tarayici deneyin.',
    SecurityError: 'Guvenli baglanti (HTTPS) gerekli. Lutfen site adresini kontrol edin.',
    AbortError: 'Mikrofon baglantisi kesildi. Lutfen tekrar deneyin.',
    TypeError: 'Tarayiciniz ses kaydini desteklemiyor.',
    default: 'Mikrofon erisimi basarisiz oldu. Lutfen tarayici ayarlarini kontrol edin.',
  };

  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  let _isPlaying = false; // eslint-disable-line no-unused-vars
  let _audioContext = null; // eslint-disable-line no-unused-vars
  let conversationHistory = [];
  let voiceInterfaceActive = false;

  // UI Elements
  let voiceBtn = null;
  let voiceInterface = null;
  let statusText = null;

  /**
   * Initialize voice chat
   */
  function init() {
    voiceBtn = document.getElementById('voiceChatBtn');
    if (!voiceBtn) {
      console.warn('[VoiceChat] Voice button not found');
      return;
    }

    injectStyles();
    setupEventListeners();
    console.log('[VoiceChat] Siri-like interface initialized');
  }

  /**
   * Inject Siri-like holographic styles
   */
  function injectStyles() {
    if (document.getElementById('siri-voice-styles')) return;

    const style = document.createElement('style');
    style.id = 'siri-voice-styles';
    style.textContent = `
      /* Siri-like Holographic Voice Interface - Blue/Purple Theme */
      .siri-voice-interface {
        position: relative;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem 1rem;
        background: linear-gradient(180deg,
          rgba(124, 92, 255, 0.05) 0%,
          rgba(0, 224, 255, 0.02) 50%,
          transparent 100%
        );
        border-radius: 24px 24px 0 0;
        margin-bottom: 0.5rem;
        animation: siriAppear 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes siriAppear {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* Siri Orb Container */
      .siri-orb-container {
        position: relative;
        width: 120px;
        height: 120px;
        margin-bottom: 1.5rem;
      }

      /* Main Orb - Blue/Purple Theme */
      .siri-orb {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%,
          rgba(124, 92, 255, 0.9) 0%,
          rgba(0, 224, 255, 0.7) 30%,
          rgba(124, 92, 255, 0.5) 60%,
          rgba(59, 130, 246, 0.3) 100%
        );
        box-shadow:
          0 0 40px rgba(124, 92, 255, 0.4),
          0 0 80px rgba(0, 224, 255, 0.2),
          inset 0 0 30px rgba(255, 255, 255, 0.1);
        position: relative;
        z-index: 2;
        animation: siriOrbidle 3s ease-in-out infinite;
      }

      .siri-orb::before {
        content: '';
        position: absolute;
        top: 10%;
        left: 15%;
        width: 30%;
        height: 30%;
        background: radial-gradient(ellipse, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
        border-radius: 50%;
      }

      @keyframes siriOrbidle {
        0%, 100% {
          transform: scale(1);
          box-shadow:
            0 0 40px rgba(124, 92, 255, 0.4),
            0 0 80px rgba(0, 224, 255, 0.2),
            inset 0 0 30px rgba(255, 255, 255, 0.1);
        }
        50% {
          transform: scale(1.02);
          box-shadow:
            0 0 50px rgba(124, 92, 255, 0.5),
            0 0 100px rgba(0, 224, 255, 0.3),
            inset 0 0 40px rgba(255, 255, 255, 0.15);
        }
      }

      /* Recording State - Pulsing */
      .siri-voice-interface.recording .siri-orb {
        animation: siriOrbRecording 0.8s ease-in-out infinite;
        background: radial-gradient(circle at 30% 30%,
          rgba(239, 68, 68, 0.9) 0%,
          rgba(220, 38, 38, 0.7) 30%,
          rgba(185, 28, 28, 0.5) 60%,
          rgba(127, 29, 29, 0.3) 100%
        );
        box-shadow:
          0 0 50px rgba(239, 68, 68, 0.5),
          0 0 100px rgba(239, 68, 68, 0.3),
          inset 0 0 30px rgba(255, 255, 255, 0.1);
      }

      @keyframes siriOrbRecording {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.08);
        }
      }

      /* Processing State - Spinning */
      .siri-voice-interface.processing .siri-orb {
        animation: siriOrbProcessing 1.5s linear infinite;
        background: conic-gradient(from 0deg,
          rgba(16, 163, 127, 0.9),
          rgba(0, 212, 170, 0.7),
          rgba(59, 130, 246, 0.7),
          rgba(139, 92, 246, 0.7),
          rgba(16, 163, 127, 0.9)
        );
      }

      @keyframes siriOrbProcessing {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Glow Rings - Blue/Purple */
      .siri-glow-ring {
        position: absolute;
        border-radius: 50%;
        border: 2px solid rgba(124, 92, 255, 0.3);
        animation: siriGlowExpand 2s ease-out infinite;
        pointer-events: none;
      }

      .siri-glow-ring:nth-child(1) {
        inset: -15px;
        animation-delay: 0s;
      }

      .siri-glow-ring:nth-child(2) {
        inset: -30px;
        animation-delay: 0.5s;
      }

      .siri-glow-ring:nth-child(3) {
        inset: -45px;
        animation-delay: 1s;
      }

      .siri-voice-interface:not(.recording):not(.processing) .siri-glow-ring {
        animation-play-state: paused;
        opacity: 0.3;
      }

      @keyframes siriGlowExpand {
        0% {
          transform: scale(1);
          opacity: 0.5;
        }
        100% {
          transform: scale(1.3);
          opacity: 0;
        }
      }

      /* Voice Visualizer Bars */
      .siri-voice-bars {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        height: 50px;
        margin-bottom: 1rem;
      }

      .siri-voice-bar {
        width: 4px;
        height: 20px;
        background: linear-gradient(to top, #7C5CFF, #00E0FF);
        border-radius: 2px;
        transition: height 0.1s ease;
      }

      .siri-voice-interface.recording .siri-voice-bar {
        animation: siriBarPulse 0.4s ease-in-out infinite;
      }

      .siri-voice-bar:nth-child(1) { animation-delay: 0s; }
      .siri-voice-bar:nth-child(2) { animation-delay: 0.05s; }
      .siri-voice-bar:nth-child(3) { animation-delay: 0.1s; }
      .siri-voice-bar:nth-child(4) { animation-delay: 0.15s; }
      .siri-voice-bar:nth-child(5) { animation-delay: 0.2s; }
      .siri-voice-bar:nth-child(6) { animation-delay: 0.25s; }
      .siri-voice-bar:nth-child(7) { animation-delay: 0.3s; }
      .siri-voice-bar:nth-child(8) { animation-delay: 0.35s; }
      .siri-voice-bar:nth-child(9) { animation-delay: 0.4s; }
      .siri-voice-bar:nth-child(10) { animation-delay: 0.45s; }
      .siri-voice-bar:nth-child(11) { animation-delay: 0.5s; }
      .siri-voice-bar:nth-child(12) { animation-delay: 0.55s; }

      @keyframes siriBarPulse {
        0%, 100% { height: 10px; }
        50% { height: 40px; }
      }

      .siri-voice-interface:not(.recording) .siri-voice-bar {
        height: 4px;
        opacity: 0.3;
      }

      /* Status Text */
      .siri-status {
        color: #fff;
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 1.25rem;
        text-align: center;
        min-height: 1.5rem;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }

      /* Action Buttons */
      .siri-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .siri-mic-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7C5CFF 0%, #00E0FF 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        box-shadow: 0 4px 20px rgba(124, 92, 255, 0.4);
        transition: all 0.2s;
      }

      .siri-mic-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 30px rgba(124, 92, 255, 0.5);
      }

      .siri-mic-btn:active {
        transform: scale(0.95);
      }

      .siri-voice-interface.recording .siri-mic-btn {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
      }

      .siri-mic-btn .mic-icon,
      .siri-mic-btn .stop-icon {
        width: 28px;
        height: 28px;
      }

      .siri-mic-btn .stop-icon {
        display: none;
      }

      .siri-voice-interface.recording .siri-mic-btn .mic-icon {
        display: none;
      }

      .siri-voice-interface.recording .siri-mic-btn .stop-icon {
        display: block;
      }

      .siri-close-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
        transition: all 0.2s;
      }

      .siri-close-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
      }

      /* Hint Text */
      .siri-hint {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.8rem;
        margin-top: 1rem;
        text-align: center;
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        .siri-voice-interface {
          padding: 1.5rem 1rem;
        }

        .siri-orb-container {
          width: 100px;
          height: 100px;
        }

        .siri-glow-ring:nth-child(1) { inset: -10px; }
        .siri-glow-ring:nth-child(2) { inset: -20px; }
        .siri-glow-ring:nth-child(3) { inset: -30px; }

        .siri-mic-btn {
          width: 54px;
          height: 54px;
        }

        .siri-voice-bars {
          height: 40px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Create inline Siri-like voice interface
   */
  function createVoiceInterface() {
    // Remove existing if any
    if (voiceInterface) {
      voiceInterface.remove();
    }

    const container = document.createElement('div');
    container.id = 'siriVoiceInterface';
    container.className = 'siri-voice-interface';
    container.innerHTML = `
      <!-- Siri Orb with Glow -->
      <div class="siri-orb-container">
        <div class="siri-glow-ring"></div>
        <div class="siri-glow-ring"></div>
        <div class="siri-glow-ring"></div>
        <div class="siri-orb"></div>
      </div>

      <!-- Voice Visualization Bars -->
      <div class="siri-voice-bars">
        <div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div>
      </div>

      <!-- Status -->
      <p class="siri-status" id="siriStatus">Mikrofona dokunun ve konusmaya baslayin</p>

      <!-- Actions -->
      <div class="siri-actions">
        <button class="siri-close-btn" id="siriCloseBtn" title="Kapat">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <button class="siri-mic-btn" id="siriMicBtn" title="Kaydet">
          <svg class="mic-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
          <svg class="stop-icon" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        </button>
      </div>

      <!-- Hint -->
      <p class="siri-hint">Butona basin ve konusmaya baslayin</p>
    `;

    voiceInterface = container;
    statusText = container.querySelector('#siriStatus');

    // Setup interface event listeners
    container.querySelector('#siriCloseBtn')?.addEventListener('click', closeVoiceInterface);
    container.querySelector('#siriMicBtn')?.addEventListener('click', toggleRecording);

    return container;
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Main voice button
    voiceBtn.addEventListener('click', openVoiceInterface);

    // Close on escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && voiceInterfaceActive) {
        closeVoiceInterface();
      }
    });
  }

  /**
   * Open inline voice interface
   */
  async function openVoiceInterface() {
    if (voiceInterfaceActive) return;

    // Check browser support first
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Tarayiciniz ses kaydini desteklemiyor. Lutfen Chrome, Firefox veya Safari kullanin.');
      return;
    }

    // Create interface
    const container = createVoiceInterface();

    // Insert into chat area - before the input wrapper
    const inputWrapper = document.querySelector('.input-wrapper');
    const inputContainer = document.querySelector('.input-container');

    if (inputContainer && inputWrapper) {
      inputContainer.insertBefore(container, inputWrapper);
    } else if (inputWrapper && inputWrapper.parentNode) {
      inputWrapper.parentNode.insertBefore(container, inputWrapper);
    } else {
      // Fallback - append to main area
      const mainArea = document.querySelector('.main-area') || document.body;
      mainArea.appendChild(container);
    }

    voiceInterfaceActive = true;

    // Pre-check microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      // Release immediately
      stream.getTracks().forEach(track => track.stop());
      updateStatus('Hazir - kaydetmek icin butona basin');
    } catch (error) {
      const message = PERMISSION_ERRORS[error.name] || PERMISSION_ERRORS.default;
      updateStatus(message);
      console.warn('[VoiceChat] Microphone permission error:', error.name);
    }
  }

  /**
   * Close voice interface
   */
  function closeVoiceInterface() {
    if (!voiceInterfaceActive) return;

    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    // Remove interface with animation
    if (voiceInterface) {
      voiceInterface.style.animation = 'siriAppear 0.3s ease reverse';
      setTimeout(() => {
        voiceInterface.remove();
        voiceInterface = null;
      }, 300);
    }

    voiceInterfaceActive = false;
    statusText = null;
  }

  /**
   * Toggle recording
   */
  async function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }

  /**
   * Start recording
   */
  async function startRecording() {
    if (isRecording) return;

    try {
      const browserInfo = getBrowserInfo();

      // Get audio stream with optimal settings
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      };

      // Safari/iOS specific adjustments
      if (browserInfo.isSafari || browserInfo.isIOS) {
        constraints.audio.sampleRate = 44100;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create MediaRecorder with supported MIME type
      const mimeType = getSupportedMimeType();
      const options = { mimeType };

      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch {
        // Fallback without options
        mediaRecorder = new MediaRecorder(stream);
      }

      audioChunks = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        processRecording();
      };

      mediaRecorder.onerror = error => {
        console.error('[VoiceChat] Recording error:', error);
        updateStatus('Kayit hatasi olustu');
        stopRecording();
      };

      mediaRecorder.start(100); // Collect data every 100ms
      isRecording = true;

      // Update UI
      if (voiceInterface) {
        voiceInterface.classList.add('recording');
      }
      updateStatus('Dinliyorum...');

      // Auto-stop after max time
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, CONFIG.maxRecordingTime);

      console.log('[VoiceChat] Recording started');
    } catch (error) {
      const message = PERMISSION_ERRORS[error.name] || PERMISSION_ERRORS.default;
      updateStatus(message);
      console.error('[VoiceChat] Start recording error:', error);
    }
  }

  /**
   * Stop recording
   */
  function stopRecording() {
    if (!isRecording || !mediaRecorder) return;

    try {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    } catch (error) {
      console.error('[VoiceChat] Stop error:', error);
    }

    isRecording = false;

    // Update UI
    if (voiceInterface) {
      voiceInterface.classList.remove('recording');
      voiceInterface.classList.add('processing');
    }
    updateStatus('Isleniyor...');

    console.log('[VoiceChat] Recording stopped');
  }

  /**
   * Process recording and send to API
   */
  async function processRecording() {
    if (audioChunks.length === 0) {
      updateStatus('Ses kaydedilemedi');
      if (voiceInterface) {
        voiceInterface.classList.remove('processing');
      }
      return;
    }

    updateStatus('Yanitiniz hazirlaniyor...');

    try {
      // Create audio blob
      const mimeType = getSupportedMimeType();
      const audioBlob = new Blob(audioChunks, { type: mimeType });

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];

        try {
          // Send to API
          const response = await fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audio: base64Audio,
              mimeType: mimeType,
              history: conversationHistory,
            }),
          });

          const result = await response.json();

          if (result.success) {
            // Update conversation history
            if (result.userText) {
              conversationHistory.push({
                role: 'user',
                content: result.userText,
              });
            }

            if (result.response) {
              conversationHistory.push({
                role: 'assistant',
                content: result.response,
              });

              // Add response to chat
              addMessageToChat(result.userText, 'user');
              addMessageToChat(result.response, 'assistant');
            }

            // Play audio response if available
            if (result.audioResponse) {
              playAudioResponse(result.audioResponse);
            }

            updateStatus('Hazir - tekrar kayit icin butona basin');
          } else {
            updateStatus(result.error || 'Yanit alinamadi');
          }
        } catch (fetchError) {
          console.error('[VoiceChat] API error:', fetchError);
          updateStatus('Baglanti hatasi. Lutfen tekrar deneyin.');
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('[VoiceChat] Process error:', error);
      updateStatus('Islem hatasi');
    } finally {
      if (voiceInterface) {
        voiceInterface.classList.remove('processing');
      }
    }
  }

  /**
   * Play audio response
   */
  function playAudioResponse(base64Audio) {
    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      _isPlaying = true;

      audio.onended = () => {
        _isPlaying = false;
      };

      audio.onerror = () => {
        _isPlaying = false;
        console.error('[VoiceChat] Audio playback error');
      };

      audio.play();
    } catch (error) {
      console.error('[VoiceChat] Play audio error:', error);
    }
  }

  /**
   * Add message to chat UI
   */
  function addMessageToChat(text, role) {
    // Try to use the global addMessage function if available
    if (typeof window.addMessage === 'function') {
      window.addMessage(text, role);
      return;
    }

    // Fallback - dispatch event for chat.html to handle
    const event = new CustomEvent('voiceChatMessage', {
      detail: { text, role },
    });
    document.dispatchEvent(event);
  }

  /**
   * Update status text
   */
  function updateStatus(message) {
    if (statusText) {
      statusText.textContent = message;
    }
  }

  // Export to global
  window.VoiceChat = {
    init,
    open: openVoiceInterface,
    close: closeVoiceInterface,
    isActive: () => voiceInterfaceActive,
    isRecording: () => isRecording,
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();
