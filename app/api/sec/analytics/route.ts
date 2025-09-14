/**
 * 🛡️ AILYDIAN AI LENS TRADER - Security Analytics API
 * Security metrics, trends, and reporting
 * © Emrah Şardağ. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security/headers';
import { evaluateRequest, getViolationStats } from '@/lib/security/policy';
import { sendSecurityAlert } from '@/lib/security/alerts';

// GET /api/sec/analytics - Security analytics dashboard data
export async function GET(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    // Apply security headers
    applySecurityHeaders(response);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h'; // 1h, 24h, 7d, 30d
    const detailed = searchParams.get('detailed') === 'true';

    // Security policy evaluation
    const context = {
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestPath: '/api/sec/analytics',
      requestMethod: 'GET',
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString()
    };

    const policyResult = await evaluateRequest(context);
    if (!policyResult.allowed) {
      return NextResponse.json(
        { error: 'Request blocked by security policy', violations: policyResult.violations },
        { status: 403, headers: response.headers }
      );
    }

    // Get current violation stats
    const violationStats = getViolationStats();

    // Mock analytics data (in production, this would come from database)
    const analytics = {
      timestamp: new Date().toISOString(),
      period,
      summary: {
        totalEvents: 1247,
        securityViolations: violationStats.byCategory,
        threatsBlocked: 42,
        vulnerabilitiesFound: 19,
        scansCompleted: 48,
        alertsSent: 127
      },
      trends: {
        events: generateTrendData(period, 1247),
        violations: generateTrendData(period, 89),
        threats: generateTrendData(period, 42),
        vulnerabilities: generateTrendData(period, 19)
      },
      categories: violationStats.byCategory,
      topThreats: [
        { type: 'SQL Injection', count: 23, severity: 'HIGH' },
        { type: 'XSS Attempt', count: 18, severity: 'HIGH' },
        { type: 'Rate Limiting', count: 31, severity: 'MEDIUM' },
        { type: 'Suspicious User Agent', count: 17, severity: 'LOW' }
      ],
      topIPs: violationStats.topIPs.slice(0, 10),
      vulnerabilities: {
        bySeverity: {
          critical: 2,
          high: 8,
          medium: 15,
          low: 34
        },
        byCategory: {
          dependencies: 31,
          configuration: 12,
          code: 8,
          infrastructure: 6
        },
        recent: [
          {
            id: 'CVE-2023-1234',
            package: 'express',
            severity: 'HIGH',
            score: 8.5,
            found: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'CVE-2023-5678',
            package: 'lodash',
            severity: 'MEDIUM',
            score: 6.2,
            found: new Date(Date.now() - 7200000).toISOString()
          }
        ]
      },
      performance: {
        scanDuration: {
          average: 45.2,
          min: 12.1,
          max: 127.8
        },
        alertDelivery: {
          success: 92.5,
          failed: 7.5,
          averageTime: 2.3
        },
        policyEvaluations: {
          total: 15647,
          blocked: 142,
          allowed: 15505,
          responseTime: 0.8
        }
      }
    };

    // Add detailed breakdown if requested
    if (detailed) {
      (analytics as any).detailed = {
        hourlyBreakdown: generateHourlyBreakdown(period),
        geoDistribution: {
          'United States': 45,
          'Germany': 23,
          'China': 18,
          'Russia': 12,
          'Brazil': 8,
          'India': 6,
          'Others': 31
        },
        userAgents: {
          'Chrome': 42,
          'Firefox': 28,
          'Safari': 15,
          'Bot/Crawler': 12,
          'Unknown': 3
        },
        attackVectors: {
          'Web Application': 67,
          'API Abuse': 23,
          'Brute Force': 8,
          'DDoS': 2
        }
      };
    }

    return NextResponse.json({
      success: true,
      data: analytics
    }, { headers: response.headers });

  } catch (error) {
    console.error('Security analytics API error:', error);
    
    await sendSecurityAlert(
      'Security API Error',
      `Error in /api/sec/analytics: ${error instanceof Error ? error.message : String(error)}`,
      'MEDIUM',
      'API',
      { error: error instanceof Error ? error.message : String(error), endpoint: '/api/sec/analytics' }
    );

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500, headers: response.headers }
    );
  }
}

// Generate trend data based on period
function generateTrendData(period: string, total: number): Array<{ timestamp: string; value: number }> {
  const data = [];
  let intervals = 24; // Default to 24 hours
  let intervalMs = 3600000; // 1 hour

  switch (period) {
    case '1h':
      intervals = 12; // 12 x 5-minute intervals
      intervalMs = 300000; // 5 minutes
      break;
    case '7d':
      intervals = 7; // 7 days
      intervalMs = 86400000; // 1 day
      break;
    case '30d':
      intervals = 30; // 30 days
      intervalMs = 86400000; // 1 day
      break;
  }

  const baseValue = Math.floor(total / intervals);
  const now = Date.now();

  for (let i = intervals - 1; i >= 0; i--) {
    const timestamp = new Date(now - (i * intervalMs)).toISOString();
    const variation = Math.floor(Math.random() * (baseValue * 0.4)) - (baseValue * 0.2);
    const value = Math.max(0, baseValue + variation);
    
    data.push({ timestamp, value });
  }

  return data;
}

// Generate hourly breakdown
function generateHourlyBreakdown(period: string): Array<{ hour: string; events: number; violations: number; threats: number }> {
  const hours = [];
  const hoursToGenerate = period === '7d' ? 168 : period === '30d' ? 720 : 24;
  
  for (let i = hoursToGenerate - 1; i >= 0; i--) {
    const date = new Date(Date.now() - (i * 3600000));
    const hour = date.toISOString().slice(0, 13) + ':00:00';
    
    hours.push({
      hour,
      events: Math.floor(Math.random() * 50) + 10,
      violations: Math.floor(Math.random() * 15) + 2,
      threats: Math.floor(Math.random() * 8) + 1
    });
  }
  
  return hours.slice(-Math.min(24, hoursToGenerate)); // Return last 24 hours max for detailed view
}
