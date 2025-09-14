export const runtime = 'edge';

export async function GET() {
  try {
    // Mock scan status data for now
    const lastScan = {
      id: `scan-${Date.now()}`,
      score: 87,
      findings: 3,
      timestamp: new Date().toISOString(),
      summary: 'Security scan completed successfully',
      status: 'completed' as const
    };

    const findings = [
      {
        type: 'HEADER',
        severity: 'MEDIUM',
        title: 'Content-Type header optimization needed',
        description: 'Response headers could be optimized for better security'
      },
      {
        type: 'CSP',
        severity: 'LOW',
        title: 'CSP policy review recommended',
        description: 'Content Security Policy is active but could be stricter'
      },
      {
        type: 'TLS',
        severity: 'INFO',
        title: 'TLS configuration verified',
        description: 'HTTPS and TLS settings are properly configured'
      }
    ];

    return Response.json({
      success: true,
      lastScan,
      findings,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get scan status:', error);
    return Response.json({
      success: false,
      error: 'Failed to get scan status'
    }, { status: 500 });
  }
}
