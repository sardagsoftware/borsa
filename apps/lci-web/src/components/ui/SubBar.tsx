'use client';

// 📍 SUBBAR - Context bar with breadcrumbs and live search

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getLocaleFromPath } from '@/lib/i18n';

export default function SubBar() {
  const pathname = usePathname();
  const router = useRouter();
  const lang = getLocaleFromPath(pathname);

  // Load i18n messages
  const [t, setT] = useState<any>(null);
  useEffect(() => {
    import(`@/../public/data/i18n/${lang}.json`).then(m => setT(m.default));
  }, [lang]);

  // Breadcrumbs
  const crumbs = useMemo(
    () => pathname.split('/').filter(Boolean).slice(1),
    [pathname]
  );

  // Search state
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<any[]>([]);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => {
      if (!q) {
        setHits([]);
        return;
      }
      fetch(`/api/search?lang=${lang}&q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(setHits)
        .catch(() => setHits([]));
    }, 140);
    return () => clearTimeout(id);
  }, [q, lang]);

  // Keyboard shortcut (⌘K)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        (document.getElementById('search-input') as HTMLInputElement)?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Click outside to close
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setHits([]);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!t) return null;

  return (
    <div className="subbar">
      <div className="mx-auto max-w-[1200px] px-4 py-3 flex items-center gap-3">
        {/* Breadcrumbs */}
        <nav className="text-sm text-[var(--txt-2)]">
          <a href={`/${lang}`} className="hover:underline">
            {t.subbar.home}
          </a>
          {crumbs.map((c, i) => (
            <span key={i}>
              {' '}
              <span className="opacity-60">/</span>{' '}
              <a
                className="hover:underline"
                href={`/${lang}/` + crumbs.slice(0, i + 1).join('/')}
              >
                {decodeURIComponent(c)}
              </a>
            </span>
          ))}
        </nav>

        {/* Search Box */}
        <div ref={boxRef} className="relative ml-auto w-full max-w-md">
          <input
            id="search-input"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t.subbar.placeholder}
            className="w-full rounded-xl px-3 py-2 bg-[#0f131b] border border-[var(--stroke)] outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
          />

          {/* Search Results Dropdown */}
          {hits.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 rounded-xl border border-[var(--stroke)] bg-[#0f131b] shadow-2xl overflow-hidden z-50">
              {hits.map((h: any) => (
                <button
                  key={h.href}
                  onClick={() => {
                    router.push(h.href);
                    setHits([]);
                    setQ('');
                  }}
                  className="text-left w-full px-3 py-2 hover:bg-[rgba(255,255,255,.06)] transition-colors"
                >
                  <div className="font-semibold">{h.title}</div>
                  <div className="text-sm text-[var(--txt-2)]">{h.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
