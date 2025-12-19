/**
 * Premium Micro-interactions & Accessibility Module
 * Advanced UI/UX Enhancements for Medical Expert
 * WCAG 2.1 AA Compliant
 *
 * @module PremiumInteractions
 * @version 2.0.0
 * @accessibility WCAG 2.1 AA
 */

class PremiumInteractions {
  constructor() {
    this.notifications = [];
    this.tooltips = new Map();
    this.focusableElements = [];
    this.currentFocusIndex = 0;

    // Accessibility settings
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    this.prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Initialize
    this.init();
  }

  /**
   * Initialize premium interactions
   */
  init() {
    this.setupRippleEffects();
    this.setupKeyboardNavigation();
    this.setupFocusTrap();
    this.setupAccessibilityAnnouncements();
    this.setupTooltips();
    this.setupSmoothScrolling();
    this.monitorAccessibilityPreferences();

    console.log('✨ Premium Interactions initialized');
  }

  /**
   * Material Design Ripple Effect
   */
  setupRippleEffects() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.btn-premium, .specialization-item, .new-consultation-btn');

      if (!target || this.prefersReducedMotion) return;

      const ripple = document.createElement('span');
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        pointer-events: none;
        animation: ripple 0.6s ease-out;
      `;

      // Ensure target is positioned
      if (getComputedStyle(target).position === 'static') {
        target.style.position = 'relative';
      }

      target.style.overflow = 'hidden';
      target.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  }

  /**
   * Enhanced Keyboard Navigation
   */
  setupKeyboardNavigation() {
    // Get all focusable elements
    this.updateFocusableElements();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K: Focus search/input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('textarea, input[type="text"]');
        if (input) input.focus();
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        this.closeTopModal();
      }

      // Tab: Enhanced tab navigation with visual feedback
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }

      // Arrow keys: Navigate lists
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowNavigation(e);
      }
    });

    // Visual focus indicators
    document.addEventListener('focusin', (e) => {
      if (!e.target.matches(':focus-visible')) return;

      // Add enhanced focus ring
      e.target.setAttribute('data-focus-visible', 'true');
    });

    document.addEventListener('focusout', (e) => {
      e.target.removeAttribute('data-focus-visible');
    });
  }

  /**
   * Update list of focusable elements
   */
  updateFocusableElements() {
    this.focusableElements = Array.from(document.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), ' +
      'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), ' +
      '.specialization-item, .message-bubble'
    ));
  }

  /**
   * Handle Tab navigation with enhancements
   */
  handleTabNavigation(e) {
    const activeElement = document.activeElement;
    const currentIndex = this.focusableElements.indexOf(activeElement);

    if (currentIndex === -1) return;

    // Show focus path indicator (breadcrumb)
    this.showFocusPath(currentIndex);

    // Announce to screen readers
    this.announce(`Focused on ${this.getFocusLabel(activeElement)}`);
  }

  /**
   * Handle Arrow key navigation
   */
  handleArrowNavigation(e) {
    const activeElement = document.activeElement;

    // Navigate specialization list
    if (activeElement.classList.contains('specialization-item')) {
      const items = Array.from(document.querySelectorAll('.specialization-item'));
      const currentIndex = items.indexOf(activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        items[prevIndex].focus();
      }
    }

    // Navigate message history
    if (activeElement.classList.contains('message-bubble')) {
      const messages = Array.from(document.querySelectorAll('.message-bubble'));
      const currentIndex = messages.indexOf(activeElement);

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) messages[currentIndex - 1].focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < messages.length - 1) messages[currentIndex + 1].focus();
      }
    }
  }

  /**
   * Get accessible label for element
   */
  getFocusLabel(element) {
    return element.getAttribute('aria-label') ||
           element.textContent.trim().substring(0, 50) ||
           element.getAttribute('title') ||
           'Interactive element';
  }

  /**
   * Show visual focus path (for users with cognitive disabilities)
   */
  showFocusPath(index) {
    const pathIndicator = document.getElementById('focus-path') || this.createFocusPathIndicator();
    pathIndicator.textContent = `Navigation: ${index + 1} of ${this.focusableElements.length}`;
    pathIndicator.style.opacity = '1';

    setTimeout(() => {
      pathIndicator.style.opacity = '0';
    }, 2000);
  }

  /**
   * Create focus path indicator
   */
  createFocusPathIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'focus-path';
    indicator.setAttribute('role', 'status');
    indicator.setAttribute('aria-live', 'polite');
    indicator.style.cssText = `
      position: fixed;
      bottom: 1rem;
      left: 1rem;
      background: rgba(0, 102, 204, 0.95);
      color: white;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    document.body.appendChild(indicator);
    return indicator;
  }

  /**
   * Focus Trap for Modals (Accessibility Requirement)
   */
  setupFocusTrap() {
    document.addEventListener('keydown', (e) => {
      const modal = document.querySelector('.modal:not([style*="display: none"])');
      if (!modal || e.key !== 'Tab') return;

      const focusableInModal = modal.querySelectorAll(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableInModal.length === 0) return;

      const firstFocusable = focusableInModal[0];
      const lastFocusable = focusableInModal[focusableInModal.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }

  /**
   * Close top-most modal
   */
  closeTopModal() {
    const modals = Array.from(document.querySelectorAll('.modal')).filter(
      m => m.style.display !== 'none'
    );

    if (modals.length > 0) {
      const topModal = modals[modals.length - 1];
      topModal.style.display = 'none';

      // Return focus to trigger element
      const triggerId = topModal.getAttribute('data-trigger-id');
      if (triggerId) {
        const trigger = document.getElementById(triggerId);
        if (trigger) trigger.focus();
      }

      this.announce('Modal closed');
    }
  }

  /**
   * Setup Accessibility Announcements (Screen Readers)
   */
  setupAccessibilityAnnouncements() {
    // Create ARIA live region
    if (!document.getElementById('aria-announcer')) {
      const announcer = document.createElement('div');
      announcer.id = 'aria-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(announcer);
    }
  }

  /**
   * Announce to screen readers
   */
  announce(message, priority = 'polite') {
    const announcer = document.getElementById('aria-announcer');
    if (!announcer) return;

    announcer.setAttribute('aria-live', priority);
    announcer.textContent = '';

    setTimeout(() => {
      announcer.textContent = message;
    }, 100);

    console.log(`📢 Announced: ${message}`);
  }

  /**
   * Setup Enhanced Tooltips
   */
  setupTooltips() {
    document.addEventListener('mouseenter', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) return;

      this.showTooltip(target, target.getAttribute('data-tooltip'));
    }, true);

    document.addEventListener('mouseleave', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) return;

      this.hideTooltip(target);
    }, true);

    // Keyboard-accessible tooltips
    document.addEventListener('focusin', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) return;

      this.showTooltip(target, target.getAttribute('data-tooltip'));
    }, true);

    document.addEventListener('focusout', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) return;

      this.hideTooltip(target);
    }, true);
  }

  /**
   * Show tooltip
   */
  showTooltip(element, text) {
    if (this.tooltips.has(element)) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.id = `tooltip-${Date.now()}`;

    element.setAttribute('aria-describedby', tooltip.id);
    element.style.position = 'relative';
    element.appendChild(tooltip);

    this.tooltips.set(element, tooltip);

    // Animate in
    setTimeout(() => {
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateX(-50%) scale(1)';
    }, 10);

    // Announce to screen readers
    this.announce(text);
  }

  /**
   * Hide tooltip
   */
  hideTooltip(element) {
    const tooltip = this.tooltips.get(element);
    if (!tooltip) return;

    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateX(-50%) scale(0)';

    setTimeout(() => {
      tooltip.remove();
      this.tooltips.delete(element);
      element.removeAttribute('aria-describedby');
    }, 300);
  }

  /**
   * Setup Smooth Scrolling
   */
  setupSmoothScrolling() {
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      e.preventDefault();
      const targetId = anchor.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);

      if (!target) return;

      const duration = this.prefersReducedMotion ? 0 : 800;

      this.smoothScrollTo(target, duration);

      // Set focus to target
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.removeAttribute('tabindex');

      this.announce(`Scrolled to ${target.getAttribute('aria-label') || targetId}`);
    });
  }

  /**
   * Smooth scroll to element
   */
  smoothScrollTo(element, duration = 800) {
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = this.easeInOutCubic(timeElapsed, startPosition, distance, duration);

      window.scrollTo(0, run);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    if (this.prefersReducedMotion) {
      window.scrollTo(0, targetPosition);
    } else {
      requestAnimationFrame(animation);
    }
  }

  /**
   * Easing function for smooth scrolling
   */
  easeInOutCubic(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t + b;
    t -= 2;
    return c / 2 * (t * t * t + 2) + b;
  }

  /**
   * Monitor Accessibility Preferences
   */
  monitorAccessibilityPreferences() {
    // Reduced motion
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      document.documentElement.classList.toggle('reduce-motion', e.matches);
      this.announce('Animation preferences updated');
    });

    // High contrast
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.prefersHighContrast = e.matches;
      document.documentElement.classList.toggle('high-contrast', e.matches);
      this.announce('Contrast preferences updated');
    });

    // Dark mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.prefersDarkMode = e.matches;
      document.documentElement.classList.toggle('dark-mode', e.matches);
      this.announce(`${e.matches ? 'Dark' : 'Light'} mode activated`);
    });
  }

  /**
   * Show Premium Notification
   */
  showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');

    const icon = this.getNotificationIcon(type);

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="flex-shrink: 0; font-size: 1.5rem;">${icon}</div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 0.25rem;">${this.getNotificationTitle(type)}</div>
          <div style="color: var(--text-secondary); font-size: 0.875rem;">${message}</div>
        </div>
        <button class="notification-close" aria-label="Close notification" style="
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-muted);
          padding: 0.25rem;
        ">×</button>
      </div>
    `;

    document.body.appendChild(notification);
    this.notifications.push(notification);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.closeNotification(notification);
    });

    // Auto-close
    if (duration > 0) {
      setTimeout(() => {
        this.closeNotification(notification);
      }, duration);
    }

    // Announce to screen readers
    this.announce(`${this.getNotificationTitle(type)}: ${message}`, 'assertive');

    // Add progress bar
    if (duration > 0) {
      const progress = document.createElement('div');
      progress.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: currentColor;
        width: 100%;
        animation: progressBar ${duration}ms linear;
      `;
      notification.style.position = 'relative';
      notification.appendChild(progress);
    }

    return notification;
  }

  /**
   * Close notification
   */
  closeNotification(notification) {
    notification.style.animation = 'notification-slide 0.3s reverse';

    setTimeout(() => {
      notification.remove();
      this.notifications = this.notifications.filter(n => n !== notification);
    }, 300);
  }

  /**
   * Get notification icon
   */
  getNotificationIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  /**
   * Get notification title
   */
  getNotificationTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    };
    return titles[type] || titles.info;
  }

  /**
   * Add Loading Skeleton
   */
  showLoadingSkeleton(container, type = 'text', count = 3) {
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = `skeleton skeleton-${type}`;
      skeleton.setAttribute('aria-label', 'Loading...');
      skeleton.setAttribute('aria-busy', 'true');
      fragment.appendChild(skeleton);
    }

    container.appendChild(fragment);
  }

  /**
   * Remove Loading Skeleton
   */
  hideLoadingSkeleton(container) {
    const skeletons = container.querySelectorAll('.skeleton');
    skeletons.forEach(skeleton => {
      skeleton.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => skeleton.remove(), 300);
    });
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.premiumInteractions = new PremiumInteractions();
  });
} else {
  window.premiumInteractions = new PremiumInteractions();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PremiumInteractions;
}
