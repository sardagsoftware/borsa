'use client';

// Home Page - i18n aware with dynamic content

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n';

export default function HomePage() {
  const params = useParams();
  const locale = (params?.locale as Locale) || 'tr';

  const [t, setT] = useState<any>(null);

  useEffect(() => {
    import(`@/../public/data/i18n/${locale}.json`).then(m => setT(m.default));
  }, [locale]);

  if (!t) return null;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-24">
      {/* Hero */}
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
        {t.hero.titleLeft}{' '}
        <span
          style={{
            color: 'var(--accent-1)',
            textShadow: '0 0 28px rgba(0,224,174,.35)',
          }}
        >
          {t.hero.titleRight}
        </span>
      </h1>
      <p className="mt-4 text-lg text-[var(--txt-2)] max-w-2xl">
        {t.hero.subtitle}
      </p>

      {/* CTAs */}
      <div className="mt-8 flex gap-3">
        <a className="cta" href={`/${locale}/signup`}>
          {locale === 'tr' ? 'Şimdi Dene' : 'Try Now'}
        </a>
        <a className="nav-link" href={`/${locale}/docs`}>
          Docs
        </a>
        <a className="nav-link" href={`/${locale}/ask`}>
          {locale === 'tr' ? 'Hızlı Soru' : 'Quick Ask'}
        </a>
      </div>

      {/* Features */}
      <section className="mt-24 grid md:grid-cols-3 gap-6">
        {[
          locale === 'tr'
            ? 'Hız / Speed'
            : 'Speed',
          locale === 'tr' ? 'Güvenlik / Security' : 'Security',
          locale === 'tr' ? 'Gözlemlenebilirlik / Observability' : 'Observability',
        ].map(title => (
          <div
            key={title}
            className="rounded-2xl p-5 border"
            style={{
              borderColor: 'var(--stroke)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))',
            }}
          >
            <div className="text-sm uppercase tracking-wider text-[var(--txt-2)] mb-2">
              Feature
            </div>
            <div className="text-2xl font-bold">{title}</div>
            <p className="mt-2 text-[var(--txt-2)]">
              {locale === 'tr'
                ? 'Enterprise-grade latency, guardrails, metrics — unified.'
                : 'Enterprise-grade latency, guardrails, metrics — unified.'}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
