import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { z } from 'zod';

const prisma = new PrismaClient();

const resendSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi gerekli').toLowerCase()
});

// Rate limiting for resend requests
const resendCounts = new Map();

function isResendRateLimited(email: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 3;

  const requests = resendCounts.get(email) || [];
  const validRequests = requests.filter((timestamp: number) => now - timestamp < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return true;
  }
  
  validRequests.push(now);
  resendCounts.set(email, validRequests);
  return false;
}

function generateVerificationToken(): { token: string; hashedToken: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return { token, hashedToken, expiresAt };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = resendSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Geçerli bir e-posta adresi gerekli' 
      }, { status: 400 });
    }

    const { email } = validationResult.data;

    // Rate limiting
    if (isResendRateLimited(email)) {
      return NextResponse.json({
        error: 'Çok fazla doğrulama e-postası gönderildi. 10 dakika sonra tekrar deneyin.'
      }, { status: 429 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        isActive: true
      }
    });

    if (!user) {
      // Don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: 'Eğer bu e-posta adresi sistemimizde kayıtlıysa, doğrulama e-postası gönderildi.'
      });
    }

    if (user.emailVerified && user.isActive) {
      return NextResponse.json({
        error: 'Bu hesap zaten doğrulanmış.'
      }, { status: 400 });
    }

    // Generate new verification token
    const { token, hashedToken, expiresAt } = generateVerificationToken();

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashedToken,
        verificationTokenExpiry: expiresAt
      }
    });

    // Log resend request
    console.log('Verification email resent:', {
      userId: user.id,
      email: user.email.replace(/(.{2}).*@/, '$1***@'),
      timestamp: new Date().toISOString()
    });

    // TODO: Send actual email
    console.log('Verification email to be sent:', {
      to: email,
      token: token,
      link: `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`
    });

    return NextResponse.json({
      success: true,
      message: 'Doğrulama e-postası gönderildi. E-posta adresinizi kontrol edin.'
    });

  } catch (error) {
    console.error('Email resend error:', error);
    return NextResponse.json({ 
      error: 'E-posta gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
