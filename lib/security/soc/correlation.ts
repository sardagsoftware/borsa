/**
 * 🛡️ Security Event Correlation Engine
 * Correlates security events to detect complex attack patterns
 * © Emrah Şardağ. All rights reserved.
 */

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    eventTypes: string[];
    timeWindow: number; // seconds
    threshold: number;
    groupBy?: string;
    pattern?: RegExp;
    geolocation?: {
      countries?: string[];
      excludeCountries?: string[];
    };
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitre?: {
    tactics: string[];
    techniques: string[];
  };
  actions: {
    createIncident: boolean;
    blockSource: boolean;
    alert: boolean;
    playbook?: string;
  };
}

export interface CorrelationResult {
  ruleId: string;
  ruleName: string;
  events: any[];
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  mitre?: {
    tactics: string[];
    techniques: string[];
  };
  recommendedActions: string[];
}

export class CorrelationEngine {
  private static instance: CorrelationEngine;
  private rules: Map<string, CorrelationRule> = new Map();
  private eventHistory: any[] = [];
  private maxHistorySize = 10000;

  private constructor() {
    this.initializeRules();
  }

  static getInstance(): CorrelationEngine {
    if (!CorrelationEngine.instance) {
      CorrelationEngine.instance = new CorrelationEngine();
    }
    return CorrelationEngine.instance;
  }

  /**
   * Analyze event against correlation rules
   */
  async analyzeEvent(event: any, eventBuffer: any[]): Promise<CorrelationResult[]> {
    const results: CorrelationResult[] = [];
    
    // Add event to history
    this.addEventToHistory(event);
    
    // Check each correlation rule
    for (const rule of this.rules.values()) {
      const result = await this.checkRule(rule, event, eventBuffer);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * Add custom correlation rule
   */
  addRule(rule: CorrelationRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove correlation rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Get all correlation rules
   */
  getRules(): CorrelationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Update existing rule
   */
  updateRule(ruleId: string, updates: Partial<CorrelationRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    Object.assign(rule, updates);
    return true;
  }

  /**
   * Check specific rule against event
   */
  private async checkRule(rule: CorrelationRule, event: any, eventBuffer: any[]): Promise<CorrelationResult | null> {
    // Check if event type matches rule
    if (!rule.conditions.eventTypes.includes(event.type)) {
      return null;
    }

    // Get relevant events within time window
    const timeWindow = rule.conditions.timeWindow * 1000; // Convert to milliseconds
    const cutoffTime = new Date(Date.now() - timeWindow);
    
    const relevantEvents = [...eventBuffer, event].filter(e => 
      new Date(e.timestamp) >= cutoffTime &&
      rule.conditions.eventTypes.includes(e.type)
    );

    // Apply grouping if specified
    let groupedEvents: any[][] = [];
    if (rule.conditions.groupBy) {
      const groups = this.groupEvents(relevantEvents, rule.conditions.groupBy);
      groupedEvents = Array.from(groups.values());
    } else {
      groupedEvents = [relevantEvents];
    }

    // Check threshold for each group
    for (const group of groupedEvents) {
      if (group.length >= rule.conditions.threshold) {
        // Additional pattern matching
        if (rule.conditions.pattern) {
          const patternMatch = group.some(e => 
            this.eventMatchesPattern(e, rule.conditions.pattern!)
          );
          if (!patternMatch) continue;
        }

        // Geolocation filtering
        if (rule.conditions.geolocation) {
          const geoMatch = this.checkGeolocationConditions(group, rule.conditions.geolocation);
          if (!geoMatch) continue;
        }

        // Calculate confidence based on various factors
        const confidence = this.calculateCorrelationConfidence(rule, group);

        // Generate correlation result
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          events: group,
          confidence,
          severity: rule.severity,
          description: this.generateCorrelationDescription(rule, group),
          mitre: rule.mitre,
          recommendedActions: this.generateRecommendedActions(rule, group)
        };
      }
    }

    return null;
  }

  /**
   * Group events by specified field
   */
  private groupEvents(events: any[], groupBy: string): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    events.forEach(event => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'srcIP':
          groupKey = event.normalized?.srcIP || 'unknown';
          break;
        case 'user':
          groupKey = event.normalized?.user || 'unknown';
          break;
        case 'userAgent':
          groupKey = event.normalized?.userAgent || 'unknown';
          break;
        case 'geolocation':
          groupKey = event.normalized?.geolocation?.country || 'unknown';
          break;
        default:
          groupKey = event[groupBy] || 'unknown';
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(event);
    });
    
    return groups;
  }

  /**
   * Check if event matches pattern
   */
  private eventMatchesPattern(event: any, pattern: RegExp): boolean {
    // Check various event fields for pattern match
    const fields = [
      event.normalized?.url,
      event.normalized?.payload,
      event.normalized?.userAgent,
      event.raw ? JSON.stringify(event.raw) : null
    ];

    return fields.some(field => field && pattern.test(field));
  }

  /**
   * Check geolocation conditions
   */
  private checkGeolocationConditions(events: any[], geoConditions: any): boolean {
    return events.some(event => {
      const country = event.normalized?.geolocation?.country;
      if (!country) return false;

      if (geoConditions.countries) {
        return geoConditions.countries.includes(country);
      }

      if (geoConditions.excludeCountries) {
        return !geoConditions.excludeCountries.includes(country);
      }

      return true;
    });
  }

  /**
   * Calculate correlation confidence
   */
  private calculateCorrelationConfidence(rule: CorrelationRule, events: any[]): number {
    let confidence = 0.5; // Base confidence

    // More events = higher confidence
    const eventRatio = events.length / rule.conditions.threshold;
    confidence += Math.min(eventRatio * 0.2, 0.3);

    // Time clustering (events close in time are more suspicious)
    const timeSpread = this.calculateTimeSpread(events);
    if (timeSpread < rule.conditions.timeWindow / 2) {
      confidence += 0.1;
    }

    // Geographic clustering
    const geoSpread = this.calculateGeographicSpread(events);
    if (geoSpread <= 1) { // Same country
      confidence += 0.1;
    }

    // Pattern matching bonus
    if (rule.conditions.pattern) {
      const patternMatches = events.filter(e => 
        this.eventMatchesPattern(e, rule.conditions.pattern!)
      ).length;
      confidence += (patternMatches / events.length) * 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate time spread of events (in seconds)
   */
  private calculateTimeSpread(events: any[]): number {
    if (events.length < 2) return 0;

    const times = events.map(e => new Date(e.timestamp).getTime()).sort();
    return (times[times.length - 1] - times[0]) / 1000;
  }

  /**
   * Calculate geographic spread of events
   */
  private calculateGeographicSpread(events: any[]): number {
    const countries = new Set();
    events.forEach(e => {
      if (e.normalized?.geolocation?.country) {
        countries.add(e.normalized.geolocation.country);
      }
    });
    return countries.size;
  }

  /**
   * Generate correlation description
   */
  private generateCorrelationDescription(rule: CorrelationRule, events: any[]): string {
    const eventCount = events.length;
    const timeSpan = this.calculateTimeSpread(events);
    const uniqueSources = new Set(events.map(e => e.normalized?.srcIP || 'unknown')).size;
    
    return `${rule.name}: ${eventCount} events detected over ${Math.round(timeSpan)} seconds from ${uniqueSources} source(s)`;
  }

  /**
   * Generate recommended actions
   */
  private generateRecommendedActions(rule: CorrelationRule, events: any[]): string[] {
    const actions: string[] = [];

    if (rule.actions.blockSource) {
      const sources = new Set(events.map(e => e.normalized?.srcIP).filter(Boolean));
      sources.forEach(ip => {
        actions.push(`Block IP address: ${ip}`);
      });
    }

    if (rule.actions.createIncident) {
      actions.push('Create security incident for investigation');
    }

    if (rule.actions.alert) {
      actions.push('Send security alert to SOC team');
    }

    if (rule.actions.playbook) {
      actions.push(`Execute security playbook: ${rule.actions.playbook}`);
    }

    // MITRE-based recommendations
    if (rule.mitre?.techniques) {
      rule.mitre.techniques.forEach(technique => {
        switch (technique) {
          case 'T1110': // Brute Force
            actions.push('Implement account lockout policies');
            actions.push('Enable multi-factor authentication');
            break;
          case 'T1190': // Exploit Public-Facing Application
            actions.push('Apply security patches immediately');
            actions.push('Review web application firewall rules');
            break;
          case 'T1046': // Network Service Scanning
            actions.push('Block scanning source IP addresses');
            actions.push('Review network segmentation');
            break;
        }
      });
    }

    return actions;
  }

  /**
   * Add event to internal history
   */
  private addEventToHistory(event: any): void {
    this.eventHistory.push(event);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize / 2);
    }
  }

  /**
   * Initialize default correlation rules
   */
  private initializeRules(): void {
    const defaultRules: CorrelationRule[] = [
      {
        id: 'brute_force_attack',
        name: 'Brute Force Attack',
        description: 'Multiple failed authentication attempts from same source',
        conditions: {
          eventTypes: ['authentication_failed', 'login_failed'],
          timeWindow: 300, // 5 minutes
          threshold: 5,
          groupBy: 'srcIP'
        },
        severity: 'HIGH',
        mitre: {
          tactics: ['TA0006'], // Credential Access
          techniques: ['T1110'] // Brute Force
        },
        actions: {
          createIncident: true,
          blockSource: true,
          alert: true,
          playbook: 'brute_force_response'
        }
      },
      {
        id: 'sql_injection_attack',
        name: 'SQL Injection Attack',
        description: 'Multiple SQL injection attempts detected',
        conditions: {
          eventTypes: ['web_attack', 'application_error'],
          timeWindow: 600, // 10 minutes
          threshold: 3,
          groupBy: 'srcIP',
          pattern: /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i
        },
        severity: 'CRITICAL',
        mitre: {
          tactics: ['TA0001'], // Initial Access
          techniques: ['T1190'] // Exploit Public-Facing Application
        },
        actions: {
          createIncident: true,
          blockSource: true,
          alert: true,
          playbook: 'web_attack_response'
        }
      },
      {
        id: 'xss_attack_pattern',
        name: 'Cross-Site Scripting Attack',
        description: 'Multiple XSS attempts from same source',
        conditions: {
          eventTypes: ['web_attack'],
          timeWindow: 300, // 5 minutes
          threshold: 3,
          groupBy: 'srcIP',
          pattern: /(<script|javascript:|onload|onerror|onclick|onmouseover)/i
        },
        severity: 'HIGH',
        mitre: {
          tactics: ['TA0001'], // Initial Access
          techniques: ['T1190'] // Exploit Public-Facing Application
        },
        actions: {
          createIncident: true,
          blockSource: true,
          alert: true,
          playbook: 'xss_response'
        }
      },
      {
        id: 'directory_traversal',
        name: 'Directory Traversal Attack',
        description: 'Multiple directory traversal attempts detected',
        conditions: {
          eventTypes: ['web_attack', 'file_access_denied'],
          timeWindow: 300, // 5 minutes
          threshold: 4,
          groupBy: 'srcIP',
          pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i
        },
        severity: 'HIGH',
        mitre: {
          tactics: ['TA0007'], // Discovery
          techniques: ['T1083'] // File and Directory Discovery
        },
        actions: {
          createIncident: true,
          blockSource: true,
          alert: true,
          playbook: 'directory_traversal_response'
        }
      },
      {
        id: 'ddos_attack',
        name: 'Distributed Denial of Service',
        description: 'High volume of requests indicating DDoS attack',
        conditions: {
          eventTypes: ['http_request', 'connection_attempt'],
          timeWindow: 60, // 1 minute
          threshold: 100,
          groupBy: 'srcIP'
        },
        severity: 'CRITICAL',
        mitre: {
          tactics: ['TA0040'], // Impact
          techniques: ['T1499'] // Endpoint Denial of Service
        },
        actions: {
          createIncident: true,
          blockSource: true,
          alert: true,
          playbook: 'ddos_response'
        }
      },
      {
        id: 'credential_stuffing',
        name: 'Credential Stuffing Attack',
        description: 'Multiple login attempts with different usernames',
        conditions: {
          eventTypes: ['authentication_failed'],
          timeWindow: 300, // 5 minutes
          threshold: 10,
          groupBy: 'srcIP'
        },
        severity: 'HIGH',
        mitre: {
          tactics: ['TA0006'], // Credential Access
          techniques: ['T1110.004'] // Credential Stuffing
        },
        actions: {
          createIncident: true,
          blockSource: true,
          alert: true,
          playbook: 'credential_stuffing_response'
        }
      },
      {
        id: 'data_exfiltration',
        name: 'Potential Data Exfiltration',
        description: 'Large amounts of data being transferred',
        conditions: {
          eventTypes: ['large_download', 'bulk_data_access'],
          timeWindow: 1800, // 30 minutes
          threshold: 3,
          groupBy: 'user'
        },
        severity: 'CRITICAL',
        mitre: {
          tactics: ['TA0010'], // Exfiltration
          techniques: ['T1041'] // Exfiltration Over C2 Channel
        },
        actions: {
          createIncident: true,
          blockSource: false,
          alert: true,
          playbook: 'data_exfiltration_response'
        }
      },
      {
        id: 'privilege_escalation',
        name: 'Privilege Escalation Attempt',
        description: 'Multiple failed privilege escalation attempts',
        conditions: {
          eventTypes: ['privilege_escalation_failed', 'unauthorized_access'],
          timeWindow: 600, // 10 minutes
          threshold: 3,
          groupBy: 'user'
        },
        severity: 'HIGH',
        mitre: {
          tactics: ['TA0004'], // Privilege Escalation
          techniques: ['T1068'] // Exploitation for Privilege Escalation
        },
        actions: {
          createIncident: true,
          blockSource: false,
          alert: true,
          playbook: 'privilege_escalation_response'
        }
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * Get correlation statistics
   */
  getStatistics(): {
    totalRules: number;
    activeRules: number;
    totalCorrelations: number;
    correlationsByRule: { ruleId: string; ruleName: string; count: number }[];
  } {
    // This would require storing correlation history
    return {
      totalRules: this.rules.size,
      activeRules: this.rules.size,
      totalCorrelations: 0,
      correlationsByRule: []
    };
  }

  /**
   * Export rules to JSON
   */
  exportRules(): string {
    const rules = Array.from(this.rules.values());
    return JSON.stringify(rules, null, 2);
  }

  /**
   * Import rules from JSON
   */
  importRules(rulesJson: string): boolean {
    try {
      const rules: CorrelationRule[] = JSON.parse(rulesJson);
      
      rules.forEach(rule => {
        this.rules.set(rule.id, rule);
      });
      
      return true;
    } catch (error) {
      console.error('Error importing correlation rules:', error);
      return false;
    }
  }
}

// Singleton instance
export const correlationEngine = CorrelationEngine.getInstance();
