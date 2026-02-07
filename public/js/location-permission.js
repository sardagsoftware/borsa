/* global window, document, navigator, requestAnimationFrame */
/**
 * AILYDIAN Location Permission Manager
 * Premium white-themed location permission popup
 *
 * @version 1.0.0
 */

(function () {
  'use strict';

  // Location error messages in Turkish
  const LOCATION_ERRORS = {
    1: 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından konum iznini verin.',
    2: 'Konum bilgisi alınamadı. Lütfen tekrar deneyin.',
    3: 'Konum isteği zaman aşımına uğradı. Lütfen tekrar deneyin.',
    default: 'Konum erişimi başarısız oldu. Lütfen tarayıcı ayarlarını kontrol edin.',
  };

  // Browser detection
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

  const LocationPermission = {
    // Track permission state
    locationState: 'prompt', // 'granted', 'denied', 'prompt'

    /**
     * Check current permission state using Permissions API
     */
    async checkPermissionState() {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          this.locationState = result.state;
          // Listen for permission changes
          result.addEventListener('change', () => {
            this.locationState = result.state;
            console.log('[LocationPermission] Permission state changed:', result.state);
          });
          return result.state;
        }
      } catch (_e) {
        console.log('[LocationPermission] Permissions API not supported, will prompt user');
      }
      return 'prompt';
    },

    /**
     * Inject premium white-themed styles
     */
    injectStyles() {
      if (document.getElementById('location-permission-styles')) return;

      const style = document.createElement('style');
      style.id = 'location-permission-styles';
      style.textContent = `
        /* ============================================================
           PREMIUM LOCATION PERMISSION POPUP (White Theme)
           ============================================================ */
        .location-popup-overlay {
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

        .location-popup-overlay.active {
          opacity: 1;
          visibility: visible;
        }

        .location-popup-overlay.closing {
          opacity: 0;
        }

        .location-popup {
          background: linear-gradient(145deg, rgba(32, 33, 36, 0.98), rgba(24, 25, 28, 0.98));
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          padding: 2rem;
          max-width: 420px;
          width: 100%;
          box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.5),
            0 0 100px rgba(255, 255, 255, 0.05);
          transform: scale(0.9) translateY(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
        }

        .location-popup-overlay.active .location-popup {
          transform: scale(1) translateY(0);
        }

        .location-popup-overlay.closing .location-popup {
          transform: scale(0.9) translateY(20px);
        }

        .location-popup-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(200, 200, 200, 0.1));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: locationPulse 2s ease-in-out infinite;
        }

        .location-popup-icon.denied {
          background: rgba(239, 68, 68, 0.15);
          animation: none;
        }

        @keyframes locationPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px 10px rgba(255, 255, 255, 0.1); }
        }

        .location-popup-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.75rem;
        }

        .location-popup-desc {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .location-popup-features {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
        }

        .location-feature {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.9rem;
          text-align: left;
        }

        .location-popup-privacy {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
          margin-bottom: 1.5rem;
        }

        .location-popup-actions {
          display: flex;
          gap: 0.75rem;
        }

        .location-btn {
          flex: 1;
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .location-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .location-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }

        .location-btn-primary {
          background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
          color: #0a0b0d;
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
        }

        .location-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.3);
        }

        .location-btn-primary:active {
          transform: translateY(0);
        }

        .location-instructions {
          text-align: left;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .location-instructions h4 {
          color: #fff;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }

        .location-instructions ol {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          padding-left: 1.25rem;
          margin: 0;
        }

        .location-instructions li {
          margin-bottom: 0.5rem;
        }

        .location-popup.location-denied .location-popup-icon {
          background: rgba(239, 68, 68, 0.15);
        }

        /* Mobile responsive for location popup */
        @media (max-width: 480px) {
          .location-popup {
            padding: 1.5rem;
            margin: 1rem;
          }

          .location-popup-title {
            font-size: 1.25rem;
          }

          .location-popup-actions {
            flex-direction: column;
          }
        }
      `;

      document.head.appendChild(style);
    },

    /**
     * Show premium permission popup (White theme)
     */
    showPermissionPopup() {
      return new Promise(resolve => {
        // Check if popup already exists
        if (document.getElementById('locationPermissionPopup')) {
          resolve(true);
          return;
        }

        this.injectStyles();

        const popup = document.createElement('div');
        popup.id = 'locationPermissionPopup';
        popup.className = 'location-popup-overlay';
        popup.innerHTML = `
          <div class="location-popup">
            <div class="location-popup-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <defs>
                  <linearGradient id="locGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ffffff"/>
                    <stop offset="100%" style="stop-color:#b0b0b0"/>
                  </linearGradient>
                </defs>
                <path fill="url(#locGradient)" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <h3 class="location-popup-title">Konum Erişimi Gerekli</h3>
            <p class="location-popup-desc">
              Daha iyi bir deneyim için konumunuza erişim izni gereklidir.
              Bu izin yalnızca size özel içerik sunmak için kullanılacaktır.
            </p>
            <div class="location-popup-features">
              <div class="location-feature">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Yerel hava durumu ve haberler</span>
              </div>
              <div class="location-feature">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Yakınlık tabanlı öneriler</span>
              </div>
              <div class="location-feature">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Kişiselleştirilmiş deneyim</span>
              </div>
            </div>
            <div class="location-popup-privacy">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#888">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              <span>Konum verileriniz güvenle korunmaktadır</span>
            </div>
            <div class="location-popup-actions">
              <button class="location-btn location-btn-secondary" id="locationDenyBtn">
                Şimdi Değil
              </button>
              <button class="location-btn location-btn-primary" id="locationAllowBtn">
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
        document.getElementById('locationAllowBtn').addEventListener('click', () => {
          this.closePermissionPopup(popup);
          resolve(true);
        });

        document.getElementById('locationDenyBtn').addEventListener('click', () => {
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
            <li>Konum iznini "İzin ver" olarak değiştirin</li>
            <li>Sayfayı yenileyin</li>
          </ol>
        `;
      } else if (browserInfo.isSafari) {
        instructions = `
          <ol>
            <li>Safari > Tercihler > Web Siteleri menüsüne gidin</li>
            <li>Sol taraftan "Konum" seçin</li>
            <li>Bu site için "İzin Ver" seçin</li>
            <li>Sayfayı yenileyin</li>
          </ol>
        `;
      } else if (browserInfo.isFirefox) {
        instructions = `
          <ol>
            <li>Adres çubuğundaki kalkan simgesine tıklayın</li>
            <li>"İzinler" bölümüne gidin</li>
            <li>Konum iznini etkinleştirin</li>
            <li>Sayfayı yenileyin</li>
          </ol>
        `;
      } else {
        instructions = `
          <ol>
            <li>Tarayıcı ayarlarına gidin</li>
            <li>Site izinlerini bulun</li>
            <li>Konum iznini etkinleştirin</li>
            <li>Sayfayı yenileyin</li>
          </ol>
        `;
      }

      this.injectStyles();

      const popup = document.createElement('div');
      popup.className = 'location-popup-overlay active';
      popup.innerHTML = `
        <div class="location-popup location-denied">
          <div class="location-popup-icon denied">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="#ef4444">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" stroke-width="2"/>
            </svg>
          </div>
          <h3 class="location-popup-title">Konum İzni Reddedildi</h3>
          <p class="location-popup-desc">
            Konum özelliklerini kullanmak için konum iznini manuel olarak etkinleştirmeniz gerekiyor.
          </p>
          <div class="location-instructions">
            <h4>Nasıl İzin Verilir:</h4>
            ${instructions}
          </div>
          <div class="location-popup-actions">
            <button class="location-btn location-btn-primary" onclick="this.closest('.location-popup-overlay').remove()">
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
     * Request location permission with premium UX
     */
    async requestPermission() {
      // First check current state
      const state = await this.checkPermissionState();

      if (state === 'granted') {
        return { success: true };
      }

      if (state === 'denied') {
        this.showDeniedPopup();
        return { success: false, error: 'denied', message: LOCATION_ERRORS[1] };
      }

      // Show premium popup first
      const userConsent = await this.showPermissionPopup();

      if (!userConsent) {
        return { success: false, error: 'user_cancelled', message: 'Kullanıcı iptal etti' };
      }

      // Now request the actual location
      return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
          position => {
            this.locationState = 'granted';
            resolve({
              success: true,
              position: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              },
            });
          },
          error => {
            console.error('[LocationPermission] Request failed:', error);

            if (error.code === 1) {
              // PERMISSION_DENIED
              this.locationState = 'denied';
              this.showDeniedPopup();
            }

            resolve({
              success: false,
              error: error.code,
              message: LOCATION_ERRORS[error.code] || LOCATION_ERRORS.default,
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes cache
          }
        );
      });
    },

    /**
     * Get current location (after permission granted)
     */
    async getCurrentLocation() {
      const state = await this.checkPermissionState();

      if (state === 'denied') {
        this.showDeniedPopup();
        return { success: false, error: 'denied' };
      }

      if (state === 'prompt') {
        return this.requestPermission();
      }

      return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
          position => {
            resolve({
              success: true,
              position: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              },
            });
          },
          error => {
            resolve({
              success: false,
              error: error.code,
              message: LOCATION_ERRORS[error.code] || LOCATION_ERRORS.default,
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          }
        );
      });
    },
  };

  // Export to global
  window.LocationPermission = LocationPermission;

  console.log('[LocationPermission] Premium location permission manager loaded');
})();
