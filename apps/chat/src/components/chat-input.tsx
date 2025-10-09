'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useChatStore } from '@/store/chat-store';
import { sendChatMessage } from '@/lib/api-client';

interface ChatInputProps {
  conversationId: string;
}

export function ChatInput({ conversationId }: ChatInputProps) {
  const [input, setInput] = useState('');
  const { addMessage, isLoading, setLoading } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add user message
    addMessage(conversationId, {
      role: 'user',
      content: userMessage,
    });

    // Set loading state
    setLoading(true);

    try {
      // Send to API
      const response = await sendChatMessage(userMessage, conversationId);

      // Add assistant response
      addMessage(conversationId, {
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
      });
    } catch (error: any) {
      // Add error message
      addMessage(conversationId, {
        role: 'assistant',
        content: `Üzgünüm, bir hata oluştu: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  return (
    <div className="relative flex items-end gap-2">
      {/* Textarea */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Bir mesaj yazın... (Enter: gönder, Shift+Enter: yeni satır)"
          disabled={isLoading}
          rows={1}
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '52px', maxHeight: '200px' }}
        />

        {/* Character count */}
        {input.length > 0 && (
          <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {input.length}
          </span>
        )}
      </div>

      {/* Send Button */}
      <button
        onClick={handleSubmit}
        disabled={!input.trim() || isLoading}
        className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        aria-label="Gönder"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
