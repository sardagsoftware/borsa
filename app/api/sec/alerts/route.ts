/**
 * 🛡️ AILYDIAN AI LENS TRADER - Security Alerts API
 * Alert management and delivery status
 * © Emrah Şardağ. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { alertManager } from '@/lib/security/alerts';
import { applySecurityHeaders } from '@/lib/security/headers';
import { evaluateRequest } from '@/lib/security/policy';
import { sendSecurityAlert } from '@/lib/security/alerts';

// GET /api/sec/alerts - Get alert delivery history
export async function GET(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    // Apply security headers
    applySecurityHeaders(response);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');
    const test = searchParams.get('test') === 'true';

    // Security policy evaluation
    const context = {
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestPath: '/api/sec/alerts',
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

    // If test mode, run alert tests
    if (test) {
      const testResult = await alertManager.testAlerts();
      
      return NextResponse.json({
        success: true,
        data: {
          test: true,
          results: testResult,
          timestamp: new Date().toISOString()
        }
      }, { headers: response.headers });
    }

    // If specific alert ID requested
    if (alertId) {
      const deliveryHistory = alertManager.getDeliveryHistory(alertId);
      
      return NextResponse.json({
        success: true,
        data: {
          alertId,
          deliveries: deliveryHistory,
          total: deliveryHistory.length,
          timestamp: new Date().toISOString()
        }
      }, { headers: response.headers });
    }

    // Mock alert history (in production, this would come from database)
    const mockAlerts = [
      {
        id: 'alert-001',
        title: 'High Severity Vulnerability Found',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        deliveries: [
          { channel: 'slack', success: true, timestamp: new Date().toISOString() },
          { channel: 'telegram', success: true, timestamp: new Date().toISOString() }
        ]
      },
      {
        id: 'alert-002',
        title: 'Security Policy Violation',
        severity: 'MEDIUM',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        deliveries: [
          { channel: 'webhook', success: false, error: 'Connection timeout', timestamp: new Date(Date.now() - 300000).toISOString() }
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        alerts: mockAlerts,
        total: mockAlerts.length,
        summary: {
          total: mockAlerts.length,
          successful: mockAlerts.filter(a => a.deliveries.some(d => d.success)).length,
          failed: mockAlerts.filter(a => a.deliveries.some(d => !d.success)).length
        },
        timestamp: new Date().toISOString()
      }
    }, { headers: response.headers });

  } catch (error) {
    console.error('Security alerts API error:', error);
    
    await sendSecurityAlert(
      'Security API Error',
      `Error in /api/sec/alerts: ${error instanceof Error ? error.message : String(error)}`,
      'MEDIUM',
      'API',
      { error: error instanceof Error ? error.message : String(error), endpoint: '/api/sec/alerts' }
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

// POST /api/sec/alerts - Send custom alert
export async function POST(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    // Apply security headers
    applySecurityHeaders(response);

    // Parse request body
    const body = await request.json();
    const { 
      title, 
      description, 
      severity, 
      type = 'SYSTEM',
      source = 'API',
      metadata = {}
    } = body;

    // Security policy evaluation
    const context = {
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestPath: '/api/sec/alerts',
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
    if (!title || !description || !severity) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['title', 'description', 'severity']
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

    // Send the alert
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      severity: severity.toUpperCase(),
      type: type.toUpperCase(),
      timestamp: new Date().toISOString(),
      source,
      metadata: {
        ...metadata,
        apiTriggered: true,
        sourceIp: context.ip
      }
    };

    const deliveries = await alertManager.sendAlert(alert);

    return NextResponse.json({
      success: true,
      data: {
        alert,
        deliveries,
        summary: {
          sent: deliveries.length,
          successful: deliveries.filter(d => d.success).length,
          failed: deliveries.filter(d => !d.success).length,
          errors: deliveries.filter(d => !d.success).map(d => ({
            channel: d.channel,
            error: d.error
          }))
        },
        timestamp: new Date().toISOString()
      }
    }, { headers: response.headers });

  } catch (error) {
    console.error('Security alert send error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send alert',
        message: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500, headers: response.headers }
    );
  }
}
