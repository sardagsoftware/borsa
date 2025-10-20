/**
 * SHARD_7.3 - Message Composer Component
 * WhatsApp-style message input with emoji, attachments, voice
 */

import React from 'react';

interface MessageComposerProps {
  onSend: (content: string) => void;
  onAttachment?: (file: File) => void;
  onVoiceRecord?: (blob: Blob) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  replyTo?: {
    id: string;
    content: string;
    sender: string;
  };
  onCancelReply?: () => void;
}

export default function MessageComposer({
  onSend,
  onAttachment,
  onVoiceRecord,
  onTyping,
  placeholder = 'Mesaj yazın...',
  replyTo,
  onCancelReply
}: MessageComposerProps) {
  const [message, setMessage] = React.useState('');
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Typing indicator
  React.useEffect(() => {
    if (message.length > 0) {
      onTyping?.(true);
      const timeout = setTimeout(() => onTyping?.(false), 3000);
      return () => clearTimeout(timeout);
    } else {
      onTyping?.(false);
    }
  }, [message, onTyping]);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAttachment?.(file);
    }
  };

  const toggleVoiceRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  const quickEmojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯'];

  return (
    <div className="border-t border-[#374151] bg-[#111827] p-4">
      {/* Reply To */}
      {replyTo && (
        <div className="mb-3 p-3 rounded-lg bg-[#1F2937] border-l-2 border-[#10A37F] flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[#10A37F] mb-1">↩️ {replyTo.sender}</div>
            <div className="text-sm text-[#9CA3AF] truncate">{replyTo.content}</div>
          </div>
          <button
            onClick={onCancelReply}
            className="ml-2 p-1 hover:bg-[#374151] rounded transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mb-3 p-3 rounded-lg bg-[#1F2937] border border-[#374151]">
          <div className="grid grid-cols-8 gap-2">
            {quickEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-2xl hover:bg-[#374151] rounded p-2 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-[#1F2937] rounded-lg transition-colors text-xl"
          title="Dosya ekle"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            rows={1}
            className="w-full px-4 py-2 pr-10 rounded-lg bg-[#1F2937] border border-[#374151] focus:border-[#10A37F] focus:outline-none resize-none transition-colors"
          />

          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-2 top-2 hover:bg-[#374151] rounded p-1 transition-colors"
          >
            😊
          </button>
        </div>

        {/* Send/Voice Button */}
        {message.trim() ? (
          <button
            onClick={handleSend}
            className="p-3 rounded-lg bg-[#10A37F] hover:bg-[#0D8F6E] transition-colors"
            title="Gönder"
          >
            ➤
          </button>
        ) : (
          <button
            onClick={toggleVoiceRecording}
            className={`p-3 rounded-lg transition-colors ${
              isRecording
                ? 'bg-[#EF4444] hover:bg-[#DC2626] animate-pulse'
                : 'bg-[#1F2937] hover:bg-[#374151]'
            }`}
            title={isRecording ? 'Kaydı durdur' : 'Sesli mesaj'}
          >
            🎤
          </button>
        )}
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mt-3 flex items-center justify-center gap-2 text-[#EF4444]">
          <div className="w-2 h-2 bg-[#EF4444] rounded-full animate-pulse" />
          <span className="text-sm font-semibold">Kaydediliyor... 0:00</span>
        </div>
      )}
    </div>
  );
}
