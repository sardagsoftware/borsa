/**
 * 🛡️ AILYDIAN AI LENS TRADER - Cloudflare Integration
 * Cloudflare API integration for DDoS, WAF & CDN
 * © Emrah Şardağ. All rights reserved.
 */

import { getSecret } from './secret';
import { sendSecurityAlert } from './alerts';

export interface CloudflareConfig {
  zoneId: string;
  apiToken: string;
  email?: string;
  apiKey?: string;
}

export interface CloudflareDNSRecord {
  id?: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SRV';
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
}

export interface CloudflareFirewallRule {
  id?: string;
  expression: string;
  action: 'block' | 'challenge' | 'js_challenge' | 'allow' | 'log' | 'bypass';
  description?: string;
  enabled?: boolean;
  priority?: number;
}

export interface CloudflareSecurityEvent {
  id: string;
  timestamp: string;
  source: 'firewall' | 'ddos' | 'bot' | 'waf';
  action: string;
  clientIP: string;
  country: string;
  userAgent: string;
  uri: string;
  matched: string;
}

export interface CloudflareAnalytics {
  requests: {
    all: number;
    cached: number;
    uncached: number;
  };
  bandwidth: {
    all: number;
    cached: number;
    uncached: number;
  };
  threats: {
    all: number;
    countries: Record<string, number>;
    types: Record<string, number>;
  };
  response_codes: Record<string, number>;
  timestamp: string;
}

export class CloudflareManager {
  private static instance: CloudflareManager;
  private config: CloudflareConfig | null = null;
  private baseUrl = 'https://api.cloudflare.com/client/v4';

  private constructor() {
    this.initializeConfig();
  }

  static getInstance(): CloudflareManager {
    if (!CloudflareManager.instance) {
      CloudflareManager.instance = new CloudflareManager();
    }
    return CloudflareManager.instance;
  }

  private initializeConfig(): void {
    const zoneId = getSecret('CLOUDFLARE_ZONE_ID');
    const apiToken = getSecret('CLOUDFLARE_API_TOKEN');
    const email = getSecret('CLOUDFLARE_EMAIL');
    const apiKey = getSecret('CLOUDFLARE_API_KEY');

    if (zoneId && (apiToken || (email && apiKey))) {
      this.config = {
        zoneId,
        apiToken: apiToken || '',
        email: email || '',
        apiKey: apiKey || ''
      };
    }
  }

  private getHeaders(): Record<string, string> {
    if (!this.config) {
      throw new Error('Cloudflare not configured');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.apiToken) {
      headers['Authorization'] = `Bearer ${this.config.apiToken}`;
    } else if (this.config.email && this.config.apiKey) {
      headers['X-Auth-Email'] = this.config.email;
      headers['X-Auth-Key'] = this.config.apiKey;
    }

    return headers;
  }

  private async apiCall<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    if (!this.config) {
      throw new Error('Cloudflare not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Cloudflare API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    return data.result;
  }

  // DNS Management
  async getDNSRecords(): Promise<CloudflareDNSRecord[]> {
    return this.apiCall(`/zones/${this.config!.zoneId}/dns_records`);
  }

  async createDNSRecord(record: CloudflareDNSRecord): Promise<CloudflareDNSRecord> {
    return this.apiCall(
      `/zones/${this.config!.zoneId}/dns_records`,
      'POST',
      record
    );
  }

  async updateDNSRecord(recordId: string, record: Partial<CloudflareDNSRecord>): Promise<CloudflareDNSRecord> {
    return this.apiCall(
      `/zones/${this.config!.zoneId}/dns_records/${recordId}`,
      'PUT',
      record
    );
  }

  async deleteDNSRecord(recordId: string): Promise<void> {
    await this.apiCall(
      `/zones/${this.config!.zoneId}/dns_records/${recordId}`,
      'DELETE'
    );
  }

  // Firewall Rules Management
  async getFirewallRules(): Promise<CloudflareFirewallRule[]> {
    const filters = await this.apiCall(`/zones/${this.config!.zoneId}/filters`);
    const rules = await this.apiCall(`/zones/${this.config!.zoneId}/firewall/rules`);
    
    return rules.map((rule: any) => {
      const filter = filters.find((f: any) => f.id === rule.filter.id);
      return {
        id: rule.id,
        expression: filter?.expression || '',
        action: rule.action,
        description: filter?.description || '',
        enabled: !rule.paused,
        priority: rule.priority
      };
    });
  }

  async createFirewallRule(rule: CloudflareFirewallRule): Promise<CloudflareFirewallRule> {
    // First create the filter
    const filter = await this.apiCall(
      `/zones/${this.config!.zoneId}/filters`,
      'POST',
      [{
        expression: rule.expression,
        description: rule.description || ''
      }]
    );

    // Then create the firewall rule
    const firewallRule = await this.apiCall(
      `/zones/${this.config!.zoneId}/firewall/rules`,
      'POST',
      [{
        filter: { id: filter[0].id },
        action: rule.action,
        priority: rule.priority,
        paused: !rule.enabled
      }]
    );

    return {
      id: firewallRule[0].id,
      expression: rule.expression,
      action: rule.action,
      description: rule.description,
      enabled: rule.enabled,
      priority: rule.priority
    };
  }

  async deleteFirewallRule(ruleId: string): Promise<void> {
    await this.apiCall(
      `/zones/${this.config!.zoneId}/firewall/rules/${ruleId}`,
      'DELETE'
    );
  }

  // Security Events
  async getSecurityEvents(since?: Date, limit: number = 100): Promise<CloudflareSecurityEvent[]> {
    const params = new URLSearchParams({
      limit: limit.toString()
    });

    if (since) {
      params.set('since', since.toISOString());
    }

    const events = await this.apiCall(
      `/zones/${this.config!.zoneId}/security/events?${params.toString()}`
    );

    return events.map((event: any) => ({
      id: event.rayId,
      timestamp: event.occurredAt,
      source: event.source,
      action: event.action,
      clientIP: event.clientIP,
      country: event.clientCountryName,
      userAgent: event.userAgent,
      uri: event.requestUri,
      matched: event.matchedVar
    }));
  }

  // Analytics
  async getAnalytics(since?: Date): Promise<CloudflareAnalytics> {
    const params = new URLSearchParams();
    
    if (since) {
      params.set('since', since.toISOString());
    } else {
      // Default to last 24 hours
      params.set('since', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    }

    const analytics = await this.apiCall(
      `/zones/${this.config!.zoneId}/analytics/dashboard?${params.toString()}`
    );

    return {
      requests: {
        all: analytics.totals.requests.all,
        cached: analytics.totals.requests.cached,
        uncached: analytics.totals.requests.uncached
      },
      bandwidth: {
        all: analytics.totals.bandwidth.all,
        cached: analytics.totals.bandwidth.cached,
        uncached: analytics.totals.bandwidth.uncached
      },
      threats: {
        all: analytics.totals.threats.all,
        countries: analytics.totals.threats.countries || {},
        types: analytics.totals.threats.types || {}
      },
      response_codes: analytics.totals.responses || {},
      timestamp: new Date().toISOString()
    };
  }

  // DDoS Protection
  async enableDDoSProtection(): Promise<void> {
    await this.apiCall(
      `/zones/${this.config!.zoneId}/settings/ddos_protection`,
      'PUT',
      { value: 'on' }
    );
  }

  async getDDoSSettings(): Promise<any> {
    return this.apiCall(`/zones/${this.config!.zoneId}/settings/ddos_protection`);
  }

  // WAF Settings
  async enableWAF(): Promise<void> {
    await this.apiCall(
      `/zones/${this.config!.zoneId}/settings/waf`,
      'PUT',
      { value: 'on' }
    );
  }

  async getWAFSettings(): Promise<any> {
    return this.apiCall(`/zones/${this.config!.zoneId}/settings/waf`);
  }

  // Rate Limiting
  async createRateLimit(config: {
    threshold: number;
    period: number;
    action: 'simulate' | 'ban' | 'challenge' | 'js_challenge';
    match: {
      request: {
        url: string;
        schemes?: string[];
        methods?: string[];
      };
    };
  }): Promise<any> {
    return this.apiCall(
      `/zones/${this.config!.zoneId}/rate_limits`,
      'POST',
      config
    );
  }

  // SSL Settings
  async getSSLSettings(): Promise<any> {
    return this.apiCall(`/zones/${this.config!.zoneId}/settings/ssl`);
  }

  async setSSLMode(mode: 'off' | 'flexible' | 'full' | 'strict'): Promise<void> {
    await this.apiCall(
      `/zones/${this.config!.zoneId}/settings/ssl`,
      'PUT',
      { value: mode }
    );
  }

  // Cache Purging
  async purgeCache(files?: string[]): Promise<void> {
    const body = files ? { files } : { purge_everything: true };
    await this.apiCall(
      `/zones/${this.config!.zoneId}/purge_cache`,
      'POST',
      body
    );
  }

  // Bot Management
  async getBotManagementSettings(): Promise<any> {
    return this.apiCall(`/zones/${this.config!.zoneId}/bot_management`);
  }

  async updateBotManagementSettings(settings: {
    fight_mode?: boolean;
    session_score?: boolean;
    enable_js?: boolean;
  }): Promise<void> {
    await this.apiCall(
      `/zones/${this.config!.zoneId}/bot_management`,
      'PUT',
      settings
    );
  }

  // IP Access Rules
  async blockIP(ip: string, note?: string): Promise<void> {
    await this.apiCall(
      `/zones/${this.config!.zoneId}/firewall/access_rules/rules`,
      'POST',
      {
        mode: 'block',
        configuration: {
          target: 'ip',
          value: ip
        },
        notes: note || `Blocked by AILYDIAN Security at ${new Date().toISOString()}`
      }
    );

    await sendSecurityAlert(
      'IP Blocked via Cloudflare',
      `IP address ${ip} has been blocked via Cloudflare WAF`,
      'MEDIUM',
      'CLOUDFLARE',
      { ip, note, timestamp: new Date().toISOString() }
    );
  }

  async unblockIP(ip: string): Promise<void> {
    // First, get all access rules to find the one to delete
    const rules = await this.apiCall(`/zones/${this.config!.zoneId}/firewall/access_rules/rules`);
    const rule = rules.find((r: any) => 
      r.configuration.target === 'ip' && 
      r.configuration.value === ip && 
      r.mode === 'block'
    );

    if (rule) {
      await this.apiCall(
        `/zones/${this.config!.zoneId}/firewall/access_rules/rules/${rule.id}`,
        'DELETE'
      );
    }
  }

  // Challenge Management
  async challengeIP(ip: string, note?: string): Promise<void> {
    await this.apiCall(
      `/zones/${this.config!.zoneId}/firewall/access_rules/rules`,
      'POST',
      {
        mode: 'challenge',
        configuration: {
          target: 'ip',
          value: ip
        },
        notes: note || `Challenged by AILYDIAN Security at ${new Date().toISOString()}`
      }
    );
  }

  // Security Level
  async setSecurityLevel(level: 'essentially_off' | 'low' | 'medium' | 'high' | 'under_attack'): Promise<void> {
    await this.apiCall(
      `/zones/${this.config!.zoneId}/settings/security_level`,
      'PUT',
      { value: level }
    );

    await sendSecurityAlert(
      'Cloudflare Security Level Changed',
      `Security level changed to ${level.toUpperCase()}`,
      'HIGH',
      'CLOUDFLARE',
      { level, timestamp: new Date().toISOString() }
    );
  }

  // Health Check
  async healthCheck(): Promise<{
    configured: boolean;
    connected: boolean;
    zoneActive: boolean;
    services: {
      dns: boolean;
      firewall: boolean;
      analytics: boolean;
      ssl: boolean;
    };
  }> {
    if (!this.config) {
      return {
        configured: false,
        connected: false,
        zoneActive: false,
        services: {
          dns: false,
          firewall: false,
          analytics: false,
          ssl: false
        }
      };
    }

    try {
      // Test zone access
      const zone = await this.apiCall(`/zones/${this.config.zoneId}`);
      
      // Test individual services
      const [dns, firewall, analytics, ssl] = await Promise.allSettled([
        this.apiCall(`/zones/${this.config.zoneId}/dns_records?per_page=1`),
        this.apiCall(`/zones/${this.config.zoneId}/firewall/rules?per_page=1`),
        this.apiCall(`/zones/${this.config.zoneId}/analytics/dashboard`),
        this.apiCall(`/zones/${this.config.zoneId}/settings/ssl`)
      ]);

      return {
        configured: true,
        connected: true,
        zoneActive: zone.status === 'active',
        services: {
          dns: dns.status === 'fulfilled',
          firewall: firewall.status === 'fulfilled',
          analytics: analytics.status === 'fulfilled',
          ssl: ssl.status === 'fulfilled'
        }
      };
    } catch (error) {
      return {
        configured: true,
        connected: false,
        zoneActive: false,
        services: {
          dns: false,
          firewall: false,
          analytics: false,
          ssl: false
        }
      };
    }
  }

  // Emergency Security Mode
  async enableEmergencyMode(): Promise<void> {
    await Promise.all([
      this.setSecurityLevel('under_attack'),
      this.enableDDoSProtection(),
      this.enableWAF(),
      this.createFirewallRule({
        expression: '(cf.threat_score ge 10)',
        action: 'js_challenge',
        description: 'Emergency: Challenge suspicious traffic',
        enabled: true,
        priority: 1
      })
    ]);

    await sendSecurityAlert(
      'Emergency Security Mode Enabled',
      'Cloudflare emergency security measures have been activated',
      'HIGH',
      'CLOUDFLARE',
      { timestamp: new Date().toISOString() }
    );
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  getConfiguration(): Partial<CloudflareConfig> | null {
    if (!this.config) return null;

    return {
      zoneId: this.config.zoneId,
      email: this.config.email
      // Don't return sensitive tokens/keys
    };
  }
}

// Singleton instance
export const cloudflareManager = CloudflareManager.getInstance();

// Convenience functions
export const blockIPCloudflare = (ip: string, note?: string) =>
  cloudflareManager.blockIP(ip, note);

export const enableEmergencyMode = () =>
  cloudflareManager.enableEmergencyMode();

export const getCloudflareAnalytics = (since?: Date) =>
  cloudflareManager.getAnalytics(since);

export const purgeCloudflareCache = (files?: string[]) =>
  cloudflareManager.purgeCache(files);

export const checkCloudflareHealth = () =>
  cloudflareManager.healthCheck();
