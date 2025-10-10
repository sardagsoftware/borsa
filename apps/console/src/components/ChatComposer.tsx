/**
 * 💬 Chat Composer - Natural Language Input (Slash-less)
 * Real-time intent parsing with suggestion chips and auto-submit
 *
 * @author LyDian AI - Ultra Intelligence Platform
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { parseUtterance, Intent } from '../intent/engine';
import { IntentChips, IntentChipsLoading, IntentChipsEmpty } from './IntentChips';
import { hasRequiredScopes, validateParams } from '../core/tool-registry';

export interface ChatComposerProps {
  locale?: string;
  userScopes?: string[];
  onSubmit: (intent: Intent, message: string) => void | Promise<void>;
  onIntentChange?: (intents: Intent[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ChatComposer({
  locale = 'tr',
  userScopes = [],
  onSubmit,
  onIntentChange,
  placeholder,
  className = '',
  disabled = false
}: ChatComposerProps) {
  const [input, setInput] = useState('');
  const [intents, setIntents] = useState<Intent[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPermissionDenied, setShowPermissionDenied] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const parseTimeoutRef = useRef<NodeJS.Timeout>();

  // Get placeholder text based on locale
  const placeholderText = placeholder || getPlaceholder(locale);

  // RTL support
  const isRTL = locale === 'ar';

  /**
   * Parse input with debouncing
   */
  const parseInput = useCallback(
    (text: string) => {
      // Clear previous timeout
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }

      // If input is too short, clear intents
      if (text.trim().length < 3) {
        setIntents([]);
        setIsParsing(false);
        onIntentChange?.([]);
        return;
      }

      setIsParsing(true);

      // Debounce: wait 300ms after user stops typing
      parseTimeoutRef.current = setTimeout(() => {
        const parsedIntents = parseUtterance(text, locale);
        setIntents(parsedIntents);
        setIsParsing(false);
        onIntentChange?.(parsedIntents);

        // Track intent parsing telemetry
        if (parsedIntents.length > 0) {
          trackIntentParsing(text, parsedIntents, locale);
        }
      }, 300);
    },
    [locale, onIntentChange]
  );

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    parseInput(value);
    setShowPermissionDenied(false);
  };

  /**
   * Handle Enter key
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Submit highest scored intent
      if (intents.length > 0) {
        handleIntentSelect(intents[0]);
      }
    }
  };

  /**
   * Handle intent chip selection
   */
  const handleIntentSelect = async (intent: Intent) => {
    // Check RBAC/Scopes
    if (!hasRequiredScopes(intent.action, userScopes)) {
      setShowPermissionDenied(true);
      return;
    }

    // Validate required parameters
    const validation = validateParams(intent.action, intent.params);
    if (!validation.valid) {
      // Missing params - show action form
      // (ActionForm component will handle this)
      console.log('Missing params:', validation.missing);
      // For now, still submit - ActionForm will catch it
    }

    setIsSubmitting(true);

    try {
      await onSubmit(intent, input);
      // Clear input on success
      setInput('');
      setIntents([]);
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Auto-resize textarea
   */
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  /**
   * Focus input on mount
   */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className={`chat-composer ${isRTL ? 'rtl' : ''} ${className}`}>
      {/* Intent Suggestions */}
      {isParsing && <IntentChipsLoading />}

      {!isParsing && intents.length > 0 && (
        <IntentChips
          intents={intents}
          onSelect={handleIntentSelect}
          locale={locale}
        />
      )}

      {!isParsing && input.length >= 3 && intents.length === 0 && (
        <IntentChipsEmpty locale={locale} />
      )}

      {/* Permission Denied Alert */}
      {showPermissionDenied && intents.length > 0 && (
        <PermissionDeniedAlert
          action={intents[0].action}
          locale={locale}
          onClose={() => setShowPermissionDenied(false)}
        />
      )}

      {/* Input Area */}
      <div className="composer-input-container">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          disabled={disabled || isSubmitting}
          className="composer-input"
          dir={isRTL ? 'rtl' : 'ltr'}
          rows={1}
          aria-label="Natural language command input"
        />

        {isSubmitting && (
          <div className="composer-loading">
            <span className="spinner" />
          </div>
        )}
      </div>

      {/* Keyboard Hint */}
      <div className="composer-hint">
        <kbd>Enter</kbd> {locale === 'tr' ? 'gönder' : 'send'} •{' '}
        <kbd>Shift + Enter</kbd> {locale === 'tr' ? 'yeni satır' : 'new line'}
      </div>

      <style jsx>{`
        .chat-composer {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .chat-composer.rtl {
          direction: rtl;
        }

        .composer-input-container {
          position: relative;
          width: 100%;
        }

        .composer-input {
          width: 100%;
          min-height: 50px;
          max-height: 200px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: #ffffff;
          font-size: 15px;
          line-height: 1.5;
          font-family: inherit;
          resize: none;
          outline: none;
          transition: all 0.2s ease;
        }

        .composer-input::placeholder {
          color: #888;
        }

        .composer-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .composer-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .composer-loading {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rtl .composer-loading {
          right: auto;
          left: 12px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .composer-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #888;
          padding: 0 4px;
        }

        kbd {
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          font-size: 11px;
          font-family: monospace;
        }

        @media (max-width: 768px) {
          .composer-hint {
            font-size: 11px;
          }

          kbd {
            padding: 1px 4px;
            font-size: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .composer-input {
            transition: none;
          }

          .spinner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Permission Denied Alert
 */
interface PermissionDeniedAlertProps {
  action: string;
  locale: string;
  onClose: () => void;
}

function PermissionDeniedAlert({
  action,
  locale,
  onClose
}: PermissionDeniedAlertProps) {
  const messages: Record<string, string> = {
    tr: `Bu eylem için yetkiniz yok: ${action}`,
    en: `Permission denied for action: ${action}`,
    ar: `تم رفض الإذن للإجراء: ${action}`,
    ru: `Нет разрешения на действие: ${action}`,
    de: `Keine Berechtigung für Aktion: ${action}`
  };

  return (
    <div className="permission-alert" role="alert">
      <span className="alert-icon">🔒</span>
      <span className="alert-message">{messages[locale] || messages.tr}</span>
      <button
        type="button"
        className="alert-close"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      <style jsx>{`
        .permission-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(255, 152, 0, 0.1);
          border: 1px solid rgba(255, 152, 0, 0.3);
          border-radius: 10px;
          color: #ffb74d;
          font-size: 14px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .alert-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .alert-message {
          flex: 1;
        }

        .alert-close {
          background: none;
          border: none;
          color: #ffb74d;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .alert-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

/**
 * Get placeholder text by locale
 */
function getPlaceholder(locale: string): string {
  const placeholders: Record<string, string> = {
    tr: 'Doğal dille yazın: "kargom nerede hepsijet 1234567890"...',
    en: 'Type naturally: "track shipment hepsijet 1234567890"...',
    ar: 'اكتب بشكل طبيعي: "تتبع الشحنة hepsijet 1234567890"...',
    ru: 'Пишите естественно: "отследить посылку hepsijet 1234567890"...',
    de: 'Natürlich schreiben: "sendung verfolgen hepsijet 1234567890"...',
    nl: 'Natuurlijk typen: "track shipment hepsijet 1234567890"...',
    bg: 'Пишете естествено: "проследи пратка hepsijet 1234567890"...',
    el: 'Γράψτε φυσικά: "παρακολουθήστε αποστολή hepsijet 1234567890"...'
  };

  return placeholders[locale] || placeholders.tr;
}

/**
 * Track intent parsing telemetry
 */
async function trackIntentParsing(
  utterance: string,
  intents: Intent[],
  locale: string
) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3100';
    await fetch(`${apiBase}/api/ui-telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'intent.parsed',
        data: {
          utterance: utterance.substring(0, 100), // Truncate for privacy
          topIntent: intents[0]?.action,
          confidence: intents[0]?.score,
          alternativeCount: intents.length - 1,
          locale,
          timestamp: new Date().toISOString()
        }
      })
    });
  } catch (error) {
    // Silent fail - telemetry should not break UX
    console.debug('Telemetry tracking failed:', error);
  }
}
