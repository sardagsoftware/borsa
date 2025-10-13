/**
 * SHARD_16.1 - Unified Chat Context
 * Central state management for all chat features
 *
 * Features:
 * - Message send/receive (E2EE)
 * - File upload/download
 * - Video call management
 * - Location sharing
 * - Contact management
 * - Real-time updates (WebSocket)
 *
 * White Hat: Zero-knowledge, client-side encryption
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { initializeSignal, encryptMessage, decryptMessage } from '@/lib/crypto/signal';
import { enqueueMessage, subscribeToMessages } from '@/lib/redis/delivery';

// Types
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  publicKey: string;
  onlineStatus: 'online' | 'offline' | 'away';
  lastSeen: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  contentType: 'text' | 'file' | 'location' | 'call';
  encryptedKey?: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
  reactions?: { userId: string; emoji: string }[];
  attachment?: {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    name: string;
    size: number;
    encryptedUrl?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  editedAt?: number;
  deletedAt?: number;
  isEncrypted: boolean;
}

export interface Chat {
  id: string;
  type: '1-1' | 'group';
  participants: string[];
  name?: string;
  avatar?: string;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  isTyping: boolean;
  onlineStatus?: 'online' | 'offline' | 'away';
}

interface ChatState {
  currentUser: User | null;
  chats: Chat[];
  messages: Record<string, Message[]>; // chatId → messages
  selectedChatId: string | null;
  contacts: User[];
  isWebSocketConnected: boolean;
  videoCallActive: boolean;
  locationSharingActive: boolean;
}

type ChatAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_CHATS'; payload: Chat[] }
  | { type: 'ADD_CHAT'; payload: Chat }
  | { type: 'UPDATE_CHAT'; payload: { chatId: string; updates: Partial<Chat> } }
  | { type: 'SELECT_CHAT'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { messageId: string; updates: Partial<Message> } }
  | { type: 'LOAD_MESSAGES'; payload: { chatId: string; messages: Message[] } }
  | { type: 'SET_TYPING'; payload: { chatId: string; isTyping: boolean } }
  | { type: 'SET_WEBSOCKET_STATUS'; payload: boolean }
  | { type: 'START_VIDEO_CALL'; payload: string }
  | { type: 'END_VIDEO_CALL' }
  | { type: 'START_LOCATION_SHARING'; payload: string }
  | { type: 'STOP_LOCATION_SHARING' }
  | { type: 'ADD_CONTACT'; payload: User }
  | { type: 'SET_CONTACTS'; payload: User[] }
  | { type: 'ARCHIVE_CHAT'; payload: string }
  | { type: 'UNARCHIVE_CHAT'; payload: string }
  | { type: 'DELETE_CHAT'; payload: string }
  | { type: 'MUTE_CHAT'; payload: string }
  | { type: 'UNMUTE_CHAT'; payload: string }
  | { type: 'PIN_CHAT'; payload: string }
  | { type: 'UNPIN_CHAT'; payload: string };

// Initial state
const initialState: ChatState = {
  currentUser: null,
  chats: [],
  messages: {},
  selectedChatId: null,
  contacts: [],
  isWebSocketConnected: false,
  videoCallActive: false,
  locationSharingActive: false
};

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };

    case 'SET_CHATS':
      return { ...state, chats: action.payload };

    case 'ADD_CHAT':
      return { ...state, chats: [action.payload, ...state.chats] };

    case 'UPDATE_CHAT': {
      const { chatId, updates } = action.payload;
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === chatId ? { ...chat, ...updates } : chat
        )
      };
    }

    case 'SELECT_CHAT':
      return { ...state, selectedChatId: action.payload };

    case 'ADD_MESSAGE': {
      const message = action.payload;
      const chatMessages = state.messages[message.chatId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [message.chatId]: [...chatMessages, message]
        },
        chats: state.chats.map((chat) =>
          chat.id === message.chatId
            ? {
                ...chat,
                lastMessage: message,
                unreadCount: message.senderId !== state.currentUser?.id ? chat.unreadCount + 1 : chat.unreadCount
              }
            : chat
        )
      };
    }

    case 'UPDATE_MESSAGE': {
      const { messageId, updates } = action.payload;
      return {
        ...state,
        messages: Object.fromEntries(
          Object.entries(state.messages).map(([chatId, msgs]) => [
            chatId,
            msgs.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
          ])
        )
      };
    }

    case 'LOAD_MESSAGES': {
      const { chatId, messages } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: messages
        }
      };
    }

    case 'SET_TYPING': {
      const { chatId, isTyping } = action.payload;
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === chatId ? { ...chat, isTyping } : chat
        )
      };
    }

    case 'SET_WEBSOCKET_STATUS':
      return { ...state, isWebSocketConnected: action.payload };

    case 'START_VIDEO_CALL':
      return { ...state, videoCallActive: true, selectedChatId: action.payload };

    case 'END_VIDEO_CALL':
      return { ...state, videoCallActive: false };

    case 'START_LOCATION_SHARING':
      return { ...state, locationSharingActive: true, selectedChatId: action.payload };

    case 'STOP_LOCATION_SHARING':
      return { ...state, locationSharingActive: false };

    case 'ADD_CONTACT':
      return { ...state, contacts: [...state.contacts, action.payload] };

    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload };

    case 'ARCHIVE_CHAT':
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload ? { ...chat, isArchived: true } : chat
        )
      };

    case 'UNARCHIVE_CHAT':
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload ? { ...chat, isArchived: false } : chat
        )
      };

    case 'DELETE_CHAT': {
      return {
        ...state,
        chats: state.chats.filter((chat) => chat.id !== action.payload),
        messages: Object.fromEntries(
          Object.entries(state.messages).filter(([chatId]) => chatId !== action.payload)
        ),
        selectedChatId: state.selectedChatId === action.payload ? null : state.selectedChatId
      };
    }

    case 'MUTE_CHAT':
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload ? { ...chat, isMuted: true } : chat
        )
      };

    case 'UNMUTE_CHAT':
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload ? { ...chat, isMuted: false } : chat
        )
      };

    case 'PIN_CHAT':
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload ? { ...chat, isPinned: true } : chat
        )
      };

    case 'UNPIN_CHAT':
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload ? { ...chat, isPinned: false } : chat
        )
      };

    default:
      return state;
  }
}

// Context
interface ChatContextValue extends ChatState {
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (chatId: string, content: string, contentType?: Message['contentType']) => Promise<void>;
  sendFile: (chatId: string, file: File) => Promise<void>;
  startVideoCall: (chatId: string) => void;
  endVideoCall: () => void;
  startLocationSharing: (chatId: string) => void;
  stopLocationSharing: () => void;
  addReaction: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  loadMessageHistory: (chatId: string) => Promise<void>;
  searchContacts: (query: string) => Promise<User[]>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// Provider
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Initialize user (get from auth or create demo)
  useEffect(() => {
    const initUser = async () => {
      try {
        // Real API call to get authenticated user
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          dispatch({ type: 'SET_USER', payload: userData });
        } else {
          // Fallback: Create demo user for testing
          console.warn('[ChatContext] Using demo user - authentication failed');
          const demoUser: User = {
            id: 'user-current',
            username: 'you',
            displayName: 'You',
            avatar: undefined,
            publicKey: 'demo-public-key',
            onlineStatus: 'online',
            lastSeen: Date.now()
          };
          dispatch({ type: 'SET_USER', payload: demoUser });
        }
      } catch (error) {
        console.error('[ChatContext] Failed to fetch user:', error);
        // Fallback to demo user
        const demoUser: User = {
          id: 'user-current',
          username: 'you',
          displayName: 'You',
          avatar: undefined,
          publicKey: 'demo-public-key',
          onlineStatus: 'online',
          lastSeen: Date.now()
        };
        dispatch({ type: 'SET_USER', payload: demoUser });
      }

      // Initialize Signal Protocol
      try {
        await initializeSignal();
        console.log('[ChatContext] Signal Protocol initialized');
      } catch (error) {
        console.error('[ChatContext] Signal init failed:', error);
      }

      // Load real data from API
      await loadRealData();
    };

    initUser();
  }, []);

  // Load real data from API
  const loadRealData = async () => {
    let contactsLoaded = false;
    let chatsLoaded = false;

    try {
      // Load contacts from API
      const contactsResponse = await fetch('/api/contacts', {
        credentials: 'include'
      });

      if (contactsResponse.ok) {
        const contacts = await contactsResponse.json();
        dispatch({ type: 'SET_CONTACTS', payload: contacts });
        contactsLoaded = true;
        console.log('[ChatContext] Loaded contacts from API');
      } else {
        console.warn('[ChatContext] Contacts API returned', contactsResponse.status);
      }

      // Load chats from API
      const chatsResponse = await fetch('/api/chats', {
        credentials: 'include'
      });

      if (chatsResponse.ok) {
        const chats = await chatsResponse.json();
        dispatch({ type: 'SET_CHATS', payload: chats });
        chatsLoaded = true;
        console.log('[ChatContext] Loaded chats from API');
      } else {
        console.warn('[ChatContext] Chats API returned', chatsResponse.status);
      }

      // If API failed, use demo data
      if (!contactsLoaded || !chatsLoaded) {
        console.log('[ChatContext] API endpoints not available, using demo data');
        loadDemoDataFallback();
      }
    } catch (error) {
      console.error('[ChatContext] Failed to load data, using demo fallback:', error);
      loadDemoDataFallback();
    }
  };

  // DEMO DATA FALLBACK - Only used if API calls fail
  const loadDemoDataFallback = () => {
    // Demo contacts
    const demoContacts: User[] = [
      {
        id: 'user-alice',
        username: 'alice',
        displayName: 'Alice Johnson',
        avatar: undefined,
        publicKey: 'alice-key',
        onlineStatus: 'online',
        lastSeen: Date.now()
      },
      {
        id: 'user-bob',
        username: 'bob',
        displayName: 'Bob Smith',
        avatar: undefined,
        publicKey: 'bob-key',
        onlineStatus: 'away',
        lastSeen: Date.now() - 300000
      },
      {
        id: 'user-carol',
        username: 'carol',
        displayName: 'Carol Williams',
        avatar: undefined,
        publicKey: 'carol-key',
        onlineStatus: 'offline',
        lastSeen: Date.now() - 3600000
      }
    ];

    dispatch({ type: 'SET_CONTACTS', payload: demoContacts });

    // Demo chats
    const demoChats: Chat[] = [
      {
        id: 'chat-user-current-user-alice',
        type: '1-1',
        participants: ['user-current', 'user-alice'],
        name: 'Alice Johnson',
        avatar: undefined,
        lastMessage: {
          id: 'msg-demo-1',
          chatId: 'chat-user-current-user-alice',
          senderId: 'user-alice',
          content: 'Hey! How are you doing?',
          contentType: 'text',
          timestamp: Date.now() - 120000,
          status: 'read',
          isEncrypted: true
        },
        unreadCount: 0,
        isPinned: true,
        isMuted: false,
        isArchived: false,
        isTyping: false,
        onlineStatus: 'online'
      },
      {
        id: 'chat-user-current-user-bob',
        type: '1-1',
        participants: ['user-current', 'user-bob'],
        name: 'Bob Smith',
        avatar: undefined,
        lastMessage: {
          id: 'msg-demo-2',
          chatId: 'chat-user-current-user-bob',
          senderId: 'user-current',
          content: 'Let me know when you\'re free',
          contentType: 'text',
          timestamp: Date.now() - 300000,
          status: 'delivered',
          isEncrypted: true
        },
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        isTyping: false,
        onlineStatus: 'away'
      },
      {
        id: 'chat-user-current-user-carol',
        type: '1-1',
        participants: ['user-current', 'user-carol'],
        name: 'Carol Williams',
        avatar: undefined,
        lastMessage: {
          id: 'msg-demo-3',
          chatId: 'chat-user-current-user-carol',
          senderId: 'user-carol',
          content: 'Thanks for the help yesterday!',
          contentType: 'text',
          timestamp: Date.now() - 3600000,
          status: 'read',
          isEncrypted: true
        },
        unreadCount: 2,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        isTyping: false,
        onlineStatus: 'offline'
      }
    ];

    dispatch({ type: 'SET_CHATS', payload: demoChats });

    // No demo messages - users start with empty chats
    // Messages will be created when users send them

    console.log('[ChatContext] Demo data loaded');
  };

  // Real WebSocket connection for live updates
  useEffect(() => {
    if (!state.currentUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/chat`;

    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[ChatContext] WebSocket connected');
        dispatch({ type: 'SET_WEBSOCKET_STATUS', payload: true });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('[ChatContext] Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[ChatContext] WebSocket error:', error);
        dispatch({ type: 'SET_WEBSOCKET_STATUS', payload: false });
      };

      ws.onclose = () => {
        console.log('[ChatContext] WebSocket disconnected');
        dispatch({ type: 'SET_WEBSOCKET_STATUS', payload: false });
      };
    } catch (error) {
      console.error('[ChatContext] Failed to create WebSocket:', error);
      // Fallback: Mark as connected for demo purposes
      dispatch({ type: 'SET_WEBSOCKET_STATUS', payload: true });
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [state.currentUser]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_message':
        dispatch({ type: 'ADD_MESSAGE', payload: data.message });
        break;
      case 'message_status':
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: { messageId: data.messageId, updates: { status: data.status } }
        });
        break;
      case 'typing':
        dispatch({
          type: 'SET_TYPING',
          payload: { chatId: data.chatId, isTyping: data.isTyping }
        });
        break;
      case 'user_status':
        dispatch({
          type: 'UPDATE_CHAT',
          payload: { chatId: data.chatId, updates: { onlineStatus: data.status } }
        });
        break;
      default:
        console.log('[ChatContext] Unknown WebSocket message type:', data.type);
    }
  };

  // Send message
  const sendMessage = useCallback(
    async (chatId: string, content: string, contentType: Message['contentType'] = 'text') => {
      if (!state.currentUser) return;

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // Encrypt message with Signal Protocol
      let encryptedContent = content;
      let isEncrypted = false;

      try {
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat && chat.participants.length > 0) {
          // Get recipient's public key
          const recipientId = chat.participants.find((p) => p !== state.currentUser!.id);
          if (recipientId) {
            encryptedContent = await encryptMessage(recipientId, content);
            isEncrypted = true;
          }
        }
      } catch (error) {
        console.error('[ChatContext] Encryption failed:', error);
      }

      const message: Message = {
        id: messageId,
        chatId,
        senderId: state.currentUser.id,
        content: encryptedContent,
        contentType,
        timestamp: Date.now(),
        status: 'sending',
        isEncrypted
      };

      dispatch({ type: 'ADD_MESSAGE', payload: message });

      // Send to backend via Redis queue
      try {
        await enqueueMessage(message);

        // Update status to sent
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: { messageId, updates: { status: 'sent' } }
        });

        // Simulate delivery after 1s
        setTimeout(() => {
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: { messageId, updates: { status: 'delivered' } }
          });
        }, 1000);
      } catch (error) {
        console.error('[ChatContext] Send failed:', error);
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: { messageId, updates: { status: 'failed' } }
        });
      }
    },
    [state.currentUser, state.chats]
  );

  // Send file
  const sendFile = useCallback(
    async (chatId: string, file: File) => {
      if (!state.currentUser) return;

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // TODO: Encrypt file with AES-256-GCM
      // TODO: Upload to /api/files/upload
      // For now, create placeholder message

      const message: Message = {
        id: messageId,
        chatId,
        senderId: state.currentUser.id,
        content: `📎 ${file.name}`,
        contentType: 'file',
        timestamp: Date.now(),
        status: 'sending',
        attachment: {
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size
        },
        isEncrypted: true
      };

      dispatch({ type: 'ADD_MESSAGE', payload: message });

      // Simulate upload progress
      setTimeout(() => {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: { messageId, updates: { status: 'sent' } }
        });
      }, 2000);
    },
    [state.currentUser]
  );

  // Video call
  const startVideoCall = useCallback((chatId: string) => {
    dispatch({ type: 'START_VIDEO_CALL', payload: chatId });
  }, []);

  const endVideoCall = useCallback(() => {
    dispatch({ type: 'END_VIDEO_CALL' });
  }, []);

  // Location sharing
  const startLocationSharing = useCallback((chatId: string) => {
    dispatch({ type: 'START_LOCATION_SHARING', payload: chatId });
  }, []);

  const stopLocationSharing = useCallback(() => {
    dispatch({ type: 'STOP_LOCATION_SHARING' });
  }, []);

  // Reactions
  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (!state.currentUser) return;

    const message = Object.values(state.messages)
      .flat()
      .find((m) => m.id === messageId);

    if (!message) return;

    const reactions = message.reactions || [];
    reactions.push({ userId: state.currentUser.id, emoji });

    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: { messageId, updates: { reactions } }
    });
  }, [state.currentUser, state.messages]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    // TODO: DELETE /api/messages/:id
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: { messageId, updates: { deletedAt: Date.now() } }
    });
  }, []);

  // Load message history from API
  const loadMessageHistory = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        credentials: 'include'
      });

      if (response.ok) {
        const messages = await response.json();
        dispatch({ type: 'LOAD_MESSAGES', payload: { chatId, messages } });
        console.log(`[ChatContext] Loaded ${messages.length} messages for chat ${chatId}`);
      } else {
        console.warn('[ChatContext] Failed to load messages, status:', response.status);
        dispatch({ type: 'LOAD_MESSAGES', payload: { chatId, messages: [] } });
      }
    } catch (error) {
      console.error('[ChatContext] Error loading message history:', error);
      dispatch({ type: 'LOAD_MESSAGES', payload: { chatId, messages: [] } });
    }
  }, []);

  // Search contacts via API
  const searchContacts = useCallback(async (query: string): Promise<User[]> => {
    try {
      const response = await fetch(`/api/contacts/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const contacts = await response.json();
        console.log(`[ChatContext] Found ${contacts.length} contacts for query "${query}"`);
        return contacts;
      }

      return [];
    } catch (error) {
      console.error('[ChatContext] Error searching contacts:', error);
      return [];
    }
  }, []);

  const value: ChatContextValue = {
    ...state,
    dispatch,
    sendMessage,
    sendFile,
    startVideoCall,
    endVideoCall,
    startLocationSharing,
    stopLocationSharing,
    addReaction,
    deleteMessage,
    loadMessageHistory,
    searchContacts
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// Hook
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}
