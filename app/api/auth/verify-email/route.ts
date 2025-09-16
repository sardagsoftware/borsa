import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/tr/auth/signin?error=missing-token`);
    }

    // Hash the token to match with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: hashedToken,
        verificationTokenExpiry: {
          gte: new Date()
        }
      }
    });

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/tr/auth/signin?error=invalid-token`);
    }

    // Verify the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        isActive: true,
        verificationToken: null,
        verificationTokenExpiry: null
      }
    });

    // Log verification success
    console.log('Email verification successful:', {
      userId: user.id,
      email: user.email.replace(/(.{2}).*@/, '$1***@'),
      timestamp: new Date().toISOString()
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/tr/auth/signin?message=email-verified`);

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/tr/auth/signin?error=verification-failed`);
  } finally {
    await prisma.$disconnect();
  }
}
