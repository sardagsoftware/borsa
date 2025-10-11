/**
 * =¬ ChatComposer - Bottom Input with Intent Recognition
 *
 * Features:
 * - Same intent engine as GlobalSearch
 * - Multi-line support (textarea)
 * - Shift+Enter for new line, Enter to send
 * - File attachment support
 * - Turkish placeholders by default
 * - Glassmorphism design (Analydian Premium)
 * - Auto-resize textarea
 *
 * @module components/unified/composer
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { recognizeIntent, IntentResult } from '../../../intent/engine';
import { getActionDescription } from '../../../intent/registry';

// ============================================================================
// Types
// ============================================================================

interface ChatComposerProps {
  /** Callback when user sends message */
  onSend: (message: string, intent: IntentResult) => void;

  /** Current locale (default: 'tr') */
  locale?: string;

  /** Placeholder text (optional, auto-selected by locale) */
  placeholder?: string;

  /** Disabled state */
  disabled?: boolean;

  /** Is currently processing? */
  isProcessing?: boolean;
}

// ============================================================================
// Localized Placeholders
// ============================================================================

const PLACEHOLDERS: Record<string, string> = {
  tr: 'Bir mesaj yaz1n... (Shift+Enter yeni sat1r, Enter gönder)',
  en: 'Type a message... (Shift+Enter new line, Enter send)',
  ar: ''C*( 13'D)... (Shift+Enter 371 ,/J/ Enter %13'D)',
  de: 'Nachricht eingeben... (Shift+Enter neue Zeile, Enter senden)',
  ru: '2548B5 A>>1I5=85... (Shift+Enter =>20O AB@>:0, Enter >B?@028BL)',
  nl: 'Typ een bericht... (Shift+Enter nieuwe regel, Enter verzenden)',
  bg: '0?8H5B5 AJ>1I5=85... (Shift+Enter =>2 @54, Enter 87?@0I0=5)',
  el: '“Á¬ÈÄµ ­½± ¼®½Å¼±... (Shift+Enter ½­± ³Á±¼¼®, Enter ±À¿ÃÄ¿»®)',
};

// ============================================================================
// ChatComposer Component
// ============================================================================

export function ChatComposer({
  onSend,
  locale = 'tr',
  placeholder,
  disabled = false,
  isProcessing = false,
}: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const [intent, setIntent] = useState<IntentResult | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================
  // Intent Recognition (Debounced)
  // ========================================

  const recognizeMessageIntent = useCallback((msg: string) => {
    if (!msg || msg.length < 2) {
      setIntent(null);
      return;
    }

    // Debounce intent recognition (300ms)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const result = recognizeIntent(msg);
      setIntent(result);
    }, 300);
  }, []);

  // ========================================
  // Auto-resize Textarea
  // ========================================

  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max 200px
    textarea.style.height = `${newHeight}px`;
  }, []);

  // ========================================
  // Handlers
  // ========================================

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    recognizeMessageIntent(value);
    autoResizeTextarea();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!message.trim() || disabled || isProcessing) return;

    try {
      // Re-recognize intent at send time (fresh)
      const finalIntent = recognizeIntent(message);
      await onSend(message, finalIntent);

      // Clear after successful send
      setMessage('');
      setIntent(null);
      setFiles([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('[ChatComposer] Send error:', error);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ========================================
  // Effects
  // ========================================

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ========================================
  // Render
  // ========================================

  const selectedPlaceholder = placeholder || PLACEHOLDERS[locale] || PLACEHOLDERS['tr'];
  const canSend = message.trim().length > 0 && !disabled && !isProcessing;

  return (
    <div className="chat-composer">
      {/* File Attachments */}
      {files.length > 0 && (
        <div className="composer-files">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="file-chip">
              <span className="file-name">{file.name}</span>
              <button
                type="button"
                className="file-remove"
                onClick={() => handleRemoveFile(index)}
                disabled={disabled}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer Container */}
      <div className="composer-container">
        {/* Attach File Button */}
        <button
          type="button"
          className="composer-button attach-button"
          onClick={handleFileClick}
          disabled={disabled || isProcessing}
          title="Dosya ekle"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 4V16M4 10H16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          placeholder={selectedPlaceholder}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isProcessing}
          rows={1}
        />

        {/* Intent Indicator */}
        {intent && intent.topMatch && (
          <div
            className="composer-intent-indicator"
            title={`${intent.topMatch.action} (${intent.topMatch.confidence})`}
          >
            <span className={`confidence-badge ${intent.topMatch.confidence}`}>
              {intent.topMatch.confidence === 'high' ? '' : '~'}
            </span>
          </div>
        )}

        {/* Send Button */}
        <button
          type="button"
          className={`composer-button send-button ${canSend ? 'enabled' : ''}`}
          onClick={handleSend}
          disabled={!canSend}
          title="Gönder"
        >
          {isProcessing ? (
            <div className="spinner-small" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M2 10L18 10M18 10L12 4M18 10L12 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Top-3 Suggestions (if intent detected) */}
      {intent && intent.matches.length > 0 && message.length > 2 && (
        <div className="composer-chips">
          {intent.matches.slice(0, 3).map((match) => (
            <div key={match.action} className={`chip ${match.confidence}`}>
              <span className="chip-label">
                {getActionDescription(match.action, locale)}
              </span>
              <span className="chip-score">{Math.round(match.score * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Styles (Scoped to ChatComposer) */}
      <style jsx>{`
        .chat-composer {
          position: sticky;
          bottom: 0;
          z-index: 100;
          padding: 20px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 215, 0, 0.1);
        }

        .composer-files {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .file-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 12px;
          color: #fff;
          font-size: 13px;
        }

        .file-name {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-remove {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          transition: color 0.2s;
        }

        .file-remove:hover:not(:disabled) {
          color: #ef4444;
        }

        .composer-container {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          max-width: 900px;
          margin: 0 auto;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid rgba(255, 215, 0, 0.2);
          border-radius: 20px;
          transition: all 0.3s ease;
        }

        .composer-container:focus-within {
          border-color: rgba(255, 215, 0, 0.6);
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
        }

        .composer-button {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 12px;
          color: rgba(255, 215, 0, 0.8);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .composer-button:hover:not(:disabled) {
          background: rgba(255, 215, 0, 0.2);
          border-color: rgba(255, 215, 0, 0.5);
          transform: scale(1.05);
        }

        .composer-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .composer-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-button.enabled {
          background: rgba(255, 215, 0, 0.3);
          border-color: rgba(255, 215, 0, 0.6);
        }

        .send-button.enabled:hover:not(:disabled) {
          background: rgba(255, 215, 0, 0.4);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
        }

        .composer-textarea {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #fff;
          font-size: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          resize: none;
          overflow-y: auto;
          max-height: 200px;
        }

        .composer-textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .composer-intent-indicator {
          flex-shrink: 0;
        }

        .confidence-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
        }

        .confidence-badge.high {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .confidence-badge.medium {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .confidence-badge.low {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 215, 0, 0.2);
          border-top-color: rgba(255, 215, 0, 0.8);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .composer-chips {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(255, 215, 0, 0.05);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 14px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          white-space: nowrap;
        }

        .chip-label {
          font-weight: 500;
        }

        .chip-score {
          font-size: 11px;
          opacity: 0.6;
        }

        .chip.high {
          border-color: rgba(34, 197, 94, 0.4);
        }

        .chip.medium {
          border-color: rgba(251, 191, 36, 0.4);
        }

        .chip.low {
          border-color: rgba(239, 68, 68, 0.4);
        }
      `}</style>
    </div>
  );
}

export default ChatComposer;
