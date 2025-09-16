'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { signIn, getSession, getProviders } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Mail, Lock, AlertCircle, TrendingUp, Shield, Bot, BarChart3, Wallet, Globe, CheckCircle } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Turnstile } from '@marsidev/react-turnstile';
import ConnectionStatus from '@/components/ConnectionStatus';
import CryptoPriceTicker from '@/components/CryptoPriceTicker';
import Logo from '@/components/Logo';
import CaptchaArrowStepper from '@/components/security/CaptchaArrowStepper';
import CaptchaProviderMount, { CaptchaProvider } from '@/components/security/CaptchaProviderMount';

interface Provider {
  id: string;
  name: string;
  type: string;
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [cloudflareToken, setCloudflareToken] = useState<string | null>(null);
  
  // New CAPTCHA states
  const [captchaEnabled, setCaptchaEnabled] = useState(true);
  const [captchaProvider, setCaptchaProvider] = useState<CaptchaProvider | 'stepper'>('turnstile');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptchaStepper, setShowCaptchaStepper] = useState(false);

  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const errorParam = searchParams?.get('error');

  const getErrorMessage = useCallback((error: string) => {
    switch (error) {
      case 'CredentialsSignin':
        return t('errors.invalidCredentials') || 'Invalid email or password';
      case 'OAuthAccountNotLinked':
        return t('errors.accountNotLinked') || 'Account could not be linked';
      default:
        return t('errors.general') || 'An error occurred';
    }
  }, [t]);

  // CAPTCHA configuration check
  useEffect(() => {
    const checkCaptchaConfig = async () => {
      try {
        const response = await fetch('/api/captcha/verify');
        if (response.ok) {
          const config = await response.json();
          setCaptchaEnabled(config.enabled);
          setCaptchaProvider(config.provider || 'turnstile');
        }
      } catch (error) {
        console.warn('Failed to fetch CAPTCHA config:', error);
        setCaptchaEnabled(false);
      }
    };

    checkCaptchaConfig();
  }, []);

  const handleCaptchaStepperComplete = useCallback((success: boolean, data?: any) => {
    if (success) {
      setCaptchaVerified(true);
      setShowCaptchaStepper(false);
      setCaptchaToken(data?.challengeId || 'stepper_verified');
    } else {
      setError('CAPTCHA doğrulaması başarısız oldu');
      setCaptchaVerified(false);
    }
  }, []);

  const handleCaptchaProviderSuccess = useCallback(async (token: string, provider: CaptchaProvider) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, provider })
      });

      const result = await response.json();
      
      if (result.success) {
        setCaptchaToken(token);
        setCaptchaVerified(true);
        setError('');
      } else {
        setError(result.error?.message || 'CAPTCHA doğrulaması başarısız');
        setCaptchaVerified(false);
      }
    } catch (error) {
      setError('CAPTCHA doğrulaması sırasında hata oluştu');
      setCaptchaVerified(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCaptchaProviderError = useCallback((error: string) => {
    setError(`CAPTCHA hatası: ${error}`);
    setCaptchaVerified(false);
    setCaptchaToken(null);
  }, []);

  useEffect(() => {
    getProviders().then(setProviders);
    
    // Check if user is already logged in
    getSession().then((session) => {
      if (session) {
        router.push('/dashboard');
      }
    });

    // Handle OAuth errors
    if (errorParam) {
      setError(getErrorMessage(errorParam));
    }
  }, [errorParam, router, getErrorMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(t('errors.required') || 'Email and password are required');
      return;
    }

    // CAPTCHA check
    if (captchaEnabled && !captchaVerified) {
      if (captchaProvider === 'stepper') {
        setShowCaptchaStepper(true);
        return;
      } else {
        setError('Lütfen CAPTCHA doğrulamasını tamamlayın');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        captchaToken,
        redirect: false
      });

      if (result?.error) {
        setError(getErrorMessage(result.error));
        // Reset CAPTCHA on authentication failure
        if (captchaEnabled) {
          setCaptchaVerified(false);
          setCaptchaToken(null);
        }
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Giriş yapılırken bir hata oluştu');
      // Reset CAPTCHA on error
      if (captchaEnabled) {
        setCaptchaVerified(false);
        setCaptchaToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const handleCloudflareChange = (token: string) => {
    setCloudflareToken(token);
  };

  const features = [
    { icon: TrendingUp, title: 'AI-Destekli Tahminler', desc: 'Makine öğrenmesi ile gelişmiş piyasa analizleri' },
    { icon: Shield, title: 'Güvenli İşlemler', desc: 'Kurumsal düzeyde güvenlik protokolleri' },
    { icon: Bot, title: 'Akıllı Otomasyon', desc: 'Otomatik alım-satım botları ve strateji araçları' },
    { icon: BarChart3, title: 'Gerçek Zamanlı Analitik', desc: 'Gelişmiş grafikler ve teknik göstergeler' },
    { icon: Wallet, title: 'Çoklu Zincir Cüzdanlar', desc: 'Tüm büyük kripto para ağları için destek' },
    { icon: Globe, title: 'Küresel Piyasalar', desc: 'Dünya çapındaki kripto para borsalarına erişim' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-bg-soft to-panel flex flex-col">
      {/* Top Status Bar */}
      <div className="w-full bg-panel/80 backdrop-blur-sm border-b border-glass/30 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left - Connection Status */}
          <ConnectionStatus className="flex-shrink-0" />
          
          {/* Center - Crypto Ticker */}
          <div className="flex-1 mx-4 min-w-0">
            <CryptoPriceTicker 
              updateInterval={30000}
              showTop={100}
            />
          </div>
          
          {/* Right - System Info */}
          <div className="flex items-center gap-4 text-xs text-muted flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Sistem Aktif</span>
            </div>
            <span>•</span>
            <span>Türkiye</span>
            <span>•</span>
            <span>{new Date().toLocaleTimeString('tr-TR')}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Side - Features Showcase */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-1/10 via-brand-2/10 to-bg relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative z-10 p-12 flex flex-col justify-center">
            {/* Logo */}
            <div className="mb-12">
              <Logo />
            </div>
            
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-6 mb-12">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group bg-panel/50 backdrop-blur-sm p-6 rounded-xl border border-glass/30 hover:border-brand-1/50 transition-all duration-300 hover:scale-105"
                >
                  <feature.icon className="w-8 h-8 text-brand-1 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-brand-1 mb-1">10K+</div>
                <div className="text-muted text-sm">Aktif Kullanıcı</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand-2 mb-1">$100M+</div>
                <div className="text-muted text-sm">İşlem Hacmi</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent mb-1">99.9%</div>
                <div className="text-muted text-sm">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-[500px] flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <Logo />
            </div>

            <div className="bg-panel/80 backdrop-blur-sm p-8 rounded-2xl border border-glass/30 shadow-2xl">
              <h1 className="text-2xl font-bold text-white mb-2">Hoş Geldiniz</h1>
              <p className="text-muted mb-8">AiLydian Trader hesabınıza giriş yapın</p>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-500 text-sm">{error}</span>
                </div>
              )}

              {/* Registration Link */}
              <div className="mb-6 p-4 bg-gradient-to-r from-brand-1/10 to-brand-2/10 rounded-lg border border-brand-1/20">
                <div className="text-center mb-2">
                  <h3 className="text-brand-1 font-semibold text-sm">🌟 Henüz Hesabınız Yok mu?</h3>
                  <p className="text-muted text-xs mb-3">Ücretsiz hesap oluşturun ve tüm özelliklere erişin</p>
                  <a 
                    href="/tr/auth/register"
                    className="inline-flex items-center gap-2 bg-brand-1 hover:bg-brand-1/90 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    📝 Hesap Oluştur
                  </a>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    E-posta
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-bg border border-glass rounded-lg pl-10 pr-4 py-3 text-white placeholder-muted focus:border-brand-1 focus:ring-1 focus:ring-brand-1 focus:outline-none transition-colors"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                    Şifre
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-bg border border-glass rounded-lg pl-10 pr-12 py-3 text-white placeholder-muted focus:border-brand-1 focus:ring-1 focus:ring-brand-1 focus:outline-none transition-colors"
                      placeholder="Şifrenizi girin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* CAPTCHA - New System */}
                {captchaEnabled && (
                  <div className="space-y-4">
                    {captchaProvider === 'stepper' ? (
                      <div className="flex justify-center">
                        <div className="bg-panel/50 backdrop-blur-sm p-4 rounded-lg border border-glass/30">
                          <div className="text-center text-white text-sm mb-2">
                            🔐 Güvenlik Doğrulaması
                          </div>
                          <div className="text-muted text-xs text-center mb-2">
                            Bot olmadığınızı doğrulayın
                          </div>
                          {captchaVerified ? (
                            <div className="flex items-center justify-center gap-2 text-green-500">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">Doğrulandı</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowCaptchaStepper(true)}
                              className="bg-brand-1 hover:bg-brand-1/80 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                              Doğrulamaya Başla
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <CaptchaProviderMount
                          provider={captchaProvider}
                          onSuccess={handleCaptchaProviderSuccess}
                          onError={handleCaptchaProviderError}
                          onExpire={() => {
                            setCaptchaVerified(false);
                            setCaptchaToken(null);
                          }}
                          theme="dark"
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-2 hover:bg-brand-2/80 disabled:bg-brand-2/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </button>
              </form>

              {/* Language Selection */}
              <div className="mt-8 pt-6 border-t border-glass/30">
                <p className="text-sm text-muted mb-3 text-center">Dil Seçimi</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button 
                    onClick={() => router.push('/tr/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇹🇷 TR
                  </button>
                  <button 
                    onClick={() => router.push('/en/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇺🇸 EN
                  </button>
                  <button 
                    onClick={() => router.push('/es/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇪🇸 ES
                  </button>
                  <button 
                    onClick={() => router.push('/zh/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇨🇳 ZH
                  </button>
                  <button 
                    onClick={() => router.push('/ja/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇯🇵 JA
                  </button>
                  <button 
                    onClick={() => router.push('/ko/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇰🇷 KO
                  </button>
                  <button 
                    onClick={() => router.push('/ru/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇷🇺 RU
                  </button>
                  <button 
                    onClick={() => router.push('/pt/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇵🇹 PT
                  </button>
                  <button 
                    onClick={() => router.push('/it/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇮🇹 IT
                  </button>
                  <button 
                    onClick={() => router.push('/ar/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇸🇦 AR
                  </button>
                  <button 
                    onClick={() => router.push('/fa/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇮🇷 FA
                  </button>
                  <button 
                    onClick={() => router.push('/fr/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇫🇷 FR
                  </button>
                  <button 
                    onClick={() => router.push('/de/auth/signin')}
                    className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                  >
                    🇩🇪 DE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CAPTCHA Stepper Modal */}
      {showCaptchaStepper && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-panel/95 backdrop-blur-sm rounded-2xl border border-glass/30 shadow-2xl max-w-md w-full mx-4">
            <CaptchaArrowStepper
              onComplete={handleCaptchaStepperComplete}
              onClose={() => setShowCaptchaStepper(false)}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
