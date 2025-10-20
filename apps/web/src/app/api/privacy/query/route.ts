import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DifferentialPrivacyEngine, KAnonymityEngine } from '@ailydian/privacy';
import { z } from 'zod';

const querySchema = z.object({
  type: z.enum(['count', 'sum', 'average']),
  field: z.string().optional(),
  filter: z.record(z.any()).optional(),
  userId: z.string(),
  epsilon: z.number().optional().default(0.1),
  useKAnonymity: z.boolean().optional().default(false),
  k: z.number().optional().default(5),
});

const dpEngine = new DifferentialPrivacyEngine();
const kEngine = new KAnonymityEngine();

// POST /api/privacy/query - Privacy-preserving query
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = querySchema.parse(body);

    // Initialize privacy budget if not exists
    if (!dpEngine.getBudget(validated.userId)) {
      dpEngine.initBudget(validated.userId, 1.0); // ε = 1.0 total budget
    }

    let result: any;

    switch (validated.type) {
      case 'count':
        // Example: Count users
        const actualCount = await prisma.user.count({
          where: validated.filter as any,
        });

        const { noisyCount, budgetRemaining } = dpEngine.privateCount(
          actualCount,
          validated.userId,
          validated.epsilon
        );

        result = {
          type: 'count',
          value: noisyCount,
          budgetRemaining,
          mechanism: 'differential_privacy',
          epsilon: validated.epsilon,
        };
        break;

      case 'sum':
      case 'average':
        // Would implement aggregation queries here
        result = {
          type: validated.type,
          value: 0,
          budgetRemaining: dpEngine.getBudget(validated.userId)?.remaining,
          mechanism: 'not_implemented',
        };
        break;
    }

    // Apply K-anonymity if requested
    if (validated.useKAnonymity) {
      // Example: anonymize user data
      const users = await prisma.user.findMany({
        where: validated.filter as any,
        take: 100,
      });

      const anonymized = kEngine.anonymize(
        users,
        [
          { field: 'email', type: 'categorical' },
          { field: 'createdAt', type: 'date' },
        ],
        validated.k,
        [
          { field: 'email', method: 'suppression' },
        ]
      );

      result.kAnonymity = {
        k: anonymized.k,
        wasGeneralized: anonymized.wasGeneralized,
        suppressedRecords: anonymized.suppressedRecords,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Privacy query error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/privacy/budget?userId=xxx - Check privacy budget
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const budget = dpEngine.getBudget(userId);

    if (!budget) {
      return NextResponse.json({
        userId,
        budgetInitialized: false,
        message: 'No budget initialized for this user',
      });
    }

    return NextResponse.json({
      userId,
      budget: {
        epsilon: budget.epsilon,
        delta: budget.delta,
        spent: budget.spent,
        remaining: budget.remaining,
        percentUsed: (budget.spent / budget.epsilon) * 100,
      },
    });
  } catch (error) {
    console.error('Get budget error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
