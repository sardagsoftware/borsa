/**
 * PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
 * LYDIAN-IQ UNIFIED SURFACE
 * PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
 *
 * ChatGPT-style unified interface for all 72 connectors
 *
 * Architecture:
 * - GlobalSearch (top, persistent)
 * - MessageList (center, scrollable)
 * - ChatComposer (bottom, sticky)
 * - DockPanel (right sidebar, collapsible)
 *
 * Features:
 * - Intent recognition for natural language queries
 * - Inline result cards within messages
 * - Turkish-first with full i18n (TR/EN/AR/DE/RU/NL/BG/EL)
 * - Real-time tool execution with 72 connectors
 * - Glassmorphism design with black-gold theme
 *
 * @module app/lydian-iq
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { I18nProvider, useI18n } from '@/i18n';
import { recognizeIntent, IntentResult } from '@/intent/engine';
import { runTool, ToolExecutionResult } from '@/core/tool-runner';
import { GlobalSearch } from '@/components/unified/search/GlobalSearch';
import { ChatComposer } from '@/components/unified/composer/ChatComposer';
import { MessageList, Message } from '@/components/unified/messages/MessageList';
import { DockPanel } from '@/components/unified/dock/DockPanel';
import '@/brand/analydian-theme.css';

// ============================================================================
// Types
// ============================================================================

interface InlineCardData {
  type: string;
  data: any;
}

interface ConversationState {
  conversationId: string;
  messages: Message[];
  isProcessing: boolean;
}

// ============================================================================
// Main Page Component (Internal)
// ============================================================================

function LydianIQPage() {
  const { locale, t } = useI18n();

  // ===== State Management =====
  const [conversation, setConversation] = useState<ConversationState>({
    conversationId: generateConversationId(),
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: t('lydianIQ.welcome') || 'Merhaba! Size nas1l yard1mc1 olabilirim? Kargo takibi, ürün arama, fiyat kar_1la_t1rma ve daha fazlas1 için bana yazabilirsiniz.',
        timestamp: Date.now(),
      },
    ],
    isProcessing: false,
  });

  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // ===== Refs =====
  const abortControllerRef = useRef<AbortController | null>(null);

  // ===== Handle Query Submission =====
  const handleSubmit = useCallback(
    async (query: string, files?: File[]) => {
      if (!query.trim() || conversation.isProcessing) return;

      // 1. Add user message
      const userMessage: Message = {
        id: generateMessageId(),
        role: 'user',
        content: query,
        timestamp: Date.now(),
        files: files?.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
      };

      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isProcessing: true,
      }));

      try {
        // 2. Recognize intent
        const intentResult = recognizeIntent(query);

        if (!intentResult.topMatch) {
          // No intent recognized - generic response
          const assistantMessage: Message = {
            id: generateMessageId(),
            role: 'assistant',
            content:
              t('lydianIQ.noIntentFound') ||
              'Üzgünüm, isteinizi anlayamad1m. Lütfen daha spesifik bir soru sorun veya desteklenen i_lemlerden birini deneyin.',
            timestamp: Date.now(),
          };

          setConversation((prev) => ({
            ...prev,
            messages: [...prev.messages, assistantMessage],
            isProcessing: false,
          }));
          return;
        }

        const { action, vendor, params } = intentResult.topMatch;

        // 3. Execute tool
        abortControllerRef.current = new AbortController();

        const result: ToolExecutionResult<any> = await runTool({
          action,
          params: {
            ...params,
            vendor,
            locale,
          },
          userId: 'current-user', // TODO: Get from auth context
          signal: abortControllerRef.current.signal,
        });

        if (!result.success) {
          // Tool execution failed
          const errorMessage: Message = {
            id: generateMessageId(),
            role: 'assistant',
            content:
              result.errorTR ||
              t('errors.EXECUTION_ERROR') ||
              'Üzgünüm, i_lem s1ras1nda bir hata olu_tu.',
            timestamp: Date.now(),
            error: {
              code: result.error || 'UNKNOWN',
              message: result.errorTR || result.error || 'Unknown error',
            },
          };

          setConversation((prev) => ({
            ...prev,
            messages: [...prev.messages, errorMessage],
            isProcessing: false,
          }));
          return;
        }

        // 4. Add assistant message with inline card
        const assistantMessage: Message = {
          id: generateMessageId(),
          role: 'assistant',
          content: generateResponseText(action, result, locale),
          timestamp: Date.now(),
          inlineCard: result.cardType
            ? {
                type: result.cardType,
                data: result.data,
              }
            : undefined,
          metadata: {
            action,
            vendor,
            executionTime: result.executionTime,
            retries: result.retries,
          },
        };

        setConversation((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isProcessing: false,
        }));
      } catch (error: any) {
        console.error('[LydianIQ] Tool execution error:', error);

        const errorMessage: Message = {
          id: generateMessageId(),
          role: 'assistant',
          content:
            error.message ||
            t('errors.NETWORK_ERROR') ||
            'Bir hata olu_tu. Lütfen tekrar deneyin.',
          timestamp: Date.now(),
          error: {
            code: 'EXECUTION_ERROR',
            message: error.message,
          },
        };

        setConversation((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
          isProcessing: false,
        }));
      }
    },
    [conversation.isProcessing, locale, t]
  );

  // ===== Cleanup on unmount =====
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ===== Render =====
  return (
    <div className="lydian-iq-container">
      {/* Global Search - Top Persistent */}
      <div className="lydian-iq-header">
        <GlobalSearch
          onSubmit={handleSubmit}
          locale={locale}
          placeholder={
            t('search.placeholder') ||
            'Kargo takibi, fiyat kar_1la_t1rma, ürün arama...'
          }
          disabled={conversation.isProcessing}
        />
      </div>

      {/* Main Content Area */}
      <div className="lydian-iq-main">
        {/* Message List - Center Scrollable */}
        <div className={`lydian-iq-messages ${isDockCollapsed ? 'dock-collapsed' : ''}`}>
          <MessageList
            messages={conversation.messages}
            locale={locale}
            isLoading={conversation.isProcessing}
          />
        </div>

        {/* Dock Panel - Right Sidebar */}
        <div className="lydian-iq-dock">
          <DockPanel
            locale={locale}
            onCollapseChange={setIsDockCollapsed}
          />
        </div>
      </div>

      {/* Chat Composer - Bottom Sticky */}
      <div className="lydian-iq-footer">
        <ChatComposer
          onSend={handleSubmit}
          locale={locale}
          placeholder={
            t('composer.placeholder') ||
            'Bir mesaj yaz1n... (Shift+Enter yeni sat1r, Enter gönder)'
          }
          disabled={conversation.isProcessing}
          isProcessing={conversation.isProcessing}
        />
      </div>

      {/* Styles */}
      <style jsx>{`
        .lydian-iq-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100%;
          background: linear-gradient(
            135deg,
            var(--color-black-pure) 0%,
            var(--color-black-deep) 50%,
            var(--color-black-rich) 100%
          );
          overflow: hidden;
        }

        /* Header - Global Search */
        .lydian-iq-header {
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
          padding: var(--space-md) var(--space-lg);
          background: var(--glass-bg-darkest);
          backdrop-filter: var(--glass-blur-strong);
          border-bottom: 1px solid var(--glass-border);
          box-shadow: var(--shadow-md);
        }

        /* Main Content */
        .lydian-iq-main {
          display: flex;
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        /* Messages Area */
        .lydian-iq-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-lg);
          transition: margin-right var(--transition-base);
        }

        .lydian-iq-messages.dock-collapsed {
          margin-right: 0;
        }

        /* Dock Panel */
        .lydian-iq-dock {
          width: 400px;
          flex-shrink: 0;
          overflow-y: auto;
          background: var(--glass-bg-darker);
          border-left: 1px solid var(--glass-border);
          transition: width var(--transition-base);
        }

        @media (max-width: 1024px) {
          .lydian-iq-dock {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            z-index: var(--z-overlay);
            box-shadow: var(--shadow-xl);
          }
        }

        @media (max-width: 768px) {
          .lydian-iq-dock {
            width: 100%;
          }
        }

        /* Footer - Chat Composer */
        .lydian-iq-footer {
          position: sticky;
          bottom: 0;
          z-index: var(--z-sticky);
          padding: var(--space-md) var(--space-lg);
          background: var(--glass-bg-darkest);
          backdrop-filter: var(--glass-blur-strong);
          border-top: 1px solid var(--glass-border);
          box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.4);
        }

        /* Scrollbar styling for message area */
        .lydian-iq-messages::-webkit-scrollbar {
          width: 8px;
        }

        .lydian-iq-messages::-webkit-scrollbar-track {
          background: var(--glass-bg-darkest);
          border-radius: var(--radius-sm);
        }

        .lydian-iq-messages::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.3);
          border-radius: var(--radius-sm);
        }

        .lydian-iq-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.5);
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .lydian-iq-header,
          .lydian-iq-footer {
            padding: var(--space-sm);
          }

          .lydian-iq-messages {
            padding: var(--space-sm);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateResponseText(
  action: string,
  result: ToolExecutionResult<any>,
  locale: string
): string {
  // Generate contextual response based on action type
  const templates: Record<string, Record<string, string>> = {
    'shipment.track': {
      tr: 'Kargo takip bilgileriniz haz1r:',
      en: 'Your shipment tracking information:',
    },
    'product.search': {
      tr: 'Ürün arama sonuçlar1n1z:',
      en: 'Your product search results:',
    },
    'product.compare': {
      tr: 'Fiyat kar_1la_t1rma sonuçlar1:',
      en: 'Price comparison results:',
    },
    'loan.compare': {
      tr: 'Kredi kar_1la_t1rma sonuçlar1:',
      en: 'Loan comparison results:',
    },
    'trip.search': {
      tr: 'Seyahat arama sonuçlar1:',
      en: 'Travel search results:',
    },
  };

  const template = templates[action];
  if (template) {
    return template[locale] || template['tr'];
  }

  // Default response
  return locale === 'tr'
    ? '0_lem ba_ar1yla tamamland1:'
    : 'Operation completed successfully:';
}

// ============================================================================
// Main Export with I18n Provider
// ============================================================================

export default function LydianIQPageWithProvider() {
  return (
    <I18nProvider initialLocale="tr">
      <LydianIQPage />
    </I18nProvider>
  );
}
