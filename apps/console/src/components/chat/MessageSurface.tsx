/**
 * 💬 Message Surface Component
 * Chat messages with inline connector cards
 * 
 * @module components/chat/MessageSurface
 * @white-hat Compliant
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { useAppStore, Message } from '../../state/store';

export default function MessageSurface() {
  const messages = useAppStore(state => state.messages);
  const intents = useAppStore(state => state.intents);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="message-surface">
      <div className="messages-container">
        {messages.map((message, index) => (
          <MessageItem key={message.id} message={message} index={index} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Intent Suggestions (if any) */}
      {intents.length > 0 && (
        <div className="intent-suggestions">
          <div className="intent-label">💡 Önerilen İşlemler:</div>
          <div className="intent-chips">
            {intents.slice(0, 3).map(intent => (
              <IntentChip key={intent.id} intent={intent} />
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .message-surface {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 1.5rem;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .intent-suggestions {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
        }

        .intent-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #d4af37;
          margin-bottom: 0.75rem;
        }

        .intent-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">⚡</div>
      <h2 className="empty-title">Lydian-IQ'ya Hoş Geldiniz</h2>
      <p className="empty-text">
        Yukarıdaki arama çubuğuna ne yapmak istediğinizi yazın veya aşağıdaki
        örnek sorguları deneyin:
      </p>
      <div className="example-queries">
        <ExampleQuery text="Trendyol'da telefon fiyatları" icon="💰" />
        <ExampleQuery text="Hepsijet kargo takibi" icon="📦" />
        <ExampleQuery text="Migros menü" icon="🍔" />
      </div>

      <style jsx>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 2rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.6;
        }

        .empty-title {
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
        }

        .empty-text {
          font-size: 1rem;
          color: rgba(245, 245, 245, 0.7);
          max-width: 500px;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .example-queries {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

// Example query chip
function ExampleQuery({ text, icon }: { text: string; icon: string }) {
  const addMessage = useAppStore(state => state.addMessage);

  const handleClick = () => {
    addMessage({ role: 'user', content: text });
    // TODO: Execute intent
  };

  return (
    <button className="example-query" onClick={handleClick}>
      <span className="query-icon">{icon}</span>
      <span className="query-text">{text}</span>

      <style jsx>{`
        .example-query {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 24px;
          color: #f5f5f5;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .example-query:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(212, 175, 55, 0.4);
          transform: translateY(-2px);
        }

        .query-icon {
          font-size: 1.25rem;
        }

        .query-text {
          font-weight: 500;
        }
      `}</style>
    </button>
  );
}

// Message item
function MessageItem({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`message ${isUser ? 'user' : isSystem ? 'system' : 'ai'}`}>
      {!isUser && (
        <div className="message-avatar">
          {isSystem ? '⚙️' : '🤖'}
        </div>
      )}

      <div className="message-content">
        <div className="message-text">{message.content}</div>
        
        {message.timestamp && (
          <div className="message-meta">
            {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      {isUser && (
        <div className="message-avatar user">
          👤
        </div>
      )}

      <style jsx>{`
        .message {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          animation: slideIn 0.3s ease;
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

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          background: rgba(212, 175, 55, 0.2);
          border: 1px solid rgba(212, 175, 55, 0.3);
          flex-shrink: 0;
        }

        .message-avatar.user {
          background: rgba(52, 152, 219, 0.2);
          border-color: rgba(52, 152, 219, 0.3);
        }

        .message-content {
          flex: 1;
          max-width: 70%;
        }

        .message.user .message-content {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .message-text {
          padding: 1rem 1.25rem;
          border-radius: 16px;
          font-size: 0.9375rem;
          line-height: 1.6;
          word-wrap: break-word;
        }

        .message.ai .message-text,
        .message.system .message-text {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
        }

        .message.user .message-text {
          background: rgba(212, 175, 55, 0.2);
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .message-meta {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: rgba(245, 245, 245, 0.5);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .message-content {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  );
}

// Intent chip
function IntentChip({ intent }: { intent: any }) {
  return (
    <button className="intent-chip">
      <span className="chip-text">{intent.action}</span>
      <span className="chip-score">{Math.round(intent.score * 100)}%</span>

      <style jsx>{`
        .intent-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(212, 175, 55, 0.15);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 20px;
          color: #f5f5f5;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .intent-chip:hover {
          background: rgba(212, 175, 55, 0.25);
          transform: translateY(-2px);
        }

        .chip-text {
          font-weight: 500;
        }

        .chip-score {
          font-size: 0.75rem;
          color: rgba(212, 175, 55, 0.8);
          font-weight: 600;
        }
      `}</style>
    </button>
  );
}
