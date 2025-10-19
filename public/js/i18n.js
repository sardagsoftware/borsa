// 🌐 CLIENT-SIDE I18N SYSTEM
// Provides language switching and localization without page reload

class I18nManager {
  constructor() {
    this.currentLang = this.getStoredLang() || this.detectBrowserLang();
    this.translations = {};
    this.menuData = {};
    this.callbacks = [];
  }

  /**
   * Get stored language from localStorage
   */
  getStoredLang() {
    try {
      return localStorage.getItem('ailydian_lang');
    } catch {
      return null;
    }
  }

  /**
   * Detect browser language
   */
  detectBrowserLang() {
    const browserLang = navigator.language || navigator.userLanguage;

    // Map browser language to supported languages
    if (browserLang.startsWith('tr')) return 'tr';
    return 'en'; // Default to English
  }

  /**
   * Set current language
   */
  async setLang(lang) {
    if (!['tr', 'en'].includes(lang)) {
      console.error('Unsupported language:', lang);
      return false;
    }

    this.currentLang = lang;

    try {
      localStorage.setItem('ailydian_lang', lang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }

    // Load translations and menu data
    await Promise.all([
      this.loadTranslations(lang),
      this.loadMenuData(lang)
    ]);

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Notify all callbacks
    this.callbacks.forEach(cb => cb(lang));

    return true;
  }

  /**
   * Load translations from API
   */
  async loadTranslations(lang) {
    try {
      const response = await fetch(`/data/i18n/${lang}.json`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.translations = await response.json();
      return true;

    } catch (error) {
      console.error('Failed to load translations:', error);

      // Fallback to embedded minimal translations
      this.translations = {
        nav: {
          products: lang === 'tr' ? 'Ürünler' : 'Products',
          solutions: lang === 'tr' ? 'Çözümler' : 'Solutions',
          developers: lang === 'tr' ? 'Geliştiriciler' : 'Developers',
          company: lang === 'tr' ? 'Şirket' : 'Company'
        },
        common: {
          loading: lang === 'tr' ? 'Yükleniyor...' : 'Loading...',
          error: lang === 'tr' ? 'Bir hata oluştu' : 'An error occurred'
        }
      };

      return false;
    }
  }

  /**
   * Load menu data from API
   */
  async loadMenuData(lang) {
    try {
      const response = await fetch(`/api/menu?lang=${lang}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        this.menuData = result.data;
        return true;
      }

      throw new Error(result.error || 'Failed to load menu');

    } catch (error) {
      console.error('Failed to load menu data:', error);
      this.menuData = {};
      return false;
    }
  }

  /**
   * Get translation by key
   * @param {string} key - Dot-notation path (e.g., 'nav.products')
   */
  t(key, defaultValue = '') {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue || key;
      }
    }

    return value || defaultValue || key;
  }

  /**
   * Subscribe to language changes
   */
  onChange(callback) {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current language
   */
  getLang() {
    return this.currentLang;
  }

  /**
   * Get menu data
   */
  getMenuData() {
    return this.menuData;
  }

  /**
   * Initialize i18n system
   */
  async init() {
    await this.setLang(this.currentLang);
    return this;
  }
}

// Export singleton instance
const i18n = new I18nManager();

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
  i18n.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}
