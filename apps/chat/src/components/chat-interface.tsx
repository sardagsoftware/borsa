'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chat-store';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { WelcomeScreen } from './welcome-screen';
import { ScrollArea } from './ui/scroll-area';

export function ChatInterface() {
  const { getCurrentConversation, createConversation } = useChatStore();
  const [conversation, setConversation] = useState(getCurrentConversation());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to conversation changes
  useEffect(() => {
    const unsubscribe = useChatStore.subscribe((state) => {
      setConversation(state.getCurrentConversation());
    });

    return unsubscribe;
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // Create initial conversation if none exists
  useEffect(() => {
    if (!conversation) {
      createConversation();
    }
  }, [conversation, createConversation]);

  if (!conversation) {
    return <WelcomeScreen />;
  }

  const hasMessages = conversation.messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-3xl mx-auto py-8">
          {!hasMessages ? (
            <WelcomeScreen />
          ) : (
            <div className="space-y-6">
              {conversation.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-card">
        <div className="max-w-3xl mx-auto p-4">
          <ChatInput conversationId={conversation.id} />
        </div>
      </div>
    </div>
  );
}
