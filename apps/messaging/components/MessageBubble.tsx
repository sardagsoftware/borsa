/**
 * SHARD_7.2 - Message Bubble Component
 * WhatsApp-style message bubbles
 */

import React from 'react';

export interface Message {
  id: string;
  content: string;
  timestamp: number;
  isSent: boolean;
  isDelivered: boolean;
  isRead: boolean;
  reactions?: string[];
  replyTo?: {
    id: string;
    content: string;
    sender: string;
  };
  attachment?: {
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    name?: string;
    size?: number;
  };
  isEncrypted: boolean;
}

interface MessageBubbleProps {
  message: Message;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
}

export default function MessageBubble({ message, onReact, onReply }: MessageBubbleProps) {
  const [showActions, setShowActions] = React.useState(false);

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (): string => {
    if (!message.isSent) return '🕐';
    if (message.isRead) return '✓✓';
    if (message.isDelivered) return '✓✓';
    return '✓';
  };

  return (
    <div
      className={`flex ${message.isSent ? 'justify-end' : 'justify-start'} mb-2 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={`max-w-[70%] rounded-2xl p-3 ${
          message.isSent
            ? 'bg-[#10A37F] text-white'
            : 'bg-[#1F2937] text-[#E5E7EB]'
        } relative`}
      >
        {/* Reply To */}
        {message.replyTo && (
          <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-2 border-[#10A37F]">
            <div className="text-xs text-[#9CA3AF] mb-1">{message.replyTo.sender}</div>
            <div className="text-sm opacity-80 truncate">{message.replyTo.content}</div>
          </div>
        )}

        {/* Attachment */}
        {message.attachment && (
          <div className="mb-2">
            {message.attachment.type === 'image' && (
              <img
                src={message.attachment.url}
                alt="attachment"
                className="rounded-lg max-w-full"
              />
            )}
            {message.attachment.type === 'file' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-black/20">
                <span className="text-2xl">📎</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{message.attachment.name}</div>
                  <div className="text-xs opacity-70">
                    {message.attachment.size ? formatFileSize(message.attachment.size) : 'Unknown size'}
                  </div>
                </div>
              </div>
            )}
            {message.attachment.type === 'audio' && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-black/20">
                <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  ▶️
                </button>
                <div className="flex-1 h-6 bg-white/20 rounded-full" />
                <span className="text-xs">0:00</span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-1 mt-1">
          {message.isEncrypted && (
            <span className="text-xs opacity-70">🔒</span>
          )}
          <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
          {message.isSent && (
            <span className={`text-xs ${
              message.isRead ? 'text-blue-400' : 'opacity-70'
            }`}>
              {getStatusIcon()}
            </span>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-2 right-2 flex items-center gap-1 bg-[#0B0F19] rounded-full px-2 py-0.5 border border-[#374151]">
            {message.reactions.slice(0, 3).map((emoji, i) => (
              <span key={i} className="text-xs">{emoji}</span>
            ))}
            {message.reactions.length > 3 && (
              <span className="text-xs text-[#6B7280]">+{message.reactions.length - 3}</span>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {showActions && (
          <div className={`absolute top-0 ${message.isSent ? 'right-full mr-2' : 'left-full ml-2'} flex items-center gap-1`}>
            <button
              onClick={() => onReact?.(message.id, '❤️')}
              className="p-1.5 bg-[#1F2937] hover:bg-[#374151] rounded-full text-sm transition-colors"
            >
              ❤️
            </button>
            <button
              onClick={() => onReply?.(message)}
              className="p-1.5 bg-[#1F2937] hover:bg-[#374151] rounded-full text-sm transition-colors"
            >
              ↩️
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
