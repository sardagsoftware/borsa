/**
 * 📱 AiLydian Ultra Pro - Premium PWA Installer & Service Worker Manager
 * Phase 2: Premium UI with Glassmorphic Design
 *
 * Features:
 * - Premium install prompt with SVG icons
 * - Glassmorphic design matching LyDian theme
 * - Service Worker registration and lifecycle management
 * - Update notifications
 * - Offline detection
 * - PWA analytics
 *
 * @version 2.0.0
 * @author LyDian AI Platform
 * @security White-Hat Compliant
 */

(function(global) {
  'use strict';

  // ============================
  // CONFIGURATION
  // ============================

  const CONFIG = {
    swPath: '/sw-advanced.js',
    scope: '/',
    updateCheckInterval: 60 * 60 * 1000, // 1 hour
    enableNotifications: true,
    enableAnalytics: true
  };

  // ============================
  // SVG ICONS (Premium Design)
  // ============================

  const ICONS = {
    // Download/Install Icon
    download: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    `,
    // Mobile Phone Icon
    mobile: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
      </svg>
    `,
    // Update/Refresh Icon
    refresh: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
      </svg>
    `,
    // Close Icon
    close: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `,
    // Sparkles Icon (Premium)
    sparkles: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"></path>
        <path d="M19 2L20.18 5.82L24 7L20.18 8.18L19 12L17.82 8.18L14 7L17.82 5.82L19 2Z"></path>
      </svg>
    `
  };

  // ============================
  // PREMIUM STYLES
  // ============================

  const PREMIUM_STYLES = `
    @keyframes slideUpFade {
      from {
        transform: translateY(40px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes shimmer {
      0% {
        background-position: -200% center;
      }
      100% {
        background-position: 200% center;
      }
    }

    .pwa-premium-banner {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: min(300px, calc(100vw - 40px));
      background: rgba(20, 20, 20, 0.92);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(16, 163, 127, 0.15);
      border-radius: 12px;
      padding: 14px 16px;
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(16, 163, 127, 0.08);
      z-index: 10000;
      animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    }

    .pwa-banner-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .pwa-banner-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #10A37F 0%, #0D8F6E 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(16, 163, 127, 0.25);
      position: relative;
      overflow: hidden;
    }

    .pwa-banner-icon svg {
      width: 18px;
      height: 18px;
    }

    .pwa-banner-icon::before {
      content: '';
      position: absolute;
      top: 0;
      left: -200%;
      width: 200%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      animation: shimmer 3s infinite;
    }

    .pwa-banner-content {
      flex: 1;
      min-width: 0;
    }

    .pwa-banner-title {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      margin: 0 0 3px 0;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pwa-banner-subtitle {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.65);
      margin: 0;
      line-height: 1.3;
    }

    .pwa-banner-close {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .pwa-banner-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    .pwa-banner-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .pwa-btn-primary {
      flex: 1;
      background: linear-gradient(135deg, #10A37F 0%, #0D8F6E 100%);
      color: #fff;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      box-shadow: 0 2px 8px rgba(16, 163, 127, 0.25);
      position: relative;
      overflow: hidden;
    }

    .pwa-btn-primary svg {
      width: 14px;
      height: 14px;
    }

    .pwa-btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      transition: left 0.5s ease;
    }

    .pwa-btn-primary:hover::before {
      left: 100%;
    }

    .pwa-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(16, 163, 127, 0.4);
      background: linear-gradient(135deg, #0D8F6E 0%, #0B7A5E 100%);
    }

    .pwa-btn-primary:active {
      transform: translateY(0);
    }

    .pwa-btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 9px 16px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
    }

    .pwa-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Update Banner Variant */
    .pwa-update-banner {
      background: rgba(16, 163, 127, 0.95);
      border: 1px solid rgba(16, 163, 127, 0.3);
    }

    .pwa-update-banner .pwa-banner-icon {
      background: linear-gradient(135deg, #10A37F 0%, #0D8F6E 100%);
      box-shadow: 0 4px 12px rgba(16, 163, 127, 0.3);
    }

    .pwa-update-banner .pwa-btn-primary {
      background: white;
      color: #10A37F;
      box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .pwa-premium-banner {
        bottom: 12px;
        right: 12px;
        width: calc(100vw - 24px);
        padding: 12px 14px;
      }

      .pwa-banner-icon {
        width: 32px;
        height: 32px;
      }

      .pwa-banner-icon svg {
        width: 16px;
        height: 16px;
      }

      .pwa-banner-title {
        font-size: 13px;
      }

      .pwa-banner-subtitle {
        font-size: 11px;
      }

      .pwa-banner-actions {
        flex-direction: column;
        gap: 6px;
      }

      .pwa-btn-primary,
      .pwa-btn-secondary {
        width: 100%;
        padding: 7px 12px;
        font-size: 11px;
      }

      .pwa-btn-primary svg {
        width: 12px;
        height: 12px;
      }
    }
  `;

  // ============================
  // PWA INSTALLER CLASS
  // ============================

  class PWAInstaller {
    constructor(config = {}) {
      this.config = { ...CONFIG, ...config };
      this.deferredPrompt = null;
      this.isInstalled = false;
      this.registration = null;
      this.updateAvailable = false;

      this.init();
    }

    /**
     * Initialize PWA installer
     */
    async init() {
      console.log('[PWA] Initializing Premium PWA Installer...');

      // Inject premium styles
      this.injectStyles();

      // Check if PWA is already installed
      this.checkInstallStatus();

      // Register service worker
      if ('serviceWorker' in navigator) {
        await this.registerServiceWorker();
      } else {
        console.warn('[PWA] Service Workers not supported');
      }

      // Setup install prompt
      this.setupInstallPrompt();

      // Setup update checker
      this.setupUpdateChecker();

      // Setup network status monitor
      this.setupNetworkMonitor();

      console.log('[PWA] ✅ Premium PWA Installer initialized');
    }

    /**
     * Inject premium styles
     */
    injectStyles() {
      const styleEl = document.createElement('style');
      styleEl.textContent = PREMIUM_STYLES;
      document.head.appendChild(styleEl);
    }

    /**
     * Register service worker
     */
    async registerServiceWorker() {
      try {
        console.log('[PWA] Registering service worker...');

        this.registration = await navigator.serviceWorker.register(
          this.config.swPath,
          { scope: this.config.scope }
        );

        console.log('[PWA] ✅ Service Worker registered:', this.registration.scope);

        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          this.handleUpdateFound(this.registration);
        });

        // Check for updates periodically
        setInterval(() => {
          this.registration.update();
        }, this.config.updateCheckInterval);

        // Initial update check
        this.registration.update();

      } catch (error) {
        console.error('[PWA] ❌ Service Worker registration failed:', error);
      }
    }

    /**
     * Handle service worker update
     */
    handleUpdateFound(registration) {
      const newWorker = registration.installing;
      console.log('[PWA] 🔄 New service worker found, installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          this.updateAvailable = true;
          console.log('[PWA] ✅ Update available!');

          this.showUpdateNotification();
        }
      });
    }

    /**
     * Show update notification (Premium Design)
     */
    showUpdateNotification() {
      if (!this.config.enableNotifications) return;

      // Remove existing banner if any
      const existing = document.getElementById('pwa-update-banner');
      if (existing) existing.remove();

      const banner = document.createElement('div');
      banner.id = 'pwa-update-banner';
      banner.className = 'pwa-premium-banner pwa-update-banner';

      banner.innerHTML = `
        <div class="pwa-banner-header">
          <div class="pwa-banner-icon">
            ${ICONS.refresh}
          </div>
          <div class="pwa-banner-content">
            <h3 class="pwa-banner-title">
              Yeni Güncelleme Mevcut
              ${ICONS.sparkles}
            </h3>
            <p class="pwa-banner-subtitle">
              Yeni özellikleri kullanmak için uygulamayı yenileyin
            </p>
          </div>
          <button class="pwa-banner-close" aria-label="Kapat">
            ${ICONS.close}
          </button>
        </div>
        <div class="pwa-banner-actions">
          <button class="pwa-btn-primary" id="pwa-update-btn">
            ${ICONS.refresh}
            <span>Şimdi Yenile</span>
          </button>
          <button class="pwa-btn-secondary" id="pwa-update-dismiss">
            Daha Sonra
          </button>
        </div>
      `;

      document.body.appendChild(banner);

      // Update button
      banner.querySelector('#pwa-update-btn').addEventListener('click', () => {
        if (this.registration && this.registration.waiting) {
          this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });

      // Dismiss buttons
      banner.querySelector('#pwa-update-dismiss').addEventListener('click', () => {
        banner.remove();
      });

      banner.querySelector('.pwa-banner-close').addEventListener('click', () => {
        banner.remove();
      });

      // Analytics
      if (this.config.enableAnalytics) {
        this.trackEvent('pwa_update_shown');
      }
    }

    /**
     * Check if PWA is installed
     */
    checkInstallStatus() {
      // Check if running in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches ||
          window.navigator.standalone === true) {
        this.isInstalled = true;
        console.log('[PWA] ✅ Running in standalone mode (installed)');
      }
    }

    /**
     * Setup install prompt
     */
    setupInstallPrompt() {
      // Listen for beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('[PWA] Install prompt available');

        // Prevent default mini-infobar
        e.preventDefault();

        // Store the event for later use
        this.deferredPrompt = e;

        // Show custom install button/banner after delay
        setTimeout(() => {
          this.showInstallPrompt();
        }, 2000); // 2 second delay
      });

      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        console.log('[PWA] ✅ App installed successfully');
        this.isInstalled = true;
        this.hideInstallPrompt();

        // Analytics
        if (this.config.enableAnalytics) {
          this.trackEvent('pwa_installed');
        }
      });
    }

    /**
     * Show install prompt banner (Premium Design)
     */
    showInstallPrompt() {
      // Don't show if already installed
      if (this.isInstalled) return;

      // Don't show if already exists
      if (document.getElementById('pwa-install-banner')) return;

      const banner = document.createElement('div');
      banner.id = 'pwa-install-banner';
      banner.className = 'pwa-premium-banner';

      banner.innerHTML = `
        <div class="pwa-banner-header">
          <div class="pwa-banner-icon">
            ${ICONS.mobile}
          </div>
          <div class="pwa-banner-content">
            <h3 class="pwa-banner-title">
              AiLydian'ı Yükleyin
            </h3>
            <p class="pwa-banner-subtitle">
              Hızlı erişim için ana ekrana ekleyin
            </p>
          </div>
          <button class="pwa-banner-close" aria-label="Kapat">
            ${ICONS.close}
          </button>
        </div>
        <div class="pwa-banner-actions">
          <button class="pwa-btn-primary" id="pwa-install-btn">
            ${ICONS.download}
            <span>Ana Ekrana Ekle</span>
          </button>
        </div>
      `;

      document.body.appendChild(banner);

      // Install button
      banner.querySelector('#pwa-install-btn').addEventListener('click', async () => {
        if (!this.deferredPrompt) {
          console.warn('[PWA] No deferred prompt available');
          return;
        }

        // Show install prompt
        this.deferredPrompt.prompt();

        // Wait for user choice
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`[PWA] User choice: ${outcome}`);

        // Analytics
        if (this.config.enableAnalytics) {
          this.trackEvent('pwa_install_prompt', { outcome });
        }

        // Clear deferred prompt
        this.deferredPrompt = null;

        // Hide banner
        banner.remove();
      });

      // Close button
      banner.querySelector('.pwa-banner-close').addEventListener('click', () => {
        banner.remove();

        // Analytics
        if (this.config.enableAnalytics) {
          this.trackEvent('pwa_install_dismissed');
        }
      });

      // Analytics
      if (this.config.enableAnalytics) {
        this.trackEvent('pwa_install_shown');
      }
    }

    /**
     * Hide install prompt
     */
    hideInstallPrompt() {
      const banner = document.getElementById('pwa-install-banner');
      if (banner) {
        banner.remove();
      }
    }

    /**
     * Setup update checker
     */
    setupUpdateChecker() {
      // Listen for controlling service worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Controller changed, reloading page...');
        window.location.reload();
      });
    }

    /**
     * Setup network status monitor
     */
    setupNetworkMonitor() {
      // Initial status
      this.updateNetworkStatus();

      // Listen for online/offline events
      window.addEventListener('online', () => {
        console.log('[PWA] ✅ Back online');
        this.updateNetworkStatus();
      });

      window.addEventListener('offline', () => {
        console.log('[PWA] ⚠️ Went offline');
        this.updateNetworkStatus();
      });
    }

    /**
     * Update network status UI
     */
    updateNetworkStatus() {
      const isOnline = navigator.onLine;

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa:network:change', {
        detail: { online: isOnline }
      }));

      // Show offline banner if offline
      if (!isOnline) {
        this.showOfflineBanner();
      } else {
        this.hideOfflineBanner();
      }
    }

    /**
     * Show offline banner
     */
    showOfflineBanner() {
      // Don't show if already exists
      if (document.getElementById('pwa-offline-banner')) return;

      const banner = document.createElement('div');
      banner.id = 'pwa-offline-banner';
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(239, 68, 68, 0.95);
        backdrop-filter: blur(10px);
        color: white;
        padding: 12px;
        text-align: center;
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        animation: slideDown 0.3s ease-out;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      `;

      banner.innerHTML = `
        İnternet bağlantınız yok. Önbelleklenmiş içerik gösteriliyor.
      `;

      // Add animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);

      document.body.prepend(banner);
    }

    /**
     * Hide offline banner
     */
    hideOfflineBanner() {
      const banner = document.getElementById('pwa-offline-banner');
      if (banner) {
        banner.style.animation = 'slideDown 0.3s ease-out reverse';
        setTimeout(() => banner.remove(), 300);
      }
    }

    /**
     * Track analytics event
     */
    trackEvent(eventName, data = {}) {
      console.log('[PWA Analytics]', eventName, data);

      // Send to analytics API if available
      if (typeof fetch !== 'undefined') {
        try {
          fetch('/api/analytics/pwa-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: eventName,
              data,
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent
            })
          }).catch(err => console.warn('[PWA] Analytics error:', err));
        } catch (error) {
          // Silent fail
        }
      }
    }

    /**
     * Get PWA status
     */
    getStatus() {
      return {
        installed: this.isInstalled,
        swRegistered: !!this.registration,
        updateAvailable: this.updateAvailable,
        online: navigator.onLine
      };
    }
  }

  // ============================
  // AUTO-INITIALIZATION
  // ============================

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      global.pwaInstaller = new PWAInstaller();
    });
  } else {
    // DOM already loaded
    global.pwaInstaller = new PWAInstaller();
  }

  // Expose class
  global.PWAInstaller = PWAInstaller;

  console.log('[PWA] 📱 Premium PWA Installer loaded');

})(window);
