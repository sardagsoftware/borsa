import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

/**
 * Message Types
 */
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ToolCall {
  id: string;
  action: string;
  payload: Record<string, any>;
  result?: {
    success: boolean;
    data?: any;
    error?: {
      code: string;
      message: string;
    };
  };
  status: 'pending' | 'running' | 'success' | 'error';
  startedAt?: string;
  completedAt?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Chat Store State
 */
interface ChatStore {
  // Conversations
  conversations: Conversation[];
  currentConversationId: string | null;

  // UI State
  isLoading: boolean;
  isSidebarOpen: boolean;

  // Actions
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setCurrentConversation: (id: string) => void;

  // Messages
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;

  // Tool Calls
  addToolCall: (conversationId: string, messageId: string, toolCall: Omit<ToolCall, 'id'>) => void;
  updateToolCall: (conversationId: string, messageId: string, toolCallId: string, updates: Partial<ToolCall>) => void;

  // UI Actions
  setLoading: (isLoading: boolean) => void;
  toggleSidebar: () => void;

  // Helpers
  getCurrentConversation: () => Conversation | null;
  getConversationById: (id: string) => Conversation | null;
}

/**
 * Chat Store Implementation
 */
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial State
      conversations: [],
      currentConversationId: null,
      isLoading: false,
      isSidebarOpen: true,

      // Create Conversation
      createConversation: () => {
        const id = nanoid();
        const now = new Date().toISOString();

        const newConversation: Conversation = {
          id,
          title: 'Yeni Sohbet',
          messages: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
        }));

        return id;
      },

      // Delete Conversation
      deleteConversation: (id) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id);
          const newCurrentId = state.currentConversationId === id
            ? filtered[0]?.id ?? null
            : state.currentConversationId;

          return {
            conversations: filtered,
            currentConversationId: newCurrentId,
          };
        });
      },

      // Set Current Conversation
      setCurrentConversation: (id) => {
        set({ currentConversationId: id });
      },

      // Add Message
      addMessage: (conversationId, message) => {
        const id = nanoid();
        const timestamp = new Date().toISOString();

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, { ...message, id, timestamp }],
                  updatedAt: timestamp,
                  // Auto-generate title from first user message
                  title: conv.messages.length === 0 && message.role === 'user'
                    ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                    : conv.title,
                }
              : conv
          ),
        }));
      },

      // Update Message
      updateMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : conv
          ),
        }));
      },

      // Add Tool Call
      addToolCall: (conversationId, messageId, toolCall) => {
        const id = nanoid();

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId
                      ? {
                          ...msg,
                          toolCalls: [...(msg.toolCalls || []), { ...toolCall, id }],
                        }
                      : msg
                  ),
                }
              : conv
          ),
        }));
      },

      // Update Tool Call
      updateToolCall: (conversationId, messageId, toolCallId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId
                      ? {
                          ...msg,
                          toolCalls: msg.toolCalls?.map((tc) =>
                            tc.id === toolCallId ? { ...tc, ...updates } : tc
                          ),
                        }
                      : msg
                  ),
                }
              : conv
          ),
        }));
      },

      // Set Loading
      setLoading: (isLoading) => {
        set({ isLoading });
      },

      // Toggle Sidebar
      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },

      // Get Current Conversation
      getCurrentConversation: () => {
        const state = get();
        return state.currentConversationId
          ? state.conversations.find((c) => c.id === state.currentConversationId) ?? null
          : null;
      },

      // Get Conversation By ID
      getConversationById: (id) => {
        return get().conversations.find((c) => c.id === id) ?? null;
      },
    }),
    {
      name: 'lydian-chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
);
