/**
 * SHARD_7.4 - Chat Window Component
 * Main chat interface combining messages and composer
 */

import React from 'react';
import MessageBubble, { Message } from './MessageBubble';
import MessageComposer from './MessageComposer';

interface ChatWindowProps {
  chatId: string;
  chatName: string;
  isOnline: boolean;
  isTyping: boolean;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onAttachment?: (file: File) => void;
  onBack?: () => void;
}

export default function ChatWindow({
  chatId,
  chatName,
  isOnline,
  isTyping,
  messages,
  onSendMessage,
  onReact,
  onAttachment,
  onBack
}: ChatWindowProps) {
  const [replyTo, setReplyTo] = React.useState<Message['replyTo']>();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (content: string) => {
    onSendMessage(content);
    setReplyTo(undefined);
  };

  const handleReply = (message: Message) => {
    setReplyTo({
      id: message.id,
      content: message.content,
      sender: message.isSent ? 'Sen' : chatName
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F19]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#374151] bg-[#111827]">
        <button
          onClick={onBack}
          className="md:hidden p-2 hover:bg-[#1F2937] rounded-lg transition-colors"
        >
          ←
        </button>

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10A37F] to-[#0D8F6E] flex items-center justify-center text-lg font-semibold">
            {chatName.charAt(0).toUpperCase()}
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10A37F] border-2 border-[#111827] rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{chatName}</h2>
          <p className="text-xs text-[#6B7280]">
            {isTyping ? '⌨️ yazıyor...' : isOnline ? 'çevrimiçi' : 'çevrimdışı'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[#1F2937] rounded-lg transition-colors">
            🎥
          </button>
          <button className="p-2 hover:bg-[#1F2937] rounded-lg transition-colors">
            📞
          </button>
          <button className="p-2 hover:bg-[#1F2937] rounded-lg transition-colors">
            ⋮
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#6B7280]">
            <div className="text-6xl mb-4">💬</div>
            <div>Henüz mesaj yok</div>
            <div className="text-sm mt-2">İlk mesajı gönderin!</div>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                onReact={onReact}
                onReply={handleReply}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <MessageComposer
        onSend={handleSend}
        onAttachment={onAttachment}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(undefined)}
      />
    </div>
  );
}
