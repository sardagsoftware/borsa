/**
 * =¬ MessageList - Conversation Display with Inline Cards
 *
 * Features:
 * - ChatGPT-style message bubbles
 * - Inline result cards within assistant messages
 * - Auto-scroll to bottom
 * - Glassmorphism design (Analydian Premium)
 * - Turkish default
 *
 * @module components/unified/messages
 */

'use client';

import React, { useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  inlineCard?: {
    type: string; // e.g., 'ShipmentCardInline', 'ProductCardInline'
    data: any;
  };
}

interface MessageListProps {
  messages: Message[];
  locale?: string;
  isLoading?: boolean;
}

// ============================================================================
// MessageList Component
// ============================================================================

export function MessageList({
  messages,
  locale = 'tr',
  isLoading = false,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={listRef} className="message-list">
      {messages.map((message) => (
        <div key={message.id} className={`message message-${message.role}`}>
          {/* Message Bubble */}
          <div className="message-bubble">
            <div className="message-content">{message.content}</div>

            {/* Inline Card (if exists) */}
            {message.inlineCard && (
              <div className="inline-card-container">
                {/* TODO: Render actual InlineCard component based on type */}
                <div className="inline-card-placeholder">
                  <strong>{message.inlineCard.type}</strong>
                  <pre>{JSON.stringify(message.inlineCard.data, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="message-timestamp">
              {new Date(message.timestamp).toLocaleTimeString(locale)}
            </div>
          </div>
        </div>
      ))}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="message message-assistant">
          <div className="message-bubble">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .message-list {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message {
          display: flex;
          max-width: 80%;
        }

        .message-user {
          align-self: flex-end;
        }

        .message-assistant {
          align-self: flex-start;
        }

        .message-bubble {
          padding: 16px 20px;
          border-radius: 16px;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 215, 0, 0.1);
        }

        .message-user .message-bubble {
          background: rgba(255, 215, 0, 0.15);
          border-color: rgba(255, 215, 0, 0.3);
        }

        .message-assistant .message-bubble {
          background: rgba(0, 0, 0, 0.6);
          border-color: rgba(255, 215, 0, 0.1);
        }

        .message-content {
          color: #fff;
          font-size: 15px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .inline-card-container {
          margin-top: 12px;
        }

        .inline-card-placeholder {
          padding: 12px;
          background: rgba(255, 215, 0, 0.05);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 12px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        .message-timestamp {
          margin-top: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .typing-indicator {
          display: flex;
          gap: 6px;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: rgba(255, 215, 0, 0.6);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default MessageList;
