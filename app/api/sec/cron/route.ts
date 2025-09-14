import { NextRequest } from 'next/server';
import { performSecurityScan } from '../../../../lib/security/scanner';
import { AlertManager } from '../../../../lib/security/alerts';

export const runtime = 'edge';

// CRON endpoint for automated security scanning
export async function GET(request: NextRequest) {
  try {
    // Verify CRON authorization
    const cronSecret = request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || !expectedSecret || cronSecret !== expectedSecret) {
      return Response.json({
        error: 'Unauthorized',
        message: 'Invalid CRON secret'
      }, { status: 401 });
    }

    console.log('🔄 Starting automated security scan...');
    
    // Perform comprehensive security scan
    const scanResult = await performSecurityScan();
    
    const alertManager = AlertManager.getInstance();
    
    // Send alerts for critical/high findings
    const criticalFindings = scanResult.findings.filter(f => 
      f.severity === 'CRITICAL' || f.severity === 'HIGH'
    );

    if (criticalFindings.length > 0) {
      await alertManager.sendSecurityAlert(
        `🚨 Automated Security Scan - ${criticalFindings.length} Critical Issues`,
        `Security scan detected ${criticalFindings.length} critical/high severity issues. Score: ${scanResult.score}/100`,
        'HIGH',
        'AUTOMATED_SCAN',
        {
          findings: criticalFindings.slice(0, 5),
          scanId: scanResult.id,
          timestamp: new Date().toISOString()
        }
      );
    }

    console.log(`✅ Automated scan completed. Score: ${scanResult.score}/100`);

    return Response.json({
      success: true,
      scanId: scanResult.id,
      score: scanResult.score,
      findings: scanResult.findings.length,
      criticalFindings: criticalFindings.length,
      timestamp: new Date().toISOString(),
      message: 'Automated security scan completed successfully'
    });

  } catch (error) {
    console.error('❌ Automated scan failed:', error);
    
    // Send failure alert
    try {
      const alertManager = AlertManager.getInstance();
      await alertManager.sendSecurityAlert(
        '🚨 Automated Security Scan Failed',
        `Automated security scan encountered an error: ${error}`,
        'HIGH',
        'SCAN_ERROR',
        { timestamp: new Date().toISOString() }
      );
    } catch (alertError) {
      console.error('Failed to send scan error alert:', alertError);
    }

    return Response.json({
      success: false,
      error: 'Automated scan failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Manual trigger for CRON job testing
export async function POST(request: NextRequest) {
  console.log('🔧 Manual CRON trigger requested');
  return GET(request);
}
