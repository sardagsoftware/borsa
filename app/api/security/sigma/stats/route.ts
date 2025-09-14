/**
 * 🛡️ AILYDIAN — SOC++ Sigma Statistics API
 * 
 * Sigma detection statistics and analytics
 * - Rule performance metrics
 * - Detection coverage analysis
 * - MITRE ATT&CK coverage
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'overview';
    const timeframe = searchParams.get('timeframe') || '24h';
    const ruleId = searchParams.get('ruleId');

    switch (action) {
      case 'overview':
        return handleOverviewStats(timeframe);
        
      case 'rules':
        return handleRulesStats(timeframe);
        
      case 'coverage':
        return handleCoverageStats();
        
      case 'performance':
        return handlePerformanceStats(timeframe, ruleId);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: overview, rules, coverage, performance' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Sigma statistics error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve statistics', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle overview statistics
 */
async function handleOverviewStats(timeframe: string) {
  // Calculate time range
  const timeRanges = {
    '1h': 1 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  const timeRange = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['24h'];
  const startTime = new Date(Date.now() - timeRange);

  // Get total rules count
  const totalRules = await prisma.sigmaRule.count();
  const enabledRules = await prisma.sigmaRule.count({
    where: { enabled: true }
  });

  // Get matches in timeframe
  const matches = await prisma.sigmaMatch.findMany({
    where: {
      timestamp: { gte: startTime }
    },
    include: {
      rule: {
        select: {
          level: true,
          tags: true
        }
      }
    }
  });

  // Calculate statistics
  const stats = {
    totalRules,
    enabledRules,
    disabledRules: totalRules - enabledRules,
    totalMatches: matches.length,
    uniqueRulesMatched: new Set(matches.map(m => m.ruleId)).size,
    
    // Level distribution
    levelDistribution: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    },
    
    // Source distribution
    sourceDistribution: {} as Record<string, number>,
    
    // Tag analysis
    topTags: {} as Record<string, number>,
    
    // Time-based metrics
    averageMatchesPerHour: 0,
    peakHour: null as { hour: number; matches: number } | null
  };

  // Process matches for detailed stats
  const hourlyMatches: Record<number, number> = {};
  
  matches.forEach(match => {
    // Level distribution
    const level = match.rule.level as keyof typeof stats.levelDistribution;
    if (stats.levelDistribution[level] !== undefined) {
      stats.levelDistribution[level]++;
    }

    // Source distribution
    stats.sourceDistribution[match.source] = (stats.sourceDistribution[match.source] || 0) + 1;

    // Tag analysis
    if (Array.isArray(match.rule.tags)) {
      (match.rule.tags as string[]).forEach(tag => {
        stats.topTags[tag] = (stats.topTags[tag] || 0) + 1;
      });
    }

    // Hourly distribution
    const hour = match.timestamp.getHours();
    hourlyMatches[hour] = (hourlyMatches[hour] || 0) + 1;
  });

  // Calculate hourly metrics
  const hoursInTimeframe = timeRange / (60 * 60 * 1000);
  stats.averageMatchesPerHour = matches.length / hoursInTimeframe;

  // Find peak hour
  let maxMatches = 0;
  let peakHour = 0;
  Object.entries(hourlyMatches).forEach(([hour, count]) => {
    if (count > maxMatches) {
      maxMatches = count;
      peakHour = parseInt(hour);
    }
  });

  if (maxMatches > 0) {
    stats.peakHour = { hour: peakHour, matches: maxMatches };
  }

  // Sort tags by frequency (top 10)
  const sortedTags = Object.entries(stats.topTags)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  stats.topTags = Object.fromEntries(sortedTags);

  return NextResponse.json({
    success: true,
    data: {
      timeframe,
      stats,
      metadata: {
        calculatedAt: new Date().toISOString(),
        timeframeStart: startTime.toISOString(),
        timeframeEnd: new Date().toISOString()
      }
    }
  });
}

/**
 * Handle rules statistics
 */
async function handleRulesStats(timeframe: string) {
  const timeRanges = {
    '1h': 1 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  const timeRange = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['24h'];
  const startTime = new Date(Date.now() - timeRange);

  // Get all rules with match counts
  const rules = await prisma.sigmaRule.findMany({
    select: {
      id: true,
      title: true,
      level: true,
      tags: true,
      enabled: true,
      createdAt: true,
      _count: {
        select: {
          matches: {
            where: {
              timestamp: { gte: startTime }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Calculate rule performance metrics
  const rulesWithStats = rules.map(rule => {
    const matchCount = rule._count.matches;
    
    return {
      id: rule.id,
      title: rule.title,
      level: rule.level,
      tags: Array.isArray(rule.tags) ? rule.tags : [],
      enabled: rule.enabled,
      matchCount,
      createdAt: rule.createdAt,
      
      // Performance indicators
      isActive: matchCount > 0,
      isHighActivity: matchCount > 10,
      ageInDays: Math.floor((Date.now() - rule.createdAt.getTime()) / (24 * 60 * 60 * 1000))
    };
  });

  // Calculate summary stats
  const summary = {
    totalRules: rules.length,
    activeRules: rulesWithStats.filter(r => r.isActive).length,
    highActivityRules: rulesWithStats.filter(r => r.isHighActivity).length,
    enabledRules: rulesWithStats.filter(r => r.enabled).length,
    recentRules: rulesWithStats.filter(r => r.ageInDays <= 7).length,
    
    // Top performers
    topRules: rulesWithStats
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 10)
      .map(rule => ({
        id: rule.id,
        title: rule.title,
        level: rule.level,
        matchCount: rule.matchCount
      })),
      
    // Underperforming rules (enabled but no matches)
    underperformingRules: rulesWithStats
      .filter(r => r.enabled && r.matchCount === 0 && r.ageInDays > 7)
      .length
  };

  return NextResponse.json({
    success: true,
    data: {
      timeframe,
      summary,
      rules: rulesWithStats,
      metadata: {
        calculatedAt: new Date().toISOString()
      }
    }
  });
}

/**
 * Handle coverage statistics  
 */
async function handleCoverageStats() {
  // Get all enabled rules with tags
  const rules = await prisma.sigmaRule.findMany({
    where: { enabled: true },
    select: {
      id: true,
      title: true,
      level: true,
      tags: true
    }
  });

  // Analyze MITRE ATT&CK coverage
  const mitreTags = new Set<string>();
  const tacticCoverage: Record<string, number> = {};
  const techniqueCoverage: Record<string, number> = {};
  
  // Common MITRE ATT&CK tactics and techniques patterns
  const mitrePatterns = {
    tactics: ['initial_access', 'execution', 'persistence', 'privilege_escalation', 
              'defense_evasion', 'credential_access', 'discovery', 'lateral_movement',
              'collection', 'command_and_control', 'exfiltration', 'impact'],
    techniquePattern: /^t\d{4}(\.\d{3})?$/i
  };

  rules.forEach(rule => {
    if (Array.isArray(rule.tags)) {
      (rule.tags as string[]).forEach(tag => {
        const normalizedTag = tag.toLowerCase();
        
        // Check for MITRE ATT&CK tags
        if (normalizedTag.startsWith('attack.')) {
          mitreTags.add(tag);
          
          // Extract tactic/technique
          const mitreId = normalizedTag.replace('attack.', '');
          
          // Check if it's a tactic
          if (mitrePatterns.tactics.includes(mitreId)) {
            tacticCoverage[mitreId] = (tacticCoverage[mitreId] || 0) + 1;
          }
          
          // Check if it's a technique
          if (mitrePatterns.techniquePattern.test(mitreId)) {
            techniqueCoverage[mitreId] = (techniqueCoverage[mitreId] || 0) + 1;
          }
        }
      });
    }
  });

  // Calculate coverage percentages (approximate)
  const totalTactics = mitrePatterns.tactics.length;
  const coveredTactics = Object.keys(tacticCoverage).length;
  const tacticCoveragePercentage = (coveredTactics / totalTactics) * 100;

  // Estimated technique coverage (there are ~200+ techniques)
  const estimatedTotalTechniques = 200;
  const coveredTechniques = Object.keys(techniqueCoverage).length;
  const techniqueCoveragePercentage = (coveredTechniques / estimatedTotalTechniques) * 100;

  return NextResponse.json({
    success: true,
    data: {
      totalRules: rules.length,
      mitreAttackCoverage: {
        totalMitreTags: mitreTags.size,
        tacticsCovered: coveredTactics,
        totalTactics,
        tacticCoveragePercentage: Math.round(tacticCoveragePercentage * 100) / 100,
        techniquesCovered: coveredTechniques,
        techniqueCoveragePercentage: Math.round(techniqueCoveragePercentage * 100) / 100,
        
        // Detailed coverage
        tacticCoverage: Object.entries(tacticCoverage)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10),
        
        topTechniques: Object.entries(techniqueCoverage)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 20)
      },
      
      // Rule level distribution for coverage analysis
      levelDistribution: {
        low: rules.filter(r => r.level === 'low').length,
        medium: rules.filter(r => r.level === 'medium').length,
        high: rules.filter(r => r.level === 'high').length,
        critical: rules.filter(r => r.level === 'critical').length
      },
      
      metadata: {
        calculatedAt: new Date().toISOString()
      }
    }
  });
}

/**
 * Handle performance statistics
 */
async function handlePerformanceStats(timeframe: string, ruleId: string | null) {
  const timeRanges = {
    '1h': 1 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  const timeRange = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['24h'];
  const startTime = new Date(Date.now() - timeRange);

  const where: Record<string, unknown> = {
    timestamp: { gte: startTime }
  };

  if (ruleId) {
    where.ruleId = ruleId;
  }

  // Get matches with rule info
  const matches = await prisma.sigmaMatch.findMany({
    where,
    include: {
      rule: {
        select: {
          id: true,
          title: true,
          level: true
        }
      }
    },
    orderBy: { timestamp: 'asc' }
  });

  // Generate performance timeline
  const timeline = generatePerformanceTimeline(matches, timeframe);
  
  // Calculate performance metrics
  const metrics = {
    totalMatches: matches.length,
    averageRiskScore: matches.length > 0 
      ? matches.reduce((sum, m) => sum + m.riskScore, 0) / matches.length 
      : 0,
    
    // Match velocity (matches per time unit)
    matchVelocity: {
      perHour: matches.length / (timeRange / (60 * 60 * 1000)),
      perDay: matches.length / (timeRange / (24 * 60 * 60 * 1000))
    },
    
    // Source performance
    sourcePerformance: {} as Record<string, { count: number; avgRiskScore: number }>,
    
    // Rule performance (if specific rule requested)
    rulePerformance: ruleId ? {
      ruleId,
      ruleTitle: matches[0]?.rule.title || 'Unknown',
      matchCount: matches.length,
      avgRiskScore: matches.reduce((sum, m) => sum + m.riskScore, 0) / matches.length,
      timeline: timeline.filter(t => t.count > 0)
    } : null
  };

  // Calculate source performance
  const sourceStats: Record<string, { scores: number[]; count: number }> = {};
  matches.forEach(match => {
    if (!sourceStats[match.source]) {
      sourceStats[match.source] = { scores: [], count: 0 };
    }
    sourceStats[match.source].scores.push(match.riskScore);
    sourceStats[match.source].count++;
  });

  Object.entries(sourceStats).forEach(([source, data]) => {
    metrics.sourcePerformance[source] = {
      count: data.count,
      avgRiskScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      timeframe,
      ruleId: ruleId || null,
      metrics,
      timeline,
      metadata: {
        calculatedAt: new Date().toISOString(),
        timeframeStart: startTime.toISOString()
      }
    }
  });
}

/**
 * Generate performance timeline
 */
function generatePerformanceTimeline(matches: Array<{ timestamp: Date }>, timeframe: string) {
  if (matches.length === 0) return [];

  const bucketSizes = {
    '1h': 5 * 60 * 1000,        // 5 minute buckets
    '24h': 60 * 60 * 1000,      // 1 hour buckets
    '7d': 4 * 60 * 60 * 1000,   // 4 hour buckets
    '30d': 24 * 60 * 60 * 1000  // 1 day buckets
  };

  const bucketSize = bucketSizes[timeframe as keyof typeof bucketSizes] || bucketSizes['24h'];
  const buckets: Record<string, number> = {};

  matches.forEach(match => {
    const bucketTime = new Date(Math.floor(match.timestamp.getTime() / bucketSize) * bucketSize);
    const bucketKey = bucketTime.toISOString();
    buckets[bucketKey] = (buckets[bucketKey] || 0) + 1;
  });

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([timestamp, count]) => ({ timestamp, count }));
}
