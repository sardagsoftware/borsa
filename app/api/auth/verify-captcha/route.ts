import { NextRequest, NextResponse } from 'next/server';

// ReCAPTCHA v3 doğrulama fonksiyonu
async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!token || !process.env.RECAPTCHA_SECRET_KEY) return false;
  
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });
    
    const data = await response.json();
    return data.success && data.score > 0.5; // 0.5 üstü güvenilir kabul et
  } catch (error) {
    console.error('ReCAPTCHA verification error:', error);
    return false;
  }
}

// Cloudflare Turnstile doğrulama fonksiyonu
async function verifyTurnstile(token: string): Promise<boolean> {
  if (!token || !process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) return false;
  
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recaptchaToken, cloudflareToken, email, password } = await request.json();
    
    // Development bypass
    if (process.env.NODE_ENV === 'development' && email === 'demo@ailydian.com') {
      console.log('Development mode: CAPTCHA bypass for demo user');
      return NextResponse.json({ 
        success: true, 
        message: 'CAPTCHA doğrulandı (development bypass)',
        verified: 'development-bypass'
      });
    }
    
    // En az bir CAPTCHA doğrulaması gerekli
    const recaptchaValid = recaptchaToken ? await verifyRecaptcha(recaptchaToken) : false;
    const turnstileValid = cloudflareToken ? await verifyTurnstile(cloudflareToken) : false;
    
    if (!recaptchaValid && !turnstileValid) {
      return NextResponse.json(
        { error: 'CAPTCHA doğrulaması başarısız' },
        { status: 400 }
      );
    }
    
    // Rate limiting kontrolü (IP bazlı)
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `login_attempt_${clientIP}`;
    
    // Gerçek bir uygulamada Redis veya veritabanı kullanın
    // Burada basit bir in-memory cache örneği
    
    // Başarılı doğrulama
    return NextResponse.json({ 
      success: true, 
      message: 'CAPTCHA doğrulandı',
      verified: recaptchaValid ? 'recaptcha' : 'turnstile'
    });
    
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
