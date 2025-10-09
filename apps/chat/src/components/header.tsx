'use client';

import { Moon, Sun, Menu, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useChatStore } from '@/store/chat-store';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar, createConversation } = useChatStore();

  const handleNewChat = () => {
    createConversation();
  };

  return (
    <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-lg font-semibold">Lydian Chat</h1>
      </div>

      {/* Right: New Chat + Theme Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Sohbet</span>
        </button>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
}
