/**
 * useFocusTrap Hook
 *
 * Trap focus within a container (for modals, dialogs)
 * - Keep focus inside modal
 * - Return focus on close
 * - Handle Escape key
 *
 * WCAG 2.1 AA:
 * - 2.1.2 No Keyboard Trap (Level A)
 * - 2.4.3 Focus Order (Level A)
 */

import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  enabled?: boolean;
  onEscape?: () => void;
}

/**
 * Trap focus within a container
 *
 * @example
 * const trapRef = useFocusTrap({
 *   enabled: isOpen,
 *   onEscape: handleClose
 * });
 *
 * <div ref={trapRef}>
 *   <button>First</button>
 *   <button>Last</button>
 * </div>
 */
export function useFocusTrap(options: UseFocusTrapOptions = {}) {
  const { enabled = true, onEscape } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    // Save currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll<HTMLElement>(selector));
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle Tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Tab key
      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        // Shift + Tab on first element -> focus last
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
        // Tab on last element -> focus first
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [enabled, onEscape]);

  return containerRef;
}

/**
 * Focus first element with error (for form validation)
 */
export function useFocusError() {
  const focusError = () => {
    // Find first element with aria-invalid="true"
    const errorElement = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (errorElement) {
      errorElement.focus();
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return focusError;
}

/**
 * Manage focus for dynamic content
 */
export function useFocusManagement() {
  const focusElement = (selector: string) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      element.focus();
    }
  };

  const focusById = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
    }
  };

  return {
    focusElement,
    focusById,
  };
}

export default useFocusTrap;
