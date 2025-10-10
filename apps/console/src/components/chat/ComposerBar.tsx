/**
 * ✍️ Composer Bar Component
 * Multi-line input with intent suggestions and send button
 * 
 * @module components/chat/ComposerBar
 * @white-hat Compliant
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../state/store';
import { trackAction } from '../../lib/telemetry';

export default function ComposerBar() {
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addMessage = useAppStore(state => state.addMessage);
  const setBusy = useAppStore(state => state.setBusy);
  const busy = useAppStore(state => state.busy);
  const flags = useAppStore(state => state.flags);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to send (Shift+Enter for newline)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || busy) return;

    const userMessage = input.trim();
    setInput('');
    setBusy(true);

    // Add user message
    addMessage({
      role: 'user',
      content: userMessage,
    });

    // Track action
    trackAction('message_send', { length: userMessage.length });

    try {
      // Call intent engine
      const intentResponse = await fetch('/api/lydian-iq/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMessage }),
        credentials: 'include',
      });

      const intentData = await intentResponse.json();

      if (intentData.success && intentData.intents && intentData.intents.length > 0) {
        const topIntent = intentData.intents[0];

        // Set intents for display
        useAppStore.getState().setIntents(intentData.intents);

        // Execute top intent
        const executeResponse = await fetch('/api/lydian-iq/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: topIntent }),
          credentials: 'include',
        });

        const executeData = await executeResponse.json();

        // Add AI response
        addMessage({
          role: 'ai',
          content: executeData.message || 'İşlem tamamlandı.',
          intentId: topIntent.id,
        });
      } else {
        // No intent found
        addMessage({
          role: 'ai',
          content: '❓ Üzgünüm, bu isteği anlayamadım. Lütfen daha açık bir şekilde yazabilir misiniz?',
        });
      }
    } catch (error) {
      console.error('Message send error:', error);
      addMessage({
        role: 'system',
        content: '❌ Bir hata oluştu. Lütfen tekrar deneyin.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="composer-bar">
      <div className="composer-container">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            className="composer-input"
            placeholder="Mesajınızı yazın... (Shift+Enter ile yeni satır)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            disabled={busy}
            rows={1}
          />

          {/* Intent suggestions toggle */}
          {flags.intent_suggestions_enabled && input.length > 2 && (
            <div className="quick-hint">
              💡 {input.length < 10 ? 'Daha fazla detay ekleyin' : 'Enter ile gönder'}
            </div>
          )}
        </div>

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim() || busy}
          title="Gönder"
        >
          {busy ? (
            <span className="spinner">⏳</span>
          ) : (
            <span className="send-icon">↑</span>
          )}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer">
        🔒 Verileriniz KVKK/GDPR uyumlu işlenir • White-hat only • Partner API'leri
      </div>

      <style jsx>{`
        .composer-bar {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(212, 175, 55, 0.2);
          padding: 1rem 1.5rem;
          position: sticky;
          bottom: 0;
          z-index: 90;
        }

        .composer-container {
          display: flex;
          align-items: flex-end;
          gap: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .input-wrapper {
          flex: 1;
          position: relative;
        }

        .composer-input {
          width: 100%;
          min-height: 48px;
          max-height: 200px;
          padding: 0.875rem 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          color: #f5f5f5;
          font-size: 0.9375rem;
          font-family: inherit;
          line-height: 1.5;
          resize: none;
          outline: none;
          transition: all 0.2s;
        }

        .composer-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(212, 175, 55, 0.5);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }

        .composer-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .composer-input::placeholder {
          color: rgba(245, 245, 245, 0.4);
        }

        .quick-hint {
          position: absolute;
          top: -2rem;
          left: 1rem;
          padding: 0.375rem 0.75rem;
          background: rgba(212, 175, 55, 0.15);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 6px;
          font-size: 0.75rem;
          color: rgba(212, 175, 55, 0.9);
          white-space: nowrap;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .send-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          border: none;
          color: #000;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
        }

        .send-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .send-icon {
          display: block;
          font-weight: 700;
          line-height: 1;
        }

        .spinner {
          display: block;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .disclaimer {
          margin-top: 0.75rem;
          text-align: center;
          font-size: 0.75rem;
          color: rgba(245, 245, 245, 0.5);
          line-height: 1.4;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .composer-bar {
            padding: 0.75rem 1rem;
          }

          .disclaimer {
            font-size: 0.6875rem;
          }
        }

        /* Scrollbar */
        .composer-input::-webkit-scrollbar {
          width: 6px;
        }

        .composer-input::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }

        .composer-input::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
