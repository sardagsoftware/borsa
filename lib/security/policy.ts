/**
 * 🛡️ AILYDIAN AI LENS TRADER - Security Policy Engine
 * Runtime policy evaluation & enforcement
 * © Emrah Şardağ. All rights reserved.
 */

import { getSecret } from './secret';
import { sendSecurityAlert } from './alerts';

export type PolicyViolationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type PolicyCategory = 'ACCESS' | 'DATA' | 'NETWORK' | 'CRYPTO' | 'COMPLIANCE' | 'BEHAVIOR';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: PolicyCategory;
  enabled: boolean;
  severity: PolicyViolationSeverity;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  created: string;
  lastModified: string;
}

export interface PolicyCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'regex' | 'ip_range';
  value: any;
  caseSensitive?: boolean;
}

export interface PolicyAction {
  type: 'ALERT' | 'BLOCK' | 'LOG' | 'THROTTLE' | 'REDIRECT' | 'QUARANTINE';
  parameters?: Record<string, any>;
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  policyName: string;
  severity: PolicyViolationSeverity;
  category: PolicyCategory;
  timestamp: string;
  details: Record<string, any>;
  sourceIp?: string;
  userAgent?: string;
  userId?: string;
  actions: string[];
  resolved: boolean;
}

export interface PolicyContext {
  ip?: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  requestPath?: string;
  requestMethod?: string;
  headers?: Record<string, string>;
  body?: any;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class SecurityPolicyEngine {
  private static instance: SecurityPolicyEngine;
  private policies: Map<string, SecurityPolicy> = new Map();
  private violations: PolicyViolation[] = [];
  private blockedIps: Set<string> = new Set();
  private throttledIps: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor() {
    this.initializeDefaultPolicies();
  }

  static getInstance(): SecurityPolicyEngine {
    if (!SecurityPolicyEngine.instance) {
      SecurityPolicyEngine.instance = new SecurityPolicyEngine();
    }
    return SecurityPolicyEngine.instance;
  }

  private initializeDefaultPolicies(): void {
    // SQL Injection Detection
    this.addPolicy({
      id: 'sql-injection',
      name: 'SQL Injection Detection',
      description: 'Detects potential SQL injection attempts',
      category: 'DATA',
      enabled: true,
      severity: 'CRITICAL',
      conditions: [
        {
          field: 'request.body',
          operator: 'regex',
          value: /(union|select|insert|update|delete|drop|create|alter|exec|execute|sp_|xp_)/i
        },
        {
          field: 'request.query',
          operator: 'regex',
          value: /'[^']*'|"[^"]*"|;|\|\||--|\/\*|\*\//
        }
      ],
      actions: [
        { type: 'BLOCK' },
        { type: 'ALERT', parameters: { severity: 'CRITICAL' } },
        { type: 'LOG', parameters: { level: 'error' } }
      ],
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    });

    // XSS Detection
    this.addPolicy({
      id: 'xss-detection',
      name: 'XSS Attack Detection',
      description: 'Detects potential XSS attack attempts',
      category: 'DATA',
      enabled: true,
      severity: 'CRITICAL',
      conditions: [
        {
          field: 'request.body',
          operator: 'regex',
          value: /<script|javascript:|onerror=|onload=|onclick=|onfocus=|onmouseover=/i
        }
      ],
      actions: [
        { type: 'BLOCK' },
        { type: 'ALERT', parameters: { severity: 'CRITICAL' } },
        { type: 'LOG', parameters: { level: 'error' } }
      ],
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    });

    // Rate Limiting
    this.addPolicy({
      id: 'rate-limiting',
      name: 'API Rate Limiting',
      description: 'Prevents excessive API requests from single IP',
      category: 'NETWORK',
      enabled: true,
      severity: 'WARNING',
      conditions: [
        {
          field: 'request.count_per_minute',
          operator: 'greater_than',
          value: 100
        }
      ],
      actions: [
        { type: 'THROTTLE', parameters: { duration: 300000 } }, // 5 minutes
        { type: 'ALERT', parameters: { severity: 'WARNING' } }
      ],
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    });

    // Suspicious User Agent
    this.addPolicy({
      id: 'suspicious-user-agent',
      name: 'Suspicious User Agent Detection',
      description: 'Detects bot-like or malicious user agents',
      category: 'BEHAVIOR',
      enabled: true,
      severity: 'WARNING',
      conditions: [
        {
          field: 'request.userAgent',
          operator: 'regex',
          value: /(curl|wget|python|scrapy|bot|crawler|spider|scan)/i
        }
      ],
      actions: [
        { type: 'LOG', parameters: { level: 'warn' } },
        { type: 'ALERT', parameters: { severity: 'WARNING' } }
      ],
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    });

    // Admin Panel Access
    this.addPolicy({
      id: 'admin-access',
      name: 'Admin Panel Access Control',
      description: 'Monitors access to admin endpoints',
      category: 'ACCESS',
      enabled: true,
      severity: 'CRITICAL',
      conditions: [
        {
          field: 'request.path',
          operator: 'contains',
          value: '/admin'
        }
      ],
      actions: [
        { type: 'LOG', parameters: { level: 'info' } },
        { type: 'ALERT', parameters: { severity: 'INFO' } }
      ],
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    });

    // Crypto Trading Anomaly
    this.addPolicy({
      id: 'crypto-anomaly',
      name: 'Cryptocurrency Trading Anomaly',
      description: 'Detects unusual trading patterns',
      category: 'CRYPTO',
      enabled: true,
      severity: 'WARNING',
      conditions: [
        {
          field: 'trade.amount',
          operator: 'greater_than',
          value: 100000 // $100k threshold
        },
        {
          field: 'trade.frequency_per_hour',
          operator: 'greater_than',
          value: 50
        }
      ],
      actions: [
        { type: 'LOG', parameters: { level: 'warn' } },
        { type: 'ALERT', parameters: { severity: 'WARNING' } }
      ],
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    });
  }

  addPolicy(policy: Omit<SecurityPolicy, 'id'> & { id?: string }): string {
    const id = policy.id || `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullPolicy: SecurityPolicy = {
      ...policy,
      id,
      created: policy.created || new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    this.policies.set(id, fullPolicy);
    return id;
  }

  updatePolicy(id: string, updates: Partial<SecurityPolicy>): boolean {
    const existing = this.policies.get(id);
    if (!existing) return false;

    const updated: SecurityPolicy = {
      ...existing,
      ...updates,
      id, // Preserve ID
      lastModified: new Date().toISOString()
    };

    this.policies.set(id, updated);
    return true;
  }

  removePolicy(id: string): boolean {
    return this.policies.delete(id);
  }

  getPolicy(id: string): SecurityPolicy | undefined {
    return this.policies.get(id);
  }

  getAllPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values());
  }

  async evaluateRequest(context: PolicyContext): Promise<{
    violations: PolicyViolation[];
    allowed: boolean;
    actions: string[];
  }> {
    const violations: PolicyViolation[] = [];
    const actions: string[] = [];
    let allowed = true;

    // Check if IP is blocked
    if (context.ip && this.blockedIps.has(context.ip)) {
      allowed = false;
      actions.push('BLOCKED_IP');
    }

    // Check throttling
    if (context.ip && this.isThrottled(context.ip)) {
      allowed = false;
      actions.push('THROTTLED');
    }

    // Evaluate each policy
    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue;

      const isViolation = this.evaluatePolicy(policy, context);
      if (isViolation) {
        const violation: PolicyViolation = {
          id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          policyId: policy.id,
          policyName: policy.name,
          severity: policy.severity,
          category: policy.category,
          timestamp: new Date().toISOString(),
          details: context,
          sourceIp: context.ip,
          userAgent: context.userAgent,
          userId: context.userId,
          actions: policy.actions.map(a => a.type),
          resolved: false
        };

        violations.push(violation);
        this.violations.push(violation);

        // Execute policy actions
        for (const action of policy.actions) {
          const actionResult = await this.executeAction(action, context, violation);
          actions.push(actionResult);

          if (action.type === 'BLOCK') {
            allowed = false;
          }
        }
      }
    }

    return { violations, allowed, actions };
  }

  private evaluatePolicy(policy: SecurityPolicy, context: PolicyContext): boolean {
    // All conditions must be met for a violation
    for (const condition of policy.conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(condition: PolicyCondition, context: PolicyContext): boolean {
    let value = this.extractValue(condition.field, context);
    let testValue = condition.value;

    // Handle case sensitivity
    if (!condition.caseSensitive && typeof value === 'string' && typeof testValue === 'string') {
      value = value.toLowerCase();
      testValue = testValue.toLowerCase();
    }

    switch (condition.operator) {
      case 'equals':
        return value === testValue;
      case 'not_equals':
        return value !== testValue;
      case 'contains':
        return typeof value === 'string' && value.includes(testValue);
      case 'not_contains':
        return typeof value === 'string' && !value.includes(testValue);
      case 'greater_than':
        return typeof value === 'number' && value > testValue;
      case 'less_than':
        return typeof value === 'number' && value < testValue;
      case 'regex':
        return typeof value === 'string' && new RegExp(testValue).test(value);
      case 'ip_range':
        return this.isIpInRange(value, testValue);
      default:
        return false;
    }
  }

  private extractValue(field: string, context: PolicyContext): any {
    const parts = field.split('.');
    let current: any = context;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private isIpInRange(ip: string, range: string): boolean {
    // Simple CIDR check - you might want to use a proper library
    if (!ip || !range) return false;
    
    const [rangeIp, prefixLength] = range.split('/');
    if (!prefixLength) {
      return ip === rangeIp;
    }

    // This is a simplified implementation
    // In production, use a proper IP range library
    return ip.startsWith(rangeIp.split('.').slice(0, Math.floor(parseInt(prefixLength) / 8)).join('.'));
  }

  private async executeAction(action: PolicyAction, context: PolicyContext, violation: PolicyViolation): Promise<string> {
    switch (action.type) {
      case 'BLOCK':
        if (context.ip) {
          this.blockedIps.add(context.ip);
          // Auto-unblock after 1 hour
          setTimeout(() => {
            this.blockedIps.delete(context.ip!);
          }, 3600000);
        }
        return 'BLOCKED';

      case 'THROTTLE':
        if (context.ip) {
          const duration = action.parameters?.duration || 300000; // 5 minutes default
          const resetTime = Date.now() + duration;
          this.throttledIps.set(context.ip, { count: 0, resetTime });
        }
        return 'THROTTLED';

      case 'ALERT':
        await sendSecurityAlert(
          `Policy Violation: ${violation.policyName}`,
          `Security policy "${violation.policyName}" was violated. Details: ${JSON.stringify(violation.details, null, 2)}`,
          violation.severity === 'CRITICAL' ? 'HIGH' : violation.severity === 'WARNING' ? 'MEDIUM' : 'LOW',
          'SECURITY_POLICY',
          { violation, context }
        );
        return 'ALERT_SENT';

      case 'LOG':
        console.log(`[SECURITY] Policy violation: ${violation.policyName}`, {
          violation,
          context
        });
        return 'LOGGED';

      case 'QUARANTINE':
        // Implement quarantine logic
        return 'QUARANTINED';

      case 'REDIRECT':
        // Implement redirect logic
        return 'REDIRECTED';

      default:
        return 'UNKNOWN_ACTION';
    }
  }

  private isThrottled(ip: string): boolean {
    const throttleInfo = this.throttledIps.get(ip);
    if (!throttleInfo) return false;

    if (Date.now() > throttleInfo.resetTime) {
      this.throttledIps.delete(ip);
      return false;
    }

    return true;
  }

  // Analytics and reporting
  getViolationsByCategory(): Record<PolicyCategory, number> {
    const counts: Record<PolicyCategory, number> = {
      ACCESS: 0,
      DATA: 0,
      NETWORK: 0,
      CRYPTO: 0,
      COMPLIANCE: 0,
      BEHAVIOR: 0
    };

    for (const violation of this.violations) {
      counts[violation.category]++;
    }

    return counts;
  }

  getTopViolatingIPs(limit: number = 10): Array<{ ip: string; count: number }> {
    const ipCounts = new Map<string, number>();

    for (const violation of this.violations) {
      if (violation.sourceIp) {
        ipCounts.set(violation.sourceIp, (ipCounts.get(violation.sourceIp) || 0) + 1);
      }
    }

    return Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getViolationHistory(hours: number = 24): PolicyViolation[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.violations.filter(v => new Date(v.timestamp).getTime() > cutoff);
  }

  // Cleanup old violations
  cleanupOldViolations(days: number = 7): number {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const initialCount = this.violations.length;
    
    this.violations = this.violations.filter(v => 
      new Date(v.timestamp).getTime() > cutoff
    );

    return initialCount - this.violations.length;
  }

  // Manual IP management
  blockIP(ip: string, duration?: number): void {
    this.blockedIps.add(ip);
    if (duration) {
      setTimeout(() => {
        this.blockedIps.delete(ip);
      }, duration);
    }
  }

  unblockIP(ip: string): boolean {
    return this.blockedIps.delete(ip);
  }

  getBlockedIPs(): string[] {
    return Array.from(this.blockedIps);
  }

  // Export/Import policies
  exportPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values());
  }

  importPolicies(policies: SecurityPolicy[]): number {
    let imported = 0;
    for (const policy of policies) {
      this.policies.set(policy.id, policy);
      imported++;
    }
    return imported;
  }
}

// Singleton instance
export const securityPolicyEngine = SecurityPolicyEngine.getInstance();

// Convenience functions
export const evaluateRequest = (context: PolicyContext) =>
  securityPolicyEngine.evaluateRequest(context);

export const addSecurityPolicy = (policy: Omit<SecurityPolicy, 'id'> & { id?: string }) =>
  securityPolicyEngine.addPolicy(policy);

export const blockIP = (ip: string, duration?: number) =>
  securityPolicyEngine.blockIP(ip, duration);

export const getViolationStats = () => ({
  byCategory: securityPolicyEngine.getViolationsByCategory(),
  topIPs: securityPolicyEngine.getTopViolatingIPs(),
  recent: securityPolicyEngine.getViolationHistory()
});
