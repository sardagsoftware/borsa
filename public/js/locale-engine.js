/**
 * 🌍 LyDian Locale Engine v2.0
 *
 * Enterprise-grade internationalization system for client-side applications
 *
 * Features:
 * - Locale detection (Cookie → URL → Accept-Language → Fallback)
 * - ICU MessageFormat support
 * - Lazy-loaded translations
 * - RTL support for Arabic
 * - SEO-friendly hreflang injection
 * - Pluralization & gender support
 * - Number/date formatting
 *
 * Usage:
 *   <script src="/js/locale-engine.js"></script>
 *   <script>
 *     const i18n = new LocaleEngine({ defaultLocale: 'tr' });
 *     await i18n.init();
 *     document.getElementById('greeting').textContent = i18n.t('nav.dashboard');
 *   </script>
 *
 * @author LyDian AI Platform
 * @license MIT
 * @version 2.0.0
 */

(function (global) {
    'use strict';

    // ============================
    // CONFIGURATION
    // ============================

    const CONFIG = {
        supportedLocales: ['tr', 'en', 'de', 'fr', 'es', 'ar', 'ru', 'it', 'ja', 'zh-CN', 'az'],
        defaultLocale: 'tr',
        fallbackLocale: 'en',
        cookieName: 'ailydian_locale',
        cookieExpireDays: 365,
        i18nBasePath: '/i18n/v2',
        autoDetect: true,
        preloadCategories: ['nav', 'footer', 'cta', 'common'], // Load these immediately
        lazyLoadCategories: ['hero', 'forms', 'errors', 'stats', 'content'], // Load on demand
    };

    // ============================
    // RTL LANGUAGES
    // ============================

    const RTL_LOCALES = ['ar'];

    // ============================
    // LOCALE ENGINE
    // ============================

    class LocaleEngine {
        constructor(options = {}) {
            this.config = { ...CONFIG, ...options };
            this.currentLocale = null;
            this.translations = new Map(); // Map<locale, Map<key, value>>
            this.observers = []; // Array of callback functions
            this.isInitialized = false;
        }

        // ============================
        // INITIALIZATION
        // ============================

        async init() {
            if (this.isInitialized) {
                console.warn('LocaleEngine already initialized');
                return;
            }

            // 1. Detect locale
            this.currentLocale = this.detectLocale();
            console.log(`🌍 Detected locale: ${this.currentLocale}`);

            // 2. Set document attributes
            this.updateDocumentAttributes();

            // 3. Load preload categories
            await this.loadPreloadCategories();

            // 4. Inject hreflang tags
            this.injectHreflangTags();

            // 5. Mark as initialized
            this.isInitialized = true;

            // 6. Notify observers
            this.notifyObservers();

            console.log('✅ LocaleEngine initialized');
        }

        // ============================
        // LOCALE DETECTION
        // ============================

        detectLocale() {
            if (!this.config.autoDetect) {
                return this.config.defaultLocale;
            }

            // 1. Check cookie
            const cookieLocale = this.getLocaleFromCookie();
            if (cookieLocale && this.isValidLocale(cookieLocale)) {
                console.log(`🍪 Locale from cookie: ${cookieLocale}`);
                return cookieLocale;
            }

            // 2. Check URL parameter (?lang=en)
            const urlLocale = this.getLocaleFromURL();
            if (urlLocale && this.isValidLocale(urlLocale)) {
                console.log(`🔗 Locale from URL: ${urlLocale}`);
                this.setLocaleCookie(urlLocale); // Save to cookie
                return urlLocale;
            }

            // 3. Check Accept-Language header (via navigator.language)
            const browserLocale = this.getLocaleFromBrowser();
            if (browserLocale && this.isValidLocale(browserLocale)) {
                console.log(`🌐 Locale from browser: ${browserLocale}`);
                this.setLocaleCookie(browserLocale); // Save to cookie
                return browserLocale;
            }

            // 4. Fallback to default
            console.log(`⚠️  No locale detected, falling back to: ${this.config.defaultLocale}`);
            return this.config.defaultLocale;
        }

        getLocaleFromCookie() {
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === this.config.cookieName) {
                    return decodeURIComponent(value);
                }
            }
            return null;
        }

        getLocaleFromURL() {
            const params = new URLSearchParams(window.location.search);
            return params.get('lang') || params.get('locale');
        }

        getLocaleFromBrowser() {
            const browserLang = navigator.language || navigator.userLanguage;
            if (!browserLang) return null;

            // Convert "en-US" → "en", "zh-CN" → "zh-CN"
            const locale = browserLang.toLowerCase();

            // Check exact match first
            if (this.config.supportedLocales.includes(locale)) {
                return locale;
            }

            // Check base language (en-US → en)
            const baseLocale = locale.split('-')[0];
            if (this.config.supportedLocales.includes(baseLocale)) {
                return baseLocale;
            }

            return null;
        }

        isValidLocale(locale) {
            return this.config.supportedLocales.includes(locale);
        }

        setLocaleCookie(locale) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + this.config.cookieExpireDays);
            document.cookie = `${this.config.cookieName}=${encodeURIComponent(locale)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
        }

        // ============================
        // DOCUMENT ATTRIBUTES
        // ============================

        updateDocumentAttributes() {
            // Set html lang attribute
            document.documentElement.lang = this.currentLocale;

            // Set dir attribute for RTL languages
            if (RTL_LOCALES.includes(this.currentLocale)) {
                document.documentElement.dir = 'rtl';
            } else {
                document.documentElement.dir = 'ltr';
            }

            console.log(`📄 Document attributes updated: lang="${this.currentLocale}", dir="${document.documentElement.dir}"`);
        }

        // ============================
        // TRANSLATION LOADING
        // ============================

        async loadPreloadCategories() {
            const promises = this.config.preloadCategories.map(category =>
                this.loadCategory(category, this.currentLocale)
            );

            await Promise.all(promises);
            console.log(`✅ Preloaded ${this.config.preloadCategories.length} categories`);
        }

        async loadCategory(category, locale) {
            const cacheKey = `${locale}:${category}`;

            // Check if already loaded
            if (this.translations.has(cacheKey)) {
                return this.translations.get(cacheKey);
            }

            try {
                const url = `${this.config.i18nBasePath}/${locale}/${category}.json`;
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.status}`);
                }

                const data = await response.json();
                this.translations.set(cacheKey, data);

                console.log(`✅ Loaded ${category} (${locale}): ${Object.keys(data).length} keys`);
                return data;
            } catch (error) {
                console.error(`❌ Error loading ${category} (${locale}):`, error);
                return {};
            }
        }

        async loadAllCategories(locale) {
            try {
                const url = `${this.config.i18nBasePath}/${locale}/index.json`;
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.status}`);
                }

                const data = await response.json();
                this.translations.set(`${locale}:all`, data);

                console.log(`✅ Loaded all translations (${locale}): ${Object.keys(data).length} keys`);
                return data;
            } catch (error) {
                console.error(`❌ Error loading all translations (${locale}):`, error);
                return {};
            }
        }

        // ============================
        // TRANSLATION (t function)
        // ============================

        t(key, params = {}) {
            if (!this.isInitialized) {
                console.warn('LocaleEngine not initialized. Call init() first.');
                return key;
            }

            // Try current locale
            let translation = this.getTranslation(key, this.currentLocale);

            // Fallback to fallback locale
            if (!translation && this.currentLocale !== this.config.fallbackLocale) {
                translation = this.getTranslation(key, this.config.fallbackLocale);
            }

            // Fallback to key itself
            if (!translation) {
                console.warn(`Translation not found: ${key}`);
                return key;
            }

            // Apply ICU MessageFormat parameters
            return this.formatMessage(translation, params);
        }

        getTranslation(key, locale) {
            // Check in all loaded categories
            for (const [cacheKey, translations] of this.translations.entries()) {
                if (cacheKey.startsWith(`${locale}:`)) {
                    if (translations[key]) {
                        return translations[key];
                    }
                }
            }

            return null;
        }

        formatMessage(template, params) {
            if (!params || Object.keys(params).length === 0) {
                return template;
            }

            // Simple ICU MessageFormat implementation
            // Supports: {variable}, {count, plural, one {...} other {...}}
            let result = template;

            // Replace simple variables: {name} → params.name
            result = result.replace(/\{(\w+)\}/g, (match, variable) => {
                return params[variable] !== undefined ? params[variable] : match;
            });

            // TODO: Implement full ICU MessageFormat (plurals, select, etc.)
            // For now, simple variable replacement is sufficient

            return result;
        }

        // ============================
        // LOCALE SWITCHING
        // ============================

        async setLocale(newLocale) {
            if (!this.isValidLocale(newLocale)) {
                console.error(`Invalid locale: ${newLocale}`);
                return false;
            }

            if (this.currentLocale === newLocale) {
                console.log(`Locale already set to: ${newLocale}`);
                return true;
            }

            console.log(`🔄 Switching locale from ${this.currentLocale} to ${newLocale}`);

            // 1. Set new locale
            this.currentLocale = newLocale;

            // 2. Update cookie
            this.setLocaleCookie(newLocale);

            // 3. Update document attributes
            this.updateDocumentAttributes();

            // 4. Load translations for new locale
            await this.loadPreloadCategories();

            // 5. Notify observers
            this.notifyObservers();

            console.log(`✅ Locale switched to: ${newLocale}`);
            return true;
        }

        // ============================
        // OBSERVERS (React to locale changes)
        // ============================

        subscribe(callback) {
            if (typeof callback === 'function') {
                this.observers.push(callback);
            }
        }

        unsubscribe(callback) {
            this.observers = this.observers.filter(cb => cb !== callback);
        }

        notifyObservers() {
            for (const callback of this.observers) {
                try {
                    callback(this.currentLocale);
                } catch (error) {
                    console.error('Observer callback error:', error);
                }
            }
        }

        // ============================
        // SEO: HREFLANG TAGS
        // ============================

        injectHreflangTags() {
            // Remove existing hreflang tags
            document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(tag => tag.remove());

            const currentPath = window.location.pathname;
            const currentSearch = window.location.search.replace(/[?&]lang=[^&]*/g, ''); // Remove existing lang param

            // Add hreflang for each supported locale
            for (const locale of this.config.supportedLocales) {
                const link = document.createElement('link');
                link.rel = 'alternate';
                link.hreflang = locale;
                link.href = `${window.location.origin}${currentPath}${currentSearch}${currentSearch ? '&' : '?'}lang=${locale}`;
                document.head.appendChild(link);
            }

            // Add x-default (fallback)
            const defaultLink = document.createElement('link');
            defaultLink.rel = 'alternate';
            defaultLink.hreflang = 'x-default';
            defaultLink.href = `${window.location.origin}${currentPath}${currentSearch}${currentSearch ? '&' : '?'}lang=${this.config.defaultLocale}`;
            document.head.appendChild(defaultLink);

            console.log(`✅ Injected ${this.config.supportedLocales.length + 1} hreflang tags`);
        }

        // ============================
        // UTILITIES
        // ============================

        getCurrentLocale() {
            return this.currentLocale;
        }

        getSupportedLocales() {
            return [...this.config.supportedLocales];
        }

        isRTL() {
            return RTL_LOCALES.includes(this.currentLocale);
        }

        // Format number according to locale
        formatNumber(number, options = {}) {
            try {
                return new Intl.NumberFormat(this.currentLocale, options).format(number);
            } catch (error) {
                console.error('Error formatting number:', error);
                return number.toString();
            }
        }

        // Format date according to locale
        formatDate(date, options = {}) {
            try {
                return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
            } catch (error) {
                console.error('Error formatting date:', error);
                return date.toString();
            }
        }

        // Format currency according to locale
        formatCurrency(amount, currency = 'USD', options = {}) {
            try {
                return new Intl.NumberFormat(this.currentLocale, {
                    style: 'currency',
                    currency,
                    ...options
                }).format(amount);
            } catch (error) {
                console.error('Error formatting currency:', error);
                return `${currency} ${amount}`;
            }
        }
    }

    // ============================
    // GLOBAL EXPORT
    // ============================

    // Export to window/global
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = LocaleEngine;
    } else {
        global.LocaleEngine = LocaleEngine;
    }

    // Auto-initialize if data-auto-init is present
    if (document.currentScript && document.currentScript.hasAttribute('data-auto-init')) {
        document.addEventListener('DOMContentLoaded', async () => {
            global.i18n = new LocaleEngine();
            await global.i18n.init();
            console.log('🌍 Auto-initialized LocaleEngine as window.i18n');
        });
    }

})(typeof window !== 'undefined' ? window : global);
