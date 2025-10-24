/**
 * THEME TOGGLE COMPONENT
 *
 * Beautiful theme switcher UI
 * - Toggle dark/light/system
 * - Smooth animations
 * - Accessible
 *
 * WHITE-HAT:
 * - WCAG AA compliant
 * - Keyboard accessible
 * - Screen reader friendly
 */

'use client';

import { useTheme } from '@/hooks/useTheme';
import type { ThemeMode } from '@/lib/theme/types';

interface ThemeToggleProps {
  variant?: 'icon' | 'button' | 'dropdown';
  showLabel?: boolean;
  className?: string;
}

/**
 * Simple icon toggle (dark ⟷ light)
 */
export function ThemeToggle({ variant = 'icon', showLabel = false, className = '' }: ThemeToggleProps) {
  const { mode, isDark, toggleTheme, setMode } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          px-3 py-2 rounded-lg
          bg-white/5 hover:bg-white/10
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-accent-blue/50
          ${className}
        `}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light Mode' : 'Dark Mode'}
      >
        <span className="text-xl" role="img" aria-hidden="true">
          {isDark ? '☀️' : '🌙'}
        </span>
        {showLabel && (
          <span className="ml-2 text-sm">
            {isDark ? 'Light' : 'Dark'}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <button
          onClick={() => setMode('light')}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-accent-blue/50
            ${
              !isDark
                ? 'bg-accent-blue text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }
          `}
          aria-pressed={!isDark}
        >
          ☀️ Light
        </button>
        <button
          onClick={() => setMode('dark')}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-accent-blue/50
            ${
              isDark
                ? 'bg-accent-blue text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }
          `}
          aria-pressed={isDark}
        >
          🌙 Dark
        </button>
      </div>
    );
  }

  // Dropdown variant with all 3 options
  return <ThemeDropdown className={className} />;
}

/**
 * Dropdown theme selector (dark / light / system)
 */
function ThemeDropdown({ className = '' }: { className?: string }) {
  const { mode, setMode } = useTheme();

  const options: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light Mode', icon: '☀️' },
    { value: 'dark', label: 'Dark Mode', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ];

  return (
    <div className={`relative ${className}`}>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as ThemeMode)}
        className="
          px-3 py-2 pr-8 rounded-lg
          bg-white/5 hover:bg-white/10
          border border-white/10
          text-sm font-medium
          cursor-pointer
          appearance-none
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-accent-blue/50
        "
        aria-label="Select theme mode"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.icon} {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * Animated theme toggle with smooth transition
 */
export function AnimatedThemeToggle({ className = '' }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-14 h-7 rounded-full
        transition-colors duration-300
        focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:ring-offset-2
        ${isDark ? 'bg-blue-600' : 'bg-yellow-400'}
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      role="switch"
      aria-checked={isDark}
    >
      {/* Toggle indicator */}
      <div
        className={`
          absolute top-1 left-1
          w-5 h-5 rounded-full
          bg-white
          shadow-md
          transition-transform duration-300
          flex items-center justify-center
          ${isDark ? 'translate-x-7' : 'translate-x-0'}
        `}
      >
        <span className="text-xs" role="img" aria-hidden="true">
          {isDark ? '🌙' : '☀️'}
        </span>
      </div>
    </button>
  );
}

/**
 * Compact theme toggle for mobile
 */
export function CompactThemeToggle({ className = '' }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        w-10 h-10 rounded-full
        flex items-center justify-center
        bg-white/5 hover:bg-white/10
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-accent-blue/50
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="text-lg" role="img" aria-hidden="true">
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  );
}

export default ThemeToggle;
