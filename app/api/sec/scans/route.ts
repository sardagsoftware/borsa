/**
 * 🛡️ AILYDIAN AI LENS TRADER - Security Scans API
 * GET/POST security scan endpoints
 * © Emrah Şardağ. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dependencyAnalyzer } from '@/lib/security/deps';
import { applySecurityHeaders } from '@/lib/security/headers';
import { evaluateRequest } from '@/lib/security/policy';
import { sendSecurityAlert } from '@/lib/security/alerts';

// GET /api/sec/scans - List recent security scans
export async function GET(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    // Apply security headers
    applySecurityHeaders(response);

    // Security policy evaluation
    const context = {
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestPath: '/api/sec/scans',
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

    // Mock scan history for now
    const scans = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'dependency_scan',
        status: 'completed',
        vulnerabilities: 5,
        critical: 1,
        high: 2,
        medium: 2,
        low: 0
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        scans,
        total: scans.length,
        timestamp: new Date().toISOString()
      }
    }, { headers: response.headers });

  } catch (error) {
    console.error('Security scans API error:', error);
    
    await sendSecurityAlert(
      'Security API Error',
      `Error in /api/sec/scans: ${error instanceof Error ? error.message : String(error)}`,
      'MEDIUM',
      'API',
      { error: error instanceof Error ? error.message : String(error), endpoint: '/api/sec/scans' }
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

// POST /api/sec/scans - Trigger new security scan
export async function POST(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    // Apply security headers
    applySecurityHeaders(response);

    // Parse request body
    const body = await request.json();
    const { type = 'full', target, force = false } = body;

    // Security policy evaluation
    const context = {
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestPath: '/api/sec/scans',
      requestMethod: 'POST',
      headers: Object.fromEntries(request.headers.entries()),
      body,
      timestamp: new Date().toISOString()
    };

    const policyResult = await evaluateRequest(context);
    if (!policyResult.allowed) {
      return NextResponse.json(
        { error: 'Request blocked by security policy', violations: policyResult.violations },
        { status: 403, headers: response.headers }
      );
    }

    // Validate scan type
    const validTypes = ['dependencies', 'vulnerabilities', 'full'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid scan type', validTypes },
        { status: 400, headers: response.headers }
      );
    }

    // Check if scan is already running (unless forced)
    // Mock scan progress check for now
    const scanInProgress = false;
    if (!force && scanInProgress) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scan already in progress',
          message: 'A security scan is currently running. Use force=true to override.'
        },
        { status: 409, headers: response.headers }
      );
    }

    // Start the scan based on type - mock implementation
    const scanResult = {
      success: true,
      scanId: 'scan_' + Date.now(),
      timestamp: new Date().toISOString(),
      type: type,
      target: target,
      vulnerabilities: [
        {
          id: 'vuln_1',
          severity: 'HIGH',
          title: 'Example High Vulnerability',
          description: 'This is a mock vulnerability for testing',
          affected: 'package@1.0.0'
        }
      ],
      summary: {
        total: 1,
        critical: 0,
        high: 1,
        medium: 0,
        low: 0
      }
    };

    // Send alert for high-severity findings
    const highSeverityIssues = scanResult.vulnerabilities?.filter((v: any) => 
      ['HIGH', 'CRITICAL'].includes(v.severity)
    ).length || 0;

    if (highSeverityIssues > 0) {
      await sendSecurityAlert(
        'High Severity Vulnerabilities Found',
        `Security scan found ${highSeverityIssues} high/critical severity vulnerabilities`,
        'HIGH',
        'DEPENDENCY_SCAN',
        { scanResult, type, target }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        scanId: scanResult.scanId,
        type,
        target,
        summary: {
          dependencies: 0,
          vulnerabilities: scanResult.vulnerabilities?.length || 0,
          highSeverity: highSeverityIssues,
          scanTime: '2.5s',
          timestamp: scanResult.timestamp
        },
        result: scanResult
      }
    }, { headers: response.headers });

  } catch (error) {
    console.error('Security scan trigger error:', error);
    
    await sendSecurityAlert(
      'Security Scan Failed',
      `Failed to trigger security scan: ${error instanceof Error ? error.message : String(error)}`,
      'HIGH',
      'API',
      { error: error instanceof Error ? error.message : String(error), endpoint: '/api/sec/scans' }
    );

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger scan',
        message: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500, headers: response.headers }
    );
  }
}
