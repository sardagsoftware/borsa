/**
 * LyDian Medical AI - Internationalization Manager
 * Complete i18n system with 8 language support and RTL
 * Version: 1.0.0
 */

class MedicalI18nManager {
    constructor() {
        this.currentLang = 'en';
        this.translations = {};
        this.rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        this.loadedLanguages = new Set();
        this.fallbackLang = 'en';

        // Available languages
        this.availableLanguages = {
            'en': { name: 'English', nativeName: 'English', flag: '🇬🇧' },
            'tr': { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
            'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
            'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
            'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
            'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
            'ru': { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
            'zh': { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' }
        };

        this.init();
    }

    async init() {
        // Detect and load user language
        await this.detectUserLanguage();
        await this.loadLanguage(this.currentLang);
        this.updatePageContent();
        this.setupEventListeners();
        this.initializeLanguageSelector();
    }

    async detectUserLanguage() {
        // Priority: 1. localStorage, 2. URL param, 3. Browser language

        // Check localStorage
        const savedLang = localStorage.getItem('medical_ai_language');
        if (savedLang && this.availableLanguages[savedLang]) {
            this.currentLang = savedLang;
            return;
        }

        // Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && this.availableLanguages[urlLang]) {
            this.currentLang = urlLang;
            localStorage.setItem('medical_ai_language', urlLang);
            return;
        }

        // Detect browser language
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0].toLowerCase();

        if (this.availableLanguages[langCode]) {
            this.currentLang = langCode;
        } else {
            this.currentLang = this.fallbackLang;
        }

        localStorage.setItem('medical_ai_language', this.currentLang);
    }

    async loadLanguage(langCode) {
        if (this.loadedLanguages.has(langCode)) {
            return true;
        }

        try {
            const response = await fetch(`/i18n/medical/${langCode}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language: ${langCode}`);
            }

            const translations = await response.json();
            this.translations[langCode] = translations;
            this.loadedLanguages.add(langCode);

            console.log(`✓ Loaded language: ${this.availableLanguages[langCode].nativeName}`);
            return true;
        } catch (error) {
            console.error(`Failed to load language ${langCode}:`, error);

            // Load fallback if current language fails
            if (langCode !== this.fallbackLang && !this.loadedLanguages.has(this.fallbackLang)) {
                return this.loadLanguage(this.fallbackLang);
            }
            return false;
        }
    }

    async setLanguage(langCode) {
        if (!this.availableLanguages[langCode]) {
            console.warn(`Language ${langCode} not supported`);
            return false;
        }

        // Load language if not loaded
        if (!this.loadedLanguages.has(langCode)) {
            await this.loadLanguage(langCode);
        }

        this.currentLang = langCode;
        localStorage.setItem('medical_ai_language', langCode);

        // Update HTML lang and dir attributes
        document.documentElement.lang = langCode;
        document.documentElement.dir = this.isRTL(langCode) ? 'rtl' : 'ltr';

        // Add/remove RTL class
        if (this.isRTL(langCode)) {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }

        // Update all translated content
        this.updatePageContent();

        // Emit language change event
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: {
                language: langCode,
                isRTL: this.isRTL(langCode),
                languageName: this.availableLanguages[langCode].nativeName
            }
        }));

        console.log(`🌍 Language changed to: ${this.availableLanguages[langCode].nativeName}`);
        return true;
    }

    updatePageContent() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.get(key);

            if (translation) {
                // Handle different element types
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (element.type === 'text' || element.type === 'number' || element.tagName === 'TEXTAREA') {
                        element.placeholder = translation;
                    } else {
                        element.value = translation;
                    }
                } else if (element.hasAttribute('title')) {
                    element.title = translation;
                } else if (element.hasAttribute('aria-label')) {
                    element.setAttribute('aria-label', translation);
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Update data-i18n-placeholder elements
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.get(key);
            if (translation) {
                element.placeholder = translation;
            }
        });

        // Update data-i18n-title elements
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.get(key);
            if (translation) {
                element.title = translation;
            }
        });

        // Update data-i18n-html elements (for HTML content)
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const translation = this.get(key);
            if (translation) {
                element.innerHTML = translation;
            }
        });

        // Update page title
        const titleKey = document.documentElement.getAttribute('data-i18n-title');
        if (titleKey) {
            document.title = this.get(titleKey) || document.title;
        } else {
            document.title = `${this.get('app.title')} - ${this.get('app.subtitle')}`;
        }
    }

    get(key, params = {}) {
        // Navigate nested object using dot notation
        const keys = key.split('.');
        let value = this.translations[this.currentLang];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                value = undefined;
                break;
            }
        }

        // Fallback to English if translation not found
        if (value === undefined && this.currentLang !== this.fallbackLang) {
            let fallbackValue = this.translations[this.fallbackLang];
            for (const k of keys) {
                if (fallbackValue && typeof fallbackValue === 'object') {
                    fallbackValue = fallbackValue[k];
                } else {
                    fallbackValue = undefined;
                    break;
                }
            }
            value = fallbackValue;
        }

        // If still not found, return the key itself
        if (value === undefined) {
            console.warn(`Translation missing: ${key}`);
            return key;
        }

        // Replace parameters in translation string
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            return Object.entries(params).reduce(
                (str, [param, val]) => str.replace(new RegExp(`\\{${param}\\}`, 'g'), val),
                value
            );
        }

        return value;
    }

    isRTL(langCode = this.currentLang) {
        return this.rtlLanguages.includes(langCode);
    }

    getCurrentLanguage() {
        return {
            code: this.currentLang,
            ...this.availableLanguages[this.currentLang],
            isRTL: this.isRTL()
        };
    }

    getAvailableLanguages() {
        return Object.entries(this.availableLanguages).map(([code, info]) => ({
            code,
            ...info,
            isRTL: this.isRTL(code),
            isCurrent: code === this.currentLang
        }));
    }

    // Format numbers based on current language
    formatNumber(number, options = {}) {
        try {
            return new Intl.NumberFormat(this.currentLang, options).format(number);
        } catch {
            return number.toString();
        }
    }

    // Format dates based on current language
    formatDate(date, options = {}) {
        try {
            const defaultOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                ...options
            };
            return new Intl.DateTimeFormat(this.currentLang, defaultOptions).format(date);
        } catch {
            return date.toLocaleDateString();
        }
    }

    // Format time based on current language
    formatTime(date, options = {}) {
        try {
            const defaultOptions = {
                hour: '2-digit',
                minute: '2-digit',
                ...options
            };
            return new Intl.DateTimeFormat(this.currentLang, defaultOptions).format(date);
        } catch {
            return date.toLocaleTimeString();
        }
    }

    // Format relative time (e.g., "2 minutes ago")
    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return this.get('time.now') || 'now';
        if (minutes < 60) return `${minutes} ${this.get('time.minutesAgo') || 'minutes ago'}`;
        if (hours < 24) return `${hours} ${this.get('time.hoursAgo') || 'hours ago'}`;
        if (days === 1) return this.get('time.yesterday') || 'yesterday';
        if (days < 7) return this.formatDate(date, { weekday: 'long' });
        return this.formatDate(date);
    }

    // Pluralization helper
    plural(count, singularKey, pluralKey, zeroKey = null) {
        if (count === 0 && zeroKey) {
            return this.get(zeroKey);
        } else if (count === 1) {
            return this.get(singularKey, { count });
        } else {
            return this.get(pluralKey, { count });
        }
    }

    initializeLanguageSelector() {
        // Create language selector if it doesn't exist
        const selector = document.getElementById('languageSelector');
        if (selector) {
            this.populateLanguageSelector(selector);
        }
    }

    populateLanguageSelector(selector) {
        // Clear existing options
        selector.innerHTML = '';

        // Add all available languages
        this.getAvailableLanguages().forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = `${lang.flag} ${lang.nativeName}`;
            option.selected = lang.isCurrent;
            selector.appendChild(option);
        });

        // Add change event listener
        selector.addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
        });
    }

    setupEventListeners() {
        // Listen for language selector changes
        document.addEventListener('change', (e) => {
            if (e.target.id === 'languageSelector' || e.target.classList.contains('language-selector')) {
                this.setLanguage(e.target.value);
            }
        });

        // Listen for dynamic content additions
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.hasAttribute('data-i18n')) {
                            this.translateElement(node);
                        }
                        // Translate child elements
                        node.querySelectorAll('[data-i18n]').forEach(el => {
                            this.translateElement(el);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    translateElement(element) {
        const key = element.getAttribute('data-i18n');
        const translation = this.get(key);

        if (translation) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        }
    }

    // Export translations for external use
    exportTranslations() {
        return {
            currentLang: this.currentLang,
            translations: this.translations[this.currentLang],
            availableLanguages: this.availableLanguages
        };
    }
}

// Initialize global i18n manager
window.medicalI18n = new MedicalI18nManager();

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MedicalI18nManager;
}

// Helper function for quick translations
window.t = (key, params) => window.medicalI18n.get(key, params);

console.log('✓ Medical AI i18n Manager initialized');
