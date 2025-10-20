/**
 * 🌍 Otomatik Dil Tespit Sistemi - Phase N
 *
 * IP-based geolocation + Browser detection + User preference
 * Tam otomatik dil tespiti ve uygulama
 *
 * Features:
 * - IP-based country detection (ipapi.co)
 * - Browser language detection
 * - Saved user preference
 * - Automatic locale switching
 * - Integration with LocaleEngine
 *
 * @version 1.0.0
 * @author LyDian AI Platform
 */

(function(global) {
    'use strict';

    // ============================
    // CONFIGURATION
    // ============================

    const CONFIG = {
        // Country code to locale mapping
        countryToLocale: {
            // Türkiye ve Türki Cumhuriyetler
            'TR': 'tr',  // Türkiye
            'AZ': 'az',  // Azerbaycan
            'TM': 'tr',  // Türkmenistan
            'UZ': 'tr',  // Özbekistan
            'KZ': 'tr',  // Kazakistan (Türkçe konuşan bölgeler)
            'KG': 'tr',  // Kırgızistan

            // English speaking countries
            'US': 'en',  // United States
            'GB': 'en',  // United Kingdom
            'CA': 'en',  // Canada
            'AU': 'en',  // Australia
            'NZ': 'en',  // New Zealand
            'IE': 'en',  // Ireland
            'ZA': 'en',  // South Africa
            'SG': 'en',  // Singapore
            'IN': 'en',  // India (primary)
            'PK': 'en',  // Pakistan
            'PH': 'en',  // Philippines

            // German speaking countries
            'DE': 'de',  // Germany
            'AT': 'de',  // Austria
            'CH': 'de',  // Switzerland (German part)
            'LI': 'de',  // Liechtenstein

            // French speaking countries
            'FR': 'fr',  // France
            'BE': 'fr',  // Belgium
            'LU': 'fr',  // Luxembourg
            'MC': 'fr',  // Monaco
            'SN': 'fr',  // Senegal
            'CI': 'fr',  // Côte d'Ivoire

            // Spanish speaking countries
            'ES': 'es',  // Spain
            'MX': 'es',  // Mexico
            'AR': 'es',  // Argentina
            'CO': 'es',  // Colombia
            'CL': 'es',  // Chile
            'PE': 'es',  // Peru
            'VE': 'es',  // Venezuela
            'EC': 'es',  // Ecuador
            'GT': 'es',  // Guatemala
            'CU': 'es',  // Cuba
            'DO': 'es',  // Dominican Republic
            'HN': 'es',  // Honduras
            'PY': 'es',  // Paraguay
            'SV': 'es',  // El Salvador
            'NI': 'es',  // Nicaragua
            'CR': 'es',  // Costa Rica
            'PA': 'es',  // Panama
            'UY': 'es',  // Uruguay
            'BO': 'es',  // Bolivia

            // Arabic speaking countries
            'SA': 'ar',  // Saudi Arabia
            'AE': 'ar',  // UAE
            'EG': 'ar',  // Egypt
            'IQ': 'ar',  // Iraq
            'JO': 'ar',  // Jordan
            'LB': 'ar',  // Lebanon
            'SY': 'ar',  // Syria
            'YE': 'ar',  // Yemen
            'KW': 'ar',  // Kuwait
            'QA': 'ar',  // Qatar
            'BH': 'ar',  // Bahrain
            'OM': 'ar',  // Oman
            'MA': 'ar',  // Morocco
            'DZ': 'ar',  // Algeria
            'TN': 'ar',  // Tunisia
            'LY': 'ar',  // Libya
            'SD': 'ar',  // Sudan

            // Russian speaking countries
            'RU': 'ru',  // Russia
            'BY': 'ru',  // Belarus
            'KZ': 'ru',  // Kazakhstan (also Russian)
            'KG': 'ru',  // Kyrgyzstan (also Russian)
            'UA': 'ru',  // Ukraine (many speak Russian)

            // Italian
            'IT': 'it',  // Italy
            'SM': 'it',  // San Marino
            'VA': 'it',  // Vatican City

            // Japanese
            'JP': 'ja',  // Japan

            // Chinese
            'CN': 'zh-CN',  // China
            'TW': 'zh-CN',  // Taiwan
            'HK': 'zh-CN',  // Hong Kong
            'MO': 'zh-CN',  // Macau
        },

        // Geolocation API endpoints (with fallbacks)
        geoAPIs: [
            {
                name: 'ipapi.co',
                url: 'https://ipapi.co/json/',
                parseResponse: (data) => data.country_code
            },
            {
                name: 'ipify + ipapi',
                url: 'https://api.ipify.org?format=json',
                followUp: async (data) => {
                    const ip = data.ip;
                    const geoResponse = await fetch(`http://ip-api.com/json/${ip}`);
                    const geoData = await geoResponse.json();
                    return geoData.countryCode;
                }
            }
        ],

        cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
        cacheKey: 'ailydian_geo_locale',
        maxRetries: 2,
        timeout: 5000
    };

    // ============================
    // AUTO LOCALE DETECTOR
    // ============================

    class AutoLocaleDetector {
        constructor(options = {}) {
            this.config = { ...CONFIG, ...options };
            this.detectedLocale = null;
            this.detectionMethod = null;
        }

        /**
         * Detect locale with priority:
         * 1. User saved preference (highest priority)
         * 2. IP-based geolocation
         * 3. Browser language
         * 4. Fallback to default
         */
        async detectLocale() {
            console.log('[AutoLocaleDetector] 🌍 Starting automatic locale detection...');

            // 1. Check user saved preference (cookie from LocaleEngine)
            const savedLocale = this.getSavedPreference();
            if (savedLocale) {
                console.log(`[AutoLocaleDetector] ✅ Using saved preference: ${savedLocale}`);
                this.detectedLocale = savedLocale;
                this.detectionMethod = 'saved_preference';
                return savedLocale;
            }

            // 2. Try IP-based geolocation (cached for 24h)
            try {
                const geoLocale = await this.detectFromIP();
                if (geoLocale) {
                    console.log(`[AutoLocaleDetector] ✅ Detected from IP: ${geoLocale}`);
                    this.detectedLocale = geoLocale;
                    this.detectionMethod = 'ip_geolocation';
                    this.cacheDetection(geoLocale);
                    return geoLocale;
                }
            } catch (error) {
                console.warn('[AutoLocaleDetector] ⚠️  IP detection failed:', error.message);
            }

            // 3. Try browser language
            const browserLocale = this.detectFromBrowser();
            if (browserLocale) {
                console.log(`[AutoLocaleDetector] ✅ Detected from browser: ${browserLocale}`);
                this.detectedLocale = browserLocale;
                this.detectionMethod = 'browser_language';
                return browserLocale;
            }

            // 4. Fallback to default (Turkish for LyDian)
            console.log('[AutoLocaleDetector] ⚠️  Using fallback locale: tr');
            this.detectedLocale = 'tr';
            this.detectionMethod = 'fallback';
            return 'tr';
        }

        /**
         * Get saved user preference
         */
        getSavedPreference() {
            // Check cookie
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'ailydian_locale') {
                    return decodeURIComponent(value);
                }
            }

            // Check localStorage
            const stored = localStorage.getItem('ailydian_locale_preference');
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    if (data.locale && data.timestamp) {
                        // Check if not expired (30 days)
                        const age = Date.now() - data.timestamp;
                        if (age < 30 * 24 * 60 * 60 * 1000) {
                            return data.locale;
                        }
                    }
                } catch (e) {
                    console.warn('[AutoLocaleDetector] Failed to parse stored preference:', e);
                }
            }

            return null;
        }

        /**
         * Detect locale from IP geolocation (with cache)
         */
        async detectFromIP() {
            // Check cache first
            const cached = this.getCachedGeoLocation();
            if (cached) {
                console.log(`[AutoLocaleDetector] 📦 Using cached geolocation: ${cached}`);
                return cached;
            }

            // Try each API with timeout and retry
            for (const api of this.config.geoAPIs) {
                for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
                    try {
                        console.log(`[AutoLocaleDetector] 🌐 Trying ${api.name} (attempt ${attempt + 1})...`);

                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

                        const response = await fetch(api.url, {
                            signal: controller.signal,
                            headers: { 'Accept': 'application/json' }
                        });
                        clearTimeout(timeoutId);

                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }

                        const data = await response.json();

                        // Parse country code
                        let countryCode;
                        if (api.followUp) {
                            countryCode = await api.followUp(data);
                        } else {
                            countryCode = api.parseResponse(data);
                        }

                        if (!countryCode) {
                            throw new Error('No country code in response');
                        }

                        // Map country to locale
                        const locale = this.config.countryToLocale[countryCode.toUpperCase()];
                        if (locale) {
                            console.log(`[AutoLocaleDetector] ✅ ${api.name}: ${countryCode} → ${locale}`);
                            this.cacheGeoLocation(locale);
                            return locale;
                        }

                        console.warn(`[AutoLocaleDetector] ⚠️  Unmapped country: ${countryCode}`);
                        return null;

                    } catch (error) {
                        console.warn(`[AutoLocaleDetector] ❌ ${api.name} failed:`, error.message);
                        if (attempt < this.config.maxRetries - 1) {
                            // Wait before retry (exponential backoff)
                            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                        }
                    }
                }
            }

            return null;
        }

        /**
         * Detect locale from browser language
         */
        detectFromBrowser() {
            const browserLang = navigator.language || navigator.userLanguage;
            if (!browserLang) return null;

            const locale = browserLang.toLowerCase();

            // Check exact match (e.g., "zh-cn")
            const supportedLocales = ['tr', 'en', 'de', 'fr', 'es', 'ar', 'ru', 'it', 'ja', 'zh-cn', 'az'];
            if (supportedLocales.includes(locale)) {
                return locale;
            }

            // Check base language (e.g., "en-US" → "en")
            const baseLocale = locale.split('-')[0];
            if (supportedLocales.includes(baseLocale)) {
                return baseLocale;
            }

            return null;
        }

        /**
         * Cache geolocation result
         */
        cacheGeoLocation(locale) {
            const data = {
                locale,
                timestamp: Date.now()
            };
            try {
                localStorage.setItem(this.config.cacheKey, JSON.stringify(data));
            } catch (e) {
                console.warn('[AutoLocaleDetector] Failed to cache:', e);
            }
        }

        /**
         * Get cached geolocation
         */
        getCachedGeoLocation() {
            try {
                const stored = localStorage.getItem(this.config.cacheKey);
                if (!stored) return null;

                const data = JSON.parse(stored);
                const age = Date.now() - data.timestamp;

                if (age < this.config.cacheDuration) {
                    return data.locale;
                }

                // Expired, remove
                localStorage.removeItem(this.config.cacheKey);
            } catch (e) {
                console.warn('[AutoLocaleDetector] Failed to read cache:', e);
            }

            return null;
        }

        /**
         * Cache detection result
         */
        cacheDetection(locale) {
            const data = {
                locale,
                method: this.detectionMethod,
                timestamp: Date.now()
            };
            try {
                localStorage.setItem('ailydian_locale_detection', JSON.stringify(data));
            } catch (e) {
                // Ignore storage errors
            }
        }

        /**
         * Get detection stats
         */
        getStats() {
            return {
                detectedLocale: this.detectedLocale,
                detectionMethod: this.detectionMethod,
                timestamp: new Date().toISOString()
            };
        }
    }

    // ============================
    // AUTO-INITIALIZATION
    // ============================

    /**
     * Automatically detect and apply locale before page render
     */
    async function autoInitialize() {
        console.log('[AutoLocaleDetector] 🚀 Auto-initializing...');

        const detector = new AutoLocaleDetector();
        const locale = await detector.detectLocale();

        // Set cookie for LocaleEngine to pick up
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 365);
        document.cookie = `ailydian_locale=${encodeURIComponent(locale)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;

        console.log(`[AutoLocaleDetector] ✅ Auto-initialized with locale: ${locale} (${detector.detectionMethod})`);

        // Dispatch event for LocaleEngine to pick up
        window.dispatchEvent(new CustomEvent('locale:auto-detected', {
            detail: {
                locale,
                method: detector.detectionMethod,
                stats: detector.getStats()
            }
        }));

        return locale;
    }

    // Export
    global.AutoLocaleDetector = AutoLocaleDetector;
    global.autoInitializeLocale = autoInitialize;

    // Auto-run if enabled
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            // Check if auto-init is enabled
            const meta = document.querySelector('meta[name="lydian-auto-locale"]');
            if (!meta || meta.content !== 'false') {
                await autoInitialize();
            }
        });
    } else {
        // DOM already loaded
        const meta = document.querySelector('meta[name="lydian-auto-locale"]');
        if (!meta || meta.content !== 'false') {
            autoInitialize();
        }
    }

    console.log('[AutoLocaleDetector] 🌍 Auto Locale Detector loaded');

})(window);
