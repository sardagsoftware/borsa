/**
 * 🛡️ AILYDIAN — SOC++ Sigma Matches API
 * 
 * Sigma match history and management
 * - Retrieve match history
 * - Match analysis and statistics
 * - False positive handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ruleId = searchParams.get('ruleId');
    const source = searchParams.get('source');
    const level = searchParams.get('level');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const timeframe = searchParams.get('timeframe') || '24h';

    // Calculate time range
    const timeRanges = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const timeRange = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['24h'];
    const startTime = new Date(Date.now() - timeRange);

    // Build where conditions
    const where: Record<string, unknown> = {
      timestamp: {
        gte: startTime
      }
    };

    if (ruleId) {
      where.ruleId = ruleId;
    }

    if (source) {
      where.source = source;
    }

    // For level filtering, we need to join with rule
    const includeRule = level || true;

    const matches = await prisma.sigmaMatch.findMany({
      where,
      include: {
        rule: includeRule ? {
          select: {
            id: true,
            title: true,
            level: true,
            tags: true
          }
        } : false
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Filter by rule level if specified
    const filteredMatches = level 
      ? matches.filter(match => match.rule?.level === level)
      : matches;

    // Get total count for pagination
    const totalCount = await prisma.sigmaMatch.count({
      where
    });

    return NextResponse.json({
      success: true,
      data: {
        matches: filteredMatches.map(match => ({
          id: match.id,
          timestamp: match.timestamp,
          ruleId: match.ruleId,
          ruleName: match.rule?.title || 'Unknown Rule',
          ruleLevel: match.rule?.level || 'unknown',
          ruleTags: Array.isArray(match.rule?.tags) ? match.rule.tags : [],
          eventId: match.eventId,
          source: match.source,
          fields: match.fields,
          riskScore: match.riskScore
        })),
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        timeframe,
        filters: {
          ruleId: ruleId || null,
          source: source || null,
          level: level || null
        }
      }
    });

  } catch (error) {
    console.error('Sigma matches error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve matches', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get('matchId');
    const ruleId = searchParams.get('ruleId');
    const action = searchParams.get('action');

    if (action === 'mark_false_positive') {
      return handleMarkFalsePositive(matchId, ruleId);
    }

    if (matchId) {
      // Delete specific match
      const deletedMatch = await prisma.sigmaMatch.delete({
        where: { id: matchId }
      });

      return NextResponse.json({
        success: true,
        data: {
          deletedMatchId: deletedMatch.id,
          message: 'Match deleted successfully'
        }
      });
    }

    if (ruleId) {
      // Delete all matches for a rule
      const deletedMatches = await prisma.sigmaMatch.deleteMany({
        where: { ruleId }
      });

      return NextResponse.json({
        success: true,
        data: {
          deletedCount: deletedMatches.count,
          message: `Deleted ${deletedMatches.count} matches for rule ${ruleId}`
        }
      });
    }

    return NextResponse.json(
      { error: 'Either matchId or ruleId is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Sigma match delete error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete match(es)', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle false positive marking
 */
async function handleMarkFalsePositive(matchId: string | null, ruleId: string | null) {
  if (!matchId && !ruleId) {
    return NextResponse.json(
      { error: 'Either matchId or ruleId is required for false positive marking' },
      { status: 400 }
    );
  }

  try {
    if (matchId) {
      // Mark specific match as false positive (for now just delete)
      const match = await prisma.sigmaMatch.findUnique({
        where: { id: matchId },
        include: { rule: true }
      });

      if (!match) {
        return NextResponse.json(
          { error: 'Match not found' },
          { status: 404 }
        );
      }

      // TODO: Create false positive tracking system
      // For now, just delete the match
      await prisma.sigmaMatch.delete({
        where: { id: matchId }
      });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Match marked as false positive and removed',
          matchId: match.id,
          ruleId: match.ruleId
        }
      });
    }

    if (ruleId) {
      // Mark all matches for a rule as false positive
      const matches = await prisma.sigmaMatch.findMany({
        where: { ruleId }
      });

      if (matches.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            message: 'No matches found for the rule',
            markedCount: 0
          }
        });
      }

      // Create false positive records for all matches (TODO: implement proper tracking)
      // For now, just delete all matches
      const deleteResult = await prisma.sigmaMatch.deleteMany({
        where: { ruleId }
      });

      return NextResponse.json({
        success: true,
        data: {
          message: `${deleteResult.count} matches marked as false positive and removed`,
          markedCount: deleteResult.count,
          ruleId
        }
      });
    }

  } catch (error) {
    console.error('False positive marking error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to mark as false positive', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
