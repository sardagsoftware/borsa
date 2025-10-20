/**
 * AILYDIAN ULTRA PRO - THEME MANAGER
 * Handles dark/light mode switching with smooth transitions
 * Auto-detects system preference on first visit
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'ailydian-theme';
    const THEMES = {
        LIGHT: 'light',
        DARK: 'dark'
    };

    /**
     * Get system theme preference
     */
    function getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return THEMES.DARK;
        }
        return THEMES.LIGHT;
    }

    /**
     * Get current theme (saved or system preference)
     */
    function getCurrentTheme() {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        if (savedTheme && (savedTheme === THEMES.LIGHT || savedTheme === THEMES.DARK)) {
            return savedTheme;
        }
        // First visit - use system preference
        return getSystemTheme();
    }

    /**
     * Apply theme to document
     */
    function applyTheme(theme, animate = true) {
        // Add transition class for smooth animation
        if (animate) {
            document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        }

        if (theme === THEMES.DARK) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // Save preference
        localStorage.setItem(STORAGE_KEY, theme);

        // Remove transition after animation completes
        if (animate) {
            setTimeout(() => {
                document.documentElement.style.transition = '';
            }, 300);
        }

        console.log(`[ThemeManager] Theme applied: ${theme}`);

        // Dispatch event for other scripts
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme }
        }));

        // Update theme toggle button if it exists
        updateToggleButton(theme);
    }

    /**
     * Toggle between light and dark themes
     */
    function toggleTheme() {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
        applyTheme(newTheme, true);
    }

    /**
     * Update toggle button appearance
     */
    function updateToggleButton(theme) {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-label', theme === THEMES.DARK ? 'Switch to light mode' : 'Switch to dark mode');
            toggleBtn.title = theme === THEMES.DARK ? 'Açık Mod' : 'Koyu Mod';
        }
    }

    /**
     * Initialize theme system
     */
    function init() {
        console.log('[ThemeManager] Initializing theme system...');

        // Apply theme immediately (no animation on page load to prevent flicker)
        const currentTheme = getCurrentTheme();
        applyTheme(currentTheme, false);

        // Set up theme toggle button after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupToggleButton);
        } else {
            setupToggleButton();
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only auto-switch if user hasn't set a preference
                const hasUserPreference = localStorage.getItem(STORAGE_KEY);
                if (!hasUserPreference) {
                    const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
                    applyTheme(newTheme, true);
                    console.log(`[ThemeManager] System theme changed to: ${newTheme}`);
                }
            });
        }

        // Make functions globally available
        window.AILYDIAN_THEME = {
            current: currentTheme,
            toggle: toggleTheme,
            set: (theme) => {
                if (theme === THEMES.DARK || theme === THEMES.LIGHT) {
                    applyTheme(theme, true);
                }
            },
            get: getCurrentTheme
        };
    }

    /**
     * Set up toggle button event listener
     */
    function setupToggleButton() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTheme();

                // Add button press animation
                toggleBtn.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    toggleBtn.style.transform = '';
                }, 150);
            });

            console.log('[ThemeManager] Toggle button initialized');
        }
    }

    /**
     * Create theme toggle button HTML
     * Call this function to generate the button markup
     */
    function createToggleButton() {
        return `
            <button id="themeToggle" class="theme-toggle" aria-label="Toggle theme" title="Tema Değiştir">
                <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
            </button>
        `;
    }

    // Run initialization immediately
    init();

    // Export for manual use
    window.AILYDIAN_THEME.createToggleButton = createToggleButton;
})();
