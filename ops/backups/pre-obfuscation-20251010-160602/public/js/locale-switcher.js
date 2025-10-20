/**
 * 🌍 LyDian Locale Switcher Component v2.0
 *
 * Beautiful dropdown language selector with flag icons
 *
 * Features:
 * - Flag icons for all 10 languages
 * - Accessible keyboard navigation
 * - Mobile-responsive
 * - Smooth animations
 * - Auto-reload on language change (optional)
 *
 * Usage:
 *   <div id="locale-switcher"></div>
 *   <script src="/js/locale-switcher.js"></script>
 *   <script>
 *     new LocaleSwitcher('#locale-switcher', {
 *       i18nEngine: window.i18n,
 *       autoReload: true
 *     });
 *   </script>
 *
 * @author LyDian AI Platform
 * @license MIT
 * @version 2.0.0
 */

(function (global) {
    'use strict';

    // ============================
    // LANGUAGE METADATA
    // ============================

    const LANGUAGES = {
        'tr': { name: 'Türkçe', flag: '🇹🇷', nativeName: 'Türkçe' },
        'en': { name: 'English', flag: '🇬🇧', nativeName: 'English' },
        'de': { name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
        'fr': { name: 'French', flag: '🇫🇷', nativeName: 'Français' },
        'es': { name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
        'ar': { name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
        'ru': { name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
        'it': { name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
        'ja': { name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
        'zh-CN': { name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
        'az': { name: 'Azerbaijani', flag: '🇦🇿', nativeName: 'Azərbaycan' }
    };

    // ============================
    // LOCALE SWITCHER
    // ============================

    class LocaleSwitcher {
        constructor(selector, options = {}) {
            this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;
            if (!this.container) {
                throw new Error(`LocaleSwitcher: Container not found: ${selector}`);
            }

            this.options = {
                i18nEngine: null,
                autoReload: false,
                showNativeName: true,
                showFlag: true,
                onLocaleChange: null,
                ...options
            };

            this.currentLocale = this.options.i18nEngine ? this.options.i18nEngine.getCurrentLocale() : 'tr';
            this.isOpen = false;

            this.init();
        }

        init() {
            this.render();
            this.attachEvents();
            console.log('🌍 LocaleSwitcher initialized');
        }

        render() {
            const currentLang = LANGUAGES[this.currentLocale];

            this.container.innerHTML = `
                <div class="locale-switcher">
                    <button class="locale-switcher-trigger" aria-label="Select language" aria-haspopup="true" aria-expanded="false">
                        ${this.options.showFlag ? `<span class="locale-flag">${currentLang.flag}</span>` : ''}
                        <span class="locale-name">${this.options.showNativeName ? currentLang.nativeName : currentLang.name}</span>
                        <svg class="locale-arrow" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M6 8L2 4h8L6 8z"/>
                        </svg>
                    </button>
                    <div class="locale-switcher-dropdown" role="menu" aria-label="Language selection">
                        ${this.renderLanguageOptions()}
                    </div>
                </div>
            `;

            this.injectStyles();
        }

        renderLanguageOptions() {
            return Object.entries(LANGUAGES)
                .map(([code, lang]) => `
                    <button
                        class="locale-option ${code === this.currentLocale ? 'locale-option-active' : ''}"
                        data-locale="${code}"
                        role="menuitem"
                        ${code === this.currentLocale ? 'aria-current="true"' : ''}
                    >
                        ${this.options.showFlag ? `<span class="locale-flag">${lang.flag}</span>` : ''}
                        <span class="locale-name">${this.options.showNativeName ? lang.nativeName : lang.name}</span>
                        ${code === this.currentLocale ? '<svg class="locale-check" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13 4L6 11l-3-3"/></svg>' : ''}
                    </button>
                `)
                .join('');
        }

        attachEvents() {
            const trigger = this.container.querySelector('.locale-switcher-trigger');
            const dropdown = this.container.querySelector('.locale-switcher-dropdown');
            const options = this.container.querySelectorAll('.locale-option');

            // Toggle dropdown
            trigger.addEventListener('click', () => this.toggleDropdown());

            // Select language
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    const locale = e.currentTarget.dataset.locale;
                    this.selectLocale(locale);
                });
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!this.container.contains(e.target)) {
                    this.closeDropdown();
                }
            });

            // Keyboard navigation
            trigger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleDropdown();
                }
                if (e.key === 'Escape') {
                    this.closeDropdown();
                }
            });

            // Arrow key navigation
            dropdown.addEventListener('keydown', (e) => {
                const focusable = Array.from(dropdown.querySelectorAll('.locale-option'));
                const currentIndex = focusable.indexOf(document.activeElement);

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % focusable.length;
                    focusable[nextIndex].focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = (currentIndex - 1 + focusable.length) % focusable.length;
                    focusable[prevIndex].focus();
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const locale = document.activeElement.dataset.locale;
                    this.selectLocale(locale);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closeDropdown();
                    trigger.focus();
                }
            });
        }

        toggleDropdown() {
            if (this.isOpen) {
                this.closeDropdown();
            } else {
                this.openDropdown();
            }
        }

        openDropdown() {
            const trigger = this.container.querySelector('.locale-switcher-trigger');
            const dropdown = this.container.querySelector('.locale-switcher-dropdown');

            dropdown.classList.add('locale-switcher-dropdown-open');
            trigger.setAttribute('aria-expanded', 'true');
            this.isOpen = true;

            // Focus first option
            const firstOption = dropdown.querySelector('.locale-option');
            if (firstOption) {
                setTimeout(() => firstOption.focus(), 100);
            }
        }

        closeDropdown() {
            const trigger = this.container.querySelector('.locale-switcher-trigger');
            const dropdown = this.container.querySelector('.locale-switcher-dropdown');

            dropdown.classList.remove('locale-switcher-dropdown-open');
            trigger.setAttribute('aria-expanded', 'false');
            this.isOpen = false;
        }

        async selectLocale(locale) {
            if (locale === this.currentLocale) {
                this.closeDropdown();
                return;
            }

            console.log(`🌍 Switching locale to: ${locale}`);

            // Update internal state
            this.currentLocale = locale;

            // Update i18n engine if provided
            if (this.options.i18nEngine) {
                await this.options.i18nEngine.setLocale(locale);
            }

            // Call custom callback
            if (typeof this.options.onLocaleChange === 'function') {
                this.options.onLocaleChange(locale);
            }

            // Reload page or re-render
            if (this.options.autoReload) {
                // Add ?lang parameter and reload
                const url = new URL(window.location.href);
                url.searchParams.set('lang', locale);
                window.location.href = url.toString();
            } else {
                // Re-render switcher
                this.render();
                this.attachEvents();
            }
        }

        injectStyles() {
            if (document.getElementById('locale-switcher-styles')) {
                return; // Already injected
            }

            const style = document.createElement('style');
            style.id = 'locale-switcher-styles';
            style.textContent = `
                .locale-switcher {
                    position: relative;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }

                .locale-switcher-trigger {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #1f2937;
                    transition: all 0.2s ease;
                }

                .locale-switcher-trigger:hover {
                    background: #f9fafb;
                    border-color: #d1d5db;
                }

                .locale-switcher-trigger:focus {
                    outline: none;
                    border-color: #C4A962;
                    box-shadow: 0 0 0 3px rgba(196, 169, 98, 0.1);
                }

                .locale-flag {
                    font-size: 18px;
                    line-height: 1;
                }

                .locale-name {
                    font-weight: 500;
                }

                .locale-arrow {
                    transition: transform 0.2s ease;
                }

                .locale-switcher-trigger[aria-expanded="true"] .locale-arrow {
                    transform: rotate(180deg);
                }

                .locale-switcher-dropdown {
                    position: absolute;
                    top: calc(100% + 4px);
                    right: 0;
                    min-width: 200px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    max-height: 0;
                    overflow: hidden;
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.2s ease;
                    z-index: 1000;
                }

                .locale-switcher-dropdown-open {
                    max-height: 500px;
                    opacity: 1;
                    transform: translateY(0);
                }

                .locale-option {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 10px 12px;
                    background: none;
                    border: none;
                    text-align: left;
                    cursor: pointer;
                    font-size: 14px;
                    color: #1f2937;
                    transition: background 0.2s ease;
                }

                .locale-option:hover {
                    background: #f9fafb;
                }

                .locale-option:focus {
                    outline: none;
                    background: #f3f4f6;
                }

                .locale-option-active {
                    background: #fef3c7;
                    font-weight: 600;
                }

                .locale-option-active:hover {
                    background: #fef3c7;
                }

                .locale-check {
                    margin-left: auto;
                    color: #C4A962;
                }

                /* Mobile responsive */
                @media (max-width: 640px) {
                    .locale-switcher-dropdown {
                        right: auto;
                        left: 0;
                        min-width: 150px;
                    }
                }

                /* RTL support */
                [dir="rtl"] .locale-switcher-dropdown {
                    right: auto;
                    left: 0;
                }

                [dir="rtl"] .locale-option {
                    text-align: right;
                }
            `;

            document.head.appendChild(style);
        }
    }

    // ============================
    // GLOBAL EXPORT
    // ============================

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = LocaleSwitcher;
    } else {
        global.LocaleSwitcher = LocaleSwitcher;
    }

})(typeof window !== 'undefined' ? window : global);
