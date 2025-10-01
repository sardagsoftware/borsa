'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/LoginMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-900/50 rounded-lg animate-pulse" />
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call secure backend authentication API with invisible bot protection
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'E-posta veya şifre hatalı');
        setIsLoading(false);
        return;
      }

      // Secure cookie is set by backend with HttpOnly flag
      // Redirect to dashboard
      router.push('/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
          {/* Left side - Login form */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl h-fit">
            <h2 className="text-3xl font-bold text-white mb-3">Güvenli Giriş</h2>
            <p className="text-slate-400 mb-8 text-base">LyDian Trader hesabınıza giriş yapın</p>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-base font-medium text-slate-300 mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3.5 text-base bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="demo@ailydian.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-base font-medium text-slate-300 mb-2">
                  Şifre
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 text-base bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Şifrenizi girin"
                  required
                />
              </div>

              {/* Invisible bot protection info */}
              <div className="bg-slate-900/30 border border-emerald-500/30 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>🔒 Görünmez bot koruması aktif - CAPTCHA'ya gerek yok</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 text-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Giriş yapılıyor...
                  </span>
                ) : (
                  'Giriş Yap'
                )}
              </button>
            </form>

            {/* Demo Credentials Helper */}
            <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3">
              <p className="text-xs text-emerald-400 font-semibold mb-1">📌 Demo Giriş Bilgileri:</p>
              <div className="font-mono text-xs text-emerald-300 space-y-1">
                <div>📧 Email: <span className="text-white select-all">demo@ailydian.com</span></div>
                <div>🔑 Şifre: <span className="text-white select-all">demo123456</span></div>
              </div>
            </div>

            {/* Device Info */}
            <div className="mt-8 pt-6 border-t border-slate-700">
              <h3 className="text-base font-semibold text-slate-300 mb-4">🔒 Güvenlik Bilgileri</h3>
              <div className="space-y-2.5 text-sm">
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

          {/* Right side - Maps stacked vertically */}
          <div className="flex flex-col gap-6">
            {/* Top - Real-time Security Map */}
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">🌍 Canlı Güvenlik Haritası</h3>
              <div className="h-[350px] rounded-lg overflow-hidden">
                <MapComponent location={deviceInfo.location} />
              </div>
            </div>

            {/* Bottom - Kaspersky Cybermap */}
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">🛡️ Kaspersky Siber Saldırı Haritası</h3>
              <div className="h-[350px] rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://cybermap.kaspersky.com/tr/widget/dynamic/dark"
                  frameBorder="0"
                  title="Kaspersky Cybermap"
                  className="rounded-lg"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
