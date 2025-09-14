/**
 * 🛡️ AILYDIAN SOC - Correlation Engine
 * Time-based pattern correlation, session clustering, and actor identification
 * © Emrah Şardağ. All rights reserved.
 */

import { SocEvent, SocSession } from './schema';

export interface CorrelationConfig {
  windowMinutes: number;
  minEvents: number;
  maxSessions: number;
  similarityThreshold: number;
}

export interface ActorFingerprint {
  ip?: string;
  asn?: string;
  userAgent?: string;
  country?: string;
  routes: Set<string>;
  methods: Set<string>;
  statusCodes: Set<number>;
  riskScore: number;
}

export interface SessionCluster {
  id: string;
  firstSeen: Date;
  lastSeen: Date;
  eventCount: number;
  uniqueIPs: Set<string>;
  uniqueRoutes: Set<string>;
  actors: ActorFingerprint[];
  riskScore: number;
  patterns: string[];
  metadata: Record<string, unknown>;
}

/**
 * Main correlation engine
 */
export class CorrelationEngine {
  private config: CorrelationConfig;

  constructor(config: Partial<CorrelationConfig> = {}) {
    this.config = {
      windowMinutes: config.windowMinutes || 45,
      minEvents: config.minEvents || 3,
      maxSessions: config.maxSessions || 1000,
      similarityThreshold: config.similarityThreshold || 0.7,
    };
  }

  /**
   * Correlate events into sessions
   */
  async correlateEvents(events: SocEvent[]): Promise<SessionCluster[]> {
    if (events.length === 0) return [];

    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Group events by time windows
    const timeWindows = this.createTimeWindows(sortedEvents);
    
    // Cluster events within each window
    const clusters: SessionCluster[] = [];
    
    for (const windowEvents of timeWindows) {
      const windowClusters = await this.clusterEventsByActors(windowEvents);
      clusters.push(...windowClusters);
    }

    // Merge similar clusters across time windows
    const mergedClusters = this.mergeSimilarClusters(clusters);
    
    // Calculate risk scores
    return mergedClusters.map(cluster => ({
      ...cluster,
      riskScore: this.calculateSessionRisk(cluster),
      patterns: this.identifyPatterns(cluster),
    }));
  }

  /**
   * Create sliding time windows
   */
  private createTimeWindows(events: SocEvent[]): SocEvent[][] {
    const windows: SocEvent[][] = [];
    const windowMs = this.config.windowMinutes * 60 * 1000;
    
    if (events.length === 0) return windows;
    
    let windowStart = events[0].timestamp.getTime();
    let currentWindow: SocEvent[] = [];
    
    for (const event of events) {
      const eventTime = event.timestamp.getTime();
      
      // If event is outside current window, start new window
      if (eventTime > windowStart + windowMs) {
        if (currentWindow.length >= this.config.minEvents) {
          windows.push([...currentWindow]);
        }
        
        // Start new window
        windowStart = eventTime;
        currentWindow = [event];
      } else {
        currentWindow.push(event);
      }
    }
    
    // Add final window if it has enough events
    if (currentWindow.length >= this.config.minEvents) {
      windows.push(currentWindow);
    }
    
    return windows;
  }

  /**
   * Cluster events by actor similarity
   */
  private async clusterEventsByActors(events: SocEvent[]): Promise<SessionCluster[]> {
    const clusters: SessionCluster[] = [];
    const processedEvents = new Set<SocEvent>();
    
    for (const event of events) {
      if (processedEvents.has(event)) continue;
      
      // Find similar events
      const similarEvents = this.findSimilarEvents(event, events, processedEvents);
      
      if (similarEvents.length >= this.config.minEvents) {
        const cluster = this.createClusterFromEvents(similarEvents);
        clusters.push(cluster);
        
        // Mark events as processed
        similarEvents.forEach(e => processedEvents.add(e));
      }
    }
    
    return clusters;
  }

  /**
   * Find events similar to a reference event
   */
  private findSimilarEvents(
    referenceEvent: SocEvent, 
    allEvents: SocEvent[], 
    processedEvents: Set<SocEvent>
  ): SocEvent[] {
    const similarEvents: SocEvent[] = [referenceEvent];
    
    for (const event of allEvents) {
      if (event === referenceEvent || processedEvents.has(event)) continue;
      
      const similarity = this.calculateEventSimilarity(referenceEvent, event);
      if (similarity >= this.config.similarityThreshold) {
        similarEvents.push(event);
      }
    }
    
    return similarEvents;
  }

  /**
   * Calculate similarity between two events
   */
  private calculateEventSimilarity(event1: SocEvent, event2: SocEvent): number {
    let score = 0;
    let factors = 0;
    
    // IP similarity
    if (event1.ip && event2.ip) {
      factors++;
      if (event1.ip === event2.ip) {
        score += 0.4; // High weight for same IP
      } else if (this.isSameSubnet(event1.ip, event2.ip)) {
        score += 0.2; // Lower weight for same subnet
      }
    }
    
    // ASN similarity
    if (event1.asn && event2.asn) {
      factors++;
      if (event1.asn === event2.asn) {
        score += 0.2;
      }
    }
    
    // User Agent similarity
    if (event1.userAgent && event2.userAgent) {
      factors++;
      const uaSimilarity = this.calculateStringSimilarity(event1.userAgent, event2.userAgent);
      score += uaSimilarity * 0.3;
    }
    
    // Route similarity
    if (event1.route && event2.route) {
      factors++;
      if (event1.route === event2.route) {
        score += 0.15;
      } else if (this.isSimilarRoute(event1.route, event2.route)) {
        score += 0.05;
      }
    }
    
    // Country similarity
    if (event1.country && event2.country) {
      factors++;
      if (event1.country === event2.country) {
        score += 0.1;
      }
    }
    
    return factors > 0 ? score / factors : 0;
  }

  /**
   * Create cluster from similar events
   */
  private createClusterFromEvents(events: SocEvent[]): SessionCluster {
    const id = `cluster-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const firstSeen = new Date(Math.min(...events.map(e => e.timestamp.getTime())));
    const lastSeen = new Date(Math.max(...events.map(e => e.timestamp.getTime())));
    
    const uniqueIPs = new Set(events.map(e => e.ip).filter(Boolean) as string[]);
    const uniqueRoutes = new Set(events.map(e => e.route).filter(Boolean) as string[]);
    
    // Extract actor fingerprints
    const actors = this.extractActorFingerprints(events);
    
    return {
      id,
      firstSeen,
      lastSeen,
      eventCount: events.length,
      uniqueIPs,
      uniqueRoutes,
      actors,
      riskScore: 0, // Will be calculated later
      patterns: [], // Will be identified later
      metadata: {
        sources: [...new Set(events.map(e => e.source))],
        timeSpan: lastSeen.getTime() - firstSeen.getTime(),
        avgEventsPerMinute: events.length / ((lastSeen.getTime() - firstSeen.getTime()) / 60000),
      },
    };
  }

  /**
   * Extract actor fingerprints from events
   */
  private extractActorFingerprints(events: SocEvent[]): ActorFingerprint[] {
    const fingerprints = new Map<string, ActorFingerprint>();
    
    for (const event of events) {
      if (!event.ip) continue;
      
      const key = `${event.ip}-${event.asn}-${event.userAgent}`;
      
      if (!fingerprints.has(key)) {
        fingerprints.set(key, {
          ip: event.ip,
          asn: event.asn,
          userAgent: event.userAgent,
          country: event.country,
          routes: new Set(),
          methods: new Set(),
          statusCodes: new Set(),
          riskScore: 0,
        });
      }
      
      const fingerprint = fingerprints.get(key)!;
      
      // Accumulate behavior patterns
      if (event.route) fingerprint.routes.add(event.route);
      if (event.method) fingerprint.methods.add(event.method);
      if (event.statusCode) fingerprint.statusCodes.add(event.statusCode);
      
      // Update risk score
      const eventRisk = (event.metadata as Record<string, unknown>)?.riskLevel as number || 0;
      fingerprint.riskScore = Math.max(fingerprint.riskScore, eventRisk);
    }
    
    return Array.from(fingerprints.values());
  }

  /**
   * Merge similar clusters across time windows
   */
  private mergeSimilarClusters(clusters: SessionCluster[]): SessionCluster[] {
    if (clusters.length <= 1) return clusters;
    
    const merged: SessionCluster[] = [];
    const processedClusters = new Set<SessionCluster>();
    
    for (const cluster of clusters) {
      if (processedClusters.has(cluster)) continue;
      
      // Find clusters that should be merged
      const toMerge = [cluster];
      
      for (const otherCluster of clusters) {
        if (otherCluster === cluster || processedClusters.has(otherCluster)) continue;
        
        if (this.shouldMergeClusters(cluster, otherCluster)) {
          toMerge.push(otherCluster);
        }
      }
      
      // Merge clusters
      const mergedCluster = this.mergeClusters(toMerge);
      merged.push(mergedCluster);
      
      // Mark as processed
      toMerge.forEach(c => processedClusters.add(c));
    }
    
    return merged;
  }

  /**
   * Determine if two clusters should be merged
   */
  private shouldMergeClusters(cluster1: SessionCluster, cluster2: SessionCluster): boolean {
    // Check actor overlap
    const ips1 = new Set(cluster1.actors.map(a => a.ip).filter(Boolean));
    const ips2 = new Set(cluster2.actors.map(a => a.ip).filter(Boolean));
    
    const ipOverlap = new Set([...ips1].filter(ip => ips2.has(ip)));
    const ipOverlapRatio = ipOverlap.size / Math.min(ips1.size, ips2.size);
    
    // Check time proximity (within 2x window)
    const timeGap = Math.abs(cluster1.firstSeen.getTime() - cluster2.lastSeen.getTime());
    const maxTimeGap = this.config.windowMinutes * 2 * 60 * 1000;
    
    return ipOverlapRatio >= 0.5 && timeGap <= maxTimeGap;
  }

  /**
   * Merge multiple clusters
   */
  private mergeClusters(clusters: SessionCluster[]): SessionCluster {
    const merged: SessionCluster = {
      id: `merged-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      firstSeen: new Date(Math.min(...clusters.map(c => c.firstSeen.getTime()))),
      lastSeen: new Date(Math.max(...clusters.map(c => c.lastSeen.getTime()))),
      eventCount: clusters.reduce((sum, c) => sum + c.eventCount, 0),
      uniqueIPs: new Set([...clusters.flatMap(c => [...c.uniqueIPs])]),
      uniqueRoutes: new Set([...clusters.flatMap(c => [...c.uniqueRoutes])]),
      actors: this.mergeActorFingerprints(clusters.flatMap(c => c.actors)),
      riskScore: Math.max(...clusters.map(c => c.riskScore)),
      patterns: [...new Set(clusters.flatMap(c => c.patterns))],
      metadata: {
        mergedFrom: clusters.map(c => c.id),
        totalClusters: clusters.length,
      },
    };
    
    return merged;
  }

  /**
   * Merge actor fingerprints
   */
  private mergeActorFingerprints(actors: ActorFingerprint[]): ActorFingerprint[] {
    const mergedMap = new Map<string, ActorFingerprint>();
    
    for (const actor of actors) {
      const key = `${actor.ip}-${actor.asn}`;
      
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          ...actor,
          routes: new Set(actor.routes),
          methods: new Set(actor.methods),
          statusCodes: new Set(actor.statusCodes),
        });
      } else {
        const existing = mergedMap.get(key)!;
        
        // Merge sets
        actor.routes.forEach(route => existing.routes.add(route));
        actor.methods.forEach(method => existing.methods.add(method));
        actor.statusCodes.forEach(code => existing.statusCodes.add(code));
        
        // Update risk score
        existing.riskScore = Math.max(existing.riskScore, actor.riskScore);
      }
    }
    
    return Array.from(mergedMap.values());
  }

  /**
   * Calculate session risk score
   */
  private calculateSessionRisk(cluster: SessionCluster): number {
    let risk = 0;
    let factors = 0;
    
    // Actor risk
    const maxActorRisk = Math.max(...cluster.actors.map(a => a.riskScore));
    risk += maxActorRisk * 0.4;
    factors++;
    
    // Event frequency risk
    const eventsPerMinute = cluster.eventCount / ((cluster.lastSeen.getTime() - cluster.firstSeen.getTime()) / 60000);
    if (eventsPerMinute > 10) {
      risk += Math.min(30, eventsPerMinute * 2);
      factors++;
    }
    
    // Route diversity risk
    const routeCount = cluster.uniqueRoutes.size;
    if (routeCount > 10) {
      risk += Math.min(20, routeCount);
      factors++;
    }
    
    // IP diversity risk
    const ipCount = cluster.uniqueIPs.size;
    if (ipCount > 5) {
      risk += Math.min(25, ipCount * 3);
      factors++;
    }
    
    return Math.min(100, risk / Math.max(1, factors) * factors);
  }

  /**
   * Identify attack patterns
   */
  private identifyPatterns(cluster: SessionCluster): string[] {
    const patterns: string[] = [];
    
    // High frequency pattern
    const eventsPerMinute = cluster.eventCount / ((cluster.lastSeen.getTime() - cluster.firstSeen.getTime()) / 60000);
    if (eventsPerMinute > 20) {
      patterns.push('HIGH_FREQUENCY_REQUESTS');
    }
    
    // Route scanning pattern
    if (cluster.uniqueRoutes.size > 20) {
      patterns.push('ROUTE_ENUMERATION');
    }
    
    // Multi-IP pattern
    if (cluster.uniqueIPs.size > 10) {
      patterns.push('DISTRIBUTED_ATTACK');
    }
    
    // Error rate pattern
    const errorCodes = cluster.actors.flatMap(a => [...a.statusCodes].filter(c => c >= 400));
    if (errorCodes.length / cluster.eventCount > 0.5) {
      patterns.push('HIGH_ERROR_RATE');
    }
    
    // Brute force pattern
    const loginRoutes = [...cluster.uniqueRoutes].filter(r => 
      r.includes('login') || r.includes('auth') || r.includes('signin')
    );
    if (loginRoutes.length > 0 && cluster.eventCount > 50) {
      patterns.push('BRUTE_FORCE_ATTEMPT');
    }
    
    return patterns;
  }

  /**
   * Helper methods
   */
  private isSameSubnet(ip1: string, ip2: string): boolean {
    // Simple /24 subnet check
    const parts1 = ip1.split('.');
    const parts2 = ip2.split('.');
    
    return parts1.slice(0, 3).join('.') === parts2.slice(0, 3).join('.');
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private isSimilarRoute(route1: string, route2: string): boolean {
    // Remove query parameters and fragments
    const path1 = route1.split('?')[0].split('#')[0];
    const path2 = route2.split('?')[0].split('#')[0];
    
    const segments1 = path1.split('/').filter(Boolean);
    const segments2 = path2.split('/').filter(Boolean);
    
    if (segments1.length !== segments2.length) return false;
    
    let similarSegments = 0;
    for (let i = 0; i < segments1.length; i++) {
      if (segments1[i] === segments2[i] || 
          (this.isParameter(segments1[i]) && this.isParameter(segments2[i]))) {
        similarSegments++;
      }
    }
    
    return similarSegments / segments1.length >= 0.8;
  }

  private isParameter(segment: string): boolean {
    return /^[a-f0-9-]{8,}$/i.test(segment) || // UUID-like
           /^\d+$/.test(segment) || // Number
           segment.startsWith(':') || // Route parameter
           segment.startsWith('{') && segment.endsWith('}'); // Template parameter
  }
}

/**
 * Convert session cluster to SOC session format
 */
export function clusterToSocSession(cluster: SessionCluster): Omit<SocSession, 'id'> {
  return {
    firstSeen: cluster.firstSeen,
    lastSeen: cluster.lastSeen,
    actors: {
      fingerprints: cluster.actors.map(actor => ({
        ip: actor.ip,
        asn: actor.asn,
        userAgent: actor.userAgent,
        country: actor.country,
        routes: [...actor.routes],
        methods: [...actor.methods],
        statusCodes: [...actor.statusCodes],
        riskScore: actor.riskScore,
      })),
      uniqueIPs: [...cluster.uniqueIPs],
      uniqueRoutes: [...cluster.uniqueRoutes],
    },
    score: cluster.riskScore,
    eventCount: cluster.eventCount,
    metadata: {
      ...cluster.metadata,
      patterns: cluster.patterns,
      clusterId: cluster.id,
    },
  };
}
