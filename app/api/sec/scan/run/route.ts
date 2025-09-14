import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders } from '../../../../../lib/security/csp';
import { performSecurityScan, SecurityFinding } from '../../../../../lib/security/scanner';
import { notifyAlert } from '../../../../../lib/security/alerts';

export const runtime = 'edge';

export async function POST(_request: NextRequest) {
  try {
    const headers = getSecurityHeaders();
    
    console.log('🛡️ AILYDIAN Security - Starting comprehensive security scan');
    
    const scanResults = await performSecurityScan();
    
    // High severity findings alert
    const criticalFindings = scanResults.findings?.filter((f: SecurityFinding) => f.severity === 'CRITICAL') || [];
    if (criticalFindings.length > 0) {
      await notifyAlert({
        type: 'CRITICAL_SECURITY_FINDING',
        message: `🚨 CRITICAL: ${criticalFindings.length} critical security findings detected`,
        data: criticalFindings,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: true,
      scanId: scanResults.id,
      score: scanResults.score,
      findings: scanResults.findings?.length || 0,
      timestamp: scanResults.startedAt,
      summary: scanResults.summary
    }, { 
      status: 200,
      headers 
    });
    
  } catch (error) {
    console.error('❌ Security scan failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Security scan failed',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: getSecurityHeaders()
    });
  }
}

export async function GET(_request: NextRequest) {
  const headers = getSecurityHeaders();
  
  return NextResponse.json({
    status: 'ready',
    message: '🛡️ AILYDIAN Security Scanner Ready',
    timestamp: new Date().toISOString(),
    capabilities: [
      'DAST (Passive)',
      'OSINT Feeds',
      'SBOM Analysis',
      'Anomaly Detection',
      'Policy Enforcement'
    ]
  }, { headers });
}
