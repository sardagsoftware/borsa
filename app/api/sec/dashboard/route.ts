/**
 * 🛡️ AILYDIAN AI LENS TRADER - Security Dashboard API
 * Main security dashboard overview
 * © Emrah Şardağ. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security/headers';
import { evaluateRequest, getViolationStats } from '@/lib/security/policy';
import { getOwnershipInfo } from '@/lib/security/ownership';
import { sendSecurityAlert } from '@/lib/security/alerts';

// GET /api/sec/dashboard - Main security dashboard data
export async function GET(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    // Apply security headers
    applySecurityHeaders(response);

    // Security policy evaluation
    const context = {
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestPath: '/api/sec/dashboard',
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

    // Get ownership info for branding
    const ownership = getOwnershipInfo();
    
    // Get current violation stats
    const violationStats = getViolationStats();

    // Build dashboard data
    const dashboard = {
      timestamp: new Date().toISOString(),
      ownership: {
        legalName: ownership.legalName,
        copyright: ownership.copyright,
        contact: ownership.contact
      },
      status: {
        overall: 'SECURE',
        lastScan: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        nextScan: new Date(Date.now() + 1800000).toISOString(), // 30 minutes from now
        systemHealth: 'HEALTHY',
        scanInProgress: false
      },
      metrics: {
        securityScore: 87,
        totalViolations: Object.values(violationStats.byCategory).reduce((sum, count) => sum + count, 0),
        activeThreats: 5,
        vulnerabilities: {
          critical: 0,
          high: 2,
          medium: 8,
          low: 15,
          total: 25
        },
        policies: {
          active: 12,
          violations: Object.values(violationStats.byCategory).reduce((sum, count) => sum + count, 0),
          blocked: 43
        }
      },
      recentActivity: [
        {
          id: 'act-001',
          type: 'SCAN_COMPLETED',
          title: 'Dependency Security Scan Completed',
          severity: 'LOW',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          details: 'Found 2 medium severity vulnerabilities'
        },
        {
          id: 'act-002',
          type: 'POLICY_VIOLATION',
          title: 'Rate Limiting Triggered',
          severity: 'MEDIUM',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: 'IP 192.168.1.100 exceeded request limit'
        },
        {
          id: 'act-003',
          type: 'THREAT_BLOCKED',
          title: 'SQL Injection Attempt Blocked',
          severity: 'HIGH',
          timestamp: new Date(Date.now() - 5400000).toISOString(),
          details: 'Malicious payload detected and blocked'
        },
        {
          id: 'act-004',
          type: 'ALERT_SENT',
          title: 'Security Alert Delivered',
          severity: 'LOW',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          details: 'Slack and Telegram notifications sent'
        }
      ],
      systemInfo: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        memoryUsage: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        services: {
          cloudflare: 'CONNECTED',
          sigstore: 'AVAILABLE',
          osint: 'ACTIVE',
          alerts: 'CONFIGURED'
        }
      },
      threats: {
        active: [
          {
            id: 'threat-001',
            type: 'BRUTE_FORCE',
            source: '192.168.1.100',
            severity: 'HIGH',
            started: new Date(Date.now() - 900000).toISOString(),
            status: 'BLOCKED'
          },
          {
            id: 'threat-002',
            type: 'SUSPICIOUS_ACTIVITY',
            source: '10.0.0.50',
            severity: 'MEDIUM',
            started: new Date(Date.now() - 1800000).toISOString(),
            status: 'MONITORING'
          }
        ],
        recent: violationStats.recent.slice(0, 5)
      },
      quickActions: [
        {
          id: 'scan_now',
          title: 'Run Security Scan',
          description: 'Trigger immediate security scan',
          icon: '🔍',
          endpoint: '/api/sec/scans',
          method: 'POST'
        },
        {
          id: 'block_ip',
          title: 'Block IP Address',
          description: 'Add IP to blocklist',
          icon: '🚫',
          endpoint: '/api/sec/policies',
          method: 'POST'
        },
        {
          id: 'send_alert',
          title: 'Send Test Alert',
          description: 'Test alert delivery channels',
          icon: '📢',
          endpoint: '/api/sec/alerts',
          method: 'POST'
        },
        {
          id: 'emergency_mode',
          title: 'Emergency Mode',
          description: 'Activate emergency security measures',
          icon: '🚨',
          endpoint: '/api/sec/emergency',
          method: 'POST'
        }
      ],
      osintFeeds: [
        {
          name: 'CISA KEV',
          status: 'ACTIVE',
          lastUpdate: new Date(Date.now() - 3600000).toISOString(),
          items: 245
        },
        {
          name: 'NVD CVE',
          status: 'ACTIVE',
          lastUpdate: new Date(Date.now() - 1800000).toISOString(),
          items: 1432
        },
        {
          name: 'GitHub Advisories',
          status: 'ACTIVE',
          lastUpdate: new Date(Date.now() - 900000).toISOString(),
          items: 89
        },
        {
          name: 'NPM Advisories',
          status: 'ACTIVE',
          lastUpdate: new Date(Date.now() - 2700000).toISOString(),
          items: 156
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: dashboard
    }, { headers: response.headers });

  } catch (error) {
    console.error('Security dashboard API error:', error);
    
    await sendSecurityAlert(
      'Security API Error',
      `Error in /api/sec/dashboard: ${error instanceof Error ? error.message : String(error)}`,
      'MEDIUM',
      'API',
      { error: error instanceof Error ? error.message : String(error), endpoint: '/api/sec/dashboard' }
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
