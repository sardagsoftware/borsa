/**
 * LYDIAN IQ - PWA INSTALLATION MANAGER
 * Cross-browser PWA installation with security
 *
 * Supports:
 * - Chrome/Edge (Chromium-based)
 * - Safari (iOS/macOS)
 * - Firefox
 * - Samsung Internet
 * - Opera
 *
 * Features:
 * - Smart install prompts
 * - Installation detection
 * - Update notifications
 * - Cross-platform compatibility
 * - White-hat security (no aggressive prompts)
 */

class LydianPWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isStandalone = false;
        this.browser = this.detectBrowser();
        this.platform = this.detectPlatform();

        this.init();
    }

    /**
     * Initialize PWA installer
     */
    init() {
        console.log('🚀 [PWA] Lydian IQ PWA Installer initialized');
        console.log(`📱 Platform: ${this.platform}, Browser: ${this.browser}`);

        this.checkInstallation();
        this.registerServiceWorker();
        this.setupEventListeners();
        this.checkForUpdates();

        // Show install prompt if not installed (after 30 seconds)
        if (!this.isInstalled && !this.isStandalone) {
            setTimeout(() => this.showInstallPrompt(), 30000);
        }
    }

    /**
     * Detect browser type
     */
    detectBrowser() {
        const ua = navigator.userAgent.toLowerCase();

        if (ua.includes('edg')) return 'edge';
        if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome';
        if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
        if (ua.includes('firefox')) return 'firefox';
        if (ua.includes('samsungbrowser')) return 'samsung';
        if (ua.includes('opr') || ua.includes('opera')) return 'opera';

        return 'unknown';
    }

    /**
     * Detect platform
     */
    detectPlatform() {
        const ua = navigator.userAgent.toLowerCase();

        if (/iphone|ipad|ipod/.test(ua)) return 'ios';
        if (/android/.test(ua)) return 'android';
        if (/mac/.test(ua)) return 'macos';
        if (/win/.test(ua)) return 'windows';
        if (/linux/.test(ua)) return 'linux';

        return 'unknown';
    }

    /**
     * Check if app is already installed
     */
    checkInstallation() {
        // Check if running in standalone mode (already installed)
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone === true ||
                           document.referrer.includes('android-app://');

        // Check installation API (Chrome/Edge)
        if ('getInstalledRelatedApps' in navigator) {
            navigator.getInstalledRelatedApps().then(apps => {
                this.isInstalled = apps.length > 0;
                console.log('✅ [PWA] Installation status:', this.isInstalled ? 'Installed' : 'Not installed');
            }).catch(err => {
                console.warn('⚠️ [PWA] Could not check installation status:', err);
            });
        }

        // If standalone, consider it installed
        if (this.isStandalone) {
            this.isInstalled = true;
            console.log('✅ [PWA] App running in standalone mode');
        }
    }

    /**
     * Register service worker
     */
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ [PWA] Service Worker not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/lydian-sw.js', {
                scope: '/'
            });

            console.log('✅ [PWA] Service Worker registered:', registration.scope);

            // Check for updates every 60 seconds
            setInterval(() => {
                registration.update();
            }, 60000);

            // Listen for service worker updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdatePrompt();
                    }
                });
            });

        } catch (error) {
            console.error('❌ [PWA] Service Worker registration failed:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for beforeinstallprompt event (Chrome/Edge)
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📥 [PWA] Install prompt available');

            // Prevent automatic prompt
            e.preventDefault();

            // Store for later use
            this.deferredPrompt = e;

            // Show custom install button
            this.showInstallButton();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('✅ [PWA] App installed successfully');
            this.isInstalled = true;
            this.hideInstallButton();

            // Analytics (optional)
            this.trackEvent('pwa_installed', {
                platform: this.platform,
                browser: this.browser
            });

            // Show success message
            this.showNotification('🎉 LyDian IQ installed successfully!', 'success');
        });

        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('🌐 [PWA] Connection restored');
            this.showNotification('✅ You are back online', 'success');
        });

        window.addEventListener('offline', () => {
            console.log('📡 [PWA] Connection lost');
            this.showNotification('⚠️ You are offline - Limited functionality', 'warning');
        });
    }

    /**
     * Show install button
     */
    showInstallButton() {
        // Check if button already exists
        let installBtn = document.getElementById('pwa-install-btn');

        if (!installBtn) {
            // Create install button
            installBtn = document.createElement('button');
            installBtn.id = 'pwa-install-btn';
            installBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Install App</span>
            `;

            installBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                background: linear-gradient(135deg, #C4A962 0%, #D4B972 100%);
                color: #1C2536;
                border: none;
                border-radius: 50px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(196, 169, 98, 0.3);
                transition: all 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;

            // Hover effect
            installBtn.addEventListener('mouseenter', () => {
                installBtn.style.transform = 'translateY(-3px)';
                installBtn.style.boxShadow = '0 6px 30px rgba(196, 169, 98, 0.4)';
            });

            installBtn.addEventListener('mouseleave', () => {
                installBtn.style.transform = 'translateY(0)';
                installBtn.style.boxShadow = '0 4px 20px rgba(196, 169, 98, 0.3)';
            });

            // Click handler
            installBtn.addEventListener('click', () => {
                this.promptInstall();
            });

            // Add to page
            document.body.appendChild(installBtn);

            // Animate in
            setTimeout(() => {
                installBtn.style.animation = 'slideInFromBottom 0.5s ease-out';
            }, 100);
        }
    }

    /**
     * Hide install button
     */
    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.animation = 'slideOutToBottom 0.5s ease-out';
            setTimeout(() => installBtn.remove(), 500);
        }
    }

    /**
     * Show install prompt
     */
    showInstallPrompt() {
        // Don't show if already installed or standalone
        if (this.isInstalled || this.isStandalone) return;

        // Platform-specific instructions
        const instructions = this.getInstallInstructions();

        if (!instructions) return;

        // Create prompt modal
        const modal = document.createElement('div');
        modal.id = 'pwa-install-modal';
        modal.innerHTML = `
            <div class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(5px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            ">
                <div class="modal-content" style="
                    background: linear-gradient(135deg, #1C2536 0%, #2D3748 100%);
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 500px;
                    width: 100%;
                    color: white;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(196, 169, 98, 0.2);
                ">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="/lydian-logo.png" alt="LyDian IQ" style="width: 60px; height: 60px; margin-bottom: 10px;">
                        <h2 style="margin: 0 0 10px 0; font-size: 1.5rem; color: #C4A962;">Install LyDian IQ</h2>
                        <p style="margin: 0; opacity: 0.8; font-size: 0.95rem;">Get instant access to ultra intelligence AI</p>
                    </div>

                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin: 20px 0;">
                        ${instructions}
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button id="pwa-install-now" style="
                            flex: 1;
                            padding: 12px;
                            background: linear-gradient(135deg, #C4A962 0%, #D4B972 100%);
                            color: #1C2536;
                            border: none;
                            border-radius: 10px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 1rem;
                        ">Install Now</button>

                        <button id="pwa-install-later" style="
                            flex: 1;
                            padding: 12px;
                            background: rgba(255, 255, 255, 0.1);
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            border-radius: 10px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 1rem;
                        ">Maybe Later</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('pwa-install-now').addEventListener('click', () => {
            this.promptInstall();
            modal.remove();
        });

        document.getElementById('pwa-install-later').addEventListener('click', () => {
            modal.remove();
        });

        // Close on outside click
        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                modal.remove();
            }
        });
    }

    /**
     * Get platform-specific install instructions
     */
    getInstallInstructions() {
        if (this.platform === 'ios' && this.browser === 'safari') {
            return `
                <ol style="margin: 0; padding-left: 20px; text-align: left; line-height: 1.8;">
                    <li>Tap the <strong>Share</strong> button (⎙)</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>Add</strong> to confirm</li>
                </ol>
            `;
        }

        if (this.platform === 'android' && ['chrome', 'samsung', 'opera'].includes(this.browser)) {
            return `
                <ol style="margin: 0; padding-left: 20px; text-align: left; line-height: 1.8;">
                    <li>Tap the menu button (⋮)</li>
                    <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                    <li>Tap <strong>Add</strong> to confirm</li>
                </ol>
            `;
        }

        if (['windows', 'macos', 'linux'].includes(this.platform) && ['chrome', 'edge'].includes(this.browser)) {
            return `
                <p style="margin: 0; text-align: left; line-height: 1.8;">
                    Click the <strong>install icon (⊕)</strong> in the address bar, or use the button below to install.
                </p>
            `;
        }

        return null;
    }

    /**
     * Prompt install
     */
    async promptInstall() {
        if (!this.deferredPrompt) {
            console.warn('⚠️ [PWA] Install prompt not available');
            return;
        }

        // Show native install prompt
        this.deferredPrompt.prompt();

        // Wait for user response
        const { outcome } = await this.deferredPrompt.userChoice;

        console.log(`📊 [PWA] Install prompt outcome: ${outcome}`);

        // Track outcome
        this.trackEvent('pwa_install_prompt', {
            outcome,
            platform: this.platform,
            browser: this.browser
        });

        // Clear prompt
        this.deferredPrompt = null;

        if (outcome === 'accepted') {
            this.hideInstallButton();
        }
    }

    /**
     * Check for updates
     */
    async checkForUpdates() {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.getRegistration();

            if (registration) {
                // Check for updates
                registration.update();
            }
        } catch (error) {
            console.error('❌ [PWA] Update check failed:', error);
        }
    }

    /**
     * Show update prompt
     */
    showUpdatePrompt() {
        const notification = this.showNotification(
            '🆕 A new version of LyDian IQ is available!',
            'info',
            [
                {
                    text: 'Update Now',
                    callback: () => {
                        window.location.reload();
                    }
                },
                {
                    text: 'Later',
                    callback: () => {}
                }
            ]
        );
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info', actions = []) {
        const notification = document.createElement('div');
        notification.className = 'pwa-notification';

        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            animation: slideInFromTop 0.5s ease-out;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="flex: 1;">${message}</div>
                ${actions.length > 0 ? `
                    <div style="display: flex; gap: 8px;">
                        ${actions.map((action, i) => `
                            <button data-action="${i}" style="
                                padding: 6px 12px;
                                background: rgba(255, 255, 255, ${i === 0 ? '0.3' : '0.1'});
                                border: 1px solid rgba(255, 255, 255, 0.3);
                                border-radius: 6px;
                                color: white;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 0.9rem;
                            ">${action.text}</button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(notification);

        // Action buttons
        actions.forEach((action, i) => {
            const btn = notification.querySelector(`[data-action="${i}"]`);
            if (btn) {
                btn.addEventListener('click', () => {
                    action.callback();
                    notification.remove();
                });
            }
        });

        // Auto-remove after 5 seconds if no actions
        if (actions.length === 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOutToTop 0.5s ease-out';
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        }

        return notification;
    }

    /**
     * Track analytics event
     */
    trackEvent(eventName, data = {}) {
        // Send to analytics (Google Analytics, Mixpanel, etc.)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }

        console.log('📊 [PWA] Event tracked:', eventName, data);
    }
}

// Initialize PWA installer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.lydianPWA = new LydianPWAInstaller();
    });
} else {
    window.lydianPWA = new LydianPWAInstaller();
}

// Add animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInFromBottom {
        from {
            opacity: 0;
            transform: translateY(100px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideOutToBottom {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(100px);
        }
    }

    @keyframes slideInFromTop {
        from {
            opacity: 0;
            transform: translateY(-100px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideOutToTop {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-100px);
        }
    }
`;
document.head.appendChild(style);
