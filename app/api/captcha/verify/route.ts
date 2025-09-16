import { NextRequest, NextResponse } from 'next/server';
import { captchaAdapter, CaptchaError } from '@/lib/security/captcha/adapter';
import { captchaRateLimiter, withRateLimit } from '@/lib/security/rate-limit';
import { CaptchaProvider } from '@/components/security/CaptchaProviderMount';

interface CaptchaVerifyRequest {
  token: string;
  provider: CaptchaProvider;
  userAgent?: string;
}

interface CaptchaVerifyResponse {
  success: boolean;
  provider: CaptchaProvider;
  timestamp: string;
  challengeId?: string;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  rateLimit?: {
    limit: number;
    remaining: number;
    resetTime: string;
  };
}

// Configuration
const CAPTCHA_ENABLED = process.env.CAPTCHA_ENABLED !== 'false';
const CAPTCHA_PROVIDER = (process.env.CAPTCHA_PROVIDER as CaptchaProvider) || 'turnstile';

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0'
};

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         request.ip || 
         'unknown';
}

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  if (!origin && !referer) return false;
  
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ].filter(Boolean);
  
  const requestOrigin = origin || (referer ? new URL(referer).origin : '');
  
  return allowedOrigins.some(allowed => 
    allowed && requestOrigin.startsWith(allowed)
  );
}

function maskToken(token: string): string {
  if (token.length <= 8) return '***';
  return token.substring(0, 4) + '*'.repeat(token.length - 8) + token.substring(token.length - 4);
}

export async function GET(request: NextRequest) {
  try {
    const info = {
      enabled: CAPTCHA_ENABLED,
      provider: CAPTCHA_PROVIDER,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      rateLimit: {
        windowMs: 60000,
        maxRequests: 10
      }
    };

    return NextResponse.json(info, {
      status: 200,
      headers: securityHeaders
    });
  } catch (error) {
    console.error('CAPTCHA info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: securityHeaders
      }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check if CAPTCHA is enabled
    if (!CAPTCHA_ENABLED) {
      return NextResponse.json({
        success: true,
        provider: CAPTCHA_PROVIDER,
        timestamp: new Date().toISOString(),
        message: 'CAPTCHA is disabled'
      }, {
        status: 200,
        headers: securityHeaders
      });
    }

    // Validate origin/CSRF
    if (!validateOrigin(request)) {
      console.warn('CAPTCHA request from invalid origin:', {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        userAgent: request.headers.get('user-agent'),
        ip: getClientIP(request)
      });
      
      return NextResponse.json(
        { error: 'Invalid origin' },
        { 
          status: 403,
          headers: securityHeaders
        }
      );
    }

    // Apply rate limiting
    const { result, rateLimitResult } = await withRateLimit(captchaRateLimiter)(
      request,
      async (req) => {
        return await processVerification(req);
      }
    );

    if (!rateLimitResult.success) {
      const response: CaptchaVerifyResponse = {
        success: false,
        provider: CAPTCHA_PROVIDER,
        timestamp: new Date().toISOString(),
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          retryable: true
        },
        rateLimit: {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime.toISOString()
        }
      };

      return NextResponse.json(response, {
        status: 429,
        headers: {
          ...securityHeaders,
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime.getTime() / 1000).toString()
        }
      });
    }

    // Add rate limit headers to successful response
    const headers = {
      ...securityHeaders,
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime.getTime() / 1000).toString()
    };

    if (result) {
      const typedResult = result as CaptchaVerifyResponse;
      return NextResponse.json(typedResult, { 
        status: typedResult.success ? 200 : 400, 
        headers 
      });
    } else {
      return NextResponse.json({
        success: false,
        provider: CAPTCHA_PROVIDER,
        timestamp: new Date().toISOString(),
        error: {
          code: 'PROCESSING_ERROR',
          message: 'Failed to process verification',
          retryable: true
        }
      } as CaptchaVerifyResponse, { 
        status: 500, 
        headers 
      });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('CAPTCHA verification error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent')
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: securityHeaders
      }
    );
  }
}

async function processVerification(request: NextRequest): Promise<CaptchaVerifyResponse> {
  let body: CaptchaVerifyRequest;
  
  try {
    body = await request.json();
  } catch (error) {
    return {
      success: false,
      provider: CAPTCHA_PROVIDER,
      timestamp: new Date().toISOString(),
      error: {
        code: 'INVALID_REQUEST',
        message: 'Invalid JSON body',
        retryable: false
      }
    };
  }

  // Validate request body
  if (!body.token || typeof body.token !== 'string') {
    return {
      success: false,
      provider: CAPTCHA_PROVIDER,
      timestamp: new Date().toISOString(),
      error: {
        code: 'MISSING_TOKEN',
        message: 'Token is required',
        retryable: false
      }
    };
  }

  if (!body.provider || !['turnstile', 'hcaptcha', 'recaptcha', 'azureb2c'].includes(body.provider)) {
    return {
      success: false,
      provider: CAPTCHA_PROVIDER,
      timestamp: new Date().toISOString(),
      error: {
        code: 'INVALID_PROVIDER',
        message: 'Invalid provider',
        retryable: false
      }
    };
  }

  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent');

  try {
    console.log('CAPTCHA verification attempt:', {
      provider: body.provider,
      tokenLength: body.token.length,
      tokenMasked: maskToken(body.token),
      clientIP: clientIP.substring(0, 10) + '...',
      userAgent: userAgent?.substring(0, 50) + '...'
    });

    const verificationResult = await captchaAdapter.verify(
      body.token,
      body.provider,
      clientIP,
      userAgent || undefined
    );

    const response: CaptchaVerifyResponse = {
      success: verificationResult.success,
      provider: verificationResult.provider,
      timestamp: verificationResult.timestamp.toISOString(),
      challengeId: verificationResult.challengeId
    };

    if (!verificationResult.success) {
      response.error = {
        code: verificationResult.errorCode || 'VERIFICATION_FAILED',
        message: verificationResult.errorMessage || 'Verification failed',
        retryable: true
      };
    }

    // Log result (without sensitive data)
    console.log('CAPTCHA verification result:', {
      success: response.success,
      provider: response.provider,
      challengeId: response.challengeId,
      errorCode: response.error?.code,
      clientIP: clientIP.substring(0, 10) + '...'
    });

    return response;

  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const captchaError = error as CaptchaError;
      return {
        success: false,
        provider: captchaError.provider,
        timestamp: new Date().toISOString(),
        error: {
          code: captchaError.code,
          message: captchaError.message,
          retryable: captchaError.retryable
        }
      };
    }

    throw error;
  }
}
