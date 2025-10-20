/**
 * 🎯 Intent Chat - Complete Natural Language Chat Interface
 * Orchestrates: ChatComposer → Intent → Form → API → MessageCard
 *
 * @author LyDian AI - Ultra Intelligence Platform
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Intent } from '../intent/engine';
import { ChatComposer } from './ChatComposer';
import { ActionForm } from '../core/action-forms';
import {
  ShipmentCard,
  LoanCard,
  HotelCard,
  ProductCard,
  ESGCard,
  InsightCard,
  GenericCard
} from './MessageCards';
import { prepareApiCall, validateParams, hasRequiredScopes } from '../core/tool-registry';
import { apiFetch } from '../lib/api';
import { withCsrf } from '../lib/csrf';

export interface IntentChatProps {
  locale?: string;
  userScopes?: string[];
  className?: string;
  onError?: (error: Error) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: Intent;
  data?: any;
  timestamp: Date;
  error?: string;
}

export function IntentChat({
  locale = 'tr',
  userScopes = [],
  className = '',
  onError
}: IntentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingIntent, setPendingIntent] = useState<Intent | null>(null);
  const [showActionForm, setShowActionForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handle user message submit from ChatComposer
   */
  const handleUserSubmit = async (intent: Intent, userMessage: string) => {
    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      intent,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);

    // Check permissions
    if (!hasRequiredScopes(intent.action, userScopes)) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: locale === 'tr' ? `Bu eylem için yetkiniz yok: ${intent.action}` : `Permission denied: ${intent.action}`,
        error: 'permission_denied',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
      return;
    }

    // Validate parameters
    const validation = validateParams(intent.action, intent.params);

    if (!validation.valid) {
      // Missing params - show form
      setPendingIntent(intent);
      setShowActionForm(true);
      return;
    }

    // Execute action directly
    await executeAction(intent);
  };

  /**
   * Handle form submission (when params were missing)
   */
  const handleFormSubmit = async (params: Record<string, any>) => {
    if (!pendingIntent) return;

    const completeIntent: Intent = {
      ...pendingIntent,
      params: { ...pendingIntent.params, ...params }
    };

    setShowActionForm(false);
    setPendingIntent(null);

    await executeAction(completeIntent);
  };

  /**
   * Execute action via API
   */
  const executeAction = async (intent: Intent) => {
    setIsProcessing(true);

    try {
      // Prepare API call config
      const apiCall = prepareApiCall(intent.action, intent.params);

      if (!apiCall) {
        throw new Error(`No API configuration for action: ${intent.action}`);
      }

      // Make API request
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3100';
      const url = `${apiBase}${apiCall.path}`;

      let response: Response;

      if (apiCall.method === 'GET') {
        response = await apiFetch(apiCall.path, { method: 'GET' });
      } else {
        // POST/PUT/DELETE - add CSRF token
        const headers = await withCsrf({
          'Content-Type': 'application/json',
          ...apiCall.headers
        });

        response = await apiFetch(apiCall.path, {
          method: apiCall.method,
          headers,
          body: JSON.stringify(apiCall.body)
        });
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Add assistant response with result
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: intent.reason || intent.action,
        intent,
        data: result.data || result,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Track success telemetry
      trackActionExecution(intent, true);
    } catch (error) {
      console.error('Action execution failed:', error);

      // Add error message
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: locale === 'tr' ? 'Bir hata oluştu' : 'An error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, errorMsg]);

      // Track failure telemetry
      trackActionExecution(intent, false, error instanceof Error ? error.message : undefined);

      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Render message based on type
   */
  const renderMessage = (message: Message) => {
    if (message.role === 'user') {
      return (
        <div key={message.id} className="message user-message">
          <div className="message-bubble">
            <div className="message-content">{message.content}</div>
            {message.intent && (
              <div className="message-meta">
                {message.intent.reason} • {Math.round(message.intent.score * 100)}%
              </div>
            )}
          </div>
        </div>
      );
    }

    if (message.role === 'system') {
      return (
        <div key={message.id} className="message system-message">
          <div className="system-bubble">
            <span className="system-icon">{message.error ? '⚠️' : 'ℹ️'}</span>
            <span className="system-text">{message.content}</span>
          </div>
        </div>
      );
    }

    // Assistant message with result card
    return (
      <div key={message.id} className="message assistant-message">
        {renderResultCard(message.intent?.action || '', message.data)}
      </div>
    );
  };

  /**
   * Render result card based on action type
   */
  const renderResultCard = (action: string, data: any) => {
    if (!data) return <GenericCard data={{}} locale={locale} />;

    switch (action) {
      case 'shipment.track':
        return <ShipmentCard data={data} locale={locale} />;

      case 'loan.compare':
        return <LoanCard data={data} locale={locale} />;

      case 'trip.search':
        return <HotelCard data={data} locale={locale} />;

      case 'product.sync':
        return <ProductCard data={data} locale={locale} />;

      case 'esg.calculate-carbon':
        return <ESGCard data={data} locale={locale} />;

      case 'insights.price-trend':
        return <InsightCard data={data} locale={locale} />;

      default:
        return <GenericCard data={data} locale={locale} />;
    }
  };

  const isRTL = locale === 'ar';

  return (
    <div className={`intent-chat ${isRTL ? 'rtl' : ''} ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h2 className="welcome-title">
              {locale === 'tr' ? '👋 Merhaba!' : '👋 Hello!'}
            </h2>
            <p className="welcome-text">
              {locale === 'tr'
                ? 'Doğal dille yazarak komutlarınızı çalıştırabilirsiniz.'
                : 'Type naturally to execute commands.'}
            </p>
            <div className="example-commands">
              <p className="example-label">
                {locale === 'tr' ? 'Örnekler:' : 'Examples:'}
              </p>
              <div className="example-item">📦 kargom nerede aras 1234567890</div>
              <div className="example-item">💰 250 bin tl 24 ay kredi</div>
              <div className="example-item">✈️ antalya 3 gece 2 kişi otel</div>
              <div className="example-item">🌱 karbon ayak izi hesapla</div>
            </div>
          </div>
        )}

        {messages.map(renderMessage)}

        {/* Action Form (if showing) */}
        {showActionForm && pendingIntent && (
          <div className="form-container">
            <ActionForm
              intent={pendingIntent}
              locale={locale}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowActionForm(false);
                setPendingIntent(null);
              }}
            />
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="processing-indicator">
            <div className="spinner-large" />
            <span className="processing-text">
              {locale === 'tr' ? 'İşleniyor...' : 'Processing...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Composer (always at bottom) */}
      <div className="composer-container">
        <ChatComposer
          locale={locale}
          userScopes={userScopes}
          onSubmit={handleUserSubmit}
          disabled={isProcessing}
        />
      </div>

      <style jsx>{`
        .intent-chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .composer-container {
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .welcome-message {
          text-align: center;
          padding: 60px 20px;
          color: #ffffff;
        }

        .welcome-title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 12px 0;
        }

        .welcome-text {
          font-size: 16px;
          color: #a0a0a0;
          margin: 0 0 32px 0;
        }

        .example-commands {
          max-width: 500px;
          margin: 0 auto;
          text-align: left;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
        }

        .example-label {
          font-size: 13px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .example-item {
          padding: 10px;
          margin: 6px 0;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          font-size: 14px;
          color: #e0e0e0;
          font-family: monospace;
        }

        .message {
          display: flex;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .user-message {
          justify-content: flex-end;
        }

        .rtl .user-message {
          justify-content: flex-start;
        }

        .assistant-message {
          justify-content: flex-start;
        }

        .rtl .assistant-message {
          justify-content: flex-end;
        }

        .message-bubble {
          max-width: 70%;
          padding: 12px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          border-bottom-right-radius: 4px;
        }

        .rtl .message-bubble {
          border-bottom-right-radius: 16px;
          border-bottom-left-radius: 4px;
        }

        .message-content {
          color: #ffffff;
          font-size: 15px;
          line-height: 1.5;
        }

        .message-meta {
          margin-top: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .system-message {
          justify-content: center;
        }

        .system-bubble {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 152, 0, 0.1);
          border: 1px solid rgba(255, 152, 0, 0.3);
          border-radius: 20px;
          font-size: 14px;
          color: #ffb74d;
        }

        .system-icon {
          font-size: 18px;
        }

        .form-container {
          animation: slideIn 0.3s ease-out;
        }

        .processing-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
        }

        .spinner-large {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .processing-text {
          font-size: 14px;
          color: #888;
        }

        /* Scrollbar styling */
        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .message-bubble {
            max-width: 85%;
          }

          .welcome-message {
            padding: 40px 16px;
          }

          .welcome-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Track action execution telemetry
 */
async function trackActionExecution(
  intent: Intent,
  success: boolean,
  errorMessage?: string
) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3100';
    await fetch(`${apiBase}/api/ui-telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'action.executed',
        data: {
          action: intent.action,
          success,
          confidence: intent.score,
          locale: intent.locale,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      })
    });
  } catch (error) {
    // Silent fail - telemetry should not break UX
    console.debug('Telemetry tracking failed:', error);
  }
}
