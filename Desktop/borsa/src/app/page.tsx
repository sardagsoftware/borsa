'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import GlobalMap from '@/components/GlobalMap';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SOCMonitor from '@/components/SOCMonitor';
import { useLanguage } from '@/contexts/LanguageContext';

interface GeoData {
  ip: string;
  location: {
    city: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  device: {
    type: string;
    os: string;
    browser: string;
    brand: string;
  };
  isp: string;
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    fetchGeolocation();
  }, []);

  const fetchGeolocation = async () => {
    try {
      const response = await fetch('/api/geolocation');
      const result = await response.json();

      if (result.success) {
        setGeoData(result.data);
      }
    } catch (error) {
      console.error('Geolocation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Login logic here
    window.location.href = '/quantum-pro';
  };

  return (
    <main className="min-h-screen bg-gradient-dark flex items-center justify-center relative overflow-hidden">
      {/* Full Width Background Map */}
      <GlobalMap />

      {/* Language Toggle Button & Footer Links - Bottom Left */}
      <div className="fixed bottom-8 left-8 md:bottom-12 md:left-12 z-[100] flex items-center gap-3 md:gap-4">
        <LanguageSwitcher />
        <a href="#" onClick={(e) => e.preventDefault()} className="text-white/60 hover:text-primary transition-colors text-xs md:text-sm font-medium">
          {t('login.privacy')}
        </a>
        <a href="#" onClick={(e) => e.preventDefault()} className="text-white/60 hover:text-primary transition-colors text-xs md:text-sm font-medium">
          {t('login.copyright')}
        </a>
        <a href="#" onClick={(e) => e.preventDefault()} className="text-white/60 hover:text-primary transition-colors text-xs md:text-sm font-medium">
          {t('login.security')}
        </a>
      </div>

      {/* Right Side Login Panel - Mobile Responsive */}
      <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 glass-dark rounded-2xl p-4 md:p-6 w-[calc(100%-2rem)] max-w-[320px] md:w-80 border-primary/30 z-20 shadow-2xl">
        <form onSubmit={handleLogin} className="space-y-3 md:space-y-4">
          <div>
            <label className="text-white/60 text-xs md:text-sm mb-2 block">{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-glass w-full text-sm md:text-base"
              placeholder="email@example.com"
              required
            />
          </div>
          <div>
            <label className="text-white/60 text-xs md:text-sm mb-2 block">{t('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-glass w-full text-sm md:text-base"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 md:px-6 py-2.5 md:py-3 bg-gradient-primary text-white text-sm md:text-base font-semibold rounded-xl hover:shadow-glow-primary transition-all active:scale-95"
          >
            {t('login.login')}
          </button>
          <div className="text-center">
            <a href="#" className="text-primary text-xs md:text-sm hover:text-primary/80 transition-colors">
              {t('login.forgotPassword')}
            </a>
          </div>

          {/* Device & Location Info */}
          {geoData && (
            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
              <div className="space-y-1.5 md:space-y-2 text-[11px] md:text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white/40">{t('login.ipAddress')}:</span>
                  <span className="text-primary font-mono text-[10px] md:text-xs">{geoData.ip}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white/40">{t('login.location')}:</span>
                  <span className="text-white/60">{geoData.location.city}, {geoData.location.country}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white/40">{t('login.device')}:</span>
                  <span className="text-white/60">{geoData.device.brand} {geoData.device.type}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white/40">{t('login.os')}:</span>
                  <span className="text-white/60">{geoData.device.os}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white/40">{t('login.operator')}:</span>
                  <span className="text-white/60 text-right text-[9px] md:text-[10px]">{geoData.isp}</span>
                </div>
              </div>
              <p className="text-white/40 text-[10px] md:text-xs text-center mt-2 md:mt-3">{t('login.authenticator')}</p>
            </div>
          )}

          {loading && !geoData && (
            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10 text-center">
              <div className="inline-block animate-spin rounded-full h-3 md:h-4 w-3 md:w-4 border-b-2 border-primary"></div>
              <p className="text-white/40 text-[10px] md:text-xs mt-2">{t('login.loadingLocation')}</p>
            </div>
          )}
        </form>
      </div>

      {/* SOC Security Monitor */}
      <SOCMonitor />

    </main>
  );
}