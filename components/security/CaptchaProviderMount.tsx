'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export type CaptchaProvider = 'turnstile' | 'hcaptcha' | 'recaptcha' | 'azureb2c';

interface CaptchaProviderMountProps {
  provider: CaptchaProvider;
  onSuccess: (token: string, provider: CaptchaProvider) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  disabled?: boolean;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    hcaptcha?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    grecaptcha?: {
      render: (container: string | HTMLElement, options: any) => number;
      reset: (widgetId?: number) => void;
      execute: (widgetId: number) => void;
    };
  }
}

const CaptchaProviderMount: React.FC<CaptchaProviderMountProps> = ({
  provider,
  onSuccess,
  onError,
  onExpire,
  disabled = false,
  theme = 'dark',
  size = 'normal',
  className = ''
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  // Environment variables (only site keys for client-side)
  const siteKeys = {
    turnstile: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    hcaptcha: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
    recaptcha: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    azureb2c: process.env.NEXT_PUBLIC_AZUREB2C_CLIENT_ID
  };

  const scriptSources = {
    turnstile: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
    hcaptcha: 'https://js.hcaptcha.com/1/api.js',
    recaptcha: 'https://www.google.com/recaptcha/api.js',
    azureb2c: null // B2C uses different approach
  };

  const loadScript = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }, []);

  const renderTurnstile = useCallback(() => {
    if (!window.turnstile || !containerRef.current || !siteKeys.turnstile) return;

    try {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKeys.turnstile,
        theme: theme === 'dark' ? 'dark' : 'light',
        size: size === 'compact' ? 'compact' : 'normal',
        callback: (token: string) => {
          onSuccess(token, 'turnstile');
        },
        'error-callback': (error: any) => {
          setError('Turnstile doğrulaması başarısız');
          onError?.('Turnstile verification failed');
        },
        'expired-callback': () => {
          onExpire?.();
        }
      });
      if (id) {
        setWidgetId(id);
      }
      setIsLoaded(true);
    } catch (err) {
      setError('Turnstile yüklenemedi');
      onError?.('Failed to render Turnstile');
    }
  }, [theme, size, onSuccess, onError, onExpire, siteKeys.turnstile]);

  const renderHcaptcha = useCallback(() => {
    if (!window.hcaptcha || !containerRef.current || !siteKeys.hcaptcha) return;

    try {
      const id = window.hcaptcha.render(containerRef.current, {
        sitekey: siteKeys.hcaptcha,
        theme: theme === 'dark' ? 'dark' : 'light',
        size: size === 'compact' ? 'compact' : 'normal',
        callback: (token: string) => {
          onSuccess(token, 'hcaptcha');
        },
        'error-callback': (error: any) => {
          setError('hCaptcha doğrulaması başarısız');
          onError?.('hCaptcha verification failed');
        },
        'expired-callback': () => {
          onExpire?.();
        }
      });
      setWidgetId(id);
      setIsLoaded(true);
    } catch (err) {
      setError('hCaptcha yüklenemedi');
      onError?.('Failed to render hCaptcha');
    }
  }, [theme, size, onSuccess, onError, onExpire, siteKeys.hcaptcha]);

  const renderRecaptcha = useCallback(() => {
    if (!window.grecaptcha || !containerRef.current || !siteKeys.recaptcha) return;

    try {
      const id = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKeys.recaptcha,
        theme: theme === 'dark' ? 'dark' : 'light',
        size: size === 'compact' ? 'compact' : 'normal',
        callback: (token: string) => {
          onSuccess(token, 'recaptcha');
        },
        'error-callback': (error: any) => {
          setError('reCAPTCHA doğrulaması başarısız');
          onError?.('reCAPTCHA verification failed');
        },
        'expired-callback': () => {
          onExpire?.();
        }
      });
      setWidgetId(id.toString());
      setIsLoaded(true);
    } catch (err) {
      setError('reCAPTCHA yüklenemedi');
      onError?.('Failed to render reCAPTCHA');
    }
  }, [theme, size, onSuccess, onError, onExpire, siteKeys.recaptcha]);

  const renderAzureB2C = useCallback(() => {
    // Azure B2C implementation would go here
    // This is a placeholder for B2C custom policy integration
    if (!siteKeys.azureb2c) {
      setError('Azure B2C yapılandırılmamış');
      return;
    }

    // Simulate B2C challenge
    setTimeout(() => {
      onSuccess('azureb2c_token_' + Date.now(), 'azureb2c');
      setIsLoaded(true);
    }, 1000);
  }, [onSuccess, siteKeys.azureb2c]);

  const initializeProvider = useCallback(async () => {
    if (mountedRef.current) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const siteKey = siteKeys[provider];
      if (!siteKey) {
        throw new Error(`${provider} site key not configured`);
      }

      switch (provider) {
        case 'turnstile':
          const turnstileScript = scriptSources.turnstile;
          if (turnstileScript) {
            await loadScript(turnstileScript);
            // Wait for script to initialize
            await new Promise(resolve => setTimeout(resolve, 100));
            renderTurnstile();
          }
          break;

        case 'hcaptcha':
          const hcaptchaScript = scriptSources.hcaptcha;
          if (hcaptchaScript) {
            await loadScript(hcaptchaScript);
            await new Promise(resolve => setTimeout(resolve, 100));
            renderHcaptcha();
          }
          break;

        case 'recaptcha':
          const recaptchaScript = scriptSources.recaptcha;
          if (recaptchaScript) {
            await loadScript(recaptchaScript);
            await new Promise(resolve => setTimeout(resolve, 100));
            renderRecaptcha();
          }
          break;

        case 'azureb2c':
          renderAzureB2C();
          break;

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      mountedRef.current = true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Provider yüklenemedi';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [provider, loadScript, renderTurnstile, renderHcaptcha, renderRecaptcha, renderAzureB2C, siteKeys, onError]);

  const reset = useCallback(() => {
    if (!widgetId) return;

    try {
      switch (provider) {
        case 'turnstile':
          window.turnstile?.reset(widgetId);
          break;
        case 'hcaptcha':
          window.hcaptcha?.reset(widgetId);
          break;
        case 'recaptcha':
          window.grecaptcha?.reset(widgetId ? parseInt(widgetId) : undefined);
          break;
        case 'azureb2c':
          // B2C reset logic
          break;
      }
    } catch (err) {
      console.warn('Failed to reset CAPTCHA:', err);
    }
  }, [provider, widgetId]);

  useEffect(() => {
    if (!disabled) {
      initializeProvider();
    }

    return () => {
      // Cleanup widget on unmount
      if (widgetId) {
        try {
          switch (provider) {
            case 'turnstile':
              window.turnstile?.remove(widgetId);
              break;
            case 'hcaptcha':
              window.hcaptcha?.remove(widgetId);
              break;
            // reCAPTCHA doesn't have remove method
          }
        } catch (err) {
          console.warn('Failed to cleanup CAPTCHA widget:', err);
        }
      }
    };
  }, [disabled, initializeProvider, provider, widgetId]);

  const getProviderName = (provider: CaptchaProvider): string => {
    switch (provider) {
      case 'turnstile': return 'Cloudflare Turnstile';
      case 'hcaptcha': return 'hCaptcha';
      case 'recaptcha': return 'Google reCAPTCHA';
      case 'azureb2c': return 'Azure AD B2C';
      default: return 'CAPTCHA';
    }
  };

  if (disabled) {
    return (
      <div className={`flex items-center justify-center p-4 bg-panel/50 border border-glass/30 rounded-lg ${className}`}>
        <div className="text-center">
          <Shield className="w-8 h-8 text-muted mx-auto mb-2" />
          <p className="text-muted text-sm">CAPTCHA devre dışı</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500 text-sm font-medium mb-2">CAPTCHA Hatası</p>
          <p className="text-red-400 text-xs">{error}</p>
          <button
            onClick={() => {
              setError(null);
              mountedRef.current = false;
              initializeProvider();
            }}
            className="mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-red-400 text-xs transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-6 bg-panel/50 border border-glass/30 rounded-lg ${className}`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-brand-1 mx-auto mb-3 animate-spin" />
          <p className="text-white text-sm font-medium mb-1">Güvenlik Kontrolü</p>
          <p className="text-muted text-xs">{getProviderName(provider)} yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {!isLoaded && (
        <div className="mb-4 text-center">
          <p className="text-muted text-sm">
            Güvenlik doğrulaması hazırlanıyor...
          </p>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="flex justify-center"
        aria-label={`${getProviderName(provider)} güvenlik doğrulaması`}
      />
      
      {isLoaded && (
        <div className="mt-3 text-center">
          <p className="text-muted text-xs">
            {getProviderName(provider)} ile korunmaktadır
          </p>
          <button
            onClick={reset}
            className="mt-1 text-brand-1 text-xs hover:text-brand-1/80 underline"
            type="button"
          >
            Yenile
          </button>
        </div>
      )}

      {/* No-JS Fallback */}
      <noscript>
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-500 inline mr-2" />
          <span className="text-yellow-500 text-sm">
            JavaScript etkinleştirilmelidir
          </span>
        </div>
      </noscript>
    </div>
  );
};

export default CaptchaProviderMount;
