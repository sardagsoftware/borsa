/**
 * LyDian AI - Multi-Language SEO Hreflang Generator
 * BEYAZ ŞAPKALI (White Hat) - Defensive SEO
 * Version: 1.0.0
 */

class HreflangGenerator {
    constructor() {
        // 8 supported languages (matching MedicalI18nManager)
        this.languages = {
            'tr': 'Türkçe',
            'en': 'English',
            'de': 'Deutsch',
            'fr': 'Français',
            'es': 'Español',
            'ar': 'العربية',
            'ru': 'Русский',
            'zh': '中文'
        };

        this.baseUrl = 'https://www.ailydian.com';
    }

    /**
     * Generate hreflang tags for current page
     * @returns {string} HTML string with hreflang tags
     */
    generateHreflangTags() {
        const currentPath = window.location.pathname;
        const pageName = currentPath === '/' ? 'index.html' : currentPath.split('/').pop();

        let hreflangHTML = '\n    <!-- SEO: Multi-Language Support (hreflang) -->\n';

        // Add language-specific links
        Object.keys(this.languages).forEach(lang => {
            const url = `${this.baseUrl}/${pageName}?lang=${lang}`;
            hreflangHTML += `    <link rel="alternate" hreflang="${lang}" href="${url}">\n`;
        });

        // Add x-default (fallback)
        hreflangHTML += `    <link rel="alternate" hreflang="x-default" href="${this.baseUrl}/${pageName}">\n`;

        return hreflangHTML;
    }

    /**
     * Inject hreflang tags into page head (client-side)
     * DEFENSIVE: Only runs if not already present
     */
    injectHreflangTags() {
        // Check if hreflang already exists (avoid duplicates - BEYAZ ŞAPKALI)
        const existingHreflang = document.querySelector('link[rel="alternate"][hreflang]');
        if (existingHreflang) {
            console.log('✅ Hreflang tags already present');
            return;
        }

        const currentPath = window.location.pathname;
        const pageName = currentPath === '/' ? 'index.html' : currentPath.split('/').pop();

        // Generate and inject tags
        Object.keys(this.languages).forEach(lang => {
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = lang;
            link.href = `${this.baseUrl}/${pageName}?lang=${lang}`;
            document.head.appendChild(link);
        });

        // Add x-default
        const defaultLink = document.createElement('link');
        defaultLink.rel = 'alternate';
        defaultLink.hreflang = 'x-default';
        defaultLink.href = `${this.baseUrl}/${pageName}`;
        document.head.appendChild(link);

        console.log('✅ Hreflang tags injected dynamically');
    }

    /**
     * Get static hreflang tags for specific page (for server-side rendering)
     * @param {string} pageName - Page filename (e.g., 'index.html')
     * @returns {string} HTML string with hreflang tags
     */
    static getHreflangForPage(pageName) {
        const baseUrl = 'https://www.ailydian.com';
        const languages = ['tr', 'en', 'de', 'fr', 'es', 'ar', 'ru', 'zh'];

        let html = '\n    <!-- SEO: Multi-Language Support (hreflang) -->\n';

        languages.forEach(lang => {
            html += `    <link rel="alternate" hreflang="${lang}" href="${baseUrl}/${pageName}?lang=${lang}">\n`;
        });

        html += `    <link rel="alternate" hreflang="x-default" href="${baseUrl}/${pageName}">\n`;

        return html;
    }

    /**
     * Validate hreflang tags on page
     * DEFENSIVE: Check for common errors
     */
    validateHreflang() {
        const hreflangLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');

        if (hreflangLinks.length === 0) {
            console.warn('⚠️ No hreflang tags found on this page');
            return false;
        }

        const foundLangs = new Set();
        let hasXDefault = false;
        let errors = [];

        hreflangLinks.forEach(link => {
            const lang = link.getAttribute('hreflang');
            const href = link.getAttribute('href');

            // Check for duplicates
            if (foundLangs.has(lang) && lang !== 'x-default') {
                errors.push(`Duplicate hreflang: ${lang}`);
            }
            foundLangs.add(lang);

            // Check for x-default
            if (lang === 'x-default') {
                hasXDefault = true;
            }

            // Check URL validity
            if (!href || !href.startsWith('https://')) {
                errors.push(`Invalid URL for ${lang}: ${href}`);
            }
        });

        if (!hasXDefault) {
            errors.push('Missing x-default hreflang');
        }

        if (errors.length > 0) {
            console.error('❌ Hreflang validation errors:', errors);
            return false;
        }

        console.log(`✅ Hreflang validation passed (${hreflangLinks.length} links)`);
        return true;
    }
}

// Initialize global hreflang generator
window.hreflangGenerator = new HreflangGenerator();

// Export for Node.js (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HreflangGenerator;
}

console.log('✅ SEO Hreflang Generator loaded (BEYAZ ŞAPKALI)');
