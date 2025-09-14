import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, validatePasswordStrength, sanitizeInput } from '@/lib/security';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedName = name ? sanitizeInput(name) : null;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors,
          score: passwordValidation.score
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        name: sanitizedName,
        password: hashedPassword,
        isActive: true,
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
        createdAt: true,
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

    return NextResponse.json({
      message: 'User created successfully',
      user
    }, { status: 201 });

  } catch (error) {
    console.error('User registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
