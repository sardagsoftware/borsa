/**
 * SKIP TO CONTENT COMPONENT
 *
 * Allow keyboard users to skip navigation
 * - Hidden until focused
 * - Jump to main content
 * - WCAG 2.1 AA compliant
 *
 * WCAG Guidelines:
 * - 2.4.1 Bypass Blocks (Level A)
 * - G1: Adding a link at the top of each page
 */

'use client';

/**
 * Skip to main content link
 * Shows when focused with Tab key
 */
export function SkipToContent() {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="
        sr-only focus:not-sr-only
        fixed top-4 left-4 z-[9999]
        px-4 py-2
        bg-accent-blue text-white
        rounded-lg
        font-medium
        focus:outline-none focus:ring-4 focus:ring-accent-blue/50
        transform transition-transform
        focus:translate-y-0
      "
    >
      Ana içeriğe geç
    </a>
  );
}

/**
 * Screen reader only text
 * Visually hidden but available to screen readers
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * Visually hidden but focusable
 */
export function VisuallyHidden({ children, focusable = false }: {
  children: React.ReactNode;
  focusable?: boolean;
}) {
  return (
    <span className={focusable ? 'sr-only focus:not-sr-only' : 'sr-only'}>
      {children}
    </span>
  );
}
