/**
 * Security Status API - Z.AI System Security Check
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkSecurityConfig } from '@/lib/utils/encryption';

export async function GET(request: NextRequest) {
  try {
    const securityStatus = checkSecurityConfig();
    
    // Detailed security assessment
    const assessment = {
      overall_status: securityStatus.recommendations.length === 0 ? 'SECURE' : 'NEEDS_ATTENTION',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      
      // Core security checks
      security_checks: {
        api_key_encryption: {
          status: securityStatus.encryption ? 'ENABLED' : 'DISABLED',
          description: 'Z.AI API key encryption with AES-256-GCM',
          impact: securityStatus.encryption ? 'LOW' : 'HIGH'
        },
        
        session_security: {
          status: securityStatus.nextauth_secret ? 'ENABLED' : 'DISABLED',
          description: 'NextAuth session encryption',
          impact: securityStatus.nextauth_secret ? 'LOW' : 'CRITICAL'
        },
        
        secure_transport: {
          status: securityStatus.https_only ? 'ENABLED' : 'DISABLED',
          description: 'HTTPS-only communication',
          impact: securityStatus.https_only ? 'LOW' : 'HIGH'
        },
        
        secure_cookies: {
          status: securityStatus.secure_cookies ? 'ENABLED' : 'DISABLED',
          description: 'Secure cookie configuration',
          impact: securityStatus.secure_cookies ? 'LOW' : 'MEDIUM'
        }
      },
      
      // Z.AI specific checks
      zai_security: {
        api_key_present: !!process.env.ZAI_API_KEY || !!process.env.ZAI_API_KEY_ENCRYPTED,
        using_encryption: !!process.env.ZAI_API_KEY_ENCRYPTED,
        rate_limiting_configured: true, // Built into service
        audit_logging_enabled: true, // Built into service
        request_sanitization: true // Built into service
      },
      
      // Recommendations
      recommendations: securityStatus.recommendations.map(rec => ({
        priority: getPriority(rec),
        message: rec,
        action_required: true
      })),
      
      // Security score (0-100)
      security_score: calculateSecurityScore(securityStatus),
      
      // System info (non-sensitive)
      system_info: {
        node_version: process.version,
        encryption_available: !!process.env.ENCRYPTION_KEY,
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
      }
    };
    
    return NextResponse.json(assessment);
    
  } catch (error) {
    console.error('Security check failed:', error);
    return NextResponse.json({
      error: 'Security check failed',
      status: 'ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function getPriority(recommendation: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (recommendation.includes('NEXTAUTH_SECRET')) return 'CRITICAL';
  if (recommendation.includes('ENCRYPTION_KEY')) return 'HIGH';
  if (recommendation.includes('HTTPS')) return 'HIGH';
  return 'MEDIUM';
}

function calculateSecurityScore(status: any): number {
  let score = 100;
  
  // Deduct points for missing security measures
  if (!status.encryption) score -= 30;
  if (!status.nextauth_secret) score -= 40;
  if (!status.https_only && process.env.NODE_ENV === 'production') score -= 20;
  if (!status.secure_cookies && process.env.NODE_ENV === 'production') score -= 10;
  
  return Math.max(0, score);
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
