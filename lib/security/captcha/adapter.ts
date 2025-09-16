import { CaptchaProvider } from '@/components/security/CaptchaProviderMount';

export interface CaptchaVerificationResult {
  success: boolean;
  provider: CaptchaProvider;
  timestamp: Date;
  challengeId?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface CaptchaError extends Error {
  code: string;
  provider: CaptchaProvider;
  retryable: boolean;
}

// Provider-specific interfaces
interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

interface HcaptchaResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

interface RecaptchaResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  score?: number;
}

// Environment variables (server-side only)
const getSecretKey = (provider: CaptchaProvider): string | undefined => {
  switch (provider) {
    case 'turnstile':
      return process.env.TURNSTILE_SECRET_KEY;
    case 'hcaptcha':
      return process.env.HCAPTCHA_SECRET_KEY;
    case 'recaptcha':
      return process.env.RECAPTCHA_SECRET_KEY;
    case 'azureb2c':
      return process.env.AZUREB2C_CLIENT_SECRET;
    default:
      return undefined;
  }
};

class CaptchaAdapter {
  private static instance: CaptchaAdapter;
  private readonly timeout = 10000; // 10 second timeout

  static getInstance(): CaptchaAdapter {
    if (!CaptchaAdapter.instance) {
      CaptchaAdapter.instance = new CaptchaAdapter();
    }
    return CaptchaAdapter.instance;
  }

  async verify(
    token: string, 
    provider: CaptchaProvider, 
    clientIP?: string,
    userAgent?: string
  ): Promise<CaptchaVerificationResult> {
    const timestamp = new Date();
    
    try {
      switch (provider) {
        case 'turnstile':
          return await this.verifyTurnstile(token, clientIP, timestamp);
        case 'hcaptcha':
          return await this.verifyHcaptcha(token, clientIP, timestamp);
        case 'recaptcha':
          return await this.verifyRecaptcha(token, clientIP, timestamp);
        case 'azureb2c':
          return await this.verifyAzureB2C(token, timestamp);
        default:
          throw this.createError(
            `Unsupported provider: ${provider}`,
            'UNSUPPORTED_PROVIDER',
            provider,
            false
          );
      }
    } catch (error) {
      if (error instanceof Error && 'provider' in error) {
        throw error;
      }
      
      throw this.createError(
        `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'VERIFICATION_FAILED',
        provider,
        true
      );
    }
  }

  private async verifyTurnstile(
    token: string, 
    clientIP?: string,
    timestamp?: Date
  ): Promise<CaptchaVerificationResult> {
    const secretKey = getSecretKey('turnstile');
    if (!secretKey) {
      throw this.createError(
        'Turnstile secret key not configured',
        'MISSING_SECRET_KEY',
        'turnstile',
        false
      );
    }

    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (clientIP) {
      formData.append('remoteip', clientIP);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'User-Agent': 'AILYDIAN-CAPTCHA/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.createError(
          `Turnstile API error: ${response.status}`,
          'API_ERROR',
          'turnstile',
          true
        );
      }

      const result: TurnstileResponse = await response.json();
      
      return {
        success: result.success,
        provider: 'turnstile',
        timestamp: timestamp || new Date(),
        challengeId: result.challenge_ts,
        errorCode: result['error-codes']?.[0],
        errorMessage: result['error-codes'] ? this.mapTurnstileError(result['error-codes'][0]) : undefined,
        metadata: {
          hostname: result.hostname,
          errorCodes: result['error-codes']
        }
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError('Request timeout', 'TIMEOUT', 'turnstile', true);
      }
      throw error;
    }
  }

  private async verifyHcaptcha(
    token: string,
    clientIP?: string, 
    timestamp?: Date
  ): Promise<CaptchaVerificationResult> {
    const secretKey = getSecretKey('hcaptcha');
    if (!secretKey) {
      throw this.createError(
        'hCaptcha secret key not configured',
        'MISSING_SECRET_KEY',
        'hcaptcha',
        false
      );
    }

    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (clientIP) {
      formData.append('remoteip', clientIP);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'User-Agent': 'AILYDIAN-CAPTCHA/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.createError(
          `hCaptcha API error: ${response.status}`,
          'API_ERROR',
          'hcaptcha',
          true
        );
      }

      const result: HcaptchaResponse = await response.json();
      
      return {
        success: result.success,
        provider: 'hcaptcha',
        timestamp: timestamp || new Date(),
        challengeId: result.challenge_ts,
        errorCode: result['error-codes']?.[0],
        errorMessage: result['error-codes'] ? this.mapHcaptchaError(result['error-codes'][0]) : undefined,
        metadata: {
          hostname: result.hostname,
          errorCodes: result['error-codes']
        }
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError('Request timeout', 'TIMEOUT', 'hcaptcha', true);
      }
      throw error;
    }
  }

  private async verifyRecaptcha(
    token: string,
    clientIP?: string,
    timestamp?: Date
  ): Promise<CaptchaVerificationResult> {
    const secretKey = getSecretKey('recaptcha');
    if (!secretKey) {
      throw this.createError(
        'reCAPTCHA secret key not configured',
        'MISSING_SECRET_KEY',
        'recaptcha',
        false
      );
    }

    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (clientIP) {
      formData.append('remoteip', clientIP);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'User-Agent': 'AILYDIAN-CAPTCHA/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.createError(
          `reCAPTCHA API error: ${response.status}`,
          'API_ERROR',
          'recaptcha',
          true
        );
      }

      const result: RecaptchaResponse = await response.json();
      
      return {
        success: result.success,
        provider: 'recaptcha',
        timestamp: timestamp || new Date(),
        challengeId: result.challenge_ts,
        errorCode: result['error-codes']?.[0],
        errorMessage: result['error-codes'] ? this.mapRecaptchaError(result['error-codes'][0]) : undefined,
        metadata: {
          hostname: result.hostname,
          errorCodes: result['error-codes'],
          score: result.score
        }
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError('Request timeout', 'TIMEOUT', 'recaptcha', true);
      }
      throw error;
    }
  }

  private async verifyAzureB2C(
    token: string,
    timestamp?: Date
  ): Promise<CaptchaVerificationResult> {
    // Azure B2C CAPTCHA verification
    // This would typically validate against Azure B2C custom policy
    const clientSecret = getSecretKey('azureb2c');
    if (!clientSecret) {
      throw this.createError(
        'Azure B2C client secret not configured',
        'MISSING_SECRET_KEY',
        'azureb2c',
        false
      );
    }

    // Placeholder implementation - in real scenario, validate against B2C
    if (token.startsWith('azureb2c_token_')) {
      return {
        success: true,
        provider: 'azureb2c',
        timestamp: timestamp || new Date(),
        challengeId: token,
        metadata: {
          claims: { captchaEntered: true, challengeType: 'visual' }
        }
      };
    }

    return {
      success: false,
      provider: 'azureb2c',
      timestamp: timestamp || new Date(),
      errorCode: 'INVALID_TOKEN',
      errorMessage: 'Invalid B2C token'
    };
  }

  private createError(
    message: string, 
    code: string, 
    provider: CaptchaProvider, 
    retryable: boolean
  ): CaptchaError {
    const error = new Error(message) as CaptchaError;
    error.code = code;
    error.provider = provider;
    error.retryable = retryable;
    return error;
  }

  private mapTurnstileError(code: string): string {
    switch (code) {
      case 'missing-input-secret':
        return 'Secret key eksik';
      case 'invalid-input-secret':
        return 'Geçersiz secret key';
      case 'missing-input-response':
        return 'CAPTCHA yanıtı eksik';
      case 'invalid-input-response':
        return 'Geçersiz CAPTCHA yanıtı';
      case 'timeout-or-duplicate':
        return 'CAPTCHA süresi dolmuş veya tekrarlanmış';
      default:
        return 'Bilinmeyen hata';
    }
  }

  private mapHcaptchaError(code: string): string {
    switch (code) {
      case 'missing-input-secret':
        return 'Secret key eksik';
      case 'invalid-input-secret':
        return 'Geçersiz secret key';
      case 'missing-input-response':
        return 'CAPTCHA yanıtı eksik';
      case 'invalid-input-response':
        return 'Geçersiz CAPTCHA yanıtı';
      case 'bad-request':
        return 'Hatalı istek';
      case 'invalid-or-already-seen-response':
        return 'Geçersiz veya daha önce kullanılmış yanıt';
      default:
        return 'Bilinmeyen hata';
    }
  }

  private mapRecaptchaError(code: string): string {
    switch (code) {
      case 'missing-input-secret':
        return 'Secret key eksik';
      case 'invalid-input-secret':
        return 'Geçersiz secret key';
      case 'missing-input-response':
        return 'CAPTCHA yanıtı eksik';
      case 'invalid-input-response':
        return 'Geçersiz CAPTCHA yanıtı';
      case 'bad-request':
        return 'Hatalı istek';
      case 'timeout-or-duplicate':
        return 'CAPTCHA süresi dolmuş veya tekrarlanmış';
      default:
        return 'Bilinmeyen hata';
    }
  }
}

// Singleton export
export const captchaAdapter = CaptchaAdapter.getInstance();

// Convenience functions
export async function verifyTurnstile(token: string, clientIP?: string) {
  return captchaAdapter.verify(token, 'turnstile', clientIP);
}

export async function verifyHcaptcha(token: string, clientIP?: string) {
  return captchaAdapter.verify(token, 'hcaptcha', clientIP);
}

export async function verifyRecaptcha(token: string, clientIP?: string) {
  return captchaAdapter.verify(token, 'recaptcha', clientIP);
}

export async function verifyAzureB2C(token: string) {
  return captchaAdapter.verify(token, 'azureb2c');
}
