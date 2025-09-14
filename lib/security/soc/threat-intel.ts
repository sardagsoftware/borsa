/**
 * 🛡️ Threat Intelligence Integration
 * Enriches security events with threat intelligence data
 * © Emrah Şardağ. All rights reserved.
 */

import { getSecret } from '../secret';

export interface ThreatIntelligenceProvider {
  name: string;
  apiKey?: string;
  endpoint?: string;
  enabled: boolean;
  rateLimitPerHour: number;
}

export interface IOC {
  value: string;
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'file';
  source: string;
  confidence: number;
  firstSeen: string;
  lastSeen: string;
  tags: string[];
  malwareFamily?: string;
  threatActor?: string;
  campaign?: string;
  description?: string;
}

export interface ThreatEnrichment {
  reputation: 'MALICIOUS' | 'SUSPICIOUS' | 'CLEAN' | 'UNKNOWN';
  confidence: number;
  sources: string[];
  iocs: IOC[];
  threatActor?: string;
  campaign?: string;
  malwareFamily?: string;
  riskScore: number; // 0-100
  firstSeen?: string;
  lastSeen?: string;
  geolocation?: {
    country: string;
    region?: string;
    city?: string;
    asn?: string;
    isp?: string;
  };
  categories: string[];
  attributes: Record<string, any>;
}

export class ThreatIntelligence {
  private static instance: ThreatIntelligence;
  private providers: Map<string, ThreatIntelligenceProvider> = new Map();
  private cache: Map<string, ThreatEnrichment> = new Map();
  private rateLimiter: Map<string, number[]> = new Map();

  private constructor() {
    this.initializeProviders();
  }

  static getInstance(): ThreatIntelligence {
    if (!ThreatIntelligence.instance) {
      ThreatIntelligence.instance = new ThreatIntelligence();
    }
    return ThreatIntelligence.instance;
  }

  /**
   * Enrich security event with threat intelligence
   */
  async enrichEvent(event: any): Promise<ThreatEnrichment | null> {
    const indicators = this.extractIndicators(event);
    if (indicators.length === 0) {
      return null;
    }

    const enrichments: ThreatEnrichment[] = [];

    for (const indicator of indicators) {
      const enrichment = await this.lookupIndicator(indicator.value, indicator.type);
      if (enrichment) {
        enrichments.push(enrichment);
      }
    }

    if (enrichments.length === 0) {
      return null;
    }

    // Combine enrichments into single result
    return this.combineEnrichments(enrichments);
  }

  /**
   * Lookup individual indicator
   */
  async lookupIndicator(indicator: string, type: IOC['type']): Promise<ThreatEnrichment | null> {
    // Check cache first
    const cacheKey = `${type}:${indicator}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const enrichment: ThreatEnrichment = {
      reputation: 'UNKNOWN',
      confidence: 0,
      sources: [],
      iocs: [],
      riskScore: 0,
      categories: [],
      attributes: {}
    };

    // Query enabled providers
    for (const provider of this.providers.values()) {
      if (!provider.enabled || !this.checkRateLimit(provider.name)) {
        continue;
      }

      try {
        const providerResult = await this.queryProvider(provider, indicator, type);
        if (providerResult) {
          enrichment.sources.push(provider.name);
          this.mergeProviderResult(enrichment, providerResult);
        }
      } catch (error) {
        console.error(`Error querying ${provider.name}:`, error);
      }
    }

    // Cache result
    if (enrichment.sources.length > 0) {
      this.cache.set(cacheKey, enrichment);
      
      // Clean cache after 1 hour
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, 3600000);
    }

    return enrichment.sources.length > 0 ? enrichment : null;
  }

  /**
   * Extract indicators from security event
   */
  private extractIndicators(event: any): { value: string; type: IOC['type'] }[] {
    const indicators: { value: string; type: IOC['type'] }[] = [];

    // Extract IP addresses
    if (event.normalized?.srcIP) {
      indicators.push({ value: event.normalized.srcIP, type: 'ip' });
    }
    if (event.normalized?.destIP) {
      indicators.push({ value: event.normalized.destIP, type: 'ip' });
    }

    // Extract domains from URLs
    if (event.normalized?.url) {
      const domain = this.extractDomainFromUrl(event.normalized.url);
      if (domain) {
        indicators.push({ value: domain, type: 'domain' });
      }
      indicators.push({ value: event.normalized.url, type: 'url' });
    }

    // Extract hashes
    if (event.normalized?.fileHash) {
      indicators.push({ value: event.normalized.fileHash, type: 'hash' });
    }

    // Extract emails
    if (event.normalized?.email) {
      indicators.push({ value: event.normalized.email, type: 'email' });
    }

    return indicators;
  }

  /**
   * Query specific threat intelligence provider
   */
  private async queryProvider(
    provider: ThreatIntelligenceProvider,
    indicator: string,
    type: IOC['type']
  ): Promise<Partial<ThreatEnrichment> | null> {
    switch (provider.name) {
      case 'virustotal':
        return this.queryVirusTotal(indicator, type);
      case 'abuseipdb':
        return this.queryAbuseIPDB(indicator, type);
      case 'urlvoid':
        return this.queryURLVoid(indicator, type);
      case 'hybrid-analysis':
        return this.queryHybridAnalysis(indicator, type);
      default:
        return null;
    }
  }

  /**
   * Query VirusTotal API
   */
  private async queryVirusTotal(indicator: string, type: IOC['type']): Promise<Partial<ThreatEnrichment> | null> {
    const apiKey = getSecret('VIRUSTOTAL_API_KEY');
    if (!apiKey) return null;

    try {
      let url: string;
      switch (type) {
        case 'ip':
          url = `https://www.virustotal.com/vtapi/v2/ip-address/report?apikey=${apiKey}&ip=${indicator}`;
          break;
        case 'domain':
          url = `https://www.virustotal.com/vtapi/v2/domain/report?apikey=${apiKey}&domain=${indicator}`;
          break;
        case 'url':
          url = `https://www.virustotal.com/vtapi/v2/url/report?apikey=${apiKey}&resource=${encodeURIComponent(indicator)}`;
          break;
        case 'hash':
          url = `https://www.virustotal.com/vtapi/v2/file/report?apikey=${apiKey}&resource=${indicator}`;
          break;
        default:
          return null;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.response_code !== 1) {
        return { reputation: 'CLEAN', confidence: 0.1, riskScore: 0 };
      }

      const positives = data.positives || 0;
      const total = data.total || 1;
      const ratio = positives / total;

      let reputation: ThreatEnrichment['reputation'] = 'CLEAN';
      let riskScore = 0;

      if (ratio > 0.1) {
        reputation = 'MALICIOUS';
        riskScore = Math.min(ratio * 100, 100);
      } else if (ratio > 0.05) {
        reputation = 'SUSPICIOUS';
        riskScore = ratio * 100;
      }

      return {
        reputation,
        confidence: Math.min(total / 20, 1.0), // Higher confidence with more scans
        riskScore,
        attributes: {
          positives,
          total,
          scans: data.scans
        }
      };
    } catch (error) {
      console.error('VirusTotal query error:', error);
      return null;
    }
  }

  /**
   * Query AbuseIPDB API
   */
  private async queryAbuseIPDB(indicator: string, type: IOC['type']): Promise<Partial<ThreatEnrichment> | null> {
    if (type !== 'ip') return null;

    const apiKey = getSecret('ABUSEIPDB_API_KEY');
    if (!apiKey) return null;

    try {
      const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${indicator}&maxAgeInDays=90&verbose`, {
        headers: {
          'Key': apiKey,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (!data.data) {
        return { reputation: 'CLEAN', confidence: 0.1, riskScore: 0 };
      }

      const abuseConfidence = data.data.abuseConfidencePercentage || 0;
      let reputation: ThreatEnrichment['reputation'] = 'CLEAN';

      if (abuseConfidence > 50) {
        reputation = 'MALICIOUS';
      } else if (abuseConfidence > 20) {
        reputation = 'SUSPICIOUS';
      }

      return {
        reputation,
        confidence: 0.8,
        riskScore: abuseConfidence,
        geolocation: {
          country: data.data.countryCode,
          region: data.data.region,
          city: data.data.city,
          isp: data.data.isp
        },
        categories: data.data.usageType ? [data.data.usageType] : [],
        attributes: {
          totalReports: data.data.totalReports,
          numDistinctUsers: data.data.numDistinctUsers,
          lastReportedAt: data.data.lastReportedAt
        }
      };
    } catch (error) {
      console.error('AbuseIPDB query error:', error);
      return null;
    }
  }

  /**
   * Query URLVoid API
   */
  private async queryURLVoid(indicator: string, type: IOC['type']): Promise<Partial<ThreatEnrichment> | null> {
    if (type !== 'url' && type !== 'domain') return null;

    const apiKey = getSecret('URLVOID_API_KEY');
    if (!apiKey) return null;

    try {
      const domain = type === 'url' ? this.extractDomainFromUrl(indicator) : indicator;
      if (!domain) return null;

      const response = await fetch(`https://api.urlvoid.com/v1/pay-as-you-go/?key=${apiKey}&host=${domain}`);
      const data = await response.json();

      if (!data.data) {
        return { reputation: 'CLEAN', confidence: 0.1, riskScore: 0 };
      }

      const detections = data.data.report?.blacklists?.detections || 0;
      const engines = data.data.report?.blacklists?.engines || 1;
      const ratio = detections / engines;

      let reputation: ThreatEnrichment['reputation'] = 'CLEAN';
      let riskScore = 0;

      if (ratio > 0.1) {
        reputation = 'MALICIOUS';
        riskScore = Math.min(ratio * 100, 100);
      } else if (ratio > 0.05) {
        reputation = 'SUSPICIOUS';
        riskScore = ratio * 100;
      }

      return {
        reputation,
        confidence: 0.7,
        riskScore,
        attributes: {
          detections,
          engines,
          blacklists: data.data.report?.blacklists?.list || []
        }
      };
    } catch (error) {
      console.error('URLVoid query error:', error);
      return null;
    }
  }

  /**
   * Query Hybrid Analysis API
   */
  private async queryHybridAnalysis(indicator: string, type: IOC['type']): Promise<Partial<ThreatEnrichment> | null> {
    if (type !== 'hash') return null;

    const apiKey = getSecret('HYBRID_ANALYSIS_API_KEY');
    if (!apiKey) return null;

    try {
      const response = await fetch(`https://www.hybrid-analysis.com/api/v2/search/hash`, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `hash=${indicator}`
      });

      const data = await response.json();

      if (!data || data.length === 0) {
        return { reputation: 'CLEAN', confidence: 0.1, riskScore: 0 };
      }

      const result = data[0];
      const threatScore = result.threat_score || 0;

      let reputation: ThreatEnrichment['reputation'] = 'CLEAN';
      if (threatScore > 70) {
        reputation = 'MALICIOUS';
      } else if (threatScore > 30) {
        reputation = 'SUSPICIOUS';
      }

      return {
        reputation,
        confidence: 0.9,
        riskScore: threatScore,
        malwareFamily: result.type_short,
        attributes: {
          verdict: result.verdict,
          environment_id: result.environment_id,
          submit_name: result.submit_name,
          analysis_start_time: result.analysis_start_time
        }
      };
    } catch (error) {
      console.error('Hybrid Analysis query error:', error);
      return null;
    }
  }

  /**
   * Combine multiple enrichment results
   */
  private combineEnrichments(enrichments: ThreatEnrichment[]): ThreatEnrichment {
    const combined: ThreatEnrichment = {
      reputation: 'CLEAN',
      confidence: 0,
      sources: [],
      iocs: [],
      riskScore: 0,
      categories: [],
      attributes: {}
    };

    let maxRiskScore = 0;
    let totalConfidence = 0;
    const reputations: ThreatEnrichment['reputation'][] = [];

    enrichments.forEach(enrichment => {
      combined.sources.push(...enrichment.sources);
      combined.iocs.push(...enrichment.iocs);
      combined.categories.push(...enrichment.categories);
      
      if (enrichment.riskScore > maxRiskScore) {
        maxRiskScore = enrichment.riskScore;
      }
      
      totalConfidence += enrichment.confidence;
      reputations.push(enrichment.reputation);

      // Merge attributes
      Object.assign(combined.attributes, enrichment.attributes);

      // Take first non-null values
      if (enrichment.threatActor && !combined.threatActor) {
        combined.threatActor = enrichment.threatActor;
      }
      if (enrichment.campaign && !combined.campaign) {
        combined.campaign = enrichment.campaign;
      }
      if (enrichment.malwareFamily && !combined.malwareFamily) {
        combined.malwareFamily = enrichment.malwareFamily;
      }
      if (enrichment.geolocation && !combined.geolocation) {
        combined.geolocation = enrichment.geolocation;
      }
    });

    // Determine overall reputation
    if (reputations.includes('MALICIOUS')) {
      combined.reputation = 'MALICIOUS';
    } else if (reputations.includes('SUSPICIOUS')) {
      combined.reputation = 'SUSPICIOUS';
    } else if (reputations.some(r => r === 'CLEAN')) {
      combined.reputation = 'CLEAN';
    } else {
      combined.reputation = 'UNKNOWN';
    }

    combined.riskScore = maxRiskScore;
    combined.confidence = Math.min(totalConfidence / enrichments.length, 1.0);
    
    // Remove duplicates
    combined.sources = [...new Set(combined.sources)];
    combined.categories = [...new Set(combined.categories)];

    return combined;
  }

  /**
   * Check rate limiting for provider
   */
  private checkRateLimit(providerName: string): boolean {
    const provider = this.providers.get(providerName);
    if (!provider) return false;

    const now = Date.now();
    const hourAgo = now - 3600000; // 1 hour ago

    if (!this.rateLimiter.has(providerName)) {
      this.rateLimiter.set(providerName, []);
    }

    const requests = this.rateLimiter.get(providerName)!;
    
    // Clean old requests
    while (requests.length > 0 && requests[0] < hourAgo) {
      requests.shift();
    }

    if (requests.length >= provider.rateLimitPerHour) {
      return false;
    }

    requests.push(now);
    return true;
  }

  /**
   * Merge provider result into enrichment
   */
  private mergeProviderResult(
    enrichment: ThreatEnrichment,
    providerResult: Partial<ThreatEnrichment>
  ): void {
    // Take the most severe reputation
    const reputationSeverity = {
      'CLEAN': 0,
      'UNKNOWN': 1,
      'SUSPICIOUS': 2,
      'MALICIOUS': 3
    };

    const currentSeverity = reputationSeverity[enrichment.reputation];
    const newSeverity = reputationSeverity[providerResult.reputation || 'UNKNOWN'];

    if (newSeverity > currentSeverity) {
      enrichment.reputation = providerResult.reputation!;
    }

    // Take maximum risk score
    if ((providerResult.riskScore || 0) > enrichment.riskScore) {
      enrichment.riskScore = providerResult.riskScore || 0;
    }

    // Average confidence
    if (providerResult.confidence) {
      enrichment.confidence = (enrichment.confidence + providerResult.confidence) / 2;
    }

    // Merge other fields
    if (providerResult.geolocation && !enrichment.geolocation) {
      enrichment.geolocation = providerResult.geolocation;
    }
    
    if (providerResult.categories) {
      enrichment.categories.push(...providerResult.categories);
    }
    
    if (providerResult.attributes) {
      Object.assign(enrichment.attributes, providerResult.attributes);
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomainFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `http://${url}`);
      return urlObj.hostname;
    } catch {
      // Try regex extraction
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
      return match ? match[1] : null;
    }
  }

  /**
   * Initialize threat intelligence providers
   */
  private initializeProviders(): void {
    const providers: ThreatIntelligenceProvider[] = [
      {
        name: 'virustotal',
        enabled: !!getSecret('VIRUSTOTAL_API_KEY'),
        rateLimitPerHour: 1000
      },
      {
        name: 'abuseipdb',
        enabled: !!getSecret('ABUSEIPDB_API_KEY'),
        rateLimitPerHour: 3000
      },
      {
        name: 'urlvoid',
        enabled: !!getSecret('URLVOID_API_KEY'),
        rateLimitPerHour: 1000
      },
      {
        name: 'hybrid-analysis',
        enabled: !!getSecret('HYBRID_ANALYSIS_API_KEY'),
        rateLimitPerHour: 100
      }
    ];

    providers.forEach(provider => {
      this.providers.set(provider.name, provider);
    });
  }

  /**
   * Get provider status
   */
  getProviderStatus(): { name: string; enabled: boolean; rateLimitPerHour: number }[] {
    return Array.from(this.providers.values()).map(provider => ({
      name: provider.name,
      enabled: provider.enabled,
      rateLimitPerHour: provider.rateLimitPerHour
    }));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    // This would require tracking cache hits/misses
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

// Singleton instance
export const threatIntelligence = ThreatIntelligence.getInstance();
