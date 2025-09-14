/**
 * 🛡️ AILYDIAN SOC (Security Operations Center) Core
 * AI-powered security monitoring, threat detection & incident response
 * © Emrah Şardağ. All rights reserved.
 */

import { mitreAttackEngine } from './mitre';
import { correlationEngine } from './correlation';
import { threatIntelligence } from './threat-intel';
import { incidentResponse } from './incident-response';
import { playbooks } from './playbooks';
import { sendSecurityAlert } from '../alerts';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  source: 'cloudflare' | 'application' | 'system' | 'network' | 'user';
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  raw: any;
  normalized: {
    srcIP?: string;
    destIP?: string;
    userAgent?: string;
    url?: string;
    method?: string;
    statusCode?: number;
    payload?: string;
    user?: string;
    geolocation?: {
      country: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
  };
  mitre?: {
    tactics: string[];
    techniques: string[];
    confidence: number;
  };
  enrichment?: {
    reputation?: 'MALICIOUS' | 'SUSPICIOUS' | 'CLEAN';
    threatActor?: string;
    campaign?: string;
    malwareFamily?: string;
    iocs?: string[];
  };
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';
  events: SecurityEvent[];
  timeline: {
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }[];
  mitigation: {
    automated: string[];
    manual: string[];
  };
  impact: {
    scope: string;
    affected_systems: string[];
    business_impact: string;
  };
  created: string;
  updated: string;
  assignee?: string;
}

export interface SOCMetrics {
  eventsPerHour: number;
  incidentsOpen: number;
  incidentsResolved: number;
  meanTimeToDetection: number; // minutes
  meanTimeToResponse: number; // minutes
  meanTimeToResolution: number; // minutes
  topAttackVectors: { technique: string; count: number }[];
  topSourceIPs: { ip: string; count: number; reputation?: string }[];
  topTargets: { target: string; count: number }[];
  threatActors: { actor: string; confidence: number }[];
}

export class SOCCore {
  private static instance: SOCCore;
  private events: Map<string, SecurityEvent> = new Map();
  private incidents: Map<string, SecurityIncident> = new Map();
  private eventBuffer: SecurityEvent[] = [];
  private correlationRules: any[] = [];
  private isMonitoring = false;

  private constructor() {}

  static getInstance(): SOCCore {
    if (!SOCCore.instance) {
      SOCCore.instance = new SOCCore();
    }
    return SOCCore.instance;
  }

  /**
   * Initialize SOC with configuration
   */
  async initialize(): Promise<void> {
    console.log('🛡️ Initializing AILYDIAN SOC...');
    
    // Load correlation rules
    await this.loadCorrelationRules();
    
    // Start monitoring
    this.startMonitoring();
    
    console.log('✅ SOC initialized successfully');
  }

  /**
   * Ingest security event for processing
   */
  async ingestEvent(event: Partial<SecurityEvent>): Promise<SecurityEvent> {
    const processedEvent: SecurityEvent = {
      id: event.id || this.generateEventId(),
      timestamp: event.timestamp || new Date().toISOString(),
      source: event.source || 'application',
      type: event.type || 'unknown',
      severity: event.severity || 'LOW',
      raw: event.raw || {},
      normalized: event.normalized || {},
      ...event
    };

    // Normalize event data
    await this.normalizeEvent(processedEvent);

    // MITRE ATT&CK mapping
    processedEvent.mitre = await mitreAttackEngine.analyzeEvent(processedEvent);

    // Threat intelligence enrichment
    const enrichment = await threatIntelligence.enrichEvent(processedEvent);
    if (enrichment && enrichment.reputation !== 'UNKNOWN') {
      processedEvent.enrichment = {
        reputation: enrichment.reputation as 'MALICIOUS' | 'SUSPICIOUS' | 'CLEAN',
        threatActor: enrichment.threatActor,
        campaign: enrichment.campaign,
        malwareFamily: enrichment.malwareFamily,
        iocs: enrichment.iocs?.map(ioc => ioc.value)
      };
    }

    // Store event
    this.events.set(processedEvent.id, processedEvent);
    this.eventBuffer.push(processedEvent);

    // Check for correlations
    await this.processCorrelations(processedEvent);

    // Auto-incident creation for critical events
    if (processedEvent.severity === 'CRITICAL') {
      await this.createIncidentFromEvent(processedEvent);
    }

    return processedEvent;
  }

  /**
   * Create incident from security event
   */
  async createIncidentFromEvent(event: SecurityEvent): Promise<SecurityIncident> {
    const incident: SecurityIncident = {
      id: this.generateIncidentId(),
      title: `Security Incident - ${event.type}`,
      description: `Automated incident created from critical security event`,
      severity: event.severity,
      status: 'OPEN',
      events: [event],
      timeline: [{
        timestamp: new Date().toISOString(),
        action: 'INCIDENT_CREATED',
        user: 'AILYDIAN_SOC',
        details: 'Incident automatically created from critical security event'
      }],
      mitigation: {
        automated: [],
        manual: []
      },
      impact: {
        scope: 'TBD',
        affected_systems: [],
        business_impact: 'TBD'
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    // Execute automated playbook
    await this.executePlaybook(incident, event);

    this.incidents.set(incident.id, incident);

    // Send alert
    await sendSecurityAlert(
      `Security Incident Created: ${incident.title}`,
      incident.description,
      incident.severity,
      'SOC',
      { 
        incidentId: incident.id,
        eventId: event.id,
        mitreTechniques: event.mitre?.techniques || [],
        sourceIP: event.normalized.srcIP
      }
    );

    return incident;
  }

  /**
   * Execute security playbook for incident
   */
  private async executePlaybook(incident: SecurityIncident, triggerEvent: SecurityEvent): Promise<void> {
    try {
      const playbookResult = await playbooks.execute(
        incident.severity,
        triggerEvent.type,
        triggerEvent.mitre?.techniques || []
      );

      incident.mitigation.automated.push(...playbookResult.automatedActions);
      incident.mitigation.manual.push(...playbookResult.manualActions);

      // Add timeline entry
      incident.timeline.push({
        timestamp: new Date().toISOString(),
        action: 'PLAYBOOK_EXECUTED',
        user: 'AILYDIAN_SOC',
        details: `Executed playbook: ${playbookResult.playbookName}`
      });

    } catch (error) {
      console.error('Playbook execution error:', error);
      
      incident.timeline.push({
        timestamp: new Date().toISOString(),
        action: 'PLAYBOOK_ERROR',
        user: 'AILYDIAN_SOC',
        details: `Playbook execution failed: ${error}`
      });
    }
  }

  /**
   * Process event correlations
   */
  private async processCorrelations(event: SecurityEvent): Promise<void> {
    try {
      const correlations = await correlationEngine.analyzeEvent(event, this.eventBuffer);
      
      if (correlations.length > 0) {
        // Create or update incident with correlated events
        const relatedIncident = this.findRelatedIncident(correlations);
        
        if (relatedIncident) {
          relatedIncident.events.push(event);
          relatedIncident.updated = new Date().toISOString();
          
          relatedIncident.timeline.push({
            timestamp: new Date().toISOString(),
            action: 'EVENT_CORRELATED',
            user: 'AILYDIAN_SOC',
            details: `Event correlated with existing incident`
          });
        } else {
          // Create new incident from correlated events
          await this.createCorrelationIncident(correlations);
        }
      }
    } catch (error) {
      console.error('Correlation processing error:', error);
    }
  }

  /**
   * Normalize event data to common format
   */
  private async normalizeEvent(event: SecurityEvent): Promise<void> {
    switch (event.source) {
      case 'cloudflare':
        this.normalizeCloudflareEvent(event);
        break;
      case 'application':
        this.normalizeApplicationEvent(event);
        break;
      case 'system':
        this.normalizeSystemEvent(event);
        break;
    }
  }

  private normalizeCloudflareEvent(event: SecurityEvent): void {
    if (event.raw.clientIP) {
      event.normalized.srcIP = event.raw.clientIP;
    }
    if (event.raw.userAgent) {
      event.normalized.userAgent = event.raw.userAgent;
    }
    if (event.raw.path) {
      event.normalized.url = event.raw.path;
    }
    if (event.raw.country) {
      event.normalized.geolocation = {
        country: event.raw.country
      };
    }
  }

  private normalizeApplicationEvent(event: SecurityEvent): void {
    // Normalize application-specific events
    if (event.raw.request) {
      event.normalized.url = event.raw.request.url;
      event.normalized.method = event.raw.request.method;
      event.normalized.srcIP = event.raw.request.ip;
      event.normalized.userAgent = event.raw.request.userAgent;
    }
  }

  private normalizeSystemEvent(event: SecurityEvent): void {
    // Normalize system-level events
    if (event.raw.process) {
      event.normalized.payload = JSON.stringify(event.raw.process);
    }
  }

  /**
   * Get SOC metrics and statistics
   */
  getMetrics(timeRange: number = 24): SOCMetrics {
    const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);
    const recentEvents = Array.from(this.events.values())
      .filter(e => new Date(e.timestamp) >= since);

    // Calculate metrics
    const eventsPerHour = recentEvents.length / timeRange;
    const incidentsOpen = Array.from(this.incidents.values())
      .filter(i => i.status === 'OPEN').length;
    const incidentsResolved = Array.from(this.incidents.values())
      .filter(i => i.status === 'RESOLVED').length;

    // Top attack vectors
    const techniqueCount = new Map<string, number>();
    recentEvents.forEach(event => {
      if (event.mitre?.techniques) {
        event.mitre.techniques.forEach(technique => {
          techniqueCount.set(technique, (techniqueCount.get(technique) || 0) + 1);
        });
      }
    });

    const topAttackVectors = Array.from(techniqueCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([technique, count]) => ({ technique, count }));

    // Top source IPs
    const ipCount = new Map<string, number>();
    recentEvents.forEach(event => {
      if (event.normalized.srcIP) {
        ipCount.set(event.normalized.srcIP, (ipCount.get(event.normalized.srcIP) || 0) + 1);
      }
    });

    const topSourceIPs = Array.from(ipCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    return {
      eventsPerHour,
      incidentsOpen,
      incidentsResolved,
      meanTimeToDetection: 0, // TODO: Calculate from incident data
      meanTimeToResponse: 0,
      meanTimeToResolution: 0,
      topAttackVectors,
      topSourceIPs,
      topTargets: [], // TODO: Implement
      threatActors: [] // TODO: Implement
    };
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return Array.from(this.events.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get open incidents
   */
  getOpenIncidents(): SecurityIncident[] {
    return Array.from(this.incidents.values())
      .filter(i => i.status === 'OPEN')
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }

  /**
   * Update incident status
   */
  async updateIncident(incidentId: string, updates: Partial<SecurityIncident>): Promise<SecurityIncident | null> {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    Object.assign(incident, updates);
    incident.updated = new Date().toISOString();

    if (updates.status) {
      incident.timeline.push({
        timestamp: new Date().toISOString(),
        action: 'STATUS_CHANGED',
        user: updates.assignee || 'SYSTEM',
        details: `Status changed to ${updates.status}`
      });
    }

    return incident;
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Process event buffer every 30 seconds
    setInterval(() => {
      this.processEventBuffer();
    }, 30000);

    // Clean old events every hour
    setInterval(() => {
      this.cleanOldEvents();
    }, 3600000);
  }

  private processEventBuffer(): void {
    // Process buffered events for correlations
    if (this.eventBuffer.length > 1000) {
      this.eventBuffer = this.eventBuffer.slice(-500); // Keep last 500 events
    }
  }

  private cleanOldEvents(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    
    for (const [id, event] of this.events.entries()) {
      if (new Date(event.timestamp) < cutoff) {
        this.events.delete(id);
      }
    }
  }

  private async loadCorrelationRules(): Promise<void> {
    // Load correlation rules from configuration or database
    this.correlationRules = [
      {
        name: 'Brute Force Attack',
        conditions: {
          eventType: ['authentication_failed'],
          timeWindow: 300, // 5 minutes
          threshold: 5,
          groupBy: 'srcIP'
        }
      },
      {
        name: 'SQL Injection Attempt',
        conditions: {
          eventType: ['web_attack'],
          pattern: /('|\\')|(;)|(\\x27)|(union)|(select)|(insert)|(delete)|(update)|(drop)|(create)|(alter)/i,
          timeWindow: 60
        }
      },
      // Add more correlation rules...
    ];
  }

  private findRelatedIncident(correlations: any[]): SecurityIncident | null {
    // Find existing incident that matches correlation criteria
    return null; // Simplified implementation
  }

  private async createCorrelationIncident(correlations: any[]): Promise<SecurityIncident> {
    // Create incident from correlated events
    const incident: SecurityIncident = {
      id: this.generateIncidentId(),
      title: `Correlated Security Activity Detected`,
      description: `Multiple related security events detected`,
      severity: 'HIGH',
      status: 'OPEN',
      events: [],
      timeline: [],
      mitigation: { automated: [], manual: [] },
      impact: { scope: 'TBD', affected_systems: [], business_impact: 'TBD' },
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    this.incidents.set(incident.id, incident);
    return incident;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateIncidentId(): string {
    return `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const socCore = SOCCore.getInstance();

// Convenience exports
export { mitreAttackEngine } from './mitre';
export { correlationEngine } from './correlation';
export { threatIntelligence } from './threat-intel';
export { incidentResponse } from './incident-response';
export { playbooks } from './playbooks';
