import { NextRequest, NextResponse } from 'next/server';
import { SecurityService, ComplianceService } from '@/lib/services/security';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const securityService = SecurityService.getInstance();
  
  try {
    // Mock user - in real app, get from JWT token
    const user = {
      id: 'user-123',
      email: 'admin@ailydian.com',
      role: 'admin' as const,
      permissions: ['live_trading', 'admin_access'],
      securityLevel: 'high' as const,
    };

    if (body.action === 'activate_kill_switch') {
      securityService.activateKillSwitch(user, body.reason || 'Manual activation');
      return NextResponse.json({ 
        success: true, 
        message: 'Kill switch activated',
        killSwitchActive: true,
      });
    }

    if (body.action === 'deactivate_kill_switch') {
      securityService.deactivateKillSwitch(user);
      return NextResponse.json({ 
        success: true, 
        message: 'Kill switch deactivated',
        killSwitchActive: false,
      });
    }

    if (body.action === 'update_settings') {
      securityService.updateSettings(body.settings);
      return NextResponse.json({ 
        success: true, 
        message: 'Security settings updated',
        settings: securityService.getSettings(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Security API error:', error);
    return NextResponse.json(
      { error: 'Security operation failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const securityService = SecurityService.getInstance();
  const complianceService = new ComplianceService();
  
  try {
    // Mock user
    const user = {
      id: 'user-123',
      email: 'admin@ailydian.com',
      role: 'admin' as const,
      permissions: ['live_trading', 'admin_access'],
      securityLevel: 'high' as const,
    };

    const settings = securityService.getSettings();
    const kycStatus = complianceService.checkKycStatus(user);
    const compliance = complianceService.checkRegionalCompliance(user, { leverage: 10 });

    return NextResponse.json({
      settings,
      kycStatus,
      compliance,
      killSwitchActive: process.env.GLOBAL_KILL_SWITCH === 'true',
      securityEvents: [
        {
          type: 'login',
          user: user.email,
          timestamp: new Date().toISOString(),
          ip: '192.168.1.100',
          severity: 'low',
        },
      ],
    });
  } catch (error) {
    console.error('Security status error:', error);
    return NextResponse.json(
      { error: 'Failed to get security status' },
      { status: 500 }
    );
  }
}
