/**
 * 🌐 Locale Switcher Component
 * Allows users to switch between languages
 */

class LocaleSwitcher {
  constructor(containerId, i18nManager, options = {}) {
    this.container = typeof containerId === 'string'
      ? document.getElementById(containerId)
      : containerId;

    if (!this.container) {
      console.error('Locale switcher container not found');
      return;
    }

    this.i18n = i18nManager;
    this.options = {
      locales: options.locales || ['tr', 'en', 'ar'],
      showFlags: options.showFlags !== false,
      position: options.position || 'top-right',
      style: options.style || 'dropdown', // 'dropdown' or 'buttons'
      ...options
    };

    this.localeInfo = {
      tr: { name: 'Türkçe', flag: '🇹🇷', nativeName: 'Türkçe' },
      en: { name: 'English', flag: '🇬🇧', nativeName: 'English' },
      ar: { name: 'العربية', flag: '🇸🇦', nativeName: 'العربية' },
      de: { name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
      fr: { name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
      es: { name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
      ru: { name: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
      zh: { name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
      ja: { name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
      ko: { name: 'Korean', flag: '🇰🇷', nativeName: '한국어' }
    };

    this.render();
    this.attachEventListeners();
  }

  render() {
    if (this.options.style === 'dropdown') {
      this.renderDropdown();
    } else {
      this.renderButtons();
    }

    this.updateActiveState();
  }

  renderDropdown() {
    const currentLocale = this.i18n.getCurrentLocale();
    const currentInfo = this.localeInfo[currentLocale];

    this.container.innerHTML = `
      <div class="locale-switcher-dropdown">
        <button class="locale-current" aria-label="Change language" aria-haspopup="true" aria-expanded="false">
          ${this.options.showFlags ? `<span class="locale-flag">${currentInfo.flag}</span>` : ''}
          <span class="locale-name">${currentInfo.nativeName}</span>
          <svg class="locale-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="locale-menu" role="menu" aria-hidden="true">
          ${this.options.locales.map(locale => {
            const info = this.localeInfo[locale];
            const isActive = locale === currentLocale;
            return `
              <button
                class="locale-option ${isActive ? 'active' : ''}"
                data-locale="${locale}"
                role="menuitem"
                ${isActive ? 'aria-current="true"' : ''}
              >
                ${this.options.showFlags ? `<span class="locale-flag">${info.flag}</span>` : ''}
                <span class="locale-name">${info.nativeName}</span>
                ${isActive ? '<svg class="locale-check" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.addDropdownStyles();
  }

  renderButtons() {
    this.container.innerHTML = `
      <div class="locale-switcher-buttons">
        ${this.options.locales.map(locale => {
          const info = this.localeInfo[locale];
          const isActive = locale === this.i18n.getCurrentLocale();
          return `
            <button
              class="locale-button ${isActive ? 'active' : ''}"
              data-locale="${locale}"
              aria-label="Switch to ${info.name}"
              ${isActive ? 'aria-current="true"' : ''}
            >
              ${this.options.showFlags ? `<span class="locale-flag">${info.flag}</span>` : ''}
              <span class="locale-code">${locale.toUpperCase()}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;

    this.addButtonStyles();
  }

  attachEventListeners() {
    if (this.options.style === 'dropdown') {
      this.attachDropdownListeners();
    } else {
      this.attachButtonListeners();
    }
  }

  attachDropdownListeners() {
    const currentBtn = this.container.querySelector('.locale-current');
    const menu = this.container.querySelector('.locale-menu');
    const options = this.container.querySelectorAll('.locale-option');

    // Toggle dropdown
    currentBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = currentBtn.getAttribute('aria-expanded') === 'true';
      currentBtn.setAttribute('aria-expanded', !isExpanded);
      menu.setAttribute('aria-hidden', isExpanded);
      menu.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        currentBtn?.setAttribute('aria-expanded', 'false');
        menu?.setAttribute('aria-hidden', 'true');
        menu?.classList.remove('active');
      }
    });

    // Handle locale selection
    options.forEach(option => {
      option.addEventListener('click', async (e) => {
        e.stopPropagation();
        const locale = option.dataset.locale;
        await this.switchLocale(locale);
        menu.classList.remove('active');
        currentBtn.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
      });
    });
  }

  attachButtonListeners() {
    const buttons = this.container.querySelectorAll('.locale-button');

    buttons.forEach(button => {
      button.addEventListener('click', async () => {
        const locale = button.dataset.locale;
        await this.switchLocale(locale);
      });
    });
  }

  async switchLocale(locale) {
    try {
      await this.i18n.setLocale(locale);
      this.updateActiveState();

      // Store preference
      localStorage.setItem('preferred-locale', locale);

      console.log(`✅ Switched to ${locale}`);
    } catch (error) {
      console.error('Failed to switch locale:', error);
    }
  }

  updateActiveState() {
    const currentLocale = this.i18n.getCurrentLocale();

    if (this.options.style === 'dropdown') {
      const currentBtn = this.container.querySelector('.locale-current');
      const currentInfo = this.localeInfo[currentLocale];

      if (currentBtn) {
        const flagSpan = currentBtn.querySelector('.locale-flag');
        const nameSpan = currentBtn.querySelector('.locale-name');

        if (flagSpan) flagSpan.textContent = currentInfo.flag;
        if (nameSpan) nameSpan.textContent = currentInfo.nativeName;
      }

      // Update active state in menu
      this.container.querySelectorAll('.locale-option').forEach(option => {
        const isActive = option.dataset.locale === currentLocale;
        option.classList.toggle('active', isActive);
        option.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    } else {
      // Update active state in buttons
      this.container.querySelectorAll('.locale-button').forEach(button => {
        const isActive = button.dataset.locale === currentLocale;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    }
  }

  addDropdownStyles() {
    if (document.getElementById('locale-switcher-dropdown-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'locale-switcher-dropdown-styles';
    styles.textContent = `
      .locale-switcher-dropdown {
        position: relative;
        z-index: 1001;
      }

      .locale-current {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(102, 126, 234, 0.2);
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--text-primary, #1a1a1a);
      }

      .locale-current:hover {
        background: white;
        border-color: rgba(102, 126, 234, 0.4);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .locale-flag {
        font-size: 18px;
        line-height: 1;
      }

      .locale-chevron {
        transition: transform 0.2s;
      }

      .locale-current[aria-expanded="true"] .locale-chevron {
        transform: rotate(180deg);
      }

      .locale-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 160px;
        background: white;
        border: 1px solid rgba(102, 126, 234, 0.15);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-8px);
        transition: all 0.2s;
        overflow: hidden;
      }

      .locale-menu.active {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .locale-option {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 14px;
        border: none;
        background: transparent;
        text-align: left;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.15s;
        color: var(--text-primary, #1a1a1a);
      }

      .locale-option:hover {
        background: rgba(102, 126, 234, 0.08);
      }

      .locale-option.active {
        background: rgba(102, 126, 234, 0.12);
        color: #667eea;
        font-weight: 600;
      }

      .locale-check {
        margin-left: auto;
        color: #667eea;
      }
    `;
    document.head.appendChild(styles);
  }

  addButtonStyles() {
    if (document.getElementById('locale-switcher-button-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'locale-switcher-button-styles';
    styles.textContent = `
      .locale-switcher-buttons {
        display: flex;
        gap: 6px;
        padding: 4px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(102, 126, 234, 0.2);
        border-radius: 20px;
      }

      .locale-button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border: none;
        background: transparent;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--text-secondary, #666);
      }

      .locale-button:hover {
        background: rgba(102, 126, 234, 0.08);
        color: var(--text-primary, #1a1a1a);
      }

      .locale-button.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
      }

      .locale-code {
        font-weight: inherit;
      }
    `;
    document.head.appendChild(styles);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.LocaleSwitcher = LocaleSwitcher;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocaleSwitcher;
}
