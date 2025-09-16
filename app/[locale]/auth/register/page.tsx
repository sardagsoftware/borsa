'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Mail, Lock, AlertCircle, User, CheckCircle, TrendingUp, Shield, Bot, BarChart3, Wallet, Globe, Loader } from 'lucide-react';
import ConnectionStatus from '@/components/ConnectionStatus';
import CryptoPriceTicker from '@/components/CryptoPriceTicker';
import Logo from '@/components/Logo';
import CaptchaArrowStepper from '@/components/security/CaptchaArrowStepper';
import CaptchaProviderMount, { CaptchaProvider } from '@/components/security/CaptchaProviderMount';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // CAPTCHA states
  const [captchaEnabled, setCaptchaEnabled] = useState(true);
  const [captchaProvider, setCaptchaProvider] = useState<CaptchaProvider | 'stepper'>('turnstile');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptchaStepper, setShowCaptchaStepper] = useState(false);

  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  // Password strength validation
  const validatePassword = (password: string) => {
    const rules = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const strength = Object.values(rules).filter(Boolean).length;
    return { rules, strength };
  };

  const passwordValidation = validatePassword(formData.password);

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'İsim gerekli';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Soyisim gerekli';
    }

    if (!formData.email) {
      errors.email = 'E-posta adresi gerekli';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!formData.password) {
      errors.password = 'Şifre gerekli';
    } else if (passwordValidation.strength < 4) {
      errors.password = 'Şifre çok zayıf, lütfen güçlendirin';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CAPTCHA handlers
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

  // Form handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Lütfen tüm alanları doğru şekilde doldurun');
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
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          captchaToken
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Hesabınız başarıyla oluşturuldu! E-posta adresinizi kontrol ederek hesabınızı doğrulayın.');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        // Reset CAPTCHA
        setCaptchaVerified(false);
        setCaptchaToken(null);
      } else {
        setError(result.error || 'Kayıt sırasında bir hata oluştu');
        // Reset CAPTCHA on error
        if (captchaEnabled) {
          setCaptchaVerified(false);
          setCaptchaToken(null);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Kayıt sırasında bir hata oluştu');
      // Reset CAPTCHA on error
      if (captchaEnabled) {
        setCaptchaVerified(false);
        setCaptchaToken(null);
      }
    } finally {
      setIsLoading(false);
    }
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
    <>
      {/* CAPTCHA Arrow Stepper Modal */}
      {showCaptchaStepper && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <CaptchaArrowStepper
            onComplete={handleCaptchaStepperComplete}
            onClose={() => setShowCaptchaStepper(false)}
            className="w-full max-w-lg"
          />
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-bg via-bg-soft to-panel flex flex-col">
        {/* Top Status Bar */}
        <div className="w-full bg-panel/80 backdrop-blur-sm border-b border-glass/30 px-6 py-3">
          <div className="flex items-center justify-between">
            <ConnectionStatus className="flex-shrink-0" />
            <div className="flex-1 mx-4 min-w-0">
              <CryptoPriceTicker updateInterval={30000} showTop={100} />
            </div>
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
          {/* Left Side - Features */}
          <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-1/10 via-brand-2/10 to-bg relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative z-10 p-12 flex flex-col justify-center">
              <div className="mb-12">
                <Logo />
              </div>
              
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

          {/* Right Side - Registration Form */}
          <div className="w-full lg:w-[600px] flex items-center justify-center p-8">
            <div className="w-full max-w-lg">
              <div className="lg:hidden mb-8 text-center">
                <Logo />
              </div>

              <div className="bg-panel/80 backdrop-blur-sm p-8 rounded-2xl border border-glass/30 shadow-2xl">
                <h1 className="text-2xl font-bold text-white mb-2">Hesap Oluştur</h1>
                <p className="text-muted mb-8">AiLydian Trader'a katılın ve gelişmiş kripto ticaret deneyimi yaşayın</p>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-500 text-sm">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-green-500 text-sm">{success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
                        İsim
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
                        <input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          required
                          className={`w-full bg-bg border rounded-lg pl-10 pr-4 py-3 text-white placeholder-muted focus:ring-1 focus:outline-none transition-colors ${
                            validationErrors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-glass focus:border-brand-1 focus:ring-brand-1'
                          }`}
                          placeholder="İsminiz"
                        />
                      </div>
                      {validationErrors.firstName && (
                        <p className="mt-1 text-red-500 text-xs">{validationErrors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">
                        Soyisim
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
                        <input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          required
                          className={`w-full bg-bg border rounded-lg pl-10 pr-4 py-3 text-white placeholder-muted focus:ring-1 focus:outline-none transition-colors ${
                            validationErrors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-glass focus:border-brand-1 focus:ring-brand-1'
                          }`}
                          placeholder="Soyisminiz"
                        />
                      </div>
                      {validationErrors.lastName && (
                        <p className="mt-1 text-red-500 text-xs">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                      E-posta Adresi
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className={`w-full bg-bg border rounded-lg pl-10 pr-4 py-3 text-white placeholder-muted focus:ring-1 focus:outline-none transition-colors ${
                          validationErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-glass focus:border-brand-1 focus:ring-brand-1'
                        }`}
                        placeholder="ornek@email.com"
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="mt-1 text-red-500 text-xs">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                      Şifre
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        className={`w-full bg-bg border rounded-lg pl-10 pr-12 py-3 text-white placeholder-muted focus:ring-1 focus:outline-none transition-colors ${
                          validationErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-glass focus:border-brand-1 focus:ring-brand-1'
                        }`}
                        placeholder="Güçlü şifre oluşturun"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex space-x-1 mb-2">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full ${
                                passwordValidation.strength >= level
                                  ? passwordValidation.strength <= 2
                                    ? 'bg-red-500'
                                    : passwordValidation.strength <= 3
                                    ? 'bg-yellow-500'
                                    : passwordValidation.strength <= 4
                                    ? 'bg-blue-500'
                                    : 'bg-green-500'
                                  : 'bg-glass'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-xs space-y-1">
                          <div className={`flex items-center gap-2 ${passwordValidation.rules.minLength ? 'text-green-500' : 'text-muted'}`}>
                            <div className={`w-2 h-2 rounded-full ${passwordValidation.rules.minLength ? 'bg-green-500' : 'bg-glass'}`} />
                            En az 8 karakter
                          </div>
                          <div className={`flex items-center gap-2 ${passwordValidation.rules.hasUppercase ? 'text-green-500' : 'text-muted'}`}>
                            <div className={`w-2 h-2 rounded-full ${passwordValidation.rules.hasUppercase ? 'bg-green-500' : 'bg-glass'}`} />
                            Büyük harf
                          </div>
                          <div className={`flex items-center gap-2 ${passwordValidation.rules.hasNumbers ? 'text-green-500' : 'text-muted'}`}>
                            <div className={`w-2 h-2 rounded-full ${passwordValidation.rules.hasNumbers ? 'bg-green-500' : 'bg-glass'}`} />
                            Rakam
                          </div>
                          <div className={`flex items-center gap-2 ${passwordValidation.rules.hasSpecialChar ? 'text-green-500' : 'text-muted'}`}>
                            <div className={`w-2 h-2 rounded-full ${passwordValidation.rules.hasSpecialChar ? 'bg-green-500' : 'bg-glass'}`} />
                            Özel karakter
                          </div>
                        </div>
                      </div>
                    )}

                    {validationErrors.password && (
                      <p className="mt-1 text-red-500 text-xs">{validationErrors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                      Şifre Tekrarı
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                        className={`w-full bg-bg border rounded-lg pl-10 pr-12 py-3 text-white placeholder-muted focus:ring-1 focus:outline-none transition-colors ${
                          validationErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-glass focus:border-brand-1 focus:ring-brand-1'
                        }`}
                        placeholder="Şifrenizi tekrar girin"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="mt-1 text-red-500 text-xs">{validationErrors.confirmPassword}</p>
                    )}
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <p className="mt-1 text-green-500 text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Şifreler eşleşiyor
                      </p>
                    )}
                  </div>

                  {/* CAPTCHA */}
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
                    disabled={isLoading || !validateForm() || (captchaEnabled && !captchaVerified)}
                    className="w-full bg-brand-2 hover:bg-brand-2/80 disabled:bg-brand-2/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Hesap Oluşturuluyor...
                      </>
                    ) : (
                      'Hesap Oluştur'
                    )}
                  </button>
                </form>

                {/* Login Link */}
                <div className="mt-6 text-center">
                  <p className="text-muted text-sm">
                    Zaten hesabınız var mı?{' '}
                    <a 
                      href="/tr/auth/signin" 
                      className="text-brand-1 hover:text-brand-1/80 font-medium transition-colors"
                    >
                      Giriş yapın
                    </a>
                  </p>
                </div>

                {/* Language Selection */}
                <div className="mt-8 pt-6 border-t border-glass/30">
                  <p className="text-sm text-muted mb-3 text-center">Dil Seçimi</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button 
                      onClick={() => router.push('/tr/auth/register')}
                      className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                    >
                      🇹🇷 TR
                    </button>
                    <button 
                      onClick={() => router.push('/en/auth/register')}
                      className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                    >
                      🇺🇸 EN
                    </button>
                    <button 
                      onClick={() => router.push('/es/auth/register')}
                      className="px-3 py-1 text-sm bg-panel border border-glass rounded text-text hover:bg-brand-1 hover:text-white transition-colors"
                    >
                      🇪🇸 ES
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
