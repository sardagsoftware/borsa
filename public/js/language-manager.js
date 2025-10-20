// 🌍 AiLydian Ultra Pro - Enterprise Language Management System
// Real-time language switching with smooth animations and API integrations

class EnterpriseLanguageManager {
    constructor() {
        this.currentLanguage = 'tr'; // Default language
        this.supportedLanguages = ['tr', 'en', 'de', 'fr', 'es', 'ar', 'zh', 'ja'];
        this.apiManager = null;
        this.isTranslating = false;
        this.translationQueue = [];
        this.observers = [];

        // Initialize API manager
        this.initializeAPIManager();

        // Load saved language preference
        this.loadLanguagePreference();

        // Initialize language system
        this.initialize();
    }

    async initializeAPIManager() {
        try {
            this.apiManager = new EnterpriseAPIManager();
            console.log('✅ Enterprise API Manager initialized');
        } catch (error) {
            console.warn('⚠️ API Manager initialization failed:', error);
        }
    }

    initialize() {
        this.createLanguageSelector();
        this.setupLanguageObserver();
        this.applyLanguage(this.currentLanguage, false);
        this.setupKeyboardShortcuts();

        // Auto-detect browser language if no preference saved
        if (!localStorage.getItem('ailydian-language')) {
            this.detectBrowserLanguage();
        }
    }

    // 🎯 Create Enhanced Language Selector
    createLanguageSelector() {
        const selector = document.querySelector('.language-selector');
        if (!selector) return;

        // Enhanced language selector with dropdown
        selector.innerHTML = `
            <div class="language-dropdown">
                <button class="language-toggle" id="languageToggle">
                    <i class="ph ph-globe"></i>
                    <span class="current-lang-text" id="currentLangText">${LANGUAGE_CONFIG[this.currentLanguage].flag} ${LANGUAGE_CONFIG[this.currentLanguage].name}</span>
                    <i class="ph ph-caret-down dropdown-arrow"></i>
                </button>
                <div class="language-menu" id="languageMenu">
                    ${this.generateLanguageOptions()}
                </div>
            </div>
        `;

        // Add styles for the enhanced selector
        this.addLanguageSelectorStyles();

        // Setup event listeners
        this.setupSelectorEvents();
    }

    generateLanguageOptions() {
        return this.supportedLanguages.map(langCode => {
            const config = LANGUAGE_CONFIG[langCode];
            const isActive = langCode === this.currentLanguage ? 'active' : '';

            return `
                <div class="language-option ${isActive}" data-lang="${langCode}">
                    <span class="flag">${config.flag}</span>
                    <span class="name">${config.name}</span>
                    ${langCode === this.currentLanguage ? '<i class="ph ph-check"></i>' : ''}
                </div>
            `;
        }).join('');
    }

    addLanguageSelectorStyles() {
        if (document.getElementById('language-selector-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'language-selector-styles';
        styles.textContent = `
            .language-dropdown {
                position: relative;
                display: inline-block;
            }

            .language-toggle {
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 10px 16px;
                color: white;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 14px;
                font-weight: 500;
            }

            .language-toggle:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }

            .language-toggle.active {
                background: rgba(16, 185, 129, 0.2);
                border-color: rgba(16, 185, 129, 0.4);
            }

            .current-lang-text {
                font-size: 14px;
                font-weight: 600;
                white-space: nowrap;
            }

            .dropdown-arrow {
                transition: transform 0.3s ease;
                font-size: 12px;
            }

            .language-toggle.active .dropdown-arrow {
                transform: rotate(180deg);
            }

            .language-menu {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                min-width: 200px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                padding: 8px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px) scale(0.95);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1000;
            }

            .language-menu.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
            }

            .language-option {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                color: #374151;
                font-size: 14px;
                font-weight: 500;
            }

            .language-option:hover {
                background: rgba(16, 185, 129, 0.1);
                color: #047857;
                transform: translateX(4px);
            }

            .language-option.active {
                background: rgba(16, 185, 129, 0.15);
                color: #047857;
                font-weight: 600;
            }

            .language-option .flag {
                font-size: 18px;
            }

            .language-option .name {
                flex: 1;
            }

            .language-option i {
                color: #10b981;
                font-size: 16px;
            }

            /* RTL Support */
            .rtl-mode {
                direction: rtl;
                text-align: right;
            }

            .rtl-mode .language-menu {
                right: auto;
                left: 0;
            }

            .rtl-mode .language-option:hover {
                transform: translateX(-4px);
            }

            /* Loading State */
            .language-toggle.loading {
                opacity: 0.7;
                pointer-events: none;
            }

            .language-toggle.loading::after {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-left: 8px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* Smooth transitions for all text elements */
            [data-translate],
            .translatable {
                transition: opacity 0.2s ease;
            }

            .translating {
                opacity: 0.6;
            }
        `;

        document.head.appendChild(styles);
    }

    setupSelectorEvents() {
        const toggle = document.getElementById('languageToggle');
        const menu = document.getElementById('languageMenu');

        if (!toggle || !menu) return;

        // Toggle dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menu.classList.contains('show');

            if (isOpen) {
                this.closeLanguageMenu();
            } else {
                this.openLanguageMenu();
            }
        });

        // Language option selection
        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.language-option');
            if (option) {
                const lang = option.getAttribute('data-lang');
                if (lang && lang !== this.currentLanguage) {
                    this.changeLanguage(lang);
                }
                this.closeLanguageMenu();
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                this.closeLanguageMenu();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('show')) {
                this.closeLanguageMenu();
            }
        });
    }

    openLanguageMenu() {
        const menu = document.getElementById('languageMenu');
        const toggle = document.getElementById('languageToggle');

        if (menu && toggle) {
            menu.classList.add('show');
            toggle.classList.add('active');
            menu.style.animation = 'slideDown 0.3s ease';
        }
    }

    closeLanguageMenu() {
        const menu = document.getElementById('languageMenu');
        const toggle = document.getElementById('languageToggle');

        if (menu && toggle) {
            menu.classList.remove('show');
            toggle.classList.remove('active');
        }
    }

    // 🎬 Language Change with Smooth Animation
    async changeLanguage(newLanguage) {
        if (this.isTranslating || newLanguage === this.currentLanguage) return;

        this.isTranslating = true;
        this.showLoadingState();

        try {
            // Animate out current content
            await this.animateContentOut();

            // Update language
            this.currentLanguage = newLanguage;
            this.saveLanguagePreference();

            // Apply new language
            await this.applyLanguage(newLanguage, true);

            // Update UI components
            this.updateLanguageSelector();
            this.updateDocumentLanguage();

            // Animate in new content
            await this.animateContentIn();

            // Notify observers
            this.notifyObservers(newLanguage);

            // Update speech recognition language
            this.updateSpeechRecognition();

            console.log(`✅ Language changed to: ${LANGUAGE_CONFIG[newLanguage].name}`);

        } catch (error) {
            console.error('Language change failed:', error);
            this.showError('Language change failed. Please try again.');
        } finally {
            this.isTranslating = false;
            this.hideLoadingState();
        }
    }

    // 🎨 Smooth Animation Methods
    async animateContentOut() {
        const elements = document.querySelectorAll('[data-translate], .translatable');

        return new Promise(resolve => {
            elements.forEach(el => el.classList.add('translating'));
            setTimeout(resolve, 200);
        });
    }

    async animateContentIn() {
        const elements = document.querySelectorAll('[data-translate], .translatable');

        return new Promise(resolve => {
            elements.forEach(el => el.classList.remove('translating'));
            setTimeout(resolve, 200);
        });
    }

    showLoadingState() {
        const toggle = document.getElementById('languageToggle');
        if (toggle) {
            toggle.classList.add('loading');
        }
    }

    hideLoadingState() {
        const toggle = document.getElementById('languageToggle');
        if (toggle) {
            toggle.classList.remove('loading');
        }
    }

    // 🔄 Apply Language to All Elements
    async applyLanguage(language, withTranslation = false) {
        const translations = TRANSLATIONS[language];
        if (!translations) return;

        // Update data-translate elements
        const elements = document.querySelectorAll('[data-translate]');

        for (const element of elements) {
            const key = element.getAttribute('data-translate');
            const translatedText = this.getNestedTranslation(translations, key);

            if (translatedText) {
                if (withTranslation && this.apiManager) {
                    // Use API translation for dynamic content
                    try {
                        const result = await this.apiManager.translate(
                            element.textContent || element.placeholder || element.value,
                            language,
                            this.currentLanguage
                        );

                        if (element.placeholder !== undefined) {
                            element.placeholder = result.translatedText;
                        } else if (element.value !== undefined) {
                            element.value = result.translatedText;
                        } else {
                            element.textContent = result.translatedText;
                        }
                    } catch (error) {
                        // Fallback to static translation
                        this.applyStaticTranslation(element, translatedText);
                    }
                } else {
                    this.applyStaticTranslation(element, translatedText);
                }
            }
        }

        // Update RTL support
        this.updateRTLSupport(language);

        // Update placeholder specifically
        this.updatePlaceholder();
    }

    applyStaticTranslation(element, translatedText) {
        if (element.placeholder !== undefined) {
            element.placeholder = translatedText;
        } else if (element.value !== undefined) {
            element.value = translatedText;
        } else {
            element.textContent = translatedText;
        }
    }

    getNestedTranslation(translations, key) {
        const keys = key.split('.');
        let result = translations;

        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                return null;
            }
        }

        return typeof result === 'string' ? result : null;
    }

    // 📱 RTL Support
    updateRTLSupport(language) {
        const isRTL = LANGUAGE_CONFIG[language].rtl;
        const body = document.body;

        if (isRTL) {
            body.classList.add('rtl-mode');
            body.setAttribute('dir', 'rtl');
        } else {
            body.classList.remove('rtl-mode');
            body.setAttribute('dir', 'ltr');
        }

        // Update specific RTL elements
        const rtlElements = document.querySelectorAll('.chat-message, .message-input, .settings-panel');
        rtlElements.forEach(el => {
            if (isRTL) {
                el.style.direction = 'rtl';
                el.style.textAlign = 'right';
            } else {
                el.style.direction = 'ltr';
                el.style.textAlign = 'left';
            }
        });
    }

    // 🎤 Update Speech Recognition Language
    updateSpeechRecognition() {
        if (window.speechRecognition) {
            const locale = LANGUAGE_CONFIG[this.currentLanguage].locale;
            window.speechRecognition.lang = locale;
            console.log(`🎤 Speech recognition updated to: ${locale}`);
        }
    }

    // 🎯 Update Components
    updateLanguageSelector() {
        const currentLangText = document.getElementById('currentLangText');
        const menu = document.getElementById('languageMenu');

        if (currentLangText) {
            const config = LANGUAGE_CONFIG[this.currentLanguage];
            currentLangText.textContent = `${config.flag} ${config.name}`;
        }

        if (menu) {
            menu.innerHTML = this.generateLanguageOptions();
        }
    }

    updateDocumentLanguage() {
        document.documentElement.lang = this.currentLanguage;
        document.querySelector('html').setAttribute('lang', this.currentLanguage);
    }

    updatePlaceholder() {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            const translations = TRANSLATIONS[this.currentLanguage];
            let placeholder = translations.placeholder;

            // Add active features to placeholder
            if (window.activeFeatures && window.activeFeatures.size > 0) {
                const features = Array.from(window.activeFeatures).join(', ');
                placeholder += ` [${features.toUpperCase()} ${translations.api?.connected || 'aktif'}]`;
            }

            messageInput.placeholder = placeholder;
        }
    }

    // 💾 Language Persistence
    saveLanguagePreference() {
        localStorage.setItem('ailydian-language', this.currentLanguage);
        localStorage.setItem('ailydian-language-timestamp', Date.now().toString());
    }

    loadLanguagePreference() {
        const saved = localStorage.getItem('ailydian-language');
        if (saved && this.supportedLanguages.includes(saved)) {
            this.currentLanguage = saved;
        }
    }

    // 🌐 Browser Language Detection
    detectBrowserLanguage() {
        const browserLang = navigator.language.split('-')[0];
        if (this.supportedLanguages.includes(browserLang)) {
            this.changeLanguage(browserLang);
        }
    }

    // ⌨️ Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + L to cycle languages
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                this.cycleLanguage();
            }
        });
    }

    cycleLanguage() {
        const currentIndex = this.supportedLanguages.indexOf(this.currentLanguage);
        const nextIndex = (currentIndex + 1) % this.supportedLanguages.length;
        const nextLanguage = this.supportedLanguages[nextIndex];
        this.changeLanguage(nextLanguage);
    }

    // 👁️ Language Observer Pattern
    setupLanguageObserver() {
        this.observers = [];
    }

    addObserver(callback) {
        this.observers.push(callback);
    }

    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    notifyObservers(newLanguage) {
        this.observers.forEach(callback => {
            try {
                callback(newLanguage);
            } catch (error) {
                console.error('Observer callback error:', error);
            }
        });
    }

    // 🛠️ Utility Methods
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    getLanguageConfig(lang = this.currentLanguage) {
        return LANGUAGE_CONFIG[lang];
    }

    getTranslation(key, lang = this.currentLanguage) {
        const translations = TRANSLATIONS[lang];
        return this.getNestedTranslation(translations, key);
    }

    // 🚨 Error Handling
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'language-error-toast';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    // 📊 Performance Monitoring
    getPerformanceMetrics() {
        return {
            currentLanguage: this.currentLanguage,
            isTranslating: this.isTranslating,
            supportedLanguages: this.supportedLanguages.length,
            cacheSize: this.apiManager?.cache?.size || 0,
            observerCount: this.observers.length
        };
    }
}

// Initialize and expose globally
if (typeof window !== 'undefined') {
    window.languageManager = new EnterpriseLanguageManager();
    window.EnterpriseLanguageManager = EnterpriseLanguageManager;

    // Add global helper function
    window.t = function(key, lang) {
        return window.languageManager.getTranslation(key, lang);
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnterpriseLanguageManager;
}