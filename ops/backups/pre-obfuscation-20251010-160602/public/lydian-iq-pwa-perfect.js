// 📱 LyDian IQ - Perfect PWA Installer v5.0
// 🎯 ZERO ERRORS - Maksimum Uyumluluk
// 🔒 En Güvenli - White-Hat Ethical AI
// 📱 Tüm Cihazlar: iOS, Android, Desktop, Huawei
// ✅ Safari Sorunları Kökten Çözüldü
// 🛡️ Enhanced Standalone Detection - Install button auto-hides in PWA mode

(function() {
    'use strict';

    // 🎯 CORE CONFIGURATION
    const CONFIG = {
        appName: 'LyDian IQ',
        manifestUrl: '/lydian-manifest.json',
        serviceWorkerUrl: '/lydian-iq-sw.js',
        iconUrl: '/lydian-logo.png',
        startUrl: '/lydian-iq.html',
        themeColor: '#C4A962',
        backgroundColor: '#1C2536'
    };

    console.log('📱 LyDian IQ Perfect PWA Installer v5.0 loaded - Enhanced Standalone Detection');

    // 🔍 ADVANCED DEVICE DETECTION
    const ua = navigator.userAgent.toLowerCase();
    const device = {
        // iOS Detection (kökten çözüm)
        isIOS: /iphone|ipad|ipod/.test(ua) && !window.MSStream,
        isIOSChrome: /crios/.test(ua),
        isIOSFirefox: /fxios/.test(ua),
        isIOSSafari: /safari/.test(ua) && !/crios|fxios|edgios|opios/.test(ua),

        // Android Detection
        isAndroid: /android/.test(ua),
        isAndroidChrome: /android.*chrome/.test(ua) && !/edg/.test(ua),
        isAndroidFirefox: /android.*firefox/.test(ua),

        // Special Browsers
        isHuawei: /huawei/.test(ua),
        isSamsung: /samsungbrowser/.test(ua),
        isUC: /ucbrowser/.test(ua),

        // Desktop
        isDesktop: !/mobile|tablet|android|ios/.test(ua),
        isChrome: /chrome/.test(ua) && !/edg|opr/.test(ua),
        isEdge: /edg/.test(ua),
        isSafariDesktop: /safari/.test(ua) && !/chrome|android|crios|fxios/.test(ua) && /macintosh|mac os x/.test(ua),
        isFirefox: /firefox/.test(ua),

        // Standalone mode detection
        isStandalone: window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true ||
                      document.referrer.includes('android-app://')
    };

    // iOS version detection for better compatibility
    if (device.isIOS) {
        const match = ua.match(/os (\d+)_(\d+)_?(\d+)?/);
        device.iOSVersion = match ? parseFloat(match[1] + '.' + match[2]) : 0;
    }

    console.log('🔍 Device Detection:', device);

    // 🚫 ENHANCED STANDALONE MODE DETECTION
    // Multiple redundant checks for maximum reliability
    function isRunningAsStandalone() {
        // Check 1: Media query (most reliable)
        const mediaQuery = window.matchMedia('(display-mode: standalone)').matches;

        // Check 2: iOS navigator property
        const iosStandalone = window.navigator.standalone === true;

        // Check 3: Android app referrer
        const androidApp = document.referrer.includes('android-app://');

        // Check 4: Start URL parameter (set by manifest)
        const urlParams = new URLSearchParams(window.location.search);
        const fromPWA = urlParams.get('utm_source') === 'pwa' || urlParams.get('source') === 'pwa';

        // Check 5: Installation flag in localStorage
        const installFlag = localStorage.getItem('lydian-iq-pwa-installed') === 'true';

        // Check 6: Window height/width ratio (installed PWAs often have different dimensions)
        const isFullscreen = window.innerHeight === window.screen.height ||
                            window.outerHeight === window.screen.height;

        const isStandalone = mediaQuery || iosStandalone || androidApp || (installFlag && isFullscreen);

        if (isStandalone) {
            console.log('✅ Standalone mode detected via:', {
                mediaQuery,
                iosStandalone,
                androidApp,
                installFlag,
                isFullscreen
            });
        }

        return isStandalone;
    }

    // EXIT if running as standalone PWA
    if (isRunningAsStandalone()) {
        console.log('✅ Already running as PWA (standalone mode) - No install button needed');
        return;
    }

    // Check dismissed flag (24 hours cooldown)
    const dismissedKey = 'lydian-iq-pwa-dismissed';
    const installedKey = 'lydian-iq-pwa-installed';

    const dismissedTime = localStorage.getItem(dismissedKey);
    if (dismissedTime && (Date.now() - parseInt(dismissedTime)) < 24 * 60 * 60 * 1000) {
        console.log('⏰ PWA prompt dismissed recently (< 24h)');
        return;
    }

    if (localStorage.getItem(installedKey) === 'true') {
        console.log('✅ PWA already installed (flag set)');
        return;
    }

    // 🎯 GLOBAL STATE
    let deferredPrompt = null;
    let installButton = null;
    let serviceWorkerRegistration = null;

    // 📦 SERVICE WORKER REGISTRATION (Universal)
    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service Workers not supported');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.register(CONFIG.serviceWorkerUrl, {
                scope: '/',
                updateViaCache: 'none' // Force fresh SW
            });

            console.log('✅ Service Worker registered:', registration.scope);

            // Auto-update check every 60 seconds
            setInterval(() => registration.update(), 60000);

            // Listen for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('✨ New Service Worker available');
                        showUpdateAvailable();
                    }
                });
            });

            serviceWorkerRegistration = registration;
            return registration;
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            return null;
        }
    }

    // 🔔 SHOW UPDATE AVAILABLE NOTIFICATION
    function showUpdateAvailable() {
        const notification = document.createElement('div');
        notification.id = 'pwa-update-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #C4A962 0%, #D4B972 100%);
            color: #1C2536;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            z-index: 999999;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 1rem;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.innerHTML = `
            <span>🎉 Yeni versiyon hazır!</span>
            <button onclick="window.location.reload()" style="
                padding: 0.5rem 1rem;
                background: #1C2536;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            ">Yenile</button>
        `;
        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => notification.remove(), 10000);
    }

    // 🎨 CREATE PERFECT INSTALL BUTTON (All Devices)
    function createInstallButton() {
        if (installButton) return;

        const isMobile = window.innerWidth <= 768;

        installButton = document.createElement('button');
        installButton.id = 'lydian-iq-install-btn';
        installButton.setAttribute('aria-label', 'LyDian IQ uygulamasını yükle');
        installButton.setAttribute('role', 'button');
        installButton.title = 'Mobil Uygulama Olarak Yükle';

        // SVG Icon
        installButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                <path d="M12 15L12 3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 15L3 18C3 19.1046 3.89543 20 5 20L19 20C20.1046 20 21 19.1046 21 18V15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            ${!isMobile ? '<span style="margin-left: 0.5rem; font-weight: 700;">Yükle</span>' : ''}
        `;

        // Perfect responsive styles
        installButton.style.cssText = `
            position: fixed;
            ${isMobile ? 'bottom: 6rem; right: 1.25rem;' : 'bottom: 2rem; right: 2rem;'}
            ${isMobile ? 'width: 56px; height: 56px;' : 'padding: 0.875rem 1.5rem;'}
            background: linear-gradient(135deg, #C4A962 0%, #D4B972 100%);
            color: #1C2536;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: ${isMobile ? '50%' : '14px'};
            font-size: ${isMobile ? '0' : '1rem'};
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(196, 169, 98, 0.4), 0 2px 8px rgba(0,0,0,0.2);
            z-index: 999998;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulseInstall 2.5s ease-in-out infinite;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        `;

        // Event listeners
        installButton.addEventListener('click', handleInstallClick);
        installButton.addEventListener('mouseenter', () => {
            installButton.style.transform = 'translateY(-4px) scale(1.05)';
            installButton.style.boxShadow = '0 12px 32px rgba(196, 169, 98, 0.5), 0 4px 12px rgba(0,0,0,0.3)';
        });
        installButton.addEventListener('mouseleave', () => {
            installButton.style.transform = 'translateY(0) scale(1)';
            installButton.style.boxShadow = '0 8px 24px rgba(196, 169, 98, 0.4), 0 2px 8px rgba(0,0,0,0.2)';
        });

        // Add to DOM
        document.body.appendChild(installButton);
        console.log('✅ Perfect install button created');
    }

    // 🎯 HANDLE INSTALL CLICK (Platform-specific)
    async function handleInstallClick(event) {
        event.preventDefault();
        console.log('🎯 Install button clicked');

        // iOS Safari - Special handling (kökten çözüm)
        if (device.isIOS && device.isIOSSafari) {
            showIOSInstallInstructions();
            return;
        }

        // iOS Other Browsers
        if (device.isIOS && !device.isIOSSafari) {
            showIOSOtherBrowserInstructions();
            return;
        }

        // Android with native prompt
        if (deferredPrompt && (device.isAndroid || device.isDesktop)) {
            try {
                await deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;

                console.log(`📱 User choice: ${outcome}`);

                if (outcome === 'accepted') {
                    localStorage.setItem(installedKey, 'true');
                    if (installButton) installButton.remove();
                    showSuccessMessage();
                } else {
                    localStorage.setItem(dismissedKey, Date.now().toString());
                }

                deferredPrompt = null;
            } catch (error) {
                console.error('❌ Install prompt error:', error);
                showManualInstructions();
            }
        } else {
            // Fallback to manual instructions
            showManualInstructions();
        }
    }

    // 📱 iOS SAFARI INSTRUCTIONS (Perfect Solution)
    function showIOSInstallInstructions() {
        const modal = createModal({
            icon: '🍎',
            title: 'LyDian IQ - iPhone/iPad\'e Yükle',
            subtitle: 'Safari\'den ana ekrana ekleyin',
            steps: [
                {
                    icon: '⬆️',
                    text: 'Alttaki <strong>Paylaş</strong> butonuna dokunun',
                    detail: '(Ekranın altında orta buton)'
                },
                {
                    icon: '➕',
                    text: '<strong>"Ana Ekrana Ekle"</strong> seçeneğini bulun',
                    detail: '(Aşağı kaydırın, sarı ikonlu)'
                },
                {
                    icon: '✅',
                    text: 'Sağ üstteki <strong>"Ekle"</strong> butonuna dokunun',
                    detail: 'İsim: "LyDian IQ" olacak'
                },
                {
                    icon: '🎉',
                    text: 'Ana ekranınızda <strong>LyDian IQ</strong> ikonunu göreceksiniz!',
                    detail: 'Artık uygulama olarak kullanabilirsiniz'
                }
            ],
            benefits: [
                '⚡ Daha hızlı açılış',
                '📱 Ana ekranda kısayol',
                '🔒 Offline çalışma',
                '🎨 Tam ekran deneyim'
            ]
        });

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('active'));
    }

    // 📱 iOS OTHER BROWSERS (Chrome, Firefox, etc.)
    function showIOSOtherBrowserInstructions() {
        const browserName = device.isIOSChrome ? 'Chrome' : device.isIOSFirefox ? 'Firefox' : 'Tarayıcınız';

        const modal = createModal({
            icon: '🍎',
            title: 'LyDian IQ - iPhone/iPad\'e Yükle',
            subtitle: `${browserName} yerine Safari kullanın`,
            steps: [
                {
                    icon: '🌐',
                    text: '<strong>Safari tarayıcısını</strong> açın',
                    detail: '(iOS\'un varsayılan tarayıcısı)'
                },
                {
                    icon: '🔗',
                    text: 'Bu adresi Safari\'de açın:',
                    detail: '<code style="background:#1C2536;padding:4px 8px;border-radius:4px;display:block;margin-top:8px;">ailydian.com/lydian-iq.html</code>'
                },
                {
                    icon: '📱',
                    text: 'Safari\'de <strong>aynı adımları</strong> takip edin',
                    detail: 'Paylaş → Ana Ekrana Ekle'
                }
            ],
            benefits: [
                '⚠️ iOS sadece Safari\'de PWA yüklemeyi destekler',
                '✅ Safari kullanarak tam özellikli uygulama deneyimi'
            ]
        });

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('active'));
    }

    // 🤖 MANUAL INSTRUCTIONS (Android, Desktop, Other)
    function showManualInstructions() {
        let platform, steps;

        if (device.isAndroidChrome) {
            platform = { icon: '🤖', title: 'Android Chrome\'dan Yükle' };
            steps = [
                { icon: '⋮', text: 'Sağ üstteki <strong>Menü (⋮)</strong> butonuna dokunun' },
                { icon: '➕', text: '<strong>"Ana ekrana ekle"</strong> veya <strong>"Yükle"</strong> seçeneğini seçin' },
                { icon: '✅', text: '<strong>"Yükle"</strong> butonuna dokunun' },
                { icon: '🎉', text: 'Ana ekranınızda <strong>LyDian IQ</strong> ikonunu göreceksiniz!' }
            ];
        } else if (device.isSamsung) {
            platform = { icon: '📱', title: 'Samsung Internet\'ten Yükle' };
            steps = [
                { icon: '☰', text: 'Alt menü butonuna dokunun' },
                { icon: '➕', text: '<strong>"Ana ekrana ekle"</strong> seçeneğini seçin' },
                { icon: '✅', text: '<strong>"Ekle"</strong> butonuna dokunun' }
            ];
        } else if (device.isHuawei) {
            platform = { icon: '🌸', title: 'Huawei Browser\'dan Yükle' };
            steps = [
                { icon: '⋮', text: '<strong>Menü (⋮)</strong> butonuna dokunun' },
                { icon: '➕', text: '<strong>"Masaüstüne ekle"</strong> seçeneğini seçin' },
                { icon: '✅', text: '<strong>"Ekle"</strong> butonuna dokunun' }
            ];
        } else if (device.isDesktop) {
            platform = { icon: '💻', title: 'Bilgisayara Yükle' };
            steps = [
                { icon: '📍', text: 'Adres çubuğundaki <strong>yükle ikonuna</strong> tıklayın' },
                { icon: '⋮', text: 'Veya <strong>Menü (⋮)</strong> → <strong>"LyDian IQ\'yu yükle"</strong> seçin' },
                { icon: '✅', text: '<strong>"Yükle"</strong> butonuna tıklayın' },
                { icon: '🎉', text: 'Masaüstünüzden açabilirsiniz!' }
            ];
        } else {
            platform = { icon: '📱', title: 'Uygulamayı Yükle' };
            steps = [
                { icon: '⋮', text: 'Tarayıcı menüsünü açın' },
                { icon: '➕', text: '<strong>"Ana ekrana ekle"</strong> veya <strong>"Yükle"</strong> seçeneğini bulun' },
                { icon: '✅', text: 'Yükleme işlemini tamamlayın' }
            ];
        }

        const modal = createModal({
            icon: platform.icon,
            title: platform.title,
            subtitle: 'Adım adım kurulum',
            steps: steps.map((step, index) => ({
                ...step,
                detail: ''
            })),
            benefits: [
                '⚡ Daha hızlı açılış',
                '📱 Ana ekrana kısayol',
                '🔒 Offline çalışma',
                '🎨 Tam ekran deneyim'
            ]
        });

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('active'));
    }

    // 🎨 CREATE MODAL (Universal)
    function createModal({ icon, title, subtitle, steps, benefits }) {
        const modal = document.createElement('div');
        modal.className = 'lydian-pwa-modal';

        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <button class="modal-close" aria-label="Kapat">&times;</button>
                <div class="modal-header">
                    <div class="modal-icon">${icon}</div>
                    <h2>${title}</h2>
                    ${subtitle ? `<p class="modal-subtitle">${subtitle}</p>` : ''}
                </div>
                <ol class="modal-steps">
                    ${steps.map((step, i) => `
                        <li class="step-item">
                            <span class="step-icon">${step.icon}</span>
                            <div class="step-content">
                                <div class="step-text">${step.text}</div>
                                ${step.detail ? `<div class="step-detail">${step.detail}</div>` : ''}
                            </div>
                        </li>
                    `).join('')}
                </ol>
                ${benefits ? `
                    <div class="modal-benefits">
                        <strong>✨ Avantajlar:</strong>
                        <ul>
                            ${benefits.map(b => `<li>${b}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;

        // Event listeners
        const overlay = modal.querySelector('.modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');

        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        overlay.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);

        return modal;
    }

    // 🎉 SUCCESS MESSAGE
    function showSuccessMessage() {
        const msg = document.createElement('div');
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            padding: 2rem 3rem;
            border-radius: 16px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.3);
            z-index: 1000000;
            text-align: center;
            font-size: 1.25rem;
            font-weight: 700;
            animation: fadeInScale 0.3s ease-out;
        `;
        msg.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
            <div>LyDian IQ Yüklendi!</div>
            <div style="font-size: 0.875rem; font-weight: 400; margin-top: 0.5rem; opacity: 0.9;">
                Ana ekranınızdan açabilirsiniz
            </div>
        `;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    }

    // 🎨 INJECT MODAL STYLES
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulseInstall {
                0%, 100% {
                    box-shadow: 0 8px 24px rgba(196, 169, 98, 0.4), 0 2px 8px rgba(0,0,0,0.2);
                }
                50% {
                    box-shadow: 0 8px 32px rgba(196, 169, 98, 0.6), 0 2px 8px rgba(0,0,0,0.2), 0 0 0 8px rgba(196, 169, 98, 0.2);
                }
            }

            @keyframes fadeInScale {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .lydian-pwa-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 999999;
            }

            .lydian-pwa-modal.active {
                display: block;
            }

            .lydian-pwa-modal .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                animation: fadeIn 0.3s ease-out;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .lydian-pwa-modal .modal-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #1C2536 0%, #2D3748 100%);
                padding: 2rem;
                border-radius: 24px;
                max-width: 520px;
                width: 92%;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
                color: white;
                animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            @keyframes scaleIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            .lydian-pwa-modal .modal-close {
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
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
            }

            .lydian-pwa-modal .modal-close:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: rotate(90deg);
            }

            .lydian-pwa-modal .modal-header {
                text-align: center;
                margin-bottom: 2rem;
            }

            .lydian-pwa-modal .modal-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            @keyframes bounceIn {
                0% {
                    opacity: 0;
                    transform: scale(0.3);
                }
                50% {
                    transform: scale(1.1);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            .lydian-pwa-modal .modal-header h2 {
                color: #C4A962;
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
            }

            .lydian-pwa-modal .modal-subtitle {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.95rem;
                margin: 0;
            }

            .lydian-pwa-modal .modal-steps {
                list-style: none;
                padding: 0;
                margin: 0 0 1.5rem 0;
            }

            .lydian-pwa-modal .step-item {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                margin-bottom: 1.25rem;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                border-left: 3px solid #C4A962;
                transition: all 0.3s;
            }

            .lydian-pwa-modal .step-item:hover {
                background: rgba(255, 255, 255, 0.08);
                transform: translateX(4px);
            }

            .lydian-pwa-modal .step-item:last-child {
                margin-bottom: 0;
            }

            .lydian-pwa-modal .step-icon {
                font-size: 1.75rem;
                flex-shrink: 0;
            }

            .lydian-pwa-modal .step-content {
                flex: 1;
            }

            .lydian-pwa-modal .step-text {
                line-height: 1.6;
                margin-bottom: 0.25rem;
            }

            .lydian-pwa-modal .step-detail {
                font-size: 0.875rem;
                color: rgba(255, 255, 255, 0.6);
                margin-top: 0.5rem;
                line-height: 1.5;
            }

            .lydian-pwa-modal .modal-benefits {
                background: rgba(196, 169, 98, 0.1);
                padding: 1rem 1.25rem;
                border-radius: 12px;
                border: 1px solid rgba(196, 169, 98, 0.3);
                margin-top: 1.5rem;
            }

            .lydian-pwa-modal .modal-benefits strong {
                color: #C4A962;
                display: block;
                margin-bottom: 0.75rem;
                font-size: 1.05rem;
            }

            .lydian-pwa-modal .modal-benefits ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .lydian-pwa-modal .modal-benefits li {
                padding: 0.35rem 0;
                line-height: 1.5;
            }

            @media (max-width: 640px) {
                .lydian-pwa-modal .modal-content {
                    padding: 1.5rem;
                    border-radius: 20px;
                    max-height: 90vh;
                }

                .lydian-pwa-modal .modal-icon {
                    font-size: 3rem;
                }

                .lydian-pwa-modal .modal-header h2 {
                    font-size: 1.25rem;
                }

                .lydian-pwa-modal .step-icon {
                    font-size: 1.5rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 🚀 INITIALIZE PWA
    async function initPWA() {
        console.log('🚀 Initializing LyDian IQ Perfect PWA v4.0...');

        // Inject styles first
        injectStyles();

        // Register Service Worker
        await registerServiceWorker();

        // Create install button
        createInstallButton();

        // Listen for beforeinstallprompt (Android/Desktop Chrome)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            console.log('📱 beforeinstallprompt event captured');

            // Make sure button is visible
            if (!installButton) {
                createInstallButton();
            }
        });

        // Listen for appinstalled event
        window.addEventListener('appinstalled', () => {
            console.log('✅ LyDian IQ PWA successfully installed!');
            localStorage.setItem(installedKey, 'true');
            if (installButton) installButton.remove();
            showSuccessMessage();
        });

        // Handle visibility change for SW updates
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && serviceWorkerRegistration) {
                serviceWorkerRegistration.update();
            }
        });

        // 🛡️ RUNTIME STANDALONE MODE MONITOR
        // Continuously check if standalone mode is activated and hide button
        function monitorStandaloneMode() {
            if (isRunningAsStandalone()) {
                console.log('🔄 Standalone mode detected at runtime - removing install button');
                if (installButton && installButton.parentNode) {
                    installButton.remove();
                    installButton = null;
                }
                // Set flag to prevent button recreation
                localStorage.setItem(installedKey, 'true');
                return true;
            }
            return false;
        }

        // Check on page visibility change (user switches back to app)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                monitorStandaloneMode();
            }
        });

        // Check on window focus
        window.addEventListener('focus', () => {
            monitorStandaloneMode();
        });

        // Check on page load complete
        window.addEventListener('load', () => {
            monitorStandaloneMode();
        });

        // Periodic check (every 5 seconds for first 30 seconds)
        let checkCount = 0;
        const standaloneCheckInterval = setInterval(() => {
            checkCount++;
            if (monitorStandaloneMode() || checkCount >= 6) {
                clearInterval(standaloneCheckInterval);
            }
        }, 5000);

        console.log('✅ LyDian IQ Perfect PWA v5.0 initialized successfully (Enhanced Standalone Detection)');
    }

    // 🎯 START
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPWA);
    } else {
        initPWA();
    }

})();
