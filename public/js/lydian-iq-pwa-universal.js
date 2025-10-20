// 📱 LyDian IQ - Universal PWA Installer
// Version: 3.0 - Production Ready
// Compatible: iOS Safari, Android Chrome, Huawei Browser, Desktop Chrome/Edge/Safari
// White-Hat Security: Active

(function() {
    'use strict';

    console.log('📱 LyDian IQ Universal PWA Installer loaded');

    // 🔍 Device & Browser Detection
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isHuawei = /huawei/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChrome = /chrome/.test(userAgent);
    const isEdge = /edg/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                      || window.navigator.standalone === true
                      || document.referrer.includes('android-app://');

    console.log('🔍 Device Detection:', {
        isIOS,
        isAndroid,
        isHuawei,
        isSafari,
        isChrome,
        isEdge,
        isStandalone
    });

    // 📦 PWA Install State Management
    let deferredPrompt = null;
    let installButton = null;

    // ✅ Check if PWA is already installed
    function isPWAInstalled() {
        // Already running as standalone
        if (isStandalone) {
            console.log('✅ PWA already installed (standalone mode)');
            return true;
        }

        // Check localStorage flag
        if (localStorage.getItem('lydian-iq-pwa-installed') === 'true') {
            console.log('✅ PWA installation flag found');
            return true;
        }

        // Check if dismissed recently (24 hours)
        const dismissedTime = localStorage.getItem('lydian-iq-pwa-dismissed');
        if (dismissedTime) {
            const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
            if (hoursSinceDismissed < 24) {
                console.log('⏰ PWA install prompt dismissed recently');
                return true;
            }
        }

        return false;
    }

    // 🎯 Service Worker Registration
    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service Workers not supported in this browser');
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.register('/lydian-iq-sw.js', {
                scope: '/'
            });

            console.log('✅ Service Worker registered:', registration.scope);

            // Check for updates every 60 seconds
            setInterval(() => {
                registration.update();
            }, 60000);

            // Listen for Service Worker updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🔄 Service Worker update found');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('✨ New Service Worker installed, ready to activate');
                        // Optionally show update notification to user
                        showUpdateNotification();
                    }
                });
            });

            return true;
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            return false;
        }
    }

    // 🔔 Show update notification
    function showUpdateNotification() {
        const updateBanner = document.createElement('div');
        updateBanner.id = 'pwa-update-banner';
        updateBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #C4A962 0%, #D4B972 100%);
            color: #1C2536;
            padding: 1rem;
            text-align: center;
            z-index: 100000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        updateBanner.innerHTML = `
            <span>🎉 Yeni versiyon hazır!</span>
            <button onclick="window.location.reload()" style="
                margin-left: 1rem;
                padding: 0.5rem 1rem;
                background: #1C2536;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            ">Yenile</button>
        `;
        document.body.appendChild(updateBanner);
    }

    // 🎨 Create Install Button
    function createInstallButton() {
        if (installButton) return; // Already created

        installButton = document.createElement('button');
        installButton.id = 'lydian-iq-pwa-install-btn';
        installButton.className = 'pwa-install-button';
        installButton.title = 'Mobil Uygulama Olarak İndir';
        installButton.setAttribute('aria-label', 'Install LyDian IQ as app');

        installButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15L12 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 15L3 18C3 19.1046 3.89543 20 5 20L19 20C20.1046 20 21 19.1046 21 18V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="button-text">İndir</span>
        `;

        // Responsive styles
        const isMobile = window.innerWidth <= 768;
        installButton.style.cssText = `
            position: fixed;
            ${isMobile ? 'bottom: 5.5rem; right: 1rem;' : 'bottom: 2rem; right: 2rem;'}
            ${isMobile ? 'width: 56px; height: 56px;' : 'padding: 1rem 1.5rem;'}
            background: linear-gradient(135deg, #C4A962 0%, #D4B972 100%);
            color: #1C2536;
            border: none;
            border-radius: ${isMobile ? '50%' : '12px'};
            font-weight: 700;
            font-size: ${isMobile ? '24px' : '1rem'};
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(196, 169, 98, 0.4);
            z-index: 9999;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            animation: pulse-install 2s ease-in-out infinite;
        `;

        // Hide text on mobile
        if (isMobile) {
            const textSpan = installButton.querySelector('.button-text');
            if (textSpan) textSpan.style.display = 'none';
        }

        // Click handler
        installButton.addEventListener('click', handleInstallClick);

        // Hover effects
        installButton.addEventListener('mouseenter', () => {
            installButton.style.transform = 'translateY(-4px) scale(1.05)';
            installButton.style.boxShadow = '0 12px 32px rgba(196, 169, 98, 0.5)';
        });

        installButton.addEventListener('mouseleave', () => {
            installButton.style.transform = 'translateY(0) scale(1)';
            installButton.style.boxShadow = '0 8px 24px rgba(196, 169, 98, 0.4)';
        });

        document.body.appendChild(installButton);
        console.log('✅ Install button created');
    }

    // 🎯 Handle Install Click
    async function handleInstallClick() {
        console.log('🎯 Install button clicked');

        // iOS/Safari: Show manual instructions modal
        if (isIOS || (isSafari && !isChrome)) {
            showIOSInstallModal();
            return;
        }

        // Android/Huawei with native prompt
        if (deferredPrompt) {
            try {
                await deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;

                console.log(`📱 User choice: ${outcome}`);

                if (outcome === 'accepted') {
                    console.log('✅ PWA install accepted');
                    localStorage.setItem('lydian-iq-pwa-installed', 'true');
                    if (installButton) installButton.remove();
                } else {
                    console.log('❌ PWA install dismissed');
                    localStorage.setItem('lydian-iq-pwa-dismissed', Date.now().toString());
                }

                deferredPrompt = null;
            } catch (error) {
                console.error('❌ Install prompt error:', error);
                showManualInstallModal();
            }
        } else {
            // No native prompt available, show manual instructions
            showManualInstallModal();
        }
    }

    // 📱 Show iOS Install Modal
    function showIOSInstallModal() {
        const modal = createInstallModal('iOS');
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    }

    // 🤖 Show Manual Install Modal
    function showManualInstallModal() {
        const platform = isAndroid ? 'Android' : isHuawei ? 'Huawei' : 'Desktop';
        const modal = createInstallModal(platform);
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    }

    // 🎨 Create Install Modal
    function createInstallModal(platform) {
        const modal = document.createElement('div');
        modal.id = 'lydian-iq-install-modal';
        modal.className = 'pwa-install-modal';

        const instructions = getInstallInstructions(platform);

        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.pwa-install-modal').remove()">&times;</button>
                <div class="modal-header">
                    <div class="modal-icon">${instructions.icon}</div>
                    <h2>${instructions.title}</h2>
                </div>
                <ol class="install-steps">
                    ${instructions.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
                <div class="modal-benefits">
                    <strong>✨ Avantajlar:</strong>
                    <ul>
                        <li>⚡ Daha hızlı açılış</li>
                        <li>📱 Ana ekrana kısayol</li>
                        <li>🔒 Offline çalışma</li>
                        <li>🔔 Push bildirimler</li>
                    </ul>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .pwa-install-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 100000;
            }
            .pwa-install-modal.active {
                display: block;
            }
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
            }
            .modal-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #1C2536 0%, #2D3748 100%);
                padding: 2rem;
                border-radius: 24px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
                color: white;
            }
            .modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                font-size: 2rem;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s;
            }
            .modal-close:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: rotate(90deg);
            }
            .modal-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            .modal-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            .modal-header h2 {
                color: #C4A962;
                font-size: 1.5rem;
                font-weight: 700;
            }
            .install-steps {
                background: rgba(255, 255, 255, 0.05);
                padding: 1.5rem;
                border-radius: 12px;
                margin-bottom: 1.5rem;
            }
            .install-steps li {
                margin-bottom: 1rem;
                line-height: 1.6;
                padding-left: 0.5rem;
            }
            .install-steps li:last-child {
                margin-bottom: 0;
            }
            .modal-benefits {
                background: rgba(196, 169, 98, 0.1);
                padding: 1rem;
                border-radius: 12px;
                border: 1px solid rgba(196, 169, 98, 0.3);
            }
            .modal-benefits strong {
                color: #C4A962;
                display: block;
                margin-bottom: 0.5rem;
            }
            .modal-benefits ul {
                list-style: none;
                padding: 0;
            }
            .modal-benefits li {
                padding: 0.25rem 0;
            }
            @keyframes pulse-install {
                0%, 100% {
                    box-shadow: 0 8px 24px rgba(196, 169, 98, 0.4);
                }
                50% {
                    box-shadow: 0 8px 32px rgba(196, 169, 98, 0.6), 0 0 0 8px rgba(196, 169, 98, 0.2);
                }
            }
        `;
        document.head.appendChild(style);

        return modal;
    }

    // 📝 Get platform-specific install instructions
    function getInstallInstructions(platform) {
        const instructions = {
            iOS: {
                icon: '🍎',
                title: 'iPhone/iPad\'e Yükleme',
                steps: [
                    '<strong>Paylaş</strong> butonuna dokunun (⬆️)',
                    '<strong>"Ana Ekrana Ekle"</strong> seçeneğini bulun',
                    '<strong>"Ekle"</strong> butonuna dokunun',
                    'Uygulama ana ekranınızda hazır! 🎉'
                ]
            },
            Android: {
                icon: '🤖',
                title: 'Android\'e Yükleme',
                steps: [
                    '<strong>Menü</strong> butonuna dokunun (⋮)',
                    '<strong>"Ana ekrana ekle"</strong> seçeneğini seçin',
                    '<strong>"Yükle"</strong> butonuna dokunun',
                    'Uygulama ana ekranınızda hazır! 🎉'
                ]
            },
            Huawei: {
                icon: '🌸',
                title: 'Huawei\'ye Yükleme',
                steps: [
                    '<strong>Menü</strong> butonuna dokunun (⋮)',
                    '<strong>"Masaüstüne ekle"</strong> seçeneğini seçin',
                    '<strong>"Ekle"</strong> butonuna dokunun',
                    'Uygulama ana ekranınızda hazır! 🎉'
                ]
            },
            Desktop: {
                icon: '💻',
                title: 'Bilgisayara Yükleme',
                steps: [
                    'Adres çubuğundaki <strong>yükle ikonuna</strong> tıklayın',
                    'Veya <strong>Menü (⋮)</strong> → <strong>"LyDian IQ\'yu yükle"</strong> seçin',
                    '<strong>"Yükle"</strong> butonuna tıklayın',
                    'Uygulama hazır! Masaüstünden açabilirsiniz 🎉'
                ]
            }
        };

        return instructions[platform] || instructions.Desktop;
    }

    // 🎯 Initialize PWA
    async function initPWA() {
        console.log('🚀 Initializing LyDian IQ PWA...');

        // Register Service Worker
        const swRegistered = await registerServiceWorker();

        if (!swRegistered) {
            console.warn('⚠️ Service Worker registration failed, PWA features limited');
        }

        // Skip if already installed
        if (isPWAInstalled()) {
            console.log('✅ PWA already installed, skipping install button');
            return;
        }

        // Create install button immediately (for browsers without beforeinstallprompt)
        createInstallButton();

        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 beforeinstallprompt event fired');
            e.preventDefault();
            deferredPrompt = e;

            // Button already created above
            if (!installButton) {
                createInstallButton();
            }
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('✅ LyDian IQ PWA successfully installed!');
            localStorage.setItem('lydian-iq-pwa-installed', 'true');
            if (installButton) installButton.remove();
            deferredPrompt = null;
        });

        console.log('✅ LyDian IQ PWA initialization complete');
    }

    // 🚀 Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPWA);
    } else {
        initPWA();
    }

    // 🔄 Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.update();
            });
        }
    });

    console.log('📱 LyDian IQ Universal PWA Installer initialized');
})();
