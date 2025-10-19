'use client';

// Locale-aware layout with Header, Footer, Orbital BG, Health Monitoring

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SubBar from '@/components/ui/SubBar';
import OrbitalBackground from '@/components/background/OrbitalBackground';
import type { HealthSnapshot } from '@/types/health';
import { HealthRingBuffer, fetchHealthData } from '@/lib/health';
import type { Locale } from '@/lib/i18n';

async function getMenu(lang: Locale) {
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/menu?lang=${lang}`,
      { next: { revalidate: 300 } }
    );
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const locale = (params?.locale as Locale) || 'tr';

  const [healthSnapshot, setHealthSnapshot] = useState<HealthSnapshot | null>(
    null
  );
  const [initialMenu, setInitialMenu] = useState(null);

  // Fetch health data
  useEffect(() => {
    const ringBuffer = HealthRingBuffer.getInstance();

    const fetchHealth = async () => {
      try {
        const snapshot = await fetchHealthData('http://localhost:3100');
        setHealthSnapshot(snapshot);
        ringBuffer.addSnapshot(snapshot);
      } catch (error) {
        console.error('Failed to fetch health data:', error);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch menu
  useEffect(() => {
    getMenu(locale).then(setInitialMenu);
  }, [locale]);

  return (
    <AuthProvider>
      {/* Orbital Background */}
      <OrbitalBackground
        particleCount={120}
        orbitRadius={250}
        particleSize={2.5}
        speed={0.0008}
      />

      <div className="relative flex min-h-screen flex-col">
        {/* Header with health status & i18n */}
        <Header healthSnapshot={healthSnapshot} initialMenu={initialMenu} />

        {/* SubBar with breadcrumbs & search */}
        <SubBar />

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer with health status */}
        <Footer healthSnapshot={healthSnapshot} />
      </div>
    </AuthProvider>
  );
}
