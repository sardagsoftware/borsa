'use client';

// 🎨 AWARD-LEVEL HEADER - i18n Glassmorphism with SSR mega menu
// Features: Smart hide-on-scroll, health status, locale switching, dynamic menu

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useSWR from 'swr';
import StatusDot from '@/components/status/StatusDot';
import { getLocaleFromPath, getLocalizedPath } from '@/lib/i18n';
import type { HealthSnapshot, HealthStatus } from '@/types/health';

interface HeaderProps {
  healthSnapshot?: HealthSnapshot | null;
  initialMenu?: any;
}

type DropKey = 'products' | 'solutions' | 'developers' | 'company';
type MenuItem = { title: string; desc: string; href: string };
type Menu = Record<DropKey, MenuItem[]>;

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Header({ healthSnapshot, initialMenu }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = getLocaleFromPath(pathname);

  // Load i18n messages
  const [t, setT] = useState<any>(null);
  useEffect(() => {
    import(`@/../public/data/i18n/${lang}.json`).then(m => setT(m.default));
  }, [lang]);

  // Fetch menu data with SWR
  const { data: menu } = useSWR<Menu>(
    `/api/menu?lang=${lang}`,
    fetcher,
    {
      fallbackData: initialMenu,
      revalidateOnFocus: false,
    }
  );

  const [open, setOpen] = useState<DropKey | null>(null);
  const [hide, setHide] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Smart hide-on-scroll
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastScrollY) > 6) {
        setHide(y > lastScrollY && y > 60);
        setLastScrollY(y);
      }
      setIsScrolled(y > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Calculate overall health status
  const getOverallStatus = (): HealthStatus => {
    if (!healthSnapshot) return 'warn';
    const downCount = healthSnapshot.items.filter(i => i.status === 'down').length;
    const warnCount = healthSnapshot.items.filter(i => i.status === 'warn').length;
    if (downCount > 0) return 'down';
    if (warnCount > 0) return 'warn';
    return 'up';
  };

  const overallStatus = getOverallStatus();

  // Locale switcher
  const switchLocale = () => {
    const newLang = lang === 'tr' ? 'en' : 'tr';
    const newPath = getLocalizedPath(pathname, newLang);
    router.push(newPath);
  };

  if (!t) return null; // Wait for i18n to load

  const NavButton = ({ id, label }: { id: DropKey; label: string }) => (
    <button
      className="nav-link"
      aria-expanded={open === id}
      onMouseEnter={() => setOpen(id)}
      onFocus={() => setOpen(id)}
      onClick={() => setOpen(open === id ? null : id)}
    >
      {label}
    </button>
  );

  const MegaSection = ({ items }: { items: MenuItem[] }) => (
    <div className="mega-col">
      {items.map(item => (
        <a
          key={item.href}
          href={item.href}
          className="mega-item"
          onClick={() => setOpen(null)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="url(#g1)" strokeWidth="2" />
            <defs>
              <linearGradient id="g1">
                <stop stopColor="#00E0AE" />
                <stop offset="1" stopColor="#6E84FF" />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <div className="font-semibold">{item.title}</div>
            <div className="text-sm opacity-80">{item.desc}</div>
          </div>
        </a>
      ))}
    </div>
  );

  return (
    <header className="header-2025" data-hide={hide} data-scrolled={isScrolled}>
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="flex items-center justify-between h-[64px]">
          {/* Logo */}
          <a className="brand" href={`/${lang}`}>
            {t.brand}
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavButton id="products" label={t.nav.products} />
            <NavButton id="solutions" label={t.nav.solutions} />
            <NavButton id="developers" label={t.nav.developers} />
            <NavButton id="company" label={t.nav.company} />
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* System Health */}
            <a
              href={`/${lang}/status`}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="System Status"
            >
              <StatusDot status={overallStatus} size="sm" />
            </a>

            {/* Search */}
            <button
              className="nav-link hidden sm:block"
              onClick={() => document.getElementById('search-input')?.focus()}
            >
              {t.nav.search} <kbd className="ml-2 text-xs">⌘K</kbd>
            </button>

            {/* Login */}
            <a className="nav-link" href={`/${lang}/login`}>
              {t.nav.login}
            </a>

            {/* CTA */}
            <a className="cta" href={`/${lang}/signup`}>
              {t.nav.try}
            </a>

            {/* Locale Switcher */}
            <button
              onClick={switchLocale}
              className="nav-link"
              aria-label="Switch language"
            >
              {lang === 'tr' ? 'EN' : 'TR'}
            </button>
          </div>
        </div>
      </div>

      {/* Mega Menu */}
      {open && menu && (
        <div onMouseLeave={() => setOpen(null)} className="relative">
          <div className="mega">
            <div className="mega-grid">
              <MegaSection items={menu[open]} />
              <MegaSection
                items={
                  open === 'products'
                    ? menu.solutions
                    : open === 'solutions'
                    ? menu.products
                    : menu.developers
                }
              />
              <MegaSection items={menu.company} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
