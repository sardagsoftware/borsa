/**
 * 🛡️ AILYDIAN AI LENS TRADER - Security Policies API
 * Security policy management endpoints
 * © Emrah Şardağ. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityPolicyEngine } from '@/lib/security/policy';
import { applySecurityHeaders } from '@/lib/security/headers';
import { evaluateRequest } from '@/lib/security/policy';
import { sendSecurityAlert } from '@/lib/security/alerts';

// GET /api/sec/policies - List all security policies
export async function GET(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    // Apply security headers
    applySecurityHeaders(response);

    // Security policy evaluation
    const context = {
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestPath: '/api/sec/policies',
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

    const policies = securityPolicyEngine.getAllPolicies();

    return NextResponse.json({
      success: true,
      data: {
        policies,
        total: policies.length,
        byCategory: policies.reduce((acc: Record<string, number>, policy) => {
          acc[policy.category] = (acc[policy.category] || 0) + 1;
          return acc;
        }, {}),
        byStatus: policies.reduce((acc: Record<string, number>, policy) => {
          const status = policy.enabled ? 'enabled' : 'disabled';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      }
    }, { headers: response.headers });

  } catch (error) {
    console.error('Security policies API error:', error);
    
    await sendSecurityAlert(
      'Security API Error',
      `Error in /api/sec/policies: ${error instanceof Error ? error.message : String(error)}`,
      'MEDIUM',
      'API',
      { error: error instanceof Error ? error.message : String(error), endpoint: '/api/sec/policies' }
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

// POST /api/sec/policies - Create new security policy
export async function POST(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    // Apply security headers
    applySecurityHeaders(response);

    // Parse request body
    const body = await request.json();
    const { 
      name, 
      description, 
      category, 
      severity, 
      conditions, 
      actions,
      enabled = true 
    } = body;

    // Security policy evaluation
    const context = {
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestPath: '/api/sec/policies',
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
    if (!name || !description || !category || !severity || !conditions || !actions) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['name', 'description', 'category', 'severity', 'conditions', 'actions']
        },
        { status: 400, headers: response.headers }
      );
    }

    // Validate category
    const validCategories = ['ACCESS', 'DATA', 'NETWORK', 'CRYPTO', 'COMPLIANCE', 'BEHAVIOR'];
    if (!validCategories.includes(category.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid category', validCategories },
        { status: 400, headers: response.headers }
      );
    }

    // Validate severity
    const validSeverities = ['INFO', 'WARNING', 'CRITICAL'];
    if (!validSeverities.includes(severity.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid severity', validSeverities },
        { status: 400, headers: response.headers }
      );
    }

    // Validate conditions
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return NextResponse.json(
        { error: 'Conditions must be a non-empty array' },
        { status: 400, headers: response.headers }
      );
    }

    // Validate actions
    if (!Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { error: 'Actions must be a non-empty array' },
        { status: 400, headers: response.headers }
      );
    }

    // Create policy
    const policyId = securityPolicyEngine.addPolicy({
      name,
      description,
      category: category.toUpperCase(),
      severity: severity.toUpperCase(),
      conditions,
      actions,
      enabled,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    });

    const createdPolicy = securityPolicyEngine.getPolicy(policyId);

    // Send alert for new policy creation
    await sendSecurityAlert(
      'Security Policy Created',
      `New security policy "${name}" has been created with ${severity.toUpperCase()} severity`,
      'LOW',
      'POLICY_MANAGEMENT',
      { policy: createdPolicy, creator: context.ip }
    );

    return NextResponse.json({
      success: true,
      data: {
        policy: createdPolicy,
        policyId,
        created: true,
        timestamp: new Date().toISOString()
      }
    }, { headers: response.headers });

  } catch (error) {
    console.error('Security policy creation error:', error);
    
    await sendSecurityAlert(
      'Security Policy Creation Failed',
      `Failed to create security policy: ${error instanceof Error ? error.message : String(error)}`,
      'MEDIUM',
      'API',
      { error: error instanceof Error ? error.message : String(error), endpoint: '/api/sec/policies' }
    );

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create policy',
        message: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500, headers: response.headers }
    );
  }
}
