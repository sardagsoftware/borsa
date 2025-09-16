/**
 * Security Kill Switch API Route
 * Emergency trading halt functionality
 * © Emrah Şardağ. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security/headers';

// POST /api/security/kill-switch - Activate/deactivate emergency trading halt
export async function POST(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    applySecurityHeaders(response);
    
    const body = await request.json();
    const { active, reason, userId } = body;

    // In production, this would:
    // 1. Stop all automated trading
    // 2. Cancel pending orders
    // 3. Log the action
    // 4. Notify administrators
    // 5. Update system status

    const killSwitchStatus = {
      active: active || false,
      reason: reason || 'Manual activation',
      activatedBy: userId || 'system',
      timestamp: new Date().toISOString(),
      affectedSystems: [
        'Automated Trading Bots',
        'API Order Execution',
        'Position Management',
        'Risk Management System'
      ]
    };

    // Log the kill switch action
    console.log('🛑 KILL SWITCH ACTIVATED:', killSwitchStatus);

    return NextResponse.json({
      success: true,
      message: active ? 'Kill switch activated - All trading halted' : 'Kill switch deactivated - Trading resumed',
      data: killSwitchStatus
    }, { headers: response.headers });

  } catch (error) {
    console.error('Kill switch API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Kill switch operation failed',
        message: process.env.NODE_ENV === 'development' ? String(error) : 'Emergency system temporarily unavailable'
      },
      { status: 500, headers: response.headers }
    );
  }
}

// GET /api/security/kill-switch - Get current kill switch status
export async function GET() {
  const response = new NextResponse();
  
  try {
    applySecurityHeaders(response);

    // In production, get from database/cache
    const killSwitchStatus = {
      active: false,
      lastActivated: null,
      lastDeactivated: null,
      activationCount: 0,
      systemHealth: 'OPERATIONAL',
      safeguards: {
        maxDailyLoss: true,
        positionLimits: true,
        apiKeyRotation: true,
        unauthorizedAccess: true
      }
    };

    return NextResponse.json({
      success: true,
      data: killSwitchStatus
    }, { headers: response.headers });

  } catch (error) {
    console.error('Kill switch status error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get kill switch status'
      },
      { status: 500, headers: response.headers }
    );
  }
}
