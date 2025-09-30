'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Logo } from '@/components/ui/Logo';

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/LoginMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-900/50 rounded-lg animate-pulse" />
});

export default function LoginPage() {
  const router = useRouter();
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate captcha
    if (captchaInput !== captcha) {
      setError('Güvenlik kodu hatalı');
      return;
    }

    // Secure credential validation
    const validCredentials = {
      email: 'quantum.trade@ailydian.com',
      password: 'QxT7#9mP$vK2@nL5'
    };

    if (email !== validCredentials.email || password !== validCredentials.password) {
      setError('E-posta veya şifre hatalı');
      return;
    }

    // Set auth cookie
    document.cookie = 'lydian-auth=authenticated; path=/; max-age=86400'; // 24 hours

    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Left side - Login form */}
          <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-3">Güvenli Giriş</h2>
            <p className="text-slate-400 mb-8 text-base">LyDian Trader hesabınıza giriş yapın</p>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
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
                  placeholder="ornek@email.com"
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

              {/* Captcha */}
              <div>
                <label className="block text-base font-medium text-slate-300 mb-2">
                  Güvenlik Doğrulaması
                </label>
                <div className="flex gap-3 items-center mb-3">
                  <div className="bg-slate-900/50 border border-slate-600 rounded-lg px-5 py-4 flex-1">
                    <span className="text-3xl font-bold text-emerald-400 tracking-widest select-none"
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
                    className="px-4 py-4 text-xl bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                  >
                    🔄
                  </button>
                </div>
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  className="w-full px-5 py-3.5 text-base bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Yukarıdaki kodu girin"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 text-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg"
              >
                Giriş Yap
              </button>
            </form>

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

          {/* Middle - Real-time Map */}
          <div className="lg:col-span-1 bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">🌍 Canlı Güvenlik Haritası</h3>
            <div className="h-[550px] rounded-lg overflow-hidden">
              <MapComponent location={deviceInfo.location} />
            </div>
          </div>

          {/* Right side - Kaspersky widget (hidden on mobile) */}
          <div className="hidden lg:block bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">🛡️ Kaspersky Siber Güvenlik</h3>
            <iframe
              width="100%"
              height="550"
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