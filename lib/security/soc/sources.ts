/**
 * 🛡️ AILYDIAN SOC - Event Sources Normalization
 * Normalize events from Cloudflare, WAF, Security Scans, OSINT, Anomaly Detection
 * © Emrah Şardağ. All rights reserved.
 */

import { 
  SocEvent, 
  CloudflareEvent, 
  WAFEvent, 
  ScanEvent, 
  OSINTEvent, 
  AnomalyEvent 
} from './schema';

/**
 * Normalize Cloudflare events to SOC format
 */
export function normalizeCloudflareEvent(cfEvent: CloudflareEvent): SocEvent {
  return {
    timestamp: new Date(cfEvent.timestamp),
    source: 'cloudflare',
    ip: cfEvent.clientIP,
    asn: cfEvent.asn,
    userAgent: cfEvent.userAgent,
    route: cfEvent.uri,
    method: cfEvent.method,
    statusCode: cfEvent.statusCode,
    country: cfEvent.country,
    signal: {
      threatScore: cfEvent.threatScore,
      botScore: cfEvent.botScore,
      wafAction: cfEvent.wafAction,
      edgeResponse: cfEvent.edgeResponse,
      cfRayId: generateRayId(),
    },
    metadata: {
      type: 'cloudflare_edge_event',
      riskLevel: calculateCfRisk(cfEvent),
    },
  };
}

/**
 * Normalize WAF events to SOC format
 */
export function normalizeWAFEvent(wafEvent: WAFEvent): SocEvent {
  return {
    timestamp: new Date(wafEvent.timestamp),
    source: 'waf',
    ip: wafEvent.sourceIP,
    userAgent: wafEvent.userAgent,
    route: wafEvent.uri,
    method: wafEvent.method,
    signal: {
      rule: wafEvent.rule,
      action: wafEvent.action,
      severity: wafEvent.severity,
      payload: wafEvent.payload?.slice(0, 500), // Truncate for storage
    },
    metadata: {
      type: 'waf_security_event',
      riskLevel: mapWafSeverityToRisk(wafEvent.severity),
    },
  };
}

/**
 * Normalize Security Scan events to SOC format
 */
export function normalizeScanEvent(scanEvent: ScanEvent): SocEvent {
  return {
    timestamp: new Date(scanEvent.timestamp),
    source: 'secscan',
    signal: {
      scanType: scanEvent.scanType,
      finding: scanEvent.finding,
      severity: scanEvent.severity,
      asset: scanEvent.asset,
      evidence: scanEvent.evidence,
    },
    metadata: {
      type: 'security_scan_finding',
      riskLevel: mapScanSeverityToRisk(scanEvent.severity),
      scanEngine: scanEvent.scanType,
    },
  };
}

/**
 * Normalize OSINT events to SOC format
 */
export function normalizeOSINTEvent(osintEvent: OSINTEvent): SocEvent {
  return {
    timestamp: new Date(osintEvent.timestamp),
    source: 'osint',
    signal: {
      source: osintEvent.source,
      feedId: osintEvent.feedId,
      severity: osintEvent.severity,
      indicators: osintEvent.indicators,
      affectedAssets: osintEvent.affectedAssets,
    },
    metadata: {
      type: 'threat_intelligence_feed',
      riskLevel: mapOsintSeverityToRisk(osintEvent.severity),
      feedType: osintEvent.source,
    },
  };
}

/**
 * Normalize Anomaly Detection events to SOC format
 */
export function normalizeAnomalyEvent(anomalyEvent: AnomalyEvent): SocEvent {
  return {
    timestamp: new Date(anomalyEvent.timestamp),
    source: 'anomaly',
    signal: {
      type: anomalyEvent.type,
      severity: anomalyEvent.severity,
      baseline: anomalyEvent.baseline,
      current: anomalyEvent.current,
      deviation: anomalyEvent.deviation,
      source: anomalyEvent.source,
    },
    metadata: {
      type: 'behavioral_anomaly',
      riskLevel: Math.min(100, Math.max(0, anomalyEvent.severity)),
      anomalyType: anomalyEvent.type,
    },
  };
}

/**
 * Auto-detect and normalize events based on structure
 */
export function normalizeEvent(rawEvent: Record<string, unknown>, source?: string): SocEvent | null {
  try {
    // Auto-detect event type if source not provided
    const eventSource = source || detectEventSource(rawEvent);
    
    switch (eventSource) {
      case 'cloudflare':
        return normalizeCloudflareEvent(rawEvent as unknown as CloudflareEvent);
      case 'waf':
        return normalizeWAFEvent(rawEvent as unknown as WAFEvent);
      case 'secscan':
        return normalizeScanEvent(rawEvent as unknown as ScanEvent);
      case 'osint':
        return normalizeOSINTEvent(rawEvent as unknown as OSINTEvent);
      case 'anomaly':
        return normalizeAnomalyEvent(rawEvent as unknown as AnomalyEvent);
      default:
        console.warn('Unknown event source:', eventSource);
        return null;
    }
  } catch (error) {
    console.error('Failed to normalize event:', error);
    return null;
  }
}

/**
 * Batch normalize multiple events
 */
export function normalizeEvents(rawEvents: Array<{event: Record<string, unknown>, source?: string}>): SocEvent[] {
  const normalized: SocEvent[] = [];
  
  for (const { event, source } of rawEvents) {
    const normalizedEvent = normalizeEvent(event, source);
    if (normalizedEvent) {
      normalized.push(normalizedEvent);
    }
  }
  
  return normalized;
}

/**
 * Event source detection heuristics
 */
function detectEventSource(event: Record<string, unknown>): string {
  // Cloudflare detection
  if (event.clientIP && event.threatScore !== undefined) {
    return 'cloudflare';
  }
  
  // WAF detection
  if (event.rule && event.action && event.sourceIP) {
    return 'waf';
  }
  
  // Security scan detection
  if (event.scanType && event.finding) {
    return 'secscan';
  }
  
  // OSINT detection
  if (event.feedId && event.indicators) {
    return 'osint';
  }
  
  // Anomaly detection
  if (event.baseline !== undefined && event.deviation !== undefined) {
    return 'anomaly';
  }
  
  return 'unknown';
}

/**
 * Risk level calculation helpers
 */
function calculateCfRisk(cfEvent: CloudflareEvent): number {
  let risk = cfEvent.threatScore || 0;
  
  // Bot score adjustment
  if (cfEvent.botScore && cfEvent.botScore < 30) {
    risk += 20;
  }
  
  // WAF action adjustment
  if (cfEvent.wafAction === 'block') {
    risk += 30;
  } else if (cfEvent.wafAction === 'challenge') {
    risk += 15;
  }
  
  // Status code adjustment
  if (cfEvent.statusCode >= 400 && cfEvent.statusCode < 500) {
    risk += 10;
  }
  
  return Math.min(100, Math.max(0, risk));
}

function mapWafSeverityToRisk(severity: string): number {
  switch (severity) {
    case 'critical': return 90;
    case 'high': return 70;
    case 'medium': return 40;
    case 'low': return 20;
    default: return 0;
  }
}

function mapScanSeverityToRisk(severity: string): number {
  switch (severity) {
    case 'critical': return 95;
    case 'high': return 75;
    case 'medium': return 45;
    case 'low': return 25;
    default: return 0;
  }
}

function mapOsintSeverityToRisk(severity: string): number {
  switch (severity) {
    case 'critical': return 85;
    case 'high': return 65;
    case 'medium': return 35;
    case 'low': return 15;
    default: return 0;
  }
}

/**
 * Generate unique ray ID for tracing
 */
function generateRayId(): string {
  return `ray-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Event validation and enrichment
 */
export function enrichEvent(event: SocEvent): SocEvent {
  // Add geolocation if IP available
  if (event.ip && !event.country) {
    event.country = getCountryFromIP(event.ip);
  }
  
  // Add ASN if IP available and ASN missing
  if (event.ip && !event.asn) {
    event.asn = getASNFromIP(event.ip);
  }
  
  // Add risk classification
  const riskLevel = (event.metadata as Record<string, unknown>)?.riskLevel as number || 0;
  event.metadata = {
    ...event.metadata,
    riskClassification: classifyRisk(riskLevel),
    processingTime: new Date().toISOString(),
  };
  
  return event;
}

function getCountryFromIP(ip: string): string {
  // Placeholder - would use GeoIP service in production
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('127.')) {
    return 'LO'; // Local/Private
  }
  return 'UN'; // Unknown
}

function getASNFromIP(_ip: string): string {
  // Placeholder - would use ASN lookup service in production
  return `AS${Math.floor(Math.random() * 65535)}`;
}

function classifyRisk(riskLevel: number): string {
  if (riskLevel >= 80) return 'CRITICAL';
  if (riskLevel >= 60) return 'HIGH';
  if (riskLevel >= 40) return 'MEDIUM';
  if (riskLevel >= 20) return 'LOW';
  return 'INFO';
}

/**
 * Event aggregation helpers
 */
export interface EventSummary {
  totalEvents: number;
  eventsBySource: Record<string, number>;
  riskDistribution: Record<string, number>;
  topIPs: Array<{ip: string, count: number}>;
  topRoutes: Array<{route: string, count: number}>;
  timeRange: {start: Date, end: Date};
}

export function summarizeEvents(events: SocEvent[]): EventSummary {
  const eventsBySource: Record<string, number> = {};
  const riskDistribution: Record<string, number> = {};
  const ipCounts: Record<string, number> = {};
  const routeCounts: Record<string, number> = {};
  
  let minTime = new Date();
  let maxTime = new Date(0);
  
  for (const event of events) {
    // Source distribution
    eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;
    
    // Risk distribution
    const risk = (event.metadata as Record<string, unknown>)?.riskClassification as string || 'INFO';
    riskDistribution[risk] = (riskDistribution[risk] || 0) + 1;
    
    // IP counts
    if (event.ip) {
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
    }
    
    // Route counts
    if (event.route) {
      routeCounts[event.route] = (routeCounts[event.route] || 0) + 1;
    }
    
    // Time range
    if (event.timestamp < minTime) minTime = event.timestamp;
    if (event.timestamp > maxTime) maxTime = event.timestamp;
  }
  
  // Sort and limit top IPs/routes
  const topIPs = Object.entries(ipCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));
    
  const topRoutes = Object.entries(routeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));
  
  return {
    totalEvents: events.length,
    eventsBySource,
    riskDistribution,
    topIPs,
    topRoutes,
    timeRange: { start: minTime, end: maxTime },
  };
}
