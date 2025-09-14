/**
 * 🛡️ AILYDIAN AI LENS TRADER - Security Events API
 * Real-time security event streaming
 * © Emrah Şardağ. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security/headers';
import { evaluateRequest } from '@/lib/security/policy';
import { sendSecurityAlert } from '@/lib/security/alerts';

// GET /api/sec/events - Get recent security events
export async function GET(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    // Apply security headers
    applySecurityHeaders(response);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000);
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    const since = searchParams.get('since');

    // Security policy evaluation
    const context = {
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestPath: '/api/sec/events',
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

    // Mock security events (in production, this would come from database)
    const mockEvents = [
      {
        id: 'evt-001',
        type: 'POLICY_VIOLATION',
        severity: 'HIGH',
        category: 'ACCESS',
        title: 'Suspicious Login Attempt',
        description: 'Multiple failed login attempts from unknown IP',
        sourceIp: '192.168.1.100',
        timestamp: new Date().toISOString(),
        metadata: {
          userAgent: 'curl/7.68.0',
          attempts: 5,
          blocked: true
        }
      },
      {
        id: 'evt-002',
        type: 'VULNERABILITY_FOUND',
        severity: 'CRITICAL',
        category: 'DEPENDENCIES',
        title: 'Critical Vulnerability in npm Package',
        description: 'CVE-2023-1234 found in express package',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        metadata: {
          package: 'express',
          version: '4.17.1',
          cve: 'CVE-2023-1234',
          cvss: 9.8
        }
      },
      {
        id: 'evt-003',
        type: 'SCAN_COMPLETED',
        severity: 'LOW',
        category: 'SYSTEM',
        title: 'Security Scan Completed',
        description: 'Dependency security scan completed successfully',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        metadata: {
          scanId: 'scan-123',
          duration: '45s',
          findings: 2
        }
      }
    ];

    // Apply filters
    let filteredEvents = [...mockEvents];

    if (severity) {
      filteredEvents = filteredEvents.filter(event => 
        event.severity.toLowerCase() === severity.toLowerCase()
      );
    }

    if (category) {
      filteredEvents = filteredEvents.filter(event => 
        event.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (since) {
      const sinceDate = new Date(since);
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) > sinceDate
      );
    }

    // Apply limit
    filteredEvents = filteredEvents.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        events: filteredEvents,
        total: filteredEvents.length,
        filters: { severity, category, since, limit },
        timestamp: new Date().toISOString()
      }
    }, { headers: response.headers });

  } catch (error) {
    console.error('Security events API error:', error);
    
    await sendSecurityAlert(
      'Security API Error',
      `Error in /api/sec/events: ${error instanceof Error ? error.message : String(error)}`,
      'MEDIUM',
      'API',
      { error: error instanceof Error ? error.message : String(error), endpoint: '/api/sec/events' }
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

// POST /api/sec/events - Create new security event
export async function POST(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    // Apply security headers
    applySecurityHeaders(response);

    // Parse request body
    const body = await request.json();
    const { 
      type, 
      severity, 
      category, 
      title, 
      description, 
      metadata = {} 
    } = body;

    // Security policy evaluation
    const context = {
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestPath: '/api/sec/events',
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

    // Validate required fields
    if (!type || !severity || !category || !title || !description) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['type', 'severity', 'category', 'title', 'description']
        },
        { status: 400, headers: response.headers }
      );
    }

    // Validate severity
    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validSeverities.includes(severity.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid severity', validSeverities },
        { status: 400, headers: response.headers }
      );
    }

    // Validate category
    const validCategories = ['ACCESS', 'DATA', 'NETWORK', 'CRYPTO', 'COMPLIANCE', 'BEHAVIOR', 'SYSTEM', 'DEPENDENCIES'];
    if (!validCategories.includes(category.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid category', validCategories },
        { status: 400, headers: response.headers }
      );
    }

    // Create event object
    const event = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type.toUpperCase(),
      severity: severity.toUpperCase(),
      category: category.toUpperCase(),
      title,
      description,
      sourceIp: request.ip,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        apiCreated: true,
        creator: 'AILYDIAN-API'
      }
    };

    // In production, save to database
    console.log('Security event created:', event);

    // Send alert for high severity events
    if (['HIGH', 'CRITICAL'].includes(severity.toUpperCase())) {
      await sendSecurityAlert(
        `Security Event: ${title}`,
        description,
        severity.toUpperCase() === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        'SECURITY_EVENT',
        event
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        event,
        created: true,
        timestamp: new Date().toISOString()
      }
    }, { headers: response.headers });

  } catch (error) {
    console.error('Security event creation error:', error);
    
    await sendSecurityAlert(
      'Security Event Creation Failed',
      `Failed to create security event: ${error instanceof Error ? error.message : String(error)}`,
      'MEDIUM',
      'API',
      { error: error instanceof Error ? error.message : String(error), endpoint: '/api/sec/events' }
    );

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create event',
        message: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500, headers: response.headers }
    );
  }
}
