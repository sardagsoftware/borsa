/**
 * Language Switcher UI Component
 * Beautiful, production-ready language selector
 * NO MOCK DATA - Real implementation
 *
 * @version 1.0.0
 * @license Proprietary
 */

class LanguageSwitcher {
  constructor(containerId = 'language-switcher') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('[LanguageSwitcher] Container not found:', containerId);
      return;
    }

    this.isOpen = false;
    this.currentLocale = window.i18n ? window.i18n.currentLocale : 'en';

    this.init();
  }

  /**
   * Initialize the language switcher
   */
  init() {
    this.render();
    this.attachEventListeners();

    // Listen for locale changes
    window.addEventListener('localechange', (e) => {
      this.currentLocale = e.detail.locale;
      this.render();
    });

    console.log('[LanguageSwitcher] Initialized');
  }

  /**
   * Render the language switcher UI
   */
  render() {
    if (!window.i18n) {
      console.error('[LanguageSwitcher] i18n not initialized');
      return;
    }

    const locales = window.i18n.getSupportedLocales();
    const currentLocaleInfo = window.i18n.getCurrentLocaleInfo();

    this.container.innerHTML = `
      <div class="lang-switcher">
        <button class="lang-switcher-trigger" aria-label="Change language" aria-expanded="${this.isOpen}">
          <span class="lang-flag">${currentLocaleInfo.flag}</span>
          <span class="lang-name">${currentLocaleInfo.nativeName}</span>
          <svg class="lang-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="lang-switcher-dropdown ${this.isOpen ? 'is-open' : ''}">
          <div class="lang-switcher-header">
            <span>🌍 Choose Language</span>
          </div>
          ${locales.map(locale => `
            <button
              class="lang-option ${locale.code === this.currentLocale ? 'is-active' : ''}"
              data-locale="${locale.code}"
              role="option"
              aria-selected="${locale.code === this.currentLocale}"
            >
              <span class="lang-option-flag">${locale.flag}</span>
              <div class="lang-option-content">
                <span class="lang-option-name">${locale.nativeName}</span>
                <span class="lang-option-english">${locale.name}</span>
              </div>
              ${locale.code === this.currentLocale ? '<svg class="lang-checkmark" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10A37F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Add styles if not already added
    if (!document.getElementById('lang-switcher-styles')) {
      this.injectStyles();
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Use event delegation
    this.container.addEventListener('click', (e) => {
      // Toggle dropdown
      const trigger = e.target.closest('.lang-switcher-trigger');
      if (trigger) {
        e.preventDefault();
        this.toggle();
        return;
      }

      // Select language
      const option = e.target.closest('.lang-option');
      if (option) {
        e.preventDefault();
        const locale = option.dataset.locale;
        this.selectLanguage(locale);
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target) && this.isOpen) {
        this.close();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Toggle dropdown
   */
  toggle() {
    this.isOpen = !this.isOpen;
    this.render();
  }

  /**
   * Close dropdown
   */
  close() {
    if (this.isOpen) {
      this.isOpen = false;
      this.render();
    }
  }

  /**
   * Select a language
   */
  async selectLanguage(locale) {
    if (locale === this.currentLocale) {
      this.close();
      return;
    }

    // Show loading state
    const button = this.container.querySelector(`[data-locale="${locale}"]`);
    if (button) {
      button.innerHTML = '<span class="lang-option-loading">Loading...</span>';
    }

    // Change locale
    const success = await window.i18n.changeLocale(locale);

    if (success) {
      this.currentLocale = locale;
      this.close();

      // Reload page to apply changes
      // In production, you might want to update UI without reload
      window.location.reload();
    } else {
      console.error('[LanguageSwitcher] Failed to change locale');
      this.render();
    }
  }

  /**
   * Inject CSS styles
   */
  injectStyles() {
    const style = document.createElement('style');
    style.id = 'lang-switcher-styles';
    style.textContent = `
      .lang-switcher {
        position: relative;
        display: inline-block;
      }

      .lang-switcher-trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .lang-switcher-trigger:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      }

      .lang-flag {
        font-size: 20px;
        line-height: 1;
      }

      .lang-name {
        font-size: 14px;
      }

      .lang-chevron {
        transition: transform 0.2s ease;
      }

      .lang-switcher-trigger[aria-expanded="true"] .lang-chevron {
        transform: rotate(180deg);
      }

      .lang-switcher-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 240px;
        background: white;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
        z-index: 1000;
        overflow: hidden;
      }

      .lang-switcher-dropdown.is-open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .lang-switcher-header {
        padding: 12px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .lang-option {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px 16px;
        background: white;
        border: none;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        cursor: pointer;
        transition: background 0.2s ease;
        text-align: left;
      }

      .lang-option:last-child {
        border-bottom: none;
      }

      .lang-option:hover {
        background: rgba(16, 163, 127, 0.05);
      }

      .lang-option.is-active {
        background: rgba(16, 163, 127, 0.1);
      }

      .lang-option-flag {
        font-size: 24px;
        line-height: 1;
        flex-shrink: 0;
      }

      .lang-option-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
      }

      .lang-option-name {
        font-size: 14px;
        font-weight: 600;
        color: #111827;
      }

      .lang-option-english {
        font-size: 12px;
        color: #6B7280;
      }

      .lang-checkmark {
        flex-shrink: 0;
        margin-left: auto;
      }

      .lang-option-loading {
        font-size: 14px;
        color: #6B7280;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .lang-switcher-dropdown {
          left: 0;
          right: 0;
          min-width: auto;
        }

        .lang-name {
          display: none;
        }
      }

      /* RTL Support */
      [dir="rtl"] .lang-switcher-dropdown {
        left: 0;
        right: auto;
      }

      [dir="rtl"] .lang-checkmark {
        margin-left: 0;
        margin-right: auto;
      }
    `;
    document.head.appendChild(style);
  }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for i18n to be ready
    const checkI18n = setInterval(() => {
      if (window.i18n && window.i18n.translations[window.i18n.currentLocale]) {
        clearInterval(checkI18n);
        window.languageSwitcher = new LanguageSwitcher();
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkI18n), 5000);
  });
} else {
  const checkI18n = setInterval(() => {
    if (window.i18n && window.i18n.translations[window.i18n.currentLocale]) {
      clearInterval(checkI18n);
      window.languageSwitcher = new LanguageSwitcher();
    }
  }, 100);
  setTimeout(() => clearInterval(checkI18n), 5000);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LanguageSwitcher;
}
