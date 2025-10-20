import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  userId: z.string(),
  preferredModel: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  customSettings: z.record(z.any()).optional(),
});

// GET /api/preferences?userId=xxx - Get user preferences
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      return NextResponse.json({
        preferences: {
          userId,
          preferredModel: null,
          temperature: 0.7,
          maxTokens: 4096,
          customSettings: {},
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/preferences - Update user preferences
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = updateSchema.parse(body);

    const preferences = await prisma.userPreference.upsert({
      where: { userId: validated.userId },
      update: {
        preferredModel: validated.preferredModel,
        temperature: validated.temperature,
        maxTokens: validated.maxTokens,
        customSettings: validated.customSettings as any,
      },
      create: {
        userId: validated.userId,
        preferredModel: validated.preferredModel,
        temperature: validated.temperature,
        maxTokens: validated.maxTokens,
        customSettings: validated.customSettings as any,
      },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Update preferences error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
