/**
 * 📱 LyDian Mobile Menu Handler
 * Professional responsive menu system
 * Version: 1.0.0
 * Date: 2025-10-07
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }

    function initMobileMenu() {
        console.log('📱 Initializing mobile menu...');

        // Find menu elements
        const menuToggle = document.querySelector('.menu-toggle') ||
                          document.querySelector('.mobile-menu-toggle') ||
                          document.querySelector('.hamburger');

        const mobileMenu = document.querySelector('.mobile-menu') ||
                          document.querySelector('.nav-links');

        const menuOverlay = document.querySelector('.mobile-overlay') ||
                           document.querySelector('.menu-overlay');

        // If no mobile menu elements, skip initialization
        if (!menuToggle || !mobileMenu) {
            console.log('ℹ️  No mobile menu elements found (desktop only page)');
            return;
        }

        console.log('✅ Mobile menu elements found');

        // Create overlay if it doesn't exist
        let overlay = menuOverlay;
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-overlay';
            document.body.appendChild(overlay);
        }

        // Toggle menu function
        function toggleMenu() {
            const isOpen = mobileMenu.classList.contains('active');

            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        }

        // Open menu
        function openMenu() {
            mobileMenu.classList.add('active');
            menuToggle.classList.add('active');
            overlay.classList.add('active');
            document.body.classList.add('menu-open');

            // Set ARIA attributes
            menuToggle.setAttribute('aria-expanded', 'true');
            mobileMenu.setAttribute('aria-hidden', 'false');

            console.log('📂 Menu opened');
        }

        // Close menu
        function closeMenu() {
            mobileMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('menu-open');

            // Set ARIA attributes
            menuToggle.setAttribute('aria-expanded', 'false');
            mobileMenu.setAttribute('aria-hidden', 'true');

            console.log('📁 Menu closed');
        }

        // Toggle button click
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Overlay click - close menu
        overlay.addEventListener('click', closeMenu);

        // Close menu when link is clicked
        const menuLinks = mobileMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Small delay to allow navigation
                setTimeout(closeMenu, 100);
            });
        });

        // Close menu on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                closeMenu();
            }
        });

        // Close menu on window resize to desktop size
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
                    closeMenu();
                }
            }, 250);
        });

        // Prevent scroll on body when menu is open
        let scrollPosition = 0;
        mobileMenu.addEventListener('transitionstart', () => {
            if (mobileMenu.classList.contains('active')) {
                scrollPosition = window.pageYOffset;
                document.body.style.top = `-${scrollPosition}px`;
            }
        });

        mobileMenu.addEventListener('transitionend', () => {
            if (!mobileMenu.classList.contains('active')) {
                document.body.style.top = '';
                window.scrollTo(0, scrollPosition);
            }
        });

        // Set initial ARIA attributes
        menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-controls', 'mobile-menu');
        mobileMenu.setAttribute('id', 'mobile-menu');
        mobileMenu.setAttribute('aria-hidden', 'true');

        console.log('✅ Mobile menu initialized successfully');
    }

    // Handle page visibility change (iOS Safari fix)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Close menu when page is hidden
            const mobileMenu = document.querySelector('.mobile-menu.active') ||
                              document.querySelector('.nav-links.active');
            if (mobileMenu) {
                mobileMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        }
    });

})();
