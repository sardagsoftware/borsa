'use client';

// Ask Page - RAG Q&A Interface

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n';

export default function AskPage() {
  const params = useParams();
  const locale = (params?.locale as Locale) || 'tr';

  const [q, setQ] = useState('');
  const [resp, setResp] = useState<{
    answer: string;
    sources: { title: string; href: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const [t, setT] = useState<any>(null);

  useEffect(() => {
    import(`@/../public/data/i18n/${locale}.json`).then(m => setT(m.default));
  }, [locale]);

  const ask = async () => {
    if (!q.trim()) return;

    setLoading(true);
    try {
      const r = await fetch(
        `/api/answer?lang=${locale}&q=` + encodeURIComponent(q)
      );
      const j = await r.json();
      setResp(j);
    } catch (error) {
      console.error('Failed to fetch answer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!t) return null;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-24">
      {/* Title */}
      <h1 className="text-3xl font-extrabold mb-4">{t.ask.title}</h1>
      <p className="text-[var(--txt-2)] mb-6">
        {locale === 'tr'
          ? 'RAG sistemi ile bilgi tabanımızdan kaynaklı cevaplar alın.'
          : 'Get grounded answers from our knowledge base with RAG system.'}
      </p>

      {/* Search Box */}
      <div className="flex gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder={t.ask.placeholder}
          className="w-full rounded-xl px-3 py-2 bg-[#0f131b] border border-[var(--stroke)] outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
        />
        <button className="cta" onClick={ask} disabled={loading}>
          {loading ? '...' : t.ask.answer}
        </button>
      </div>

      {/* Answer */}
      {resp && (
        <div
          className="mt-6 rounded-2xl p-4 border"
          style={{
            borderColor: 'var(--stroke)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))',
          }}
        >
          <div className="font-semibold mb-2">{t.ask.answer}</div>
          <p className="text-[var(--txt-2)]">{resp.answer}</p>

          {resp.sources?.length > 0 && (
            <div className="mt-3 text-sm">
              <div className="opacity-70 mb-1">{t.ask.sources}</div>
              <ul className="list-disc pl-5">
                {resp.sources.map(s => (
                  <li key={s.href}>
                    <a className="hover:underline text-[var(--accent-2)]" href={s.href}>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Example Questions */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">
          {locale === 'tr' ? 'Örnek Sorular' : 'Example Questions'}
        </h2>
        <div className="grid gap-2">
          {(locale === 'tr'
            ? ['RAG nedir?', 'Ailydian nedir?', 'Fiyatlandırma nasıl?']
            : ['What is RAG?', 'What is Ailydian?', 'How is pricing?']
          ).map(example => (
            <button
              key={example}
              onClick={() => setQ(example)}
              className="text-left px-4 py-2 rounded-lg bg-[rgba(255,255,255,.06)] hover:bg-[rgba(255,255,255,.10)] transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
