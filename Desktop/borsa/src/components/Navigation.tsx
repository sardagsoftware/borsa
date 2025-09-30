'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Home,
  LayoutDashboard,
  TrendingUp,
  Bitcoin,
  LineChart,
  Briefcase,
  Eye,
  Bot,
  Brain,
  Settings as SettingsIcon,
  ChevronDown,
  LogOut,
  Activity,
  BarChart3,
  Shield,
  Radio,
  Zap
} from 'lucide-react';

interface NavItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { href: '/', label: 'Ana Sayfa', icon: <Home size={18} /> },
  {
    label: 'Piyasalar',
    icon: <TrendingUp size={18} />,
    children: [
      { href: '/crypto', label: 'Kripto', icon: <Bitcoin size={16} /> },
      { href: '/stocks', label: 'Hisse Senetleri', icon: <LineChart size={16} /> },
      { href: '/portfolio', label: 'Portföy', icon: <Briefcase size={16} /> },
      { href: '/watchlist', label: 'İzleme Listesi', icon: <Eye size={16} /> },
    ]
  },
  {
    label: 'AI Trading',
    icon: <Bot size={18} />,
    children: [
      { href: '/nirvana', label: '🧠 Nirvana TF Bot', icon: <Zap size={16} /> },
      { href: '/quantum-pro', label: 'Quantum Pro', icon: <Brain size={16} /> },
      { href: '/ai-trading', label: 'AI Trading Hub', icon: <Bot size={16} /> },
      { href: '/bot-management', label: 'Bot Yönetimi', icon: <SettingsIcon size={16} /> },
    ]
  },
  {
    label: 'Analiz',
    icon: <BarChart3 size={18} />,
    children: [
      { href: '/market-analysis', label: 'Piyasa Analizi', icon: <Activity size={16} /> },
      { href: '/backtesting', label: 'Backtesting', icon: <BarChart3 size={16} /> },
      { href: '/risk-management', label: 'Risk Yönetimi', icon: <Shield size={16} /> },
      { href: '/signals', label: 'Sinyaller', icon: <Radio size={16} /> },
    ]
  },
  { href: '/settings', label: 'Ayarlar', icon: <SettingsIcon size={18} /> },
];

interface CoinTicker {
  symbol: string;
  price: number;
  change24h: number;
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [topCoins, setTopCoins] = useState<CoinTicker[]>([]);

  useEffect(() => {
    // Fetch top 50 coins
    const fetchCoins = async () => {
      try {
        const response = await fetch('/api/market/coinmarketcap');
        const result = await response.json();
        if (result.success) {
          setTopCoins(result.data.slice(0, 50).map((coin: any) => ({
            symbol: coin.symbol,
            price: coin.currentPrice,
            change24h: coin.priceChange24h
          })));
        }
      } catch (error) {
        console.error('Ticker fetch error:', error);
      }
    };

    fetchCoins();
    const interval = setInterval(fetchCoins, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    // Clear auth cookie
    document.cookie = 'lydian-auth=; path=/; max-age=0';
    router.push('/login');
  };

  const isActive = (href: string) => pathname === href;

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <nav className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
      {/* Top 50 Coin Ticker */}
      {topCoins.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900/30 border-b border-slate-700/50 overflow-hidden py-2">
          <div className="flex animate-marquee whitespace-nowrap items-center">
            {/* Double the array for seamless loop */}
            {[...topCoins, ...topCoins].map((coin, index) => (
              <div
                key={`${coin.symbol}-${index}`}
                className="inline-flex items-center gap-2 px-5 text-sm"
              >
                <span className="font-bold text-slate-200">{coin.symbol}</span>
                <span className="text-white font-mono">${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                <span className={`font-semibold ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {coin.change24h >= 0 ? '↑' : '↓'} {Math.abs(coin.change24h).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo Text */}
          <Link href="/" className="flex items-baseline gap-3 mr-8">
            <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              LyDian
            </span>
            <span className="text-lg md:text-xl text-slate-400 font-semibold tracking-wider">
              Trader
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              if (item.children) {
                // Dropdown menu
                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all text-slate-300 hover:bg-slate-800/50 hover:text-white flex items-center gap-2"
                    >
                      {item.icon}
                      {item.label}
                      <ChevronDown size={14} className={`transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                    </button>

                    {openDropdown === item.label && (
                      <div
                        onMouseLeave={() => setOpenDropdown(null)}
                        className="absolute top-full left-0 mt-1 w-56 bg-slate-800/95 backdrop-blur-xl rounded-lg border border-slate-700/50 shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href || '#'}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              isActive(child.href || '')
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                            }`}
                          >
                            {child.icon}
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Regular link
                return (
                  <Link
                    key={item.href}
                    href={item.href || '#'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.href || '')
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              }
            })}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 transition-all text-sm"
          >
            <LogOut size={16} />
            Çıkış
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 flex overflow-x-auto space-x-2 scrollbar-hide">
          {navItems.map((item) => {
            if (item.children) {
              return item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href || '#'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive(child.href || '')
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 bg-slate-800/50'
                  }`}
                >
                  {child.icon}
                  {child.label}
                </Link>
              ));
            } else {
              return (
                <Link
                  key={item.href}
                  href={item.href || '#'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive(item.href || '')
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            }
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-red-500/20 text-red-400 border border-red-500/30"
          >
            <LogOut size={14} />
            Çıkış
          </button>
        </div>
      </div>
    </nav>
  );
}