/* global window, document, navigator, MediaRecorder, fetch, Blob, FileReader, Audio, CustomEvent, requestAnimationFrame */
/**
 * AILYDIAN Voice Chat Client - Siri-Like Holographic Interface
 * Voice-to-Voice conversation in Turkish with Premium Permission UI
 *
 * @version 3.0.0 - Premium permission popups + Fixed microphone handling
 */

(function () {
  'use strict';

  const CONFIG = {
    apiEndpoint: '/api/voice/chat',
    maxRecordingTime: 30000, // 30 seconds max
    silenceTimeout: 2000, // Stop after 2 seconds of silence
  };

  // Cross-browser MIME type detection with fallback chain
  function getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=aac',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(type)) {
        console.log('[VoiceChat] Using MIME type:', type);
        return type;
      }
    }
    console.warn('[VoiceChat] No supported MIME type found, using fallback');
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

  // Permission error messages in Turkish (proper Turkish characters)
  const PERMISSION_ERRORS = {
    NotAllowedError:
      'Mikrofon izni reddedildi. Lütfen tarayıcı ayarlarından mikrofon iznini verin.',
    NotFoundError: 'Mikrofon bulunamadı. Lütfen cihazınıza mikrofon bağlayın.',
    NotReadableError:
      'Mikrofon başka bir uygulama tarafından kullanılıyor. Lütfen diğer uygulamaları kapatın.',
    OverconstrainedError: 'Mikrofon ayarları uyumsuz. Lütfen farklı bir tarayıcı deneyin.',
    SecurityError: 'Güvenli bağlantı (HTTPS) gerekli. Lütfen site adresini kontrol edin.',
    AbortError: 'Mikrofon bağlantısı kesildi. Lütfen tekrar deneyin.',
    TypeError: 'Tarayıcınız ses kaydını desteklemiyor.',
    default: 'Mikrofon erişimi başarısız oldu. Lütfen tarayıcı ayarlarını kontrol edin.',
  };

  // ============================================================
  // PREMIUM PERMISSION MANAGER (Google/Apple Quality)
  // ============================================================
  const PermissionManager = {
    // Track permission state
    microphoneState: 'prompt', // 'granted', 'denied', 'prompt'

    /**
     * Check current permission state using Permissions API
     */
    async checkPermissionState() {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'microphone' });
          this.microphoneState = result.state;
          // Listen for permission changes
          result.addEventListener('change', () => {
            this.microphoneState = result.state;
            console.log('[VoiceChat] Permission state changed:', result.state);
          });
          return result.state;
        }
      } catch (_e) {
        console.log('[VoiceChat] Permissions API not supported, will prompt user');
      }
      return 'prompt';
    },

    /**
     * Show premium permission popup (Google/Apple style)
     */
    showPermissionPopup() {
      return new Promise(resolve => {
        // Check if popup already exists
        if (document.getElementById('premiumPermissionPopup')) {
          resolve(true);
          return;
        }

        const popup = document.createElement('div');
        popup.id = 'premiumPermissionPopup';
        popup.className = 'permission-popup-overlay';
        popup.innerHTML = `
          <div class="permission-popup">
            <div class="permission-popup-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <defs>
                  <linearGradient id="micGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#7C5CFF"/>
                    <stop offset="100%" style="stop-color:#00E0FF"/>
                  </linearGradient>
                </defs>
                <path fill="url(#micGradient)" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path fill="url(#micGradient)" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </div>
            <h3 class="permission-popup-title">Mikrofon Erişimi Gerekli</h3>
            <p class="permission-popup-desc">
              Sesli sohbet için mikrofonunuza erişim izni gereklidir.
              Bu izin yalnızca ses kaydı için kullanılacaktır.
            </p>
            <div class="permission-popup-features">
              <div class="permission-feature">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#10a37f">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Sesli komutlar ve sohbet</span>
              </div>
              <div class="permission-feature">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#10a37f">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Gerçek zamanlı ses tanıma</span>
              </div>
              <div class="permission-feature">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#10a37f">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Türkçe dil desteği</span>
              </div>
            </div>
            <div class="permission-popup-privacy">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#888">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              <span>Verileriniz şifrelenerek korunmaktadır</span>
            </div>
            <div class="permission-popup-actions">
              <button class="permission-btn permission-btn-secondary" id="permissionDenyBtn">
                Şimdi Değil
              </button>
              <button class="permission-btn permission-btn-primary" id="permissionAllowBtn">
                İzin Ver
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(popup);

        // Animate in
        requestAnimationFrame(() => {
          popup.classList.add('active');
        });

        // Handle buttons
        document.getElementById('permissionAllowBtn').addEventListener('click', () => {
          this.closePermissionPopup(popup);
          resolve(true);
        });

        document.getElementById('permissionDenyBtn').addEventListener('click', () => {
          this.closePermissionPopup(popup);
          resolve(false);
        });

        // Close on background click
        popup.addEventListener('click', e => {
          if (e.target === popup) {
            this.closePermissionPopup(popup);
            resolve(false);
          }
        });
      });
    },

    /**
     * Close permission popup with animation
     */
    closePermissionPopup(popup) {
      popup.classList.remove('active');
      popup.classList.add('closing');
      setTimeout(() => popup.remove(), 300);
    },

    /**
     * Show permission denied popup with instructions
     */
    showDeniedPopup() {
      const browserInfo = getBrowserInfo();
      let instructions = '';

      if (browserInfo.isChrome) {
        instructions = `
          <ol>
            <li>Adres çubuğundaki kilit simgesine tıklayın</li>
            <li>"Site ayarları" seçeneğine tıklayın</li>
            <li>Mikrofon iznini "İzin ver" olarak değiştirin</li>
            <li>Sayfayı yenileyin</li>
          </ol>
        `;
      } else if (browserInfo.isSafari) {
        instructions = `
          <ol>
            <li>Safari > Tercihler > Web Siteleri menüsüne gidin</li>
            <li>Sol taraftan "Mikrofon" seçin</li>
            <li>Bu site için "İzin Ver" seçin</li>
            <li>Sayfayı yenileyin</li>
          </ol>
        `;
      } else if (browserInfo.isFirefox) {
        instructions = `
          <ol>
            <li>Adres çubuğundaki kalkan simgesine tıklayın</li>
            <li>"İzinler" bölümüne gidin</li>
            <li>Mikrofon iznini etkinleştirin</li>
            <li>Sayfayı yenileyin</li>
          </ol>
        `;
      } else {
        instructions = `
          <ol>
            <li>Tarayıcı ayarlarına gidin</li>
            <li>Site izinlerini bulun</li>
            <li>Mikrofon iznini etkinleştirin</li>
            <li>Sayfayı yenileyin</li>
          </ol>
        `;
      }

      const popup = document.createElement('div');
      popup.className = 'permission-popup-overlay active';
      popup.innerHTML = `
        <div class="permission-popup permission-denied">
          <div class="permission-popup-icon denied">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="#ef4444">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" stroke-width="2"/>
            </svg>
          </div>
          <h3 class="permission-popup-title">Mikrofon İzni Reddedildi</h3>
          <p class="permission-popup-desc">
            Sesli sohbet için mikrofon iznini manuel olarak etkinleştirmeniz gerekiyor.
          </p>
          <div class="permission-instructions">
            <h4>Nasıl İzin Verilir:</h4>
            ${instructions}
          </div>
          <div class="permission-popup-actions">
            <button class="permission-btn permission-btn-primary" onclick="this.closest('.permission-popup-overlay').remove()">
              Anladım
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(popup);

      popup.addEventListener('click', e => {
        if (e.target === popup) {
          popup.remove();
        }
      });
    },

    /**
     * Request microphone permission with premium UX
     */
    async requestPermission() {
      // First check current state
      const state = await this.checkPermissionState();

      if (state === 'granted') {
        return { success: true };
      }

      if (state === 'denied') {
        this.showDeniedPopup();
        return { success: false, error: 'denied', message: PERMISSION_ERRORS.NotAllowedError };
      }

      // Show premium popup first
      const userConsent = await this.showPermissionPopup();

      if (!userConsent) {
        return { success: false, error: 'user_cancelled', message: 'Kullanıcı iptal etti' };
      }

      // Now request the actual permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
            channelCount: 1,
          },
        });

        // Release stream immediately after permission granted
        stream.getTracks().forEach(track => track.stop());
        this.microphoneState = 'granted';

        return { success: true };
      } catch (error) {
        console.error('[VoiceChat] Permission request failed:', error);

        if (error.name === 'NotAllowedError') {
          this.microphoneState = 'denied';
          this.showDeniedPopup();
        }

        return {
          success: false,
          error: error.name,
          message: PERMISSION_ERRORS[error.name] || PERMISSION_ERRORS.default,
        };
      }
    },
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
   * Inject Siri-like holographic styles + Premium Permission Popup styles
   */
  function injectStyles() {
    if (document.getElementById('siri-voice-styles')) return;

    const style = document.createElement('style');
    style.id = 'siri-voice-styles';
    style.textContent = `
      /* ============================================================
         PREMIUM PERMISSION POPUP (Google/Apple Quality)
         ============================================================ */
      .permission-popup-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        padding: 1rem;
      }

      .permission-popup-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      .permission-popup-overlay.closing {
        opacity: 0;
      }

      .permission-popup {
        background: linear-gradient(145deg, rgba(32, 33, 36, 0.98), rgba(24, 25, 28, 0.98));
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 2rem;
        max-width: 420px;
        width: 100%;
        box-shadow:
          0 25px 50px rgba(0, 0, 0, 0.5),
          0 0 100px rgba(124, 92, 255, 0.1);
        transform: scale(0.9) translateY(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: center;
      }

      .permission-popup-overlay.active .permission-popup {
        transform: scale(1) translateY(0);
      }

      .permission-popup-overlay.closing .permission-popup {
        transform: scale(0.9) translateY(20px);
      }

      .permission-popup-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 1.5rem;
        background: linear-gradient(135deg, rgba(124, 92, 255, 0.2), rgba(0, 224, 255, 0.2));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: permissionPulse 2s ease-in-out infinite;
      }

      .permission-popup-icon.denied {
        background: rgba(239, 68, 68, 0.15);
        animation: none;
      }

      @keyframes permissionPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(124, 92, 255, 0.4); }
        50% { transform: scale(1.05); box-shadow: 0 0 20px 10px rgba(124, 92, 255, 0.2); }
      }

      .permission-popup-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 0.75rem;
      }

      .permission-popup-desc {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.95rem;
        line-height: 1.6;
        margin-bottom: 1.5rem;
      }

      .permission-popup-features {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
      }

      .permission-feature {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: rgba(255, 255, 255, 0.85);
        font-size: 0.9rem;
        text-align: left;
      }

      .permission-popup-privacy {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.8rem;
        margin-bottom: 1.5rem;
      }

      .permission-popup-actions {
        display: flex;
        gap: 0.75rem;
      }

      .permission-btn {
        flex: 1;
        padding: 0.875rem 1.5rem;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
      }

      .permission-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.15);
      }

      .permission-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
      }

      .permission-btn-primary {
        background: linear-gradient(135deg, #7C5CFF 0%, #00E0FF 100%);
        color: #fff;
        box-shadow: 0 4px 15px rgba(124, 92, 255, 0.4);
      }

      .permission-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(124, 92, 255, 0.5);
      }

      .permission-btn-primary:active {
        transform: translateY(0);
      }

      .permission-instructions {
        text-align: left;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1.5rem;
      }

      .permission-instructions h4 {
        color: #fff;
        font-size: 0.9rem;
        margin-bottom: 0.75rem;
      }

      .permission-instructions ol {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.85rem;
        padding-left: 1.25rem;
        margin: 0;
      }

      .permission-instructions li {
        margin-bottom: 0.5rem;
      }

      .permission-popup.permission-denied .permission-popup-icon {
        background: rgba(239, 68, 68, 0.15);
      }

      /* Mobile responsive for permission popup */
      @media (max-width: 480px) {
        .permission-popup {
          padding: 1.5rem;
          margin: 1rem;
        }

        .permission-popup-title {
          font-size: 1.25rem;
        }

        .permission-popup-actions {
          flex-direction: column;
        }
      }

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
      <p class="siri-status" id="siriStatus">Mikrofona dokunun ve konuşmaya başlayın</p>

      <!-- Actions -->
      <div class="siri-actions">
        <button class="siri-close-btn" id="siriCloseBtn" title="Kapat" aria-label="Sesli sohbeti kapat">
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
      <p class="siri-hint">Butona basın ve konuşmaya başlayın</p>
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
   * Open inline voice interface with premium permission handling
   */
  async function openVoiceInterface() {
    if (voiceInterfaceActive) return;

    // Check browser support first
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showBrowserNotSupportedPopup();
      return;
    }

    // Check permission state first
    const permissionState = await PermissionManager.checkPermissionState();

    // If permission not yet granted, show premium popup and request permission
    if (permissionState !== 'granted') {
      const result = await PermissionManager.requestPermission();

      if (!result.success) {
        console.warn('[VoiceChat] Permission not granted:', result.error);
        return; // Don't open interface if permission denied
      }
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
    updateStatus('Hazır - kaydetmek için butona basın');
    console.log('[VoiceChat] Voice interface opened');
  }

  /**
   * Show browser not supported popup
   */
  function showBrowserNotSupportedPopup() {
    const popup = document.createElement('div');
    popup.className = 'permission-popup-overlay active';
    popup.innerHTML = `
      <div class="permission-popup">
        <div class="permission-popup-icon denied">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="#fdb022">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <h3 class="permission-popup-title">Tarayıcı Desteklenmiyor</h3>
        <p class="permission-popup-desc">
          Tarayıcınız ses kaydını desteklemiyor. Lütfen Chrome, Firefox, Safari veya Edge tarayıcılarından birini kullanın.
        </p>
        <div class="permission-popup-actions">
          <button class="permission-btn permission-btn-primary" onclick="this.closest('.permission-popup-overlay').remove()">
            Anladım
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    popup.addEventListener('click', e => {
      if (e.target === popup) popup.remove();
    });
  }

  /**
   * Close voice interface with full cleanup
   */
  function closeVoiceInterface() {
    if (!voiceInterfaceActive) return;

    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    // Clear any pending timeouts
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      recordingTimeout = null;
    }

    // Force cleanup any remaining stream
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }

    // Reset media recorder
    mediaRecorder = null;
    audioChunks = [];

    // Remove interface with animation
    if (voiceInterface) {
      voiceInterface.style.animation = 'siriAppear 0.3s ease reverse';
      setTimeout(() => {
        if (voiceInterface) {
          voiceInterface.remove();
          voiceInterface = null;
        }
      }, 300);
    }

    voiceInterfaceActive = false;
    statusText = null;
    console.log('[VoiceChat] Voice interface closed');
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

  // Track current stream for cleanup
  let currentStream = null;
  let recordingTimeout = null;

  /**
   * Start recording with proper error handling and stream management
   */
  async function startRecording() {
    if (isRecording) return;

    // Clean up any previous stream
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }

    try {
      const browserInfo = getBrowserInfo();

      // Get audio stream with optimal cross-browser settings
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      };

      // Safari/iOS specific adjustments (must include sampleRate for compatibility)
      if (browserInfo.isSafari || browserInfo.isIOS) {
        // Safari requires specific sample rates
        constraints.audio.sampleRate = { ideal: 44100 };
      }

      // Request microphone access
      currentStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create MediaRecorder with supported MIME type
      const mimeType = getSupportedMimeType();
      let recorderOptions = {};

      // Only set mimeType if supported (some browsers reject unknown options)
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mimeType)) {
        recorderOptions.mimeType = mimeType;
      }

      try {
        mediaRecorder = new MediaRecorder(currentStream, recorderOptions);
      } catch (e) {
        console.warn('[VoiceChat] MediaRecorder options failed, using defaults:', e);
        // Fallback without options
        mediaRecorder = new MediaRecorder(currentStream);
      }

      audioChunks = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Clean up stream
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
          currentStream = null;
        }
        processRecording();
      };

      mediaRecorder.onerror = event => {
        console.error('[VoiceChat] Recording error:', event.error);
        updateStatus('Kayıt hatası oluştu. Tekrar deneyin.');

        // Clean up on error
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
          currentStream = null;
        }

        isRecording = false;
        if (voiceInterface) {
          voiceInterface.classList.remove('recording');
        }
      };

      // Start recording (collect data every 100ms for smoother audio)
      mediaRecorder.start(100);
      isRecording = true;

      // Update UI
      if (voiceInterface) {
        voiceInterface.classList.add('recording');
      }
      updateStatus('Dinliyorum...');

      // Auto-stop after max time
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
      }
      recordingTimeout = setTimeout(() => {
        if (isRecording) {
          updateStatus('Maksimum süre doldu, işleniyor...');
          stopRecording();
        }
      }, CONFIG.maxRecordingTime);

      console.log('[VoiceChat] Recording started with MIME:', mediaRecorder.mimeType);
    } catch (error) {
      console.error('[VoiceChat] Start recording error:', error);

      // Clean up stream on error
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
      }

      // Handle specific errors
      if (error.name === 'NotAllowedError') {
        // Permission was revoked or denied
        PermissionManager.microphoneState = 'denied';
        PermissionManager.showDeniedPopup();
        closeVoiceInterface();
      } else {
        const message = PERMISSION_ERRORS[error.name] || PERMISSION_ERRORS.default;
        updateStatus(message);
      }
    }
  }

  /**
   * Stop recording with proper cleanup
   */
  function stopRecording() {
    if (!isRecording || !mediaRecorder) return;

    // Clear auto-stop timeout
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      recordingTimeout = null;
    }

    try {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    } catch (error) {
      console.error('[VoiceChat] Stop error:', error);
      // Force cleanup if stop fails
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
      }
    }

    isRecording = false;

    // Update UI
    if (voiceInterface) {
      voiceInterface.classList.remove('recording');
      voiceInterface.classList.add('processing');
    }
    updateStatus('İşleniyor...');

    console.log('[VoiceChat] Recording stopped');
  }

  /**
   * Process recording and send to API
   */
  async function processRecording() {
    if (audioChunks.length === 0) {
      updateStatus('Ses kaydedilemedi. Tekrar deneyin.');
      if (voiceInterface) {
        voiceInterface.classList.remove('processing');
      }
      return;
    }

    updateStatus('Yanıtınız hazırlanıyor...');

    try {
      // Create audio blob with the recorded MIME type
      const mimeType = mediaRecorder?.mimeType || getSupportedMimeType();
      const audioBlob = new Blob(audioChunks, { type: mimeType });

      console.log('[VoiceChat] Processing audio:', audioBlob.size, 'bytes,', mimeType);

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

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

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

            updateStatus('Hazır - tekrar kayıt için butona basın');
          } else {
            updateStatus(result.error || 'Yanıt alınamadı. Tekrar deneyin.');
          }
        } catch (fetchError) {
          console.error('[VoiceChat] API error:', fetchError);
          updateStatus('Bağlantı hatası. Lütfen tekrar deneyin.');
        } finally {
          if (voiceInterface) {
            voiceInterface.classList.remove('processing');
          }
        }
      };

      reader.onerror = () => {
        console.error('[VoiceChat] FileReader error');
        updateStatus('Ses dosyası okunamadı.');
        if (voiceInterface) {
          voiceInterface.classList.remove('processing');
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('[VoiceChat] Process error:', error);
      updateStatus('İşlem hatası. Tekrar deneyin.');
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
