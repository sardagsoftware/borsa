import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Enhanced validation schema
const registerSchema = z.object({
  firstName: z.string().min(1, 'İsim gerekli').max(50, 'İsim çok uzun'),
  lastName: z.string().min(1, 'Soyisim gerekli').max(50, 'Soyisim çok uzun'),
  email: z.string().email('Geçerli bir e-posta adresi gerekli').toLowerCase(),
  password: z.string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermeli')
    .regex(/[a-z]/, 'Şifre en az bir küçük harf içermeli')
    .regex(/\d/, 'Şifre en az bir rakam içermeli')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Şifre en az bir özel karakter içermeli'),
  confirmPassword: z.string(),
  captchaToken: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword']
});

// Basic rate limiting with memory store
const requestCounts = new Map();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;

  const requests = requestCounts.get(ip) || [];
  const validRequests = requests.filter((timestamp: number) => now - timestamp < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return true;
  }
  
  validRequests.push(now);
  requestCounts.set(ip, validRequests);
  return false;
}

// VPN Detection
function detectVPN(ip: string): { isVPN: boolean; confidence: number } {
  // Known VPN IP ranges (simplified)
  const vpnRanges = [
    /^185\.156\./, /^185\.246\./, /^104\.200\./, /^45\.12\./
  ];

  for (const range of vpnRanges) {
    if (range.test(ip)) {
      return { isVPN: true, confidence: 0.9 };
    }
  }

  // Private IP ranges are not VPNs
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
    return { isVPN: false, confidence: 0.1 };
  }

  return { isVPN: false, confidence: 0.2 };
}

// Bot Detection
function detectBot(userAgent: string): { isBot: boolean; confidence: number } {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
    /headless/i, /phantom/i, /selenium/i
  ];

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return { isBot: true, confidence: 0.9 };
    }
  }

  return { isBot: false, confidence: 0.1 };
}

// Hash password
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Sanitize input
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// Basic CAPTCHA verification
async function verifyCaptcha(token: string): Promise<{ success: boolean; error?: string }> {
  if (!token || token === 'stepper_verified') {
    return { success: true };
  }

  // Placeholder for actual CAPTCHA verification
  // In production, this would call reCAPTCHA or similar service
  return { success: true };
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 
                     'unknown';

    // Rate limiting
    if (isRateLimited(clientIP)) {
      return NextResponse.json({
        error: 'Çok fazla kayıt denemesi. 15 dakika sonra tekrar deneyin.'
      }, { status: 429 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return NextResponse.json({ 
        error: 'Form doğrulama hatası', 
        details: errors 
      }, { status: 400 });
    }

    const { firstName, lastName, email, password, captchaToken } = validationResult.data;
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // CAPTCHA verification
    if (process.env.CAPTCHA_ENABLED === 'true' && captchaToken) {
      const captchaResult = await verifyCaptcha(captchaToken);
      if (!captchaResult.success) {
        return NextResponse.json({ 
          error: 'CAPTCHA doğrulaması başarısız' 
        }, { status: 400 });
      }
    }

    // VPN Detection
    const vpnDetection = detectVPN(clientIP);
    if (vpnDetection.isVPN && vpnDetection.confidence > 0.7) {
      console.log('VPN registration blocked:', {
        email: email.replace(/(.{2}).*@/, '$1***@'),
        ip: clientIP.replace(/\.\d+\.\d+$/, '.***.**'),
        confidence: vpnDetection.confidence
      });
      
      return NextResponse.json({ 
        error: 'VPN veya proxy kullanılarak kayıt oluşturulamaz.' 
      }, { status: 403 });
    }

    // Bot Detection
    const botDetection = detectBot(userAgent);
    if (botDetection.isBot && botDetection.confidence > 0.6) {
      console.log('Bot registration blocked:', {
        email: email.replace(/(.{2}).*@/, '$1***@'),
        ip: clientIP.replace(/\.\d+\.\d+$/, '.***.**'),
        userAgent,
        confidence: botDetection.confidence
      });
      
      return NextResponse.json({ 
        error: 'Otomatik kayıt tespit edildi. İnsan doğrulaması gerekli.' 
      }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizeInput(email).toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Bu e-posta adresi ile zaten bir hesap mevcut' 
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: sanitizeInput(email).toLowerCase(),
        name: `${sanitizeInput(firstName)} ${sanitizeInput(lastName)}`,
        password: hashedPassword,
        isActive: false, // Email verification required
        riskLevel: 'MEDIUM',
        maxDailyLoss: 1000.0,
        twoFactorEnabled: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        riskLevel: true,
        createdAt: true
      }
    });

    // Create default risk settings
    await prisma.riskSetting.create({
      data: {
        userId: user.id,
        maxDailyLoss: 1000.0,
        maxPositionSize: 10000.0,
        maxLeverage: 10.0,
        stopLossPercent: 2.0,
        takeProfitPercent: 5.0,
        maxPositions: 10,
        maxCorrelation: 0.7,
        aiTradingEnabled: false,
        minAiConfidence: 0.7,
      }
    });

    // Log registration
    console.log('User registration successful:', {
      userId: user.id,
      email: user.email.replace(/(.{2}).*@/, '$1***@'),
      ip: clientIP.replace(/\.\d+\.\d+$/, '.***.**'),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Hesabınız başarıyla oluşturuldu. E-posta doğrulaması için lütfen e-postanızı kontrol edin.',
      userId: user.id
    }, { 
      status: 201,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    return NextResponse.json({ 
      error: 'Kayıt sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.' 
    }, { 
      status: 500,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}
