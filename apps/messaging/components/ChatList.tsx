/**
 * SHARD_7.1 - Chat List Component
 * WhatsApp-style conversation list
 */

import React from 'react';

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  isOnline: boolean;
  isTyping: boolean;
  isPinned: boolean;
  isMuted: boolean;
  isGroup: boolean;
}

interface ChatListProps {
  chats: Chat[];
  selectedChatId?: string;
  onChatSelect: (chatId: string) => void;
  onSearch?: (query: string) => void;
}

export default function ChatList({ chats, selectedChatId, onChatSelect, onSearch }: ChatListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredChats = React.useMemo(() => {
    if (!searchQuery) return chats;
    return chats.filter(chat =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className="flex flex-col h-full bg-[#111827]">
      {/* Header */}
      <div className="p-4 border-b border-[#374151]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Sohbetler</h2>
          <button className="p-2 hover:bg-[#1F2937] rounded-lg transition-colors">
            ✏️
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Ara..."
            className="w-full px-4 py-2 pl-10 rounded-lg bg-[#0B0F19] border border-[#374151] focus:border-[#10A37F] focus:outline-none transition-colors text-sm"
          />
          <span className="absolute left-3 top-2.5 text-[#6B7280]">🔍</span>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#6B7280]">
            <div className="text-6xl mb-4">💬</div>
            <div>Henüz sohbet yok</div>
          </div>
        ) : (
          filteredChats.map(chat => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={chat.id === selectedChatId}
              onClick={() => onChatSelect(chat.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

function ChatListItem({ chat, isSelected, onClick }: ChatListItemProps) {
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Şimdi';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}dk`;
    if (diff < 86400000) return new Date(timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return new Date(timestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-4 hover:bg-[#1F2937] cursor-pointer transition-colors ${
        isSelected ? 'bg-[#1F2937]' : ''
      } ${chat.isPinned ? 'bg-[#1F2937]/50' : ''}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10A37F] to-[#0D8F6E] flex items-center justify-center text-xl font-semibold">
          {chat.avatar || chat.name.charAt(0).toUpperCase()}
        </div>
        {chat.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10A37F] border-2 border-[#111827] rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{chat.name}</h3>
            {chat.isGroup && <span className="text-xs">👥</span>}
            {chat.isMuted && <span className="text-xs">🔇</span>}
          </div>
          <span className="text-xs text-[#6B7280]">{formatTime(chat.timestamp)}</span>
        </div>

        <div className="flex items-center justify-between">
          <p className={`text-sm truncate ${
            chat.isTyping
              ? 'text-[#10A37F] italic'
              : chat.unreadCount > 0
              ? 'text-[#E5E7EB] font-medium'
              : 'text-[#6B7280]'
          }`}>
            {chat.isTyping ? '⌨️ yazıyor...' : chat.lastMessage}
          </p>

          {chat.unreadCount > 0 && (
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#10A37F] flex items-center justify-center text-xs font-bold">
              {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
            </div>
          )}
        </div>
      </div>

      {chat.isPinned && (
        <div className="text-[#6B7280] text-sm">📌</div>
      )}
    </div>
  );
}
