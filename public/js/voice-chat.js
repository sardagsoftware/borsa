/* global window, document, navigator, MediaRecorder, fetch, Blob, FileReader, Audio, CustomEvent, requestAnimationFrame, AudioContext, webkitAudioContext */
/**
 * AILYDIAN Voice Chat Client - Ultra Professional Clean Interface
 * Voice-to-Voice conversation in Turkish with Premium Permission UI
 * White/Silver theme - No neon, no red - Chat page color harmony
 *
 * @version 4.0.0 - Professional white theme + Silence detection + Auto-stop
 */

(function () {
  'use strict';

  const CONFIG = {
    apiEndpoint: '/api/voice/chat',
    maxRecordingTime: 30000,
    silenceThreshold: 0.01,
    silenceDuration: 2000,
    minRecordingTime: 1000,
  };

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
        return type;
      }
    }
    return 'audio/webm';
  }

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

  const PERMISSION_ERRORS = {
    NotAllowedError: 'Mikrofon izni reddedildi. Tarayıcı ayarlarından mikrofon iznini verin.',
    NotFoundError: 'Mikrofon bulunamadı. Cihazınıza mikrofon bağlayın.',
    NotReadableError: 'Mikrofon başka bir uygulama tarafından kullanılıyor.',
    OverconstrainedError: 'Mikrofon ayarları uyumsuz. Farklı bir tarayıcı deneyin.',
    SecurityError: 'Güvenli bağlantı (HTTPS) gerekli.',
    AbortError: 'Mikrofon bağlantısı kesildi. Tekrar deneyin.',
    TypeError: 'Tarayıcınız ses kaydını desteklemiyor.',
    default: 'Mikrofon erişimi başarısız oldu. Tarayıcı ayarlarını kontrol edin.',
  };

  // ============================================================
  // BROWSER SPEECH RECOGNITION (PRIMARY STT - No server needed)
  // ============================================================
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  var _speechRecognition = null;
  var _recognizedText = '';
  var _recognitionActive = false;

  function startBrowserSTT() {
    if (!SpeechRecognitionAPI) return false;
    try {
      _speechRecognition = new SpeechRecognitionAPI();
      _speechRecognition.lang = 'tr-TR';
      _speechRecognition.continuous = true;
      _speechRecognition.interimResults = true;
      _speechRecognition.maxAlternatives = 1;
      _recognizedText = '';
      _recognitionActive = true;

      _speechRecognition.onresult = function(event) {
        var finalText = '';
        var interimText = '';
        for (var i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }
        _recognizedText = finalText || interimText;
      };

      _speechRecognition.onerror = function(e) {
        console.warn('[VoiceChat] Browser STT error:', e.error);
        _recognitionActive = false;
      };

      _speechRecognition.onend = function() {
        _recognitionActive = false;
      };

      _speechRecognition.start();
      return true;
    } catch (e) {
      console.warn('[VoiceChat] Browser STT unavailable:', e.message);
      return false;
    }
  }

  function stopBrowserSTT() {
    if (_speechRecognition) {
      try { _speechRecognition.stop(); } catch (e) { /* ignore */ }
      _recognitionActive = false;
    }
  }

  // ============================================================
  // PREMIUM PERMISSION MANAGER
  // ============================================================
  const PermissionManager = {
    microphoneState: 'prompt',

    async checkPermissionState() {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'microphone' });
          this.microphoneState = result.state;
          result.addEventListener('change', () => {
            this.microphoneState = result.state;
          });
          return result.state;
        }
      } catch (_e) {
        // Permissions API not supported
      }
      return 'prompt';
    },

    showPermissionPopup() {
      return new Promise(resolve => {
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
                <path fill="rgba(255,255,255,0.9)" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path fill="rgba(255,255,255,0.7)" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </div>
            <h3 class="permission-popup-title">Mikrofon Erişimi Gerekli</h3>
            <p class="permission-popup-desc">
              Sesli sohbet için mikrofonunuza erişim izni gereklidir.
              Bu izin yalnızca ses kaydı için kullanılacaktır.
            </p>
            <div class="permission-popup-features">
              <div class="permission-feature">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="rgba(255,255,255,0.8)">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Sesli komutlar ve sohbet</span>
              </div>
              <div class="permission-feature">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="rgba(255,255,255,0.8)">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Gerçek zamanlı ses tanıma</span>
              </div>
              <div class="permission-feature">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="rgba(255,255,255,0.8)">
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
        requestAnimationFrame(() => { popup.classList.add('active'); });

        document.getElementById('permissionAllowBtn').addEventListener('click', () => {
          this.closePermissionPopup(popup);
          resolve(true);
        });

        document.getElementById('permissionDenyBtn').addEventListener('click', () => {
          this.closePermissionPopup(popup);
          resolve(false);
        });

        popup.addEventListener('click', e => {
          if (e.target === popup) {
            this.closePermissionPopup(popup);
            resolve(false);
          }
        });
      });
    },

    closePermissionPopup(popup) {
      popup.classList.remove('active');
      popup.classList.add('closing');
      setTimeout(() => popup.remove(), 300);
    },

    showDeniedPopup() {
      const browserInfo = getBrowserInfo();
      let instructions = '';

      if (browserInfo.isChrome) {
        instructions = '<ol><li>Adres çubuğundaki kilit simgesine tıklayın</li><li>"Site ayarları" seçeneğine tıklayın</li><li>Mikrofon iznini "İzin ver" olarak değiştirin</li><li>Sayfayı yenileyin</li></ol>';
      } else if (browserInfo.isSafari) {
        instructions = '<ol><li>Safari > Tercihler > Web Siteleri menüsüne gidin</li><li>Sol taraftan "Mikrofon" seçin</li><li>Bu site için "İzin Ver" seçin</li><li>Sayfayı yenileyin</li></ol>';
      } else {
        instructions = '<ol><li>Tarayıcı ayarlarına gidin</li><li>Site izinlerini bulun</li><li>Mikrofon iznini etkinleştirin</li><li>Sayfayı yenileyin</li></ol>';
      }

      const popup = document.createElement('div');
      popup.className = 'permission-popup-overlay active';
      popup.innerHTML = `
        <div class="permission-popup permission-denied">
          <div class="permission-popup-icon denied">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="rgba(255,255,255,0.5)">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              <line x1="3" y1="3" x2="21" y2="21" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
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
        if (e.target === popup) popup.remove();
      });
    },

    async requestPermission() {
      const state = await this.checkPermissionState();

      if (state === 'granted') return { success: true };

      if (state === 'denied') {
        this.showDeniedPopup();
        return { success: false, error: 'denied', message: PERMISSION_ERRORS.NotAllowedError };
      }

      const userConsent = await this.showPermissionPopup();
      if (!userConsent) {
        return { success: false, error: 'user_cancelled', message: 'Kullanıcı iptal etti' };
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
        });
        stream.getTracks().forEach(track => track.stop());
        this.microphoneState = 'granted';
        return { success: true };
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          this.microphoneState = 'denied';
          this.showDeniedPopup();
        }
        return { success: false, error: error.name, message: PERMISSION_ERRORS[error.name] || PERMISSION_ERRORS.default };
      }
    },
  };

  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  let _isPlaying = false;
  let conversationHistory = [];
  let voiceInterfaceActive = false;
  let currentStream = null;
  let recordingTimeout = null;
  let silenceAnalyser = null;
  let silenceCheckInterval = null;
  let lastSoundTime = 0;
  let recordingStartTime = 0;

  let voiceBtn = null;
  let voiceInterface = null;
  let statusText = null;

  function init() {
    voiceBtn = document.getElementById('voiceChatBtn');
    if (!voiceBtn) return;
    injectStyles();
    setupEventListeners();
  }

  function injectStyles() {
    if (document.getElementById('siri-voice-styles')) return;

    const style = document.createElement('style');
    style.id = 'siri-voice-styles';
    style.textContent = `
      /* ============================================================
         PERMISSION POPUP - Clean Professional
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
      .permission-popup-overlay.active { opacity: 1; visibility: visible; }
      .permission-popup-overlay.closing { opacity: 0; }

      .permission-popup {
        background: linear-gradient(145deg, rgba(20, 21, 24, 0.98), rgba(14, 15, 18, 0.98));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 2rem;
        max-width: 420px;
        width: 100%;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
        transform: scale(0.9) translateY(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: center;
      }
      .permission-popup-overlay.active .permission-popup { transform: scale(1) translateY(0); }
      .permission-popup-overlay.closing .permission-popup { transform: scale(0.9) translateY(20px); }

      .permission-popup-icon {
        width: 80px; height: 80px;
        margin: 0 auto 1.5rem;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        animation: permPulse 2s ease-in-out infinite;
      }
      .permission-popup-icon.denied { background: rgba(255, 255, 255, 0.04); animation: none; }
      @keyframes permPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.1); }
        50% { transform: scale(1.05); box-shadow: 0 0 20px 10px rgba(255,255,255,0.05); }
      }

      .permission-popup-title { font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 0.75rem; }
      .permission-popup-desc { color: rgba(255,255,255,0.6); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; }

      .permission-popup-features {
        display: flex; flex-direction: column; gap: 0.75rem;
        margin-bottom: 1.5rem; padding: 1rem;
        background: rgba(255,255,255,0.03); border-radius: 12px;
      }
      .permission-feature { display: flex; align-items: center; gap: 0.75rem; color: rgba(255,255,255,0.75); font-size: 0.9rem; text-align: left; }

      .permission-popup-privacy {
        display: flex; align-items: center; justify-content: center;
        gap: 0.5rem; color: rgba(255,255,255,0.4); font-size: 0.8rem; margin-bottom: 1.5rem;
      }
      .permission-popup-actions { display: flex; gap: 0.75rem; }
      .permission-btn { flex: 1; padding: 0.875rem 1.5rem; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: none; font-family: inherit; }
      .permission-btn-secondary { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.1); }
      .permission-btn-secondary:hover { background: rgba(255,255,255,0.12); color: #fff; }
      .permission-btn-primary { background: rgba(255,255,255,0.15); color: #fff; }
      .permission-btn-primary:hover { background: rgba(255,255,255,0.22); transform: translateY(-1px); }
      .permission-btn-primary:active { transform: translateY(0); }

      .permission-instructions { text-align: left; background: rgba(255,255,255,0.04); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; }
      .permission-instructions h4 { color: #fff; font-size: 0.9rem; margin-bottom: 0.75rem; }
      .permission-instructions ol { color: rgba(255,255,255,0.6); font-size: 0.85rem; padding-left: 1.25rem; margin: 0; }
      .permission-instructions li { margin-bottom: 0.5rem; }

      @media (max-width: 480px) {
        .permission-popup { padding: 1.5rem; margin: 1rem; }
        .permission-popup-title { font-size: 1.25rem; }
        .permission-popup-actions { flex-direction: column; }
      }

      /* ============================================================
         VOICE INTERFACE - Ultra Professional White/Silver
         ============================================================ */
      .siri-voice-interface {
        position: relative; width: 100%;
        display: flex; flex-direction: column; align-items: center;
        padding: 2rem 1rem;
        background: transparent;
        border-radius: 16px 16px 0 0;
        margin-bottom: 0.5rem;
        animation: voiceAppear 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes voiceAppear {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Orb Container */
      .siri-orb-container { position: relative; width: 100px; height: 100px; margin-bottom: 1.25rem; }

      /* Main Orb - Clean White/Silver */
      .siri-orb {
        width: 100%; height: 100%; border-radius: 50%;
        background: radial-gradient(circle at 35% 35%,
          rgba(255, 255, 255, 0.25) 0%,
          rgba(255, 255, 255, 0.12) 40%,
          rgba(255, 255, 255, 0.06) 70%,
          rgba(255, 255, 255, 0.02) 100%
        );
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 0 30px rgba(255, 255, 255, 0.05);
        position: relative; z-index: 2;
        animation: orbIdle 3s ease-in-out infinite;
      }
      .siri-orb::before {
        content: ''; position: absolute;
        top: 12%; left: 18%; width: 25%; height: 25%;
        background: radial-gradient(ellipse, rgba(255,255,255,0.25) 0%, transparent 70%);
        border-radius: 50%;
      }
      @keyframes orbIdle {
        0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(255,255,255,0.05); }
        50% { transform: scale(1.02); box-shadow: 0 0 40px rgba(255,255,255,0.08); }
      }

      /* Recording State - White Pulse (NO RED) */
      .siri-voice-interface.recording .siri-orb {
        animation: orbRecording 1s ease-in-out infinite;
        background: radial-gradient(circle at 35% 35%,
          rgba(255, 255, 255, 0.45) 0%,
          rgba(255, 255, 255, 0.25) 40%,
          rgba(255, 255, 255, 0.12) 70%,
          rgba(255, 255, 255, 0.04) 100%
        );
        border-color: rgba(255, 255, 255, 0.25);
        box-shadow: 0 0 40px rgba(255, 255, 255, 0.1);
      }
      @keyframes orbRecording {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.06); }
      }

      /* Processing State - Subtle Spin */
      .siri-voice-interface.processing .siri-orb {
        animation: orbProcessing 1.5s linear infinite;
        background: conic-gradient(from 0deg,
          rgba(255, 255, 255, 0.3),
          rgba(255, 255, 255, 0.08),
          rgba(255, 255, 255, 0.3)
        );
      }
      @keyframes orbProcessing {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Glow Rings - Subtle White */
      .siri-glow-ring {
        position: absolute; border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.08);
        animation: ringExpand 2.5s ease-out infinite;
        pointer-events: none;
      }
      .siri-glow-ring:nth-child(1) { inset: -12px; animation-delay: 0s; }
      .siri-glow-ring:nth-child(2) { inset: -24px; animation-delay: 0.8s; }
      .siri-glow-ring:nth-child(3) { inset: -36px; animation-delay: 1.6s; }
      .siri-voice-interface:not(.recording):not(.processing) .siri-glow-ring {
        animation-play-state: paused; opacity: 0.2;
      }
      @keyframes ringExpand {
        0% { transform: scale(1); opacity: 0.4; }
        100% { transform: scale(1.25); opacity: 0; }
      }

      /* Voice Bars - White/Silver */
      .siri-voice-bars {
        display: flex; align-items: center; justify-content: center;
        gap: 3px; height: 40px; margin-bottom: 0.75rem;
      }
      .siri-voice-bar {
        width: 3px; height: 16px;
        background: rgba(255, 255, 255, 0.35);
        border-radius: 2px;
        transition: height 0.1s ease;
      }
      .siri-voice-interface.recording .siri-voice-bar {
        animation: barPulse 0.5s ease-in-out infinite;
      }
      .siri-voice-bar:nth-child(1) { animation-delay: 0s; }
      .siri-voice-bar:nth-child(2) { animation-delay: 0.06s; }
      .siri-voice-bar:nth-child(3) { animation-delay: 0.12s; }
      .siri-voice-bar:nth-child(4) { animation-delay: 0.18s; }
      .siri-voice-bar:nth-child(5) { animation-delay: 0.24s; }
      .siri-voice-bar:nth-child(6) { animation-delay: 0.30s; }
      .siri-voice-bar:nth-child(7) { animation-delay: 0.36s; }
      .siri-voice-bar:nth-child(8) { animation-delay: 0.42s; }
      .siri-voice-bar:nth-child(9) { animation-delay: 0.48s; }
      .siri-voice-bar:nth-child(10) { animation-delay: 0.54s; }
      @keyframes barPulse {
        0%, 100% { height: 8px; background: rgba(255,255,255,0.2); }
        50% { height: 32px; background: rgba(255,255,255,0.5); }
      }
      .siri-voice-interface:not(.recording) .siri-voice-bar { height: 3px; opacity: 0.2; }

      /* Status */
      .siri-status {
        color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; font-weight: 500;
        margin-bottom: 1rem; text-align: center; min-height: 1.5rem;
      }

      /* Actions */
      .siri-actions { display: flex; gap: 1rem; align-items: center; }

      .siri-mic-btn {
        width: 56px; height: 56px; border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: rgba(255, 255, 255, 0.8);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
        transition: all 0.2s;
      }
      .siri-mic-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        transform: scale(1.05);
      }
      .siri-mic-btn:active { transform: scale(0.95); }

      /* Recording mic button - brighter white, NO RED */
      .siri-voice-interface.recording .siri-mic-btn {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        color: #fff;
        box-shadow: 0 2px 16px rgba(255, 255, 255, 0.1);
      }

      .siri-mic-btn .mic-icon, .siri-mic-btn .stop-icon { width: 24px; height: 24px; }
      .siri-mic-btn .stop-icon { display: none; }
      .siri-voice-interface.recording .siri-mic-btn .mic-icon { display: none; }
      .siri-voice-interface.recording .siri-mic-btn .stop-icon { display: block; }

      .siri-close-btn {
        width: 40px; height: 40px; border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: rgba(255, 255, 255, 0.5);
        transition: all 0.2s;
      }
      .siri-close-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }

      .siri-hint { color: rgba(255,255,255,0.35); font-size: 0.75rem; margin-top: 0.75rem; text-align: center; }

      @media (max-width: 768px) {
        .siri-voice-interface { padding: 1.5rem 1rem; }
        .siri-orb-container { width: 80px; height: 80px; }
        .siri-glow-ring:nth-child(1) { inset: -8px; }
        .siri-glow-ring:nth-child(2) { inset: -16px; }
        .siri-glow-ring:nth-child(3) { inset: -24px; }
        .siri-mic-btn { width: 50px; height: 50px; }
        .siri-voice-bars { height: 32px; }
      }
    `;
    document.head.appendChild(style);
  }

  function createVoiceInterface() {
    if (voiceInterface) voiceInterface.remove();

    const container = document.createElement('div');
    container.id = 'siriVoiceInterface';
    container.className = 'siri-voice-interface';
    container.innerHTML = `
      <div class="siri-orb-container">
        <div class="siri-glow-ring"></div>
        <div class="siri-glow-ring"></div>
        <div class="siri-glow-ring"></div>
        <div class="siri-orb"></div>
      </div>
      <div class="siri-voice-bars">
        <div class="siri-voice-bar"></div><div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div><div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div><div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div><div class="siri-voice-bar"></div>
        <div class="siri-voice-bar"></div><div class="siri-voice-bar"></div>
      </div>
      <p class="siri-status" id="siriStatus">Hazır - mikrofona basın ve konuşun</p>
      <div class="siri-actions">
        <button class="siri-close-btn" id="siriCloseBtn" title="Kapat" aria-label="Sesli sohbeti kapat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
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
      <p class="siri-hint">Konusmayi bitirince otomatik algılanır</p>
    `;

    voiceInterface = container;
    statusText = container.querySelector('#siriStatus');

    container.querySelector('#siriCloseBtn')?.addEventListener('click', closeVoiceInterface);
    container.querySelector('#siriMicBtn')?.addEventListener('click', toggleRecording);

    return container;
  }

  function setupEventListeners() {
    voiceBtn.addEventListener('click', openVoiceInterface);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && voiceInterfaceActive) closeVoiceInterface();
    });
  }

  async function openVoiceInterface() {
    if (voiceInterfaceActive) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showBrowserNotSupportedPopup();
      return;
    }

    const permissionState = await PermissionManager.checkPermissionState();
    if (permissionState !== 'granted') {
      const result = await PermissionManager.requestPermission();
      if (!result.success) return;
    }

    const container = createVoiceInterface();
    const inputWrapper = document.querySelector('.input-wrapper');
    const inputContainer = document.querySelector('.input-container');

    if (inputContainer && inputWrapper) {
      inputContainer.insertBefore(container, inputWrapper);
    } else if (inputWrapper && inputWrapper.parentNode) {
      inputWrapper.parentNode.insertBefore(container, inputWrapper);
    } else {
      const mainArea = document.querySelector('.main-area') || document.body;
      mainArea.appendChild(container);
    }

    voiceInterfaceActive = true;
    updateStatus('Hazır - kaydetmek için butona basın');
  }

  function showBrowserNotSupportedPopup() {
    const popup = document.createElement('div');
    popup.className = 'permission-popup-overlay active';
    popup.innerHTML = `
      <div class="permission-popup">
        <div class="permission-popup-icon denied">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="rgba(255,255,255,0.5)">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <h3 class="permission-popup-title">Tarayıcı Desteklenmiyor</h3>
        <p class="permission-popup-desc">Chrome, Firefox, Safari veya Edge tarayıcılarından birini kullanın.</p>
        <div class="permission-popup-actions">
          <button class="permission-btn permission-btn-primary" onclick="this.closest('.permission-popup-overlay').remove()">Anladım</button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
    popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  }

  function closeVoiceInterface() {
    if (!voiceInterfaceActive) return;

    stopSilenceDetection();
    stopBrowserSTT();

    if (isRecording) stopRecording();

    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      recordingTimeout = null;
    }

    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }

    mediaRecorder = null;
    audioChunks = [];

    if (voiceInterface) {
      voiceInterface.style.animation = 'voiceAppear 0.25s ease reverse';
      setTimeout(() => {
        if (voiceInterface) { voiceInterface.remove(); voiceInterface = null; }
      }, 250);
    }

    voiceInterfaceActive = false;
    statusText = null;
  }

  async function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }

  // ============================================================
  // SILENCE DETECTION - Auto-stop when user stops speaking
  // ============================================================
  function startSilenceDetection(stream) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioContext = new AudioCtx();
      silenceAnalyser = audioContext.createAnalyser();
      silenceAnalyser.fftSize = 512;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(silenceAnalyser);

      const dataArray = new Uint8Array(silenceAnalyser.frequencyBinCount);
      lastSoundTime = Date.now();

      silenceCheckInterval = setInterval(() => {
        if (!isRecording || !silenceAnalyser) return;

        silenceAnalyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avgVolume = sum / dataArray.length / 255;

        if (avgVolume > CONFIG.silenceThreshold) {
          lastSoundTime = Date.now();
        }

        const timeSinceSound = Date.now() - lastSoundTime;
        const recordingDuration = Date.now() - recordingStartTime;

        // Auto-stop after silence, but only if we've recorded at least minRecordingTime
        if (timeSinceSound > CONFIG.silenceDuration && recordingDuration > CONFIG.minRecordingTime) {
          updateStatus('Sessizlik algılandı, işleniyor...');
          stopRecording();
        }
      }, 100);
    } catch (e) {
      console.warn('[VoiceChat] Silence detection unavailable:', e.message);
    }
  }

  function stopSilenceDetection() {
    if (silenceCheckInterval) {
      clearInterval(silenceCheckInterval);
      silenceCheckInterval = null;
    }
    silenceAnalyser = null;
  }

  async function startRecording() {
    if (isRecording) return;

    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }

    try {
      const browserInfo = getBrowserInfo();
      const constraints = {
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      };

      if (browserInfo.isSafari || browserInfo.isIOS) {
        constraints.audio.sampleRate = { ideal: 44100 };
      }

      currentStream = await navigator.mediaDevices.getUserMedia(constraints);

      const mimeType = getSupportedMimeType();
      let recorderOptions = {};

      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mimeType)) {
        recorderOptions.mimeType = mimeType;
      }

      try {
        mediaRecorder = new MediaRecorder(currentStream, recorderOptions);
      } catch (e) {
        mediaRecorder = new MediaRecorder(currentStream);
      }

      audioChunks = [];
      recordingStartTime = Date.now();

      // Start browser SpeechRecognition in parallel (primary STT)
      startBrowserSTT();

      mediaRecorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stopSilenceDetection();
        stopBrowserSTT();
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
          currentStream = null;
        }
        processRecording();
      };

      mediaRecorder.onerror = event => {
        console.error('[VoiceChat] Recording error:', event.error);
        updateStatus('Kayıt hatası oluştu. Tekrar deneyin.');
        stopSilenceDetection();
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
          currentStream = null;
        }
        isRecording = false;
        if (voiceInterface) voiceInterface.classList.remove('recording');
      };

      // Use larger timeslice for better audio quality
      mediaRecorder.start(250);
      isRecording = true;

      // Start silence detection for auto-stop
      startSilenceDetection(currentStream);

      if (voiceInterface) voiceInterface.classList.add('recording');
      updateStatus('Dinliyorum... konuşmanızı bitirince otomatik durur');

      if (recordingTimeout) clearTimeout(recordingTimeout);
      recordingTimeout = setTimeout(() => {
        if (isRecording) {
          updateStatus('Maksimum süre doldu, işleniyor...');
          stopRecording();
        }
      }, CONFIG.maxRecordingTime);

    } catch (error) {
      console.error('[VoiceChat] Start recording error:', error);
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
      }
      if (error.name === 'NotAllowedError') {
        PermissionManager.microphoneState = 'denied';
        PermissionManager.showDeniedPopup();
        closeVoiceInterface();
      } else {
        updateStatus(PERMISSION_ERRORS[error.name] || PERMISSION_ERRORS.default);
      }
    }
  }

  function stopRecording() {
    if (!isRecording || !mediaRecorder) return;

    stopSilenceDetection();

    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      recordingTimeout = null;
    }

    try {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    } catch (error) {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
      }
    }

    isRecording = false;

    if (voiceInterface) {
      voiceInterface.classList.remove('recording');
      voiceInterface.classList.add('processing');
    }
    updateStatus('İşleniyor...');
  }

  // Send recognized text to AI (text-only mode - no server STT needed)
  async function sendToAI(userText) {
    try {
      var response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userText,
          conversationHistory: conversationHistory.slice(-20),
        }),
      });

      var result;
      try {
        result = await response.json();
      } catch (parseErr) {
        throw new Error('Sunucu yanıtı okunamadı');
      }

      if (!response.ok) {
        throw new Error(result?.error || 'Sunucu hatası');
      }

      if (result.success && result.response) {
        conversationHistory.push({ role: 'user', content: userText });
        conversationHistory.push({ role: 'assistant', content: result.response });
        addMessageToChat(userText, 'user');
        addMessageToChat(result.response, 'assistant');
        if (conversationHistory.length > 20) {
          conversationHistory = conversationHistory.slice(-20);
        }
        // Play audio or browser TTS
        var audioData = result.audio || result.audioResponse;
        if (audioData) {
          playAudioResponse(audioData, result.audioFormat || 'mp3');
        } else {
          speakWithBrowserTTS(result.response);
        }
        updateStatus('Hazır - tekrar kayıt için butona basın');
      } else {
        updateStatus(result.error || 'Yanıt alınamadı. Tekrar deneyin.');
      }
    } catch (err) {
      console.error('[VoiceChat] sendToAI error:', err);
      var errMsg = err.message || 'Bağlantı hatası';
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        errMsg = 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
      }
      updateStatus(errMsg);
    } finally {
      if (voiceInterface) voiceInterface.classList.remove('processing');
    }
  }

  async function processRecording() {
    updateStatus('Yanıtınız hazırlanıyor...');

    // Use browser SpeechRecognition text if available (primary path)
    var browserText = _recognizedText ? _recognizedText.trim() : '';

    if (browserText) {
      console.log('[VoiceChat] Using browser STT:', browserText.substring(0, 50));
      await sendToAI(browserText);
      return;
    }

    // Fallback: Send audio to server for STT
    var totalSize = 0;
    for (var i = 0; i < audioChunks.length; i++) {
      totalSize += audioChunks[i].size || 0;
    }
    if (audioChunks.length === 0 || totalSize === 0) {
      updateStatus('Ses algılanamadı. Tekrar deneyin.');
      if (voiceInterface) voiceInterface.classList.remove('processing');
      return;
    }

    try {
      const mimeType = mediaRecorder?.mimeType || getSupportedMimeType();
      const audioBlob = new Blob(audioChunks, { type: mimeType });

      const reader = new FileReader();
      reader.onloadend = async () => {
        const parts = reader.result.split(',');
        const base64Audio = parts[1] || '';
        if (!base64Audio) {
          updateStatus('Ses dosyası okunamadı. Tekrar deneyin.');
          if (voiceInterface) voiceInterface.classList.remove('processing');
          return;
        }

        try {
          const response = await fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64Audio,
              mimeType: mimeType,
              conversationHistory: conversationHistory.slice(-20),
            }),
          });

          var result;
          try {
            result = await response.json();
          } catch (parseErr) {
            console.error('[VoiceChat] Response parse error:', parseErr);
            throw new Error('Sunucu yanıtı okunamadı');
          }

          if (!response.ok) {
            console.error('[VoiceChat] API HTTP', response.status, result?.error || '');
            throw new Error(result?.error || 'Sunucu hatası (HTTP ' + response.status + ')');
          }

          if (result.success) {
            var userText = result.userText || result.userMessage || '';
            if (userText) {
              conversationHistory.push({ role: 'user', content: userText });
            }
            if (result.response) {
              conversationHistory.push({ role: 'assistant', content: result.response });
              addMessageToChat(userText, 'user');
              addMessageToChat(result.response, 'assistant');
            } else {
              updateStatus('Yanıt alınamadı. Tekrar deneyin.');
              if (voiceInterface) voiceInterface.classList.remove('processing');
              return;
            }
            // Trim conversation history to prevent memory issues
            if (conversationHistory.length > 20) {
              conversationHistory = conversationHistory.slice(-20);
            }
            // Play audio response (server returns audioFormat for correct MIME)
            var audioData = result.audio || result.audioResponse;
            var audioFormat = result.audioFormat || 'mp3';
            if (audioData) {
              playAudioResponse(audioData, audioFormat);
            } else if (result.response) {
              speakWithBrowserTTS(result.response);
            }
            updateStatus('Hazır - tekrar kayıt için butona basın');
          } else {
            updateStatus(result.error || 'Yanıt alınamadı. Tekrar deneyin.');
          }
        } catch (fetchError) {
          console.error('[VoiceChat] API error:', fetchError);
          var errMsg = fetchError.message || 'Bağlantı hatası';
          if (fetchError.message === 'Failed to fetch' || fetchError.name === 'TypeError') {
            errMsg = 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
          }
          updateStatus(errMsg);
        } finally {
          if (voiceInterface) voiceInterface.classList.remove('processing');
        }
      };

      reader.onerror = () => {
        updateStatus('Ses dosyası okunamadı.');
        if (voiceInterface) voiceInterface.classList.remove('processing');
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      updateStatus('İşlem hatası. Tekrar deneyin.');
      if (voiceInterface) voiceInterface.classList.remove('processing');
    }
  }

  function playAudioResponse(base64Audio, format) {
    try {
      // Map format to correct MIME type
      var mimeMap = {
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'flac': 'audio/flac',
        'ogg': 'audio/ogg',
        'mp4': 'audio/mp4',
      };
      var mime = mimeMap[format] || 'audio/mpeg';
      var audio = new Audio('data:' + mime + ';base64,' + base64Audio);
      _isPlaying = true;
      audio.onended = function() { _isPlaying = false; };
      audio.onerror = function(e) {
        console.warn('[VoiceChat] Audio play failed, trying browser TTS');
        _isPlaying = false;
        // If audio fails to play, fallback to browser TTS
        var lastMsg = conversationHistory[conversationHistory.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          speakWithBrowserTTS(lastMsg.content);
        }
      };
      audio.play().catch(function(err) {
        console.warn('[VoiceChat] Audio play rejected:', err.message);
        _isPlaying = false;
        var lastMsg = conversationHistory[conversationHistory.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          speakWithBrowserTTS(lastMsg.content);
        }
      });
    } catch (error) {
      console.error('[VoiceChat] Play error:', error);
      _isPlaying = false;
    }
  }

  function addMessageToChat(text, role) {
    if (typeof window.addMessage === 'function') {
      window.addMessage(role, text);
      return;
    }
    document.dispatchEvent(new CustomEvent('voiceChatMessage', { detail: { text, role } }));
  }

  function updateStatus(message) {
    if (statusText) statusText.textContent = message;
  }

  // Browser-native Turkish TTS fallback (no API key needed)
  function speakWithBrowserTTS(text) {
    if (!window.speechSynthesis) {
      updateStatus('Tarayıcınız sesli yanıtı desteklemiyor.');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      // Truncate very long text for TTS
      var ttsText = text.length > 500 ? text.substring(0, 500) + '...' : text;
      var utterance = new SpeechSynthesisUtterance(ttsText);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      function setVoiceAndSpeak() {
        var voices = window.speechSynthesis.getVoices();
        var turkishVoice = voices.find(function(v) { return v.lang && v.lang.startsWith('tr'); });
        if (turkishVoice) utterance.voice = turkishVoice;
        _isPlaying = true;
        utterance.onend = function() { _isPlaying = false; updateStatus('Hazır - tekrar kayıt için butona basın'); };
        utterance.onerror = function() { _isPlaying = false; };
        window.speechSynthesis.speak(utterance);
      }

      // Chrome loads voices asynchronously
      var voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoiceAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = function() {
          window.speechSynthesis.onvoiceschanged = null;
          setVoiceAndSpeak();
        };
        // Timeout fallback if voices never load
        setTimeout(function() {
          if (!_isPlaying) setVoiceAndSpeak();
        }, 300);
      }
    } catch (e) {
      console.warn('[VoiceChat] Browser TTS failed:', e.message);
      updateStatus('Sesli yanıt oluşturulamadı.');
    }
  }

  window.VoiceChat = {
    init,
    open: openVoiceInterface,
    close: closeVoiceInterface,
    isActive: () => voiceInterfaceActive,
    isRecording: () => isRecording,
    requestPermission: () => PermissionManager.requestPermission(),
    checkPermission: () => PermissionManager.checkPermissionState(),
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();
