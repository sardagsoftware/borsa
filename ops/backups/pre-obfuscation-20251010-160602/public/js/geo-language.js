/**
 * AILYDIAN GeoIP Auto-Language Detection
 * Detects user's language/country and auto-switches interface
 * Zero external dependencies - uses only browser APIs
 */

(function() {
    'use strict';

    // Language mapping with fallbacks
    const LANG_MAP = {
        'tr': { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        'en': { code: 'en', name: 'English', flag: '🇺🇸' },
        'de': { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        'fr': { code: 'fr', name: 'Français', flag: '🇫🇷' },
        'es': { code: 'es', name: 'Español', flag: '🇪🇸' },
        'ar': { code: 'ar', name: 'العربية', flag: '🇸🇦' },
        'zh': { code: 'zh', name: '中文', flag: '🇨🇳' },
        'ja': { code: 'ja', name: '日本語', flag: '🇯🇵' },
        'ru': { code: 'ru', name: 'Русский', flag: '🇷🇺' },
        'it': { code: 'it', name: 'Italiano', flag: '🇮🇹' },
        'pt': { code: 'pt', name: 'Português', flag: '🇵🇹' }
    };

    const DEFAULT_LANG = 'tr';
    const STORAGE_KEY = 'ailydian-language';
    const FIRST_VISIT_KEY = 'ailydian-first-visit';

    /**
     * Detect user's preferred language
     * Priority: localStorage > Browser Language > Default
     */
    function detectLanguage() {
        // Check if user has already set a preference
        const savedLang = localStorage.getItem(STORAGE_KEY);
        if (savedLang && LANG_MAP[savedLang]) {
            console.log(`[GeoLanguage] Using saved language: ${savedLang}`);
            return savedLang;
        }

        // Detect from browser
        const browserLangs = navigator.languages || [navigator.language || navigator.userLanguage];
        console.log('[GeoLanguage] Browser languages:', browserLangs);

        for (const lang of browserLangs) {
            const langCode = lang.split('-')[0].toLowerCase();
            if (LANG_MAP[langCode]) {
                console.log(`[GeoLanguage] Detected browser language: ${langCode}`);
                return langCode;
            }
        }

        // Fallback to default
        console.log(`[GeoLanguage] Using default language: ${DEFAULT_LANG}`);
        return DEFAULT_LANG;
    }

    /**
     * Apply language to document
     */
    function applyLanguage(langCode) {
        if (!LANG_MAP[langCode]) {
            langCode = DEFAULT_LANG;
        }

        document.documentElement.lang = langCode;
        localStorage.setItem(STORAGE_KEY, langCode);

        // Add RTL support for Arabic
        if (langCode === 'ar') {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }

        console.log(`[GeoLanguage] Language set to: ${LANG_MAP[langCode].name}`);

        // Dispatch event for other scripts to listen
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: {
                code: langCode,
                info: LANG_MAP[langCode]
            }
        }));
    }

    /**
     * Show language notification on first visit
     */
    function showLanguageNotification(langCode) {
        const isFirstVisit = !localStorage.getItem(FIRST_VISIT_KEY);

        if (isFirstVisit && langCode !== DEFAULT_LANG) {
            localStorage.setItem(FIRST_VISIT_KEY, 'true');

            // Show subtle notification (can be customized)
            console.log(`[GeoLanguage] First visit detected with language: ${LANG_MAP[langCode].name}`);

            // You can add a toast notification here if needed
            // For now, just log it
        }
    }

    /**
     * Create language selector UI (optional)
     */
    function createLanguageSelector() {
        const selector = document.createElement('div');
        selector.className = 'language-selector';
        selector.id = 'languageSelector';

        const currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
        const currentInfo = LANG_MAP[currentLang];

        selector.innerHTML = `
            <button class="language-btn" aria-label="Change language" title="Dil Değiştir / Change Language">
                <span class="language-flag">${currentInfo.flag}</span>
                <span class="language-code">${currentLang.toUpperCase()}</span>
            </button>
            <div class="language-dropdown">
                ${Object.entries(LANG_MAP).map(([code, info]) => `
                    <button class="language-option ${code === currentLang ? 'active' : ''}" data-lang="${code}">
                        <span class="language-flag">${info.flag}</span>
                        <span class="language-name">${info.name}</span>
                    </button>
                `).join('')}
            </div>
        `;

        return selector;
    }

    /**
     * Initialize language detection
     */
    function init() {
        console.log('[GeoLanguage] Initializing auto-language detection...');

        const detectedLang = detectLanguage();
        applyLanguage(detectedLang);
        showLanguageNotification(detectedLang);

        // Make functions globally available
        window.AILYDIAN_LANG = {
            current: detectedLang,
            available: LANG_MAP,
            change: function(langCode) {
                if (LANG_MAP[langCode]) {
                    applyLanguage(langCode);
                    location.reload(); // Reload to apply translations
                }
            },
            createSelector: createLanguageSelector
        };
    }

    // Run immediately on script load
    init();
})();
