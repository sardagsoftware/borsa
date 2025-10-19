import type { IncidentTag } from './types';

export type ClassificationResult = {
  tag: IncidentTag;
  confidence: number;
  reason: string;
};

export function classifyIncident(
  code: number,
  err?: string | null,
  ms?: number
): ClassificationResult {
  // DNS errors
  if (err?.toLowerCase().includes('dns') ||
      err?.toLowerCase().includes('enotfound') ||
      err?.toLowerCase().includes('getaddrinfo')) {
    return {
      tag: 'DNS',
      confidence: 0.95,
      reason: 'DNS resolution failure detected in error message'
    };
  }

  // Auth errors
  if (code === 401 || code === 403 ||
      err?.toLowerCase().includes('auth') ||
      err?.toLowerCase().includes('unauthorized') ||
      err?.toLowerCase().includes('forbidden')) {
    return {
      tag: 'Auth',
      confidence: 0.9,
      reason: `HTTP ${code} indicates authentication/authorization failure`
    };
  }

  // Upstream errors
  if (code === 502 || code === 503 || code === 504) {
    return {
      tag: 'Upstream',
      confidence: 0.9,
      reason: `HTTP ${code} indicates upstream service failure`
    };
  }

  // Rate limiting
  if (code === 429 || err?.toLowerCase().includes('rate limit')) {
    return {
      tag: 'RateLimit',
      confidence: 0.95,
      reason: 'Rate limit exceeded'
    };
  }

  // Network errors
  if (err?.toLowerCase().includes('network') ||
      err?.toLowerCase().includes('timeout') ||
      err?.toLowerCase().includes('etimedout') ||
      err?.toLowerCase().includes('econnrefused') ||
      err?.toLowerCase().includes('econnreset')) {
    return {
      tag: 'Network',
      confidence: 0.85,
      reason: 'Network connectivity issue detected'
    };
  }

  // Redirect issues
  if (code === 301 || code === 302 || code === 307 || code === 308) {
    return {
      tag: 'Redirect',
      confidence: 0.8,
      reason: `HTTP ${code} redirect detected`
    };
  }

  // Client errors
  if (code >= 400 && code < 500) {
    return {
      tag: 'Client4xx',
      confidence: 0.7,
      reason: `HTTP ${code} client error`
    };
  }

  // Server errors
  if (code >= 500) {
    return {
      tag: 'Server5xx',
      confidence: 0.85,
      reason: `HTTP ${code} server error`
    };
  }

  // Security errors
  if (err?.toLowerCase().includes('security') ||
      err?.toLowerCase().includes('ssl') ||
      err?.toLowerCase().includes('tls') ||
      err?.toLowerCase().includes('certificate')) {
    return {
      tag: 'Security',
      confidence: 0.9,
      reason: 'Security/SSL/TLS issue detected'
    };
  }

  // Unknown
  return {
    tag: 'Unknown',
    confidence: 0.5,
    reason: 'Unable to classify incident with high confidence'
  };
}

export function getActionNotes(tag: IncidentTag): string[] {
  const actionMap: Record<IncidentTag, string[]> = {
    DNS: [
      '✓ DNS kayıtlarını kontrol et (A, AAAA, CNAME)',
      '✓ Name server\'ları doğrula',
      '✓ DNS cache temizle (local + CDN)',
      '✓ Alternative DNS provider test et',
      '✓ TTL ayarlarını gözden geçir'
    ],
    Auth: [
      '✓ API key/token geçerliliğini kontrol et',
      '✓ Permission/scope ayarlarını doğrula',
      '✓ SSO/OAuth entegrasyonunu test et',
      '✓ Token expiration kontrol et',
      '✓ IP whitelist ayarlarını gözden geçir'
    ],
    Upstream: [
      '✓ Upstream service health check yap',
      '✓ Connection pool ayarlarını kontrol et',
      '✓ Circuit breaker durumunu kontrol et',
      '✓ Load balancer health kontrol et',
      '✓ Upstream service logs inceле'
    ],
    RateLimit: [
      '✓ Rate limit threshold ayarlarını artır',
      '✓ Client-side throttling ekle',
      '✓ Caching stratejisi uygula',
      '✓ Request batching düşün',
      '✓ Priority queue sistemi ekle'
    ],
    Network: [
      '✓ Network connectivity test yap',
      '✓ Firewall rules kontrol et',
      '✓ Latency/packet loss analizi yap',
      '✓ CDN/proxy ayarlarını kontrol et',
      '✓ BGP routing kontrol et'
    ],
    Redirect: [
      '✓ Redirect chain\'i kontrol et (max 3-4)',
      '✓ SSL/TLS sertifika geçerliliği',
      '✓ HSTS headers kontrol et',
      '✓ Mixed content (HTTP/HTTPS) kontrol et',
      '✓ Canonical URL ayarlarını doğrula'
    ],
    Client4xx: [
      '✓ Request validation kontrol et',
      '✓ Client error logging detaylı incele',
      '✓ API versiyonu doğrula',
      '✓ Request/response format kontrol et',
      '✓ Client library versiyonlarını kontrol et'
    ],
    Server5xx: [
      '✓ Server error logs detaylı incele',
      '✓ Resource kullanımı kontrol et (CPU/RAM/Disk)',
      '✓ Database connection pool kontrol et',
      '✓ Rollback düşün (son deployment)',
      '✓ Auto-scaling ayarlarını kontrol et'
    ],
    Security: [
      '✓ Security logs detaylı incele',
      '✓ SSL/TLS yapılandırma kontrol et',
      '✓ Firewall rules gözden geçir',
      '✓ DDoS protection kontrol et',
      '✓ WAF rules kontrol et'
    ],
    Unknown: [
      '✓ Error logs detaylı incele',
      '✓ Monitoring dashboard kontrol et',
      '✓ Recent deployment history',
      '✓ Infrastructure changes kontrol et',
      '✓ Oncall ekibe escalate et'
    ]
  };

  return actionMap[tag] || actionMap.Unknown;
}

export function getSeverityRecommendation(
  tag: IncidentTag,
  consecutiveFailures: number,
  affectedEndpoints: number
): 1 | 2 | 3 {
  // Critical tags always SEV-2 minimum
  const criticalTags: IncidentTag[] = ['Auth', 'Server5xx', 'Upstream', 'Security'];

  if (criticalTags.includes(tag)) {
    if (consecutiveFailures >= 3 || affectedEndpoints >= 4) {
      return 1; // SEV-1
    }
    return 2; // SEV-2
  }

  // High-impact tags
  const highImpactTags: IncidentTag[] = ['DNS', 'Network'];

  if (highImpactTags.includes(tag)) {
    if (consecutiveFailures >= 5 || affectedEndpoints >= 6) {
      return 1; // SEV-1
    }
    if (consecutiveFailures >= 2 || affectedEndpoints >= 2) {
      return 2; // SEV-2
    }
    return 3; // SEV-3
  }

  // Low-impact tags
  if (consecutiveFailures >= 10 || affectedEndpoints >= 8) {
    return 2; // SEV-2
  }

  return 3; // SEV-3
}

export function shouldRollback(
  tag: IncidentTag,
  sev: 1 | 2 | 3,
  consecutiveFailures: number
): boolean {
  const rollbackTags: IncidentTag[] = ['Server5xx', 'Upstream'];

  if (!rollbackTags.includes(tag)) {
    return false;
  }

  // SEV-1 with consecutive failures
  if (sev === 1 && consecutiveFailures >= 3) {
    return true;
  }

  // SEV-2 with many consecutive failures
  if (sev === 2 && consecutiveFailures >= 5) {
    return true;
  }

  return false;
}
