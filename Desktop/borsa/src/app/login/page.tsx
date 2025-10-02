'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Logo } from '@/components/ui/Logo';

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/LoginMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-900/50 rounded-lg animate-pulse" />
});

export default function LoginPage() {
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [deviceInfo, setDeviceInfo] = useState<any>({
    browser: '',
    os: '',
    device: '',
    macAddress: 'XX:XX:XX:XX:XX:XX', // MAC adresi tarayıcıdan alınamaz (güvenlik)
    ip: 'Yükleniyor...',
    location: { lat: 41.0082, lng: 28.9784 }, // Istanbul default
    city: 'Yükleniyor...',
    country: 'Türkiye',
    isp: 'Yükleniyor...',
    timezone: 'Europe/Istanbul',
    accuracy: 'medium'
  });

  // Generate random captcha
  useEffect(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  }, []);

  // Detect device info
  useEffect(() => {
    const ua = navigator.userAgent;

    // Browser detection
    let browser = 'Bilinmeyen';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    // OS detection
    let os = 'Bilinmeyen';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    // Device type
    let device = 'Masaüstü';
    if (/Mobile|Android|iPhone/i.test(ua)) device = 'Mobil';
    else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';

    setDeviceInfo((prev: any) => ({ ...prev, browser, os, device }));

    // Get IP and location from our backend API
    fetch('/api/location')
      .then(res => res.json())
      .then(data => {
        console.log('📍 Location data:', data);
        setDeviceInfo((prev: any) => ({
          ...prev,
          ip: data.ip || 'Alınamadı',
          location: {
            lat: data.latitude || 41.0082,
            lng: data.longitude || 28.9784
          },
          city: data.city,
          country: data.country,
          isp: data.isp,
          timezone: data.timezone
        }));
      })
      .catch((error) => {
        console.error('Location API error:', error);
        setDeviceInfo((prev: any) => ({ ...prev, ip: 'Alınamadı' }));
      });

    // Try to get browser geolocation for higher accuracy
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('🎯 Browser geolocation:', latitude, longitude);

          // Send to backend for reverse geocoding
          fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude })
          })
            .then(res => res.json())
            .then(data => {
              console.log('🗺️ Reverse geocode:', data);
              setDeviceInfo((prev: any) => ({
                ...prev,
                location: { lat: latitude, lng: longitude },
                accuracy: 'very-high'
              }));
            })
            .catch(err => console.error('Reverse geocode error:', err));
        },
        (error) => {
          console.log('Browser geolocation denied or unavailable');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-6">
          <Logo size="md" animated={true} />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Left side - Login form */}
          <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-2">Güvenli Giriş</h2>
            <p className="text-slate-400 mb-6">LyDian Trader hesabınıza giriş yapın</p>

            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="ornek@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Şifre
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Şifrenizi girin"
                />
              </div>

              {/* Captcha */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Güvenlik Doğrulaması
                </label>
                <div className="flex gap-3 items-center mb-2">
                  <div className="bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 flex-1">
                    <span className="text-2xl font-bold text-emerald-400 tracking-widest select-none"
                          style={{ fontFamily: 'monospace', letterSpacing: '0.3em' }}>
                      {captcha}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                      let result = '';
                      for (let i = 0; i < 6; i++) {
                        result += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setCaptcha(result);
                      setCaptchaInput('');
                    }}
                    className="px-3 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                  >
                    🔄
                  </button>
                </div>
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Yukarıdaki kodu girin"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg"
              >
                Giriş Yap
              </button>
            </form>

            {/* Demo Credentials Info */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-sm font-semibold text-emerald-400 mb-3">🎯 Demo Hesap Bilgileri</h3>
              <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-emerald-300 font-mono">demo@borsa.ailydian.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Şifre:</span>
                  <span className="text-emerald-300 font-mono">Demo2025!Borsa</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <p className="text-[10px] text-slate-500">
                    ✅ Paper Trading (Güvenli Mod) | ✅ Tüm AI Botlar Aktif | ✅ Risk Yönetimi Zorunlu
                  </p>
                </div>
              </div>
            </div>

            {/* Device Info */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">🔒 Güvenlik Bilgileri</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarayıcı:</span>
                  <span className="text-slate-300">{deviceInfo.browser}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">İşletim Sistemi:</span>
                  <span className="text-slate-300">{deviceInfo.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cihaz Tipi:</span>
                  <span className="text-slate-300">{deviceInfo.device}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IP Adresi:</span>
                  <span className="text-slate-300 font-mono">{deviceInfo.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Şehir:</span>
                  <span className="text-slate-300">{deviceInfo.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ülke:</span>
                  <span className="text-slate-300">{deviceInfo.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ISP:</span>
                  <span className="text-slate-300 text-[10px]">{deviceInfo.isp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Zaman Dilimi:</span>
                  <span className="text-slate-300">{deviceInfo.timezone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Konum Hassasiyeti:</span>
                  <span className="text-emerald-400 uppercase text-[10px]">{deviceInfo.accuracy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Oturum Zamanı:</span>
                  <span className="text-slate-300">{new Date().toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle - Real-time Map */}
          <div className="lg:col-span-1 bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-bold text-white mb-4">🌍 Canlı Güvenlik Haritası</h3>
            <div className="h-[500px] rounded-lg overflow-hidden">
              <MapComponent location={deviceInfo.location} />
            </div>
          </div>

          {/* Right side - Kaspersky widget (hidden on mobile) */}
          <div className="hidden lg:block bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-bold text-white mb-4">🛡️ Kaspersky Siber Güvenlik</h3>
            <iframe
              width="100%"
              height="500"
              src="https://cybermap.kaspersky.com/tr/widget/dynamic/dark"
              frameBorder="0"
              title="Kaspersky Cybermap"
              className="rounded-lg"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>
    </main>
  );
}