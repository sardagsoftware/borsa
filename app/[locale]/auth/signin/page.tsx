'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { signIn, getSession, getProviders } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Mail, Lock, AlertCircle, TrendingUp, Shield, Bot, BarChart3, Wallet, Globe } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Turnstile } from '@marsidev/react-turnstile';
import ConnectionStatus from '@/components/ConnectionStatus';
import { Link } from '@/i18n/routing';
import CryptoPriceTicker from '@/components/CryptoPriceTicker';
import Logo from '@/components/Logo';

interface Provider {
  id: string;
  name: string;
  type: string;
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  
  const [email, setEmail] = useState('demo@ailydian.com');
  const [password, setPassword] = useState('demo123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [cloudflareToken, setCloudflareToken] = useState<string | null>(null);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const errorParam = searchParams.get('error');

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
    setIsLoading(true);
    setError('');

    if (!email || !password) {
      setError(t('errors.required') || 'Email and password are required');
      setIsLoading(false);
      return;
    }

    // CAPTCHA doğrulaması - development için bypass
    if (process.env.NODE_ENV === 'development' && email === 'demo@ailydian.com') {
      console.log('Development mode: CAPTCHA bypass for demo user');
      // Demo user için CAPTCHA bypass
    } else if (!recaptchaToken && !cloudflareToken) {
      setError('Lütfen bot olmadığınızı doğrulayın');
      setIsLoading(false);
      return;
    }

    try {
      // CAPTCHA token'ını backend'e göndermek için API endpoint
      const captchaResponse = await fetch('/api/auth/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recaptchaToken, 
          cloudflareToken,
          email,
          password 
        })
      });

      if (!captchaResponse.ok) {
        const errorData = await captchaResponse.json();
        throw new Error(errorData.error || 'CAPTCHA doğrulaması başarısız');
      }

      // CAPTCHA doğrulandıktan sonra NextAuth ile gerçek login
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error === 'CredentialsSignin' ? 'Geçersiz email veya şifre' : result.error);
      }

      // Başarılı giriş - locale aware redirect
      const currentLocale = window.location.pathname.split('/')[1] || 'tr';
      const dashboardPath = currentLocale === 'tr' ? '/dashboard' : `/${currentLocale}/dashboard`;
      router.push(dashboardPath);
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error instanceof Error ? error.message : (t('errors.general') || 'An error occurred during sign in'));
      setIsLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, title: 'AI Destekli Trading', desc: 'Piyasa analizi için gelişmiş makine öğrenmesi algoritmaları' },
    { icon: Shield, title: 'Kurumsal Güvenlik', desc: 'Çok faktörlü kimlik doğrulama ile banka düzeyinde güvenlik' },
    { icon: Bot, title: 'Otomatik Stratejiler', desc: 'Risk yönetimi ile akıllı trading botları' },
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
                    {/* Center - Live Crypto Prices */}
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
            <span>{new Date().toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Side - Features */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-1/20 via-brand-2/20 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-center p-12">
          <div className="mb-8 text-center">
            <Logo size="xl" className="mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-brand-1 mb-4">
              Profesyonel Kripto Trading Platformu
            </h2>
            <p className="text-lg text-muted leading-relaxed">
              Yapay zeka destekli yeni nesil trading platformu. 
              Gelişmiş analizler ve otomatik stratejilerle güvenle trade yapın.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 glass rounded-xl border border-glass">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-brand-1 to-brand-2 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text mb-1">{feature.title}</h3>
                  <p className="text-muted text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Brief Button */}
          <div className="mt-8">
            <Link 
              href="/brief"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-1 to-brand-2 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              📋 Platform Özelliklerini Görüntüle & Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile Header */}
          <div className="text-center lg:hidden mb-8">
            <Logo size="lg" className="mx-auto mb-4" />
            <p className="text-muted">Profesyonel Kripto Trading Platformu</p>
          </div>

          {/* Login Form */}
          <div className="glass p-8 rounded-2xl border border-glass shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text mb-2">
                {t('auth.login') || 'Güvenli Giriş'}
              </h2>
              <p className="text-muted">
                {t('auth.loginDescription') || 'Trading panelinize giriş yapın'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-500 text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-panel border border-glass rounded-lg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-1 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-panel border border-glass rounded-lg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-1 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-text transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* CAPTCHA Verification */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    🛡️ Bot Koruması
                  </label>
                  
                  {/* Cloudflare Turnstile */}
                  <div className="mb-3">
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "0x4AAAAAAABkMYinukE8nzYZ"}
                      onSuccess={(token: string) => setCloudflareToken(token)}
                    />
                  </div>

                  {/* Google reCAPTCHA v3 (fallback) */}
                  <div>
                    <ReCAPTCHA
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                      onChange={(token) => setRecaptchaToken(token)}
                      onExpired={() => setRecaptchaToken(null)}
                      theme="dark"
                      size="compact"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-gradient-to-r from-brand-1 to-brand-2 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gradient-to-r from-brand-1/10 to-brand-2/10 border border-brand-1/20 rounded-lg">
              <p className="text-sm font-medium text-text mb-2">🔧 Demo Credentials (Pre-filled)</p>
              <div className="text-xs text-muted space-y-1">
                <p>Email: demo@ailydian.com</p>
                <p>Password: demo123456</p>
              </div>
            </div>

            {/* Language Selection */}
            <div className="mt-6">
              <p className="text-center text-sm text-muted mb-3">Select Language</p>
              <div className="flex justify-center space-x-2">
                <Link 
                  href="/tr/auth/signin"
                  className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                >
                  🇹🇷 TR
                </Link>
                <Link 
                  href="/en/auth/signin"
                  className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                >
                  🇺🇸 EN
                </Link>
                <Link 
                  href="/ar/auth/signin"
                  className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                >
                  🇸🇦 AR
                </Link>
                <Link 
                  href="/fa/auth/signin"
                  className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                >
                  🇮🇷 FA
                </Link>
                <Link 
                  href="/fr/auth/signin"
                  className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                >
                  🇫🇷 FR
                </Link>
                <Link 
                  href="/de/auth/signin"
                  className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                >
                  🇩🇪 DE
                </Link>
                <Link 
                  href="/nl/auth/signin"
                  className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                >
                  🇳🇱 NL
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
