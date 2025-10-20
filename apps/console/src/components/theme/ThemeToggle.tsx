/**
 * 🌓 Theme Toggle Button
 * Beautiful theme switcher component
 * 
 * @module components/theme/ThemeToggle
 * @white-hat Compliant
 */

'use client';

import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, effectiveTheme, setTheme } = useTheme();

  const themes: Array<{ value: 'light' | 'dark' | 'auto'; icon: string; label: string }> = [
    { value: 'light', icon: '☀️', label: 'Açık' },
    { value: 'dark', icon: '🌙', label: 'Koyu' },
    { value: 'auto', icon: '🌓', label: 'Otomatik' },
  ];

  return (
    <div className="theme-toggle">
      {themes.map((t) => (
        <button
          key={t.value}
          className={`theme-btn ${theme === t.value ? 'active' : ''}`}
          onClick={() => setTheme(t.value)}
          title={t.label}
          aria-label={`${t.label} tema`}
          aria-pressed={theme === t.value}
        >
          <span className="theme-icon">{t.icon}</span>
        </button>
      ))}

      <style jsx>{`
        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          padding: 0.25rem;
        }

        .theme-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-base);
          position: relative;
        }

        .theme-btn:hover {
          background: var(--color-surface-hover);
        }

        .theme-btn.active {
          background: var(--gradient-primary);
        }

        .theme-btn.active::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: var(--radius-full);
          border: 2px solid var(--color-primary);
          opacity: 0.5;
          animation: pulse 2s infinite;
        }

        .theme-icon {
          font-size: 1.125rem;
          line-height: 1;
        }

        .theme-btn.active .theme-icon {
          filter: brightness(0) saturate(100%) invert(0);
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.05);
          }
        }

        /* A11y: Focus visible */
        .theme-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
