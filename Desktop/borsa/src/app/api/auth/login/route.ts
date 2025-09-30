/**
 * SECURE AUTHENTICATION API
 * Backend-only authentication with bcrypt + JWT
 * NIRVANA Level Security Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Environment validation
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars-12345678';
const PASSWORD_HASH = process.env.PASSWORD_HASH || '$2b$12$PvxW9uiX4ImXi/vLDhHnXOgnF1cnTchlNAyi0/wN04qc6/GSjSTVS'; // Demo2025!
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'demo@ailydian.com';

// Zod validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  captcha: z.string().min(6, 'Captcha must be 6 characters'),
  expectedCaptcha: z.string().min(6)
});

// Rate limiting simulation (in-memory)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * POST /api/auth/login
 * Secure login with bcrypt password verification and JWT token generation
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  try {
    // Rate limiting check
    const attempts = loginAttempts.get(ip);
    if (attempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;

      if (attempts.count >= MAX_ATTEMPTS && timeSinceLastAttempt < LOCKOUT_DURATION) {
        const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 60000);
        return NextResponse.json(
          {
            success: false,
            error: 'Too many failed attempts',
            message: `Çok fazla başarısız deneme. ${remainingTime} dakika sonra tekrar deneyin.`,
            lockoutRemaining: remainingTime
          },
          { status: 429 }
        );
      }

      // Reset if lockout period has passed
      if (timeSinceLastAttempt >= LOCKOUT_DURATION) {
        loginAttempts.delete(ip);
      }
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { email, password, captcha, expectedCaptcha } = validation.data;

    // Captcha validation
    if (captcha !== expectedCaptcha) {
      incrementLoginAttempts(ip);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid captcha',
          message: 'Güvenlik kodu hatalı'
        },
        { status: 400 }
      );
    }

    // Email validation
    if (email !== ADMIN_EMAIL) {
      incrementLoginAttempts(ip);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'E-posta veya şifre hatalı'
        },
        { status: 401 }
      );
    }

    // Password verification with bcrypt
    const isValidPassword = await bcrypt.compare(password, PASSWORD_HASH);

    if (!isValidPassword) {
      incrementLoginAttempts(ip);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'E-posta veya şifre hatalı'
        },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(ip);

    // Generate JWT token
    const token = jwt.sign(
      {
        email,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      JWT_SECRET,
      { algorithm: 'HS256' }
    );

    // Create secure response with HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'Giriş başarılı',
      user: {
        email,
        role: 'admin'
      }
    });

    // Set secure cookie with all security flags
    response.cookies.set('lydian-auth', token, {
      httpOnly: true,      // Prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',  // CSRF protection
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');

    return response;

  } catch (error) {
    console.error('[AUTH ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication failed',
        message: 'Bir hata oluştu. Lütfen tekrar deneyin.'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: Increment failed login attempts
 */
function incrementLoginAttempts(ip: string) {
  const attempts = loginAttempts.get(ip);
  if (attempts) {
    loginAttempts.set(ip, {
      count: attempts.count + 1,
      lastAttempt: Date.now()
    });
  } else {
    loginAttempts.set(ip, {
      count: 1,
      lastAttempt: Date.now()
    });
  }
}

/**
 * GET /api/auth/login
 * Not allowed - login requires POST
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to login.' },
    { status: 405 }
  );
}