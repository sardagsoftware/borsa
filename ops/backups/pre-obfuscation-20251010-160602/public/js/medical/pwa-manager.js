/**
 * LyDian Medical AI - PWA Manager Module
 * Progressive Web App features and offline support
 */

const PWAManager = {
    swRegistration: null,
    deferredPrompt: null,
    isInstalled: false,

    // ============================================
    // SERVICE WORKER REGISTRATION
    // ============================================
    async init() {
        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
            console.log('Service Workers not supported');
            return false;
        }

        try {
            // Register service worker
            this.swRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', this.swRegistration);

            // Check for updates
            this.swRegistration.addEventListener('updatefound', () => {
                const newWorker = this.swRegistration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });

            // Listen for install prompt
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.deferredPrompt = e;
                this.showInstallButton();
            });

            // Check if already installed
            window.addEventListener('appinstalled', () => {
                this.isInstalled = true;
                this.hideInstallButton();
                MedicalUI.showToast('LyDian Medical AI installed successfully!', 'success');
            });

            // Check install status
            if (window.matchMedia('(display-mode: standalone)').matches) {
                this.isInstalled = true;
            }

            return true;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    },

    // ============================================
    // INSTALL PROMPT
    // ============================================
    showInstallButton() {
        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) {
            installBtn.style.display = 'block';
        }
    },

    hideInstallButton() {
        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    },

    async promptInstall() {
        if (!this.deferredPrompt) {
            MedicalUI.showToast('App already installed or install not available', 'info');
            return;
        }

        // Show install prompt
        this.deferredPrompt.prompt();

        // Wait for user response
        const { outcome } = await this.deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted install prompt');
            this.hideInstallButton();
        } else {
            console.log('User dismissed install prompt');
        }

        // Clear the deferred prompt
        this.deferredPrompt = null;
    },

    // ============================================
    // UPDATE MANAGEMENT
    // ============================================
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #1E3A8A;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 1rem;
        `;
        notification.innerHTML = `
            <span>A new version is available!</span>
            <button onclick="PWAManager.applyUpdate()" style="padding: 0.5rem 1rem; background: white; color: #1E3A8A; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Update</button>
            <button onclick="this.parentElement.remove()" style="padding: 0.5rem 1rem; background: transparent; color: white; border: 1px solid white; border-radius: 6px; cursor: pointer;">Later</button>
        `;
        document.body.appendChild(notification);
    },

    async applyUpdate() {
        if (this.swRegistration && this.swRegistration.waiting) {
            this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

            // Reload after service worker takes control
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    },

    // ============================================
    // OFFLINE SUPPORT
    // ============================================
    async cacheEssentialAssets() {
        if (!('caches' in window)) {
            console.log('Cache API not supported');
            return false;
        }

        try {
            const cache = await caches.open('medical-ai-v1');
            const essentialAssets = [
                '/medical-expert.html',
                '/css/medical-expert.css',
                '/js/medical/app.js',
                '/js/medical/state-management.js',
                '/js/medical/api-client.js',
                '/js/medical/ui-components.js',
                '/lydian-logo.png'
            ];

            await cache.addAll(essentialAssets);
            console.log('Essential assets cached');
            return true;
        } catch (error) {
            console.error('Failed to cache assets:', error);
            return false;
        }
    },

    async clearCache() {
        if (!('caches' in window)) return;

        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            MedicalUI.showToast('Cache cleared successfully', 'success');
        } catch (error) {
            console.error('Failed to clear cache:', error);
            MedicalUI.showToast('Failed to clear cache', 'error');
        }
    },

    // ============================================
    // NETWORK STATUS
    // ============================================
    initNetworkListener() {
        window.addEventListener('online', () => {
            MedicalUI.showToast('Back online', 'success');
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            MedicalUI.showToast('Working offline', 'warning');
        });
    },

    isOnline() {
        return navigator.onLine;
    },

    // ============================================
    // BACKGROUND SYNC
    // ============================================
    async registerBackgroundSync() {
        if (!this.swRegistration) return;

        try {
            await this.swRegistration.sync.register('sync-medical-data');
            console.log('Background sync registered');
        } catch (error) {
            console.error('Background sync registration failed:', error);
        }
    },

    async syncOfflineData() {
        // Sync any offline data when connection is restored
        console.log('Syncing offline data...');

        // Check if there's offline data to sync
        const offlineData = localStorage.getItem('medical-ai-offline-queue');
        if (offlineData) {
            try {
                const queue = JSON.parse(offlineData);
                // Process queue items
                for (const item of queue) {
                    // Send to server
                    await fetch(item.endpoint, {
                        method: item.method,
                        headers: item.headers,
                        body: item.body
                    });
                }

                // Clear queue
                localStorage.removeItem('medical-ai-offline-queue');
                MedicalUI.showToast('Offline data synced', 'success');
            } catch (error) {
                console.error('Sync failed:', error);
            }
        }
    },

    // ============================================
    // NOTIFICATIONS
    // ============================================
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    },

    async showNotification(title, options = {}) {
        if (!this.swRegistration) return;

        const hasPermission = await this.requestNotificationPermission();
        if (!hasPermission) return;

        try {
            await this.swRegistration.showNotification(title, {
                icon: '/lydian-logo.png',
                badge: '/lydian-logo.png',
                ...options
            });
        } catch (error) {
            console.error('Notification failed:', error);
        }
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.PWAManager = PWAManager;

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            PWAManager.init();
            PWAManager.initNetworkListener();
        });
    } else {
        PWAManager.init();
        PWAManager.initNetworkListener();
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAManager;
}
