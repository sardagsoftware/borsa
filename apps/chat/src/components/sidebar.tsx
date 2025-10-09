'use client';

import { MessageSquare, Trash2, X } from 'lucide-react';
import { useChatStore } from '@/store/chat-store';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import clsx from 'clsx';

export function Sidebar() {
  const {
    conversations,
    currentConversationId,
    isSidebarOpen,
    setCurrentConversation,
    deleteConversation,
    toggleSidebar,
  } = useChatStore();

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <aside className="fixed lg:relative w-64 h-full bg-card border-r border-border z-50 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-border px-4 flex items-center justify-between">
          <h2 className="font-semibold">Sohbetler</h2>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 hover:bg-accent rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              Henüz sohbet yok
              <br />
              Yeni bir sohbet başlatın
            </div>
          ) : (
            conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === currentConversationId}
                onSelect={() => setCurrentConversation(conversation.id)}
                onDelete={() => deleteConversation(conversation.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="h-14 border-t border-border px-4 flex items-center text-xs text-muted-foreground">
          <span>Lydian Chat v1.0</span>
        </div>
      </aside>
    </>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: any;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={clsx(
        'group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
        isActive
          ? 'bg-accent'
          : 'hover:bg-accent/50'
      )}
      onClick={onSelect}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{conversation.title}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(conversation.updatedAt), 'dd MMM', { locale: tr })}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
        aria-label="Sohbeti sil"
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </button>
    </div>
  );
}
