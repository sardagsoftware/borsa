/**
 * MOBILE MENU ENHANCED - Medical LyDian 2025
 * Perfect mobile navigation with mega menu and user menu support
 */

(function() {
    'use strict';

    // Mobile Menu State
    let mobileMenuState = {
        isOpen: false,
        activeMegaMenu: null,
        userMenuOpen: false
    };

    /**
     * Initialize mobile menu system
     */
    function initMobileMenu() {
        console.log('🔧 Initializing enhanced mobile menu...');

        // Setup mobile menu toggle
        setupMobileToggle();

        // Setup mega menu items for mobile
        setupMegaMenus();

        // Setup user menu dropdown
        setupUserMenu();

        // Setup overlay
        setupOverlay();

        // Setup click outside to close
        setupClickOutside();

        // Setup escape key to close
        setupEscapeKey();

        console.log('✅ Mobile menu initialized');
    }

    /**
     * Setup mobile toggle button
     */
    function setupMobileToggle() {
        const toggleBtn = document.getElementById('mobileMenuToggle');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMobileMenu();
            });
        }
    }

    /**
     * Toggle mobile menu (sidebar)
     */
    function toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = getOrCreateOverlay();
        const body = document.body;

        mobileMenuState.isOpen = !mobileMenuState.isOpen;

        if (mobileMenuState.isOpen) {
            sidebar?.classList.add('mobile-open');
            overlay.classList.add('active');
            body.classList.add('mobile-menu-open');
        } else {
            sidebar?.classList.remove('mobile-open');
            overlay.classList.remove('active');
            body.classList.remove('mobile-menu-open');
            closeAllMenus();
        }
    }

    /**
     * Setup mega menu items
     */
    function setupMegaMenus() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(navItem => {
            const megaMenu = navItem.querySelector('.mega-menu');

            if (megaMenu && window.innerWidth <= 768) {
                // On mobile, toggle mega menu on nav item click
                navItem.addEventListener('click', (e) => {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleMegaMenu(navItem);
                    }
                });

                // Prevent mega menu items from bubbling
                const megaMenuItems = megaMenu.querySelectorAll('.mega-menu-item');
                megaMenuItems.forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Close menu after selection
                        setTimeout(() => {
                            closeAllMenus();
                        }, 300);
                    });
                });
            }
        });
    }

    /**
     * Toggle mega menu
     */
    function toggleMegaMenu(navItem) {
        const megaMenu = navItem.querySelector('.mega-menu');

        if (!megaMenu) return;

        const isActive = navItem.classList.contains('active');

        // Close all other mega menus
        document.querySelectorAll('.nav-item.active').forEach(item => {
            if (item !== navItem) {
                item.classList.remove('active');
            }
        });

        // Toggle current menu
        if (isActive) {
            navItem.classList.remove('active');
            mobileMenuState.activeMegaMenu = null;
        } else {
            navItem.classList.add('active');
            mobileMenuState.activeMegaMenu = navItem;
        }
    }

    /**
     * Setup user menu dropdown
     */
    function setupUserMenu() {
        const userMenuContainer = document.querySelector('.user-menu-container');
        const userMenuToggle = userMenuContainer?.querySelector('.user-menu-toggle');

        if (userMenuToggle) {
            userMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleUserMenu();
            });
        }

        // Close user menu when clicking a menu item
        const userMenuItems = document.querySelectorAll('.user-menu-item');
        userMenuItems.forEach(item => {
            item.addEventListener('click', () => {
                closeUserMenu();
            });
        });
    }

    /**
     * Toggle user menu
     */
    function toggleUserMenu() {
        const userMenuContainer = document.querySelector('.user-menu-container');

        if (!userMenuContainer) return;

        mobileMenuState.userMenuOpen = !mobileMenuState.userMenuOpen;

        if (mobileMenuState.userMenuOpen) {
            userMenuContainer.classList.add('active');
            // Close mega menus
            document.querySelectorAll('.nav-item.active').forEach(item => {
                item.classList.remove('active');
            });
        } else {
            userMenuContainer.classList.remove('active');
        }
    }

    /**
     * Close user menu
     */
    function closeUserMenu() {
        const userMenuContainer = document.querySelector('.user-menu-container');
        userMenuContainer?.classList.remove('active');
        mobileMenuState.userMenuOpen = false;
    }

    /**
     * Setup overlay
     */
    function setupOverlay() {
        const overlay = getOrCreateOverlay();

        overlay.addEventListener('click', () => {
            closeAllMenus();
            toggleMobileMenu(); // Close sidebar
        });
    }

    /**
     * Get or create overlay element
     */
    function getOrCreateOverlay() {
        let overlay = document.querySelector('.mobile-menu-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-menu-overlay';
            document.body.appendChild(overlay);
        }

        return overlay;
    }

    /**
     * Setup click outside to close
     */
    function setupClickOutside() {
        document.addEventListener('click', (e) => {
            const userMenuContainer = document.querySelector('.user-menu-container');
            const megaMenus = document.querySelectorAll('.mega-menu');

            // Close user menu if clicking outside
            if (userMenuContainer && !userMenuContainer.contains(e.target)) {
                closeUserMenu();
            }

            // Close mega menus if clicking outside (desktop only)
            if (window.innerWidth > 768) {
                let clickedInsideMega = false;

                megaMenus.forEach(menu => {
                    if (menu.contains(e.target) || menu.parentElement.contains(e.target)) {
                        clickedInsideMega = true;
                    }
                });

                if (!clickedInsideMega) {
                    document.querySelectorAll('.nav-item.active').forEach(item => {
                        item.classList.remove('active');
                    });
                }
            }
        });
    }

    /**
     * Setup escape key to close
     */
    function setupEscapeKey() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAllMenus();

                if (mobileMenuState.isOpen) {
                    toggleMobileMenu();
                }
            }
        });
    }

    /**
     * Close all menus
     */
    function closeAllMenus() {
        // Close mega menus
        document.querySelectorAll('.nav-item.active').forEach(item => {
            item.classList.remove('active');
        });

        // Close user menu
        closeUserMenu();

        mobileMenuState.activeMegaMenu = null;
    }

    /**
     * Handle window resize
     */
    function handleResize() {
        if (window.innerWidth > 768) {
            // Desktop mode - reset mobile state
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.querySelector('.mobile-menu-overlay');
            const body = document.body;

            sidebar?.classList.remove('mobile-open');
            overlay?.classList.remove('active');
            body.classList.remove('mobile-menu-open');

            closeAllMenus();
            mobileMenuState.isOpen = false;
        }
    }

    /**
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }

    // Handle window resize
    window.addEventListener('resize', debounce(handleResize, 250));

    // Expose global function for backward compatibility
    window.toggleMobileMenu = toggleMobileMenu;

    console.log('✅ Mobile menu enhanced script loaded');

})();
