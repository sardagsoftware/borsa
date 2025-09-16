/**

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'; * 🛡️ AILYDIAN — SOC++ Sigma Evaluate API
 * 
 * Sigma rules evaluation endpoint
 * - Evaluate events against Sigma rules
 * - Real-time detection and matching
 * - Batch evaluation support
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SigmaRuleEngine } from '@/lib/security/sigma';

interface EvaluationMatch {
  ruleId: string;
  ruleTitle: string;
  ruleLevel: string;
  matchedFields: Record<string, unknown>;
  riskScore: number;
  confidence: number;
  mitreAttackIds?: string[];
}

interface EvaluationResult {
  event: Record<string, unknown>;
  matches: EvaluationMatch[];
  evaluationTime?: number;
  error?: string;
}

interface SigmaMatch {
  timestamp: Date;
  ruleId: string;
  eventId?: string;
  source: string;
  fields: Record<string, unknown>;
  riskScore: number;
  rule: {
    id: string;
    title: string;
    level: string;
    tags?: string[];
  };
}

interface SigmaMatchResult {
  ruleId: string;
  ruleName: string;
  fields: Record<string, unknown>;
  riskScore: number;
  confidence: number;
}

interface RuleWithCount {
  count: number;
  rule: {
    id: string;
    title: string;
    level: string;
    tags?: string[];
  };
}

interface TopRule {
  ruleId: string;
  title: string;
  level: string;
  matchCount: number;
}

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, ruleIds, options } = body;

    // Validate input
    if (!events || (!Array.isArray(events) && typeof events !== 'object')) {
      return NextResponse.json(
        { error: 'Events data is required (single event object or array)' },
        { status: 400 }
      );
    }

    // Normalize to array
    const eventArray = Array.isArray(events) ? events : [events];

    // Initialize Sigma engine
    const sigmaEngine = new SigmaRuleEngine();

    // Get rules to evaluate
    let rulesToEvaluate = null;
    if (ruleIds && Array.isArray(ruleIds) && ruleIds.length > 0) {
      // Use specific rules
      rulesToEvaluate = await prisma.sigmaRule.findMany({
        where: {
          id: { in: ruleIds },
          enabled: true
        }
      });
    } else {
      // Use all enabled rules
      rulesToEvaluate = await prisma.sigmaRule.findMany({
        where: { enabled: true },
        take: options?.maxRules || 1000
      });
    }

    if (rulesToEvaluate.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalEvents: eventArray.length,
          totalRules: 0,
          matches: [],
          evaluationStats: {
            totalEvaluations: 0,
            matchingEvaluations: 0,
            averageEvaluationTime: 0
          }
        }
      });
    }

    // Evaluate events
    const results: EvaluationResult[] = [];
    const evaluationStats = {
      totalEvaluations: 0,
      matchingEvaluations: 0,
      totalEvaluationTime: 0,
      averageEvaluationTime: 0
    };

    for (const event of eventArray) {
      const startTime = Date.now();
      
      try {
        // Convert to SOC event format
        const socEvent = {
          id: event.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(event.timestamp || Date.now()),
          source: (event.source as 'cloudflare' | 'vercel' | 'waf' | 'secscan' | 'osint' | 'anomaly') || 'anomaly',
          eventType: event.eventType || 'generic',
          signal: event.signal || event.data || event,
          data: event
        };

        // Evaluate event against all rules
        const ruleIdsToEvaluate = rulesToEvaluate.map(rule => rule.id);
        const evaluationResult = await sigmaEngine.evaluateEvents([socEvent], ruleIdsToEvaluate);

        evaluationStats.totalEvaluations++;
        const eventMatches = evaluationResult.matches || [];
        if (eventMatches.length > 0) {
          evaluationStats.matchingEvaluations++;
        }
        
        // Store matches in database if requested
        if (options?.saveMatches !== false && eventMatches.length > 0) {
          for (const match of eventMatches) {
            await prisma.sigmaMatch.create({
              data: {
                timestamp: new Date(),
                ruleId: match.ruleId,
                eventId: socEvent.id,
                source: socEvent.source,
                fields: match.fields || {},
                riskScore: match.riskScore || 0
              }
            });
          }
        }

        results.push({
          event: options?.includeEvents ? event : { id: socEvent.id },
          matches: eventMatches.map((match: SigmaMatchResult) => ({
            ruleId: match.ruleId,
            ruleTitle: match.ruleName,
            ruleLevel: 'medium', // Default level, can be enhanced
            matchedFields: match.fields,
            riskScore: match.riskScore,
            confidence: match.confidence,
            mitreAttackIds: []
          })),
          evaluationTime: Date.now() - startTime
        });

        evaluationStats.totalEvaluationTime += Date.now() - startTime;

      } catch (evaluationError) {
        console.error('Event evaluation error:', evaluationError);
        results.push({
          event: { id: event.id || 'unknown' },
          matches: [],
          error: evaluationError instanceof Error ? evaluationError.message : 'Evaluation failed',
          evaluationTime: Date.now() - startTime
        });
        evaluationStats.totalEvaluations++;
      }
    }

    // Calculate final statistics
    evaluationStats.averageEvaluationTime = evaluationStats.totalEvaluations > 0 
      ? evaluationStats.totalEvaluationTime / evaluationStats.totalEvaluations 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalEvents: eventArray.length,
        totalRules: rulesToEvaluate.length,
        results,
        evaluationStats,
        summary: {
          totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0),
          eventsWithMatches: results.filter(r => r.matches.length > 0).length,
          highRiskMatches: results.reduce((sum, r) => 
            sum + r.matches.filter((m: EvaluationMatch) => m.riskScore >= 70).length, 0
          ),
          criticalMatches: results.reduce((sum, r) => 
            sum + r.matches.filter((m: EvaluationMatch) => m.ruleLevel === 'critical').length, 0
          )
        }
      }
    });

  } catch (error) {
    console.error('Sigma evaluate error:', error);
    return NextResponse.json(
      { 
        error: 'Evaluation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        return handleEvaluationStats(searchParams);
        
      case 'rules':
        return handleEvaluationRules(searchParams);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: stats, rules' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Sigma evaluate GET error:', error);
    return NextResponse.json(
      { 
        error: 'Request failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle evaluation statistics request
 */
async function handleEvaluationStats(searchParams: URLSearchParams) {
  const timeframe = searchParams.get('timeframe') || '24h';
  const ruleId = searchParams.get('ruleId');

  // Calculate time range
  const timeRanges = {
    '1h': 1 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  const timeRange = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['24h'];
  const startTime = new Date(Date.now() - timeRange);

  // Build query conditions
  const where: Record<string, unknown> = {
    timestamp: {
      gte: startTime
    }
  };

  if (ruleId) {
    where.ruleId = ruleId;
  }

  // Get matches and statistics
  const matches = await prisma.sigmaMatch.findMany({
    where,
    include: {
      rule: {
        select: {
          id: true,
          title: true,
          level: true,
          tags: true
        }
      }
    },
    orderBy: { timestamp: 'desc' }
  });

  // Calculate statistics
  const stats = {
    totalMatches: matches.length,
    uniqueRules: new Set(matches.map(m => m.ruleId)).size,
    averageRiskScore: matches.length > 0 
      ? matches.reduce((sum, m) => sum + m.riskScore, 0) / matches.length 
      : 0,
    levelDistribution: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    },
    topRules: [] as TopRule[],
    recentMatches: matches.slice(0, 10),
    timelineData: generateTimelineData(matches, timeframe)
  };

  // Level distribution
  matches.forEach(match => {
    const level = match.rule.level as keyof typeof stats.levelDistribution;
    if (stats.levelDistribution[level] !== undefined) {
      stats.levelDistribution[level]++;
    }
  });

  // Top rules by match count
  const ruleCounts: Record<string, RuleWithCount> = {};
  matches.forEach(match => {
    if (!ruleCounts[match.ruleId]) {
      ruleCounts[match.ruleId] = { 
        count: 0, 
        rule: {
          id: match.rule.id,
          title: match.rule.title,
          level: match.rule.level,
          tags: Array.isArray(match.rule.tags) ? match.rule.tags as string[] : []
        }
      };
    }
    ruleCounts[match.ruleId].count++;
  });

  stats.topRules = Object.entries(ruleCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([ruleId, data]) => ({
      ruleId,
      title: data.rule.title,
      level: data.rule.level,
      matchCount: data.count
    }));

  return NextResponse.json({
    success: true,
    data: {
      timeframe,
      stats
    }
  });
}

/**
 * Handle evaluation rules request
 */
async function handleEvaluationRules(searchParams: URLSearchParams) {
  const enabled = searchParams.get('enabled');
  const level = searchParams.get('level');
  const tag = searchParams.get('tag');

  const where: Record<string, unknown> = {};

  if (enabled !== null) {
    where.enabled = enabled === 'true';
  }

  if (level) {
    where.level = level;
  }

  if (tag) {
    where.tags = { has: tag };
  }

  const rules = await prisma.sigmaRule.findMany({
    where,
    select: {
      id: true,
      title: true,
      level: true,
      tags: true,
      enabled: true,
      _count: {
        select: { matches: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return NextResponse.json({
    success: true,
    data: {
      rules: rules.map(rule => ({
        ...rule,
        tags: Array.isArray(rule.tags) ? rule.tags : [],
        matchCount: rule._count.matches
      }))
    }
  });
}

/**
 * Generate timeline data for matches
 */
function generateTimelineData(matches: Array<{timestamp: Date}>, timeframe: string) {
  const timelineData: Array<{ timestamp: string; count: number }> = [];
  
  if (matches.length === 0) {
    return timelineData;
  }

  // Determine bucket size based on timeframe
  const bucketSizes = {
    '1h': 5 * 60 * 1000,     // 5 minute buckets
    '24h': 60 * 60 * 1000,   // 1 hour buckets
    '7d': 4 * 60 * 60 * 1000, // 4 hour buckets
    '30d': 24 * 60 * 60 * 1000 // 1 day buckets
  };

  const bucketSize = bucketSizes[timeframe as keyof typeof bucketSizes] || bucketSizes['24h'];
  const buckets: Record<string, number> = {};

  // Group matches into time buckets
  matches.forEach(match => {
    const timestamp = new Date(match.timestamp);
    const bucketTime = new Date(Math.floor(timestamp.getTime() / bucketSize) * bucketSize);
    const bucketKey = bucketTime.toISOString();
    
    buckets[bucketKey] = (buckets[bucketKey] || 0) + 1;
  });

  // Convert to timeline format
  Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([timestamp, count]) => {
      timelineData.push({ timestamp, count });
    });

  return timelineData;
}
