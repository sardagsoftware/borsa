'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Logo } from './ui/Logo';
import { useLanguage } from '@/contexts/LanguageContext';

// Simplified premium menu structure
const menuGroups = {
  ai: {
    label: 'AI Botlar',
    items: [
      { href: '/ai-control-center', label: 'AI Kontrol Merkezi' },
      { href: '/ai-chat', label: 'AI Asistan' },
      { href: '/quantum-pro', label: 'Quantum Pro' },
      { href: '/bot-management', label: 'Bot Yönetimi' },
      { href: '/ai-testing', label: 'AI Model Test' },
      { href: '/signals', label: 'Sinyaller' },
    ]
  },
  analytics: {
    label: 'Analiz',
    items: [
      { href: '/backtesting', label: 'Backtest' },
      { href: '/risk-management', label: 'Risk Yönetimi' },
      { href: '/market-analysis', label: 'Piyasa Analizi' },
    ]
  },
  settings: { href: '/settings', label: 'Ayarlar' }
};

export default function Navigation() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { t } = useLanguage();

  // Hide navigation on login page (/)
  if (pathname === '/') {
    return null;
  }

  // Helper function to check if current path is in dropdown
  const isDropdownActive = (items: any[]) => {
    return items.some(item => pathname === item.href);
  };

  // Modern dropdown with premium icons
  const DropdownMenu = ({ group, label }: { group: string, label: string }) => {
    const items = (menuGroups as any)[group].items;
    const isActive = isDropdownActive(items);
    const isOpen = openDropdown === group;

    // Premium SVG icons
    const getIcon = () => {
      if (group === 'ai') {
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      }
      if (group === 'analytics') {
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      }
      return null;
    };

    return (
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : group)}
          className={`
            px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
            ${isActive
              ? 'glass text-primary border border-primary/30 shadow-glow-primary'
              : 'text-white/70 hover:glass hover:text-white hover:border-white/20'
            }
          `}
        >
          {getIcon()}
          <span>{label}</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-56 glass-dark border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in slide-in-from-top-2 duration-200">
            {items.map((item: any) => {
              const isItemActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenDropdown(null)}
                  className={`
                    block px-4 py-2.5 text-sm transition-all font-medium rounded-lg mx-2
                    ${isItemActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="glass-dark border-b border-white/10 sticky top-0 z-[55]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-white">LyDian Trader</span>
          </Link>

          {/* Main Navigation Links - Centered */}
          <div className="hidden md:flex items-center space-x-2 mx-auto">
            {/* AI Botlar */}
            <DropdownMenu group="ai" label={menuGroups.ai.label} />

            {/* Analiz */}
            <DropdownMenu group="analytics" label={menuGroups.analytics.label} />

            {/* Ayarlar */}
            <Link
              href={menuGroups.settings.href}
              className={`
                px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
                ${pathname === menuGroups.settings.href
                  ? 'glass text-primary border border-primary/30 shadow-glow-primary'
                  : 'text-white/70 hover:glass hover:text-white hover:border-white/20'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{menuGroups.settings.label}</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation - Scrollable */}
        <div className="md:hidden pb-3 flex overflow-x-auto space-x-2 scrollbar-hide">
          {/* AI Group */}
          {menuGroups.ai.items.map((item: any) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                  ${isActive
                    ? 'glass text-primary border border-primary/30'
                    : 'text-white/70 glass-dark'
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Analytics Group */}
          {menuGroups.analytics.items.map((item: any) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                  ${isActive
                    ? 'glass text-primary border border-primary/30'
                    : 'text-white/70 glass-dark'
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Settings */}
          <Link
            href={menuGroups.settings.href}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
              ${pathname === menuGroups.settings.href
                ? 'glass text-primary border border-primary/30'
                : 'text-white/70 glass-dark'
              }
            `}
          >
            {menuGroups.settings.label}
          </Link>
        </div>

      </div>
    </nav>
  );
}