/**
 * 🛡️ AILYDIAN SOC++ - IOC Enrichment System
 * Threat Intelligence enrichment using AbuseIPDB, OTX, and VirusTotal APIs
 * Caching, risk scoring, reputation analysis, and batch processing
 * © Emrah Şardağ. All rights reserved.
 */

import crypto from 'crypto';
import { SocEvent } from './soc/schema';

export interface IOC {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'filename';
  value: string;
  source: string;
  firstSeen: Date;
  lastSeen: Date;
  confidence: number;
  riskScore: number;
  tags: string[];
}

export interface IOCEnrichmentResult {
  ioc: IOC;
  enrichmentData: {
    abuseIPDB?: AbuseIPDBResult | null;
    otx?: OTXResult | null;
    virusTotal?: VirusTotalResult | null;
  };
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    confidence: number;
    reasons: string[];
    mitigations: string[];
  };
  timestamp: Date;
  ttl: number; // Time to live in seconds
}

export interface AbuseIPDBResult {
  ipAddress: string;
  isPublic: boolean;
  ipVersion: number;
  isWhitelisted: boolean;
  abuseConfidencePercentage: number;
  countryCode: string;
  countryName: string;
  usageType: string;
  isp: string;
  domain: string;
  totalReports: number;
  numDistinctUsers: number;
  lastReportedAt: string;
}

export interface OTXResult {
  indicator: string;
  type: string;
  pulses: Array<{
    id: string;
    name: string;
    description: string;
    author_name: string;
    created: string;
    modified: string;
    tags: string[];
    references: string[];
    malware_families: string[];
    attack_ids: string[];
  }>;
  general: {
    reputation: number;
    threat_score: number;
    analysis_stats: Record<string, number>;
  };
}

export interface VirusTotalResult {
  id: string;
  type: string;
  attributes: {
    last_analysis_date: number;
    last_analysis_stats: {
      harmless: number;
      malicious: number;
      suspicious: number;
      undetected: number;
      timeout: number;
    };
    last_analysis_results: Record<string, {
      category: string;
      engine_name: string;
      method: string;
      result: string;
    }>;
    reputation: number;
    total_votes: {
      harmless: number;
      malicious: number;
    };
  };
}

export interface IOCBatchResult {
  sessionId: string;
  processedCount: number;
  successCount: number;
  errorCount: number;
  results: IOCEnrichmentResult[];
  errors: Array<{
    ioc: string;
    error: string;
    timestamp: Date;
  }>;
  processingTime: number;
  rateLimit: {
    remaining: number;
    resetTime: Date;
  };
}

/**
 * AbuseIPDB API Client
 */
export class AbuseIPDBClient {
  private apiKey: string;
  private baseURL = 'https://api.abuseipdb.com/api/v2';
  private rateLimitRemaining = 1000;
  private rateLimitReset = new Date();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Check IP reputation
   */
  async checkIP(ipAddress: string, maxAge = 90): Promise<AbuseIPDBResult | null> {
    if (!this.isValidIP(ipAddress)) {
      throw new Error(`Invalid IP address: ${ipAddress}`);
    }

    try {
      const response = await fetch(`${this.baseURL}/check`, {
        method: 'GET',
        headers: {
          'Key': this.apiKey,
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          ipAddress,
          maxAgeInDays: maxAge.toString(),
          verbose: 'true'
        })
      });

      // Update rate limit info
      this.updateRateLimit(response);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('AbuseIPDB rate limit exceeded');
        }
        throw new Error(`AbuseIPDB API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data as AbuseIPDBResult;
    } catch (error) {
      console.warn(`AbuseIPDB check failed for ${ipAddress}:`, error);
      return null;
    }
  }

  /**
   * Check if IP is valid
   */
  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Update rate limit tracking
   */
  private updateRateLimit(response: Response): void {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    
    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining);
    }
    if (reset) {
      this.rateLimitReset = new Date(parseInt(reset) * 1000);
    }
  }

  /**
   * Get rate limit status
   */
  getRateLimit(): { remaining: number; resetTime: Date } {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset
    };
  }
}

/**
 * AlienVault OTX API Client
 */
export class OTXClient {
  private apiKey: string;
  private baseURL = 'https://otx.alienvault.com/api/v1';
  private rateLimitRemaining = 1000;
  private rateLimitReset = new Date();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get indicator information
   */
  async getIndicator(indicator: string, type: string): Promise<OTXResult | null> {
    try {
      const response = await fetch(
        `${this.baseURL}/indicators/${type}/${encodeURIComponent(indicator)}/general`,
        {
          headers: {
            'X-OTX-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      this.updateRateLimit(response);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('OTX rate limit exceeded');
        }
        throw new Error(`OTX API error: ${response.status}`);
      }

      const generalData = await response.json();

      // Get pulses data
      const pulsesResponse = await fetch(
        `${this.baseURL}/indicators/${type}/${encodeURIComponent(indicator)}/malware`,
        {
          headers: {
            'X-OTX-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      let pulsesData = [];
      if (pulsesResponse.ok) {
        const pulses = await pulsesResponse.json();
        pulsesData = pulses.data || [];
      }

      return {
        indicator,
        type,
        pulses: pulsesData,
        general: {
          reputation: generalData.reputation || 0,
          threat_score: generalData.threat_score || 0,
          analysis_stats: generalData.analysis || {}
        }
      } as OTXResult;

    } catch (error) {
      console.warn(`OTX lookup failed for ${indicator}:`, error);
      return null;
    }
  }

  /**
   * Update rate limit tracking
   */
  private updateRateLimit(response: Response): void {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    
    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining);
    }
    if (reset) {
      this.rateLimitReset = new Date(parseInt(reset) * 1000);
    }
  }

  /**
   * Get rate limit status
   */
  getRateLimit(): { remaining: number; resetTime: Date } {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset
    };
  }
}

/**
 * VirusTotal API Client
 */
export class VirusTotalClient {
  private apiKey: string;
  private baseURL = 'https://www.virustotal.com/api/v3';
  private rateLimitRemaining = 500;
  private rateLimitReset = new Date();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get IP report
   */
  async getIPReport(ipAddress: string): Promise<VirusTotalResult | null> {
    return this.getReport('ip_addresses', ipAddress);
  }

  /**
   * Get domain report
   */
  async getDomainReport(domain: string): Promise<VirusTotalResult | null> {
    return this.getReport('domains', domain);
  }

  /**
   * Get URL report
   */
  async getURLReport(url: string): Promise<VirusTotalResult | null> {
    const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
    return this.getReport('urls', urlId);
  }

  /**
   * Get file hash report
   */
  async getHashReport(hash: string): Promise<VirusTotalResult | null> {
    return this.getReport('files', hash);
  }

  /**
   * Generic report retrieval
   */
  private async getReport(endpoint: string, id: string): Promise<VirusTotalResult | null> {
    try {
      const response = await fetch(`${this.baseURL}/${endpoint}/${id}`, {
        headers: {
          'x-apikey': this.apiKey,
          'Accept': 'application/json',
        },
      });

      this.updateRateLimit(response);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('VirusTotal rate limit exceeded');
        }
        if (response.status === 404) {
          return null; // Not found is normal for some indicators
        }
        throw new Error(`VirusTotal API error: ${response.status}`);
      }

      const data = await response.json();
      return data as VirusTotalResult;

    } catch (error) {
      console.warn(`VirusTotal lookup failed for ${id}:`, error);
      return null;
    }
  }

  /**
   * Update rate limit tracking
   */
  private updateRateLimit(response: Response): void {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    
    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining);
    }
    if (reset) {
      this.rateLimitReset = new Date(parseInt(reset) * 1000);
    }
  }

  /**
   * Get rate limit status
   */
  getRateLimit(): { remaining: number; resetTime: Date } {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset
    };
  }
}

/**
 * IOC Cache Manager
 */
export class IOCCacheManager {
  private cache = new Map<string, IOCEnrichmentResult>();
  private readonly defaultTTL = 3600; // 1 hour in seconds

  /**
   * Get cached result
   */
  get(key: string): IOCEnrichmentResult | null {
    const result = this.cache.get(key);
    if (!result) return null;

    // Check if expired
    const now = Date.now();
    const expires = result.timestamp.getTime() + (result.ttl * 1000);
    
    if (now > expires) {
      this.cache.delete(key);
      return null;
    }

    return result;
  }

  /**
   * Set cached result
   */
  set(key: string, result: IOCEnrichmentResult, ttl = this.defaultTTL): void {
    result.ttl = ttl;
    this.cache.set(key, result);
  }

  /**
   * Generate cache key
   */
  generateKey(ioc: IOC): string {
    return crypto
      .createHash('sha256')
      .update(`${ioc.type}:${ioc.value}`)
      .digest('hex');
  }

  /**
   * Clear expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, result] of this.cache.entries()) {
      const expires = result.timestamp.getTime() + (result.ttl * 1000);
      if (now > expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    memoryUsage: number;
    hitRate: number;
  } {
    return {
      totalEntries: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
      hitRate: 0 // Would need to track hits/misses
    };
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    for (const [key, value] of this.cache.entries()) {
      size += key.length * 2; // UTF-16
      size += JSON.stringify(value).length * 2;
    }
    return size;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * IOC Risk Assessor - Calculate risk scores and assessments
 */
export class IOCRiskAssessor {
  /**
   * Assess IOC risk based on enrichment data
   */
  assessRisk(enrichmentResult: IOCEnrichmentResult): void {
    const { enrichmentData } = enrichmentResult;
    let riskScore = 0;
    let confidence = 0.5;
    const reasons: string[] = [];
    const mitigations: string[] = [];

    // Assess AbuseIPDB data
    if (enrichmentData.abuseIPDB) {
      const abuse = enrichmentData.abuseIPDB;
      
      if (abuse.abuseConfidencePercentage > 75) {
        riskScore += 40;
        reasons.push(`High abuse confidence: ${abuse.abuseConfidencePercentage}%`);
        mitigations.push('Block IP address');
      } else if (abuse.abuseConfidencePercentage > 25) {
        riskScore += 20;
        reasons.push(`Moderate abuse reports: ${abuse.abuseConfidencePercentage}%`);
        mitigations.push('Monitor IP activity closely');
      }

      if (abuse.totalReports > 100) {
        riskScore += 15;
        reasons.push(`Many abuse reports: ${abuse.totalReports}`);
      }

      if (abuse.countryCode && this.isHighRiskCountry(abuse.countryCode)) {
        riskScore += 10;
        reasons.push(`High-risk country: ${abuse.countryName}`);
      }

      confidence += 0.2;
    }

    // Assess OTX data
    if (enrichmentData.otx) {
      const otx = enrichmentData.otx;
      
      if (otx.pulses.length > 0) {
        riskScore += 30;
        reasons.push(`Found in ${otx.pulses.length} threat intelligence feeds`);
        mitigations.push('Investigate associated campaigns');

        // Check for malware families
        const malwareFamilies = new Set<string>();
        otx.pulses.forEach(pulse => {
          pulse.malware_families.forEach(family => malwareFamilies.add(family));
        });

        if (malwareFamilies.size > 0) {
          riskScore += 20;
          reasons.push(`Associated malware families: ${Array.from(malwareFamilies).join(', ')}`);
          mitigations.push('Deploy malware-specific signatures');
        }
      }

      if (otx.general.threat_score > 5) {
        riskScore += otx.general.threat_score * 5;
        reasons.push(`High OTX threat score: ${otx.general.threat_score}`);
      }

      confidence += 0.2;
    }

    // Assess VirusTotal data
    if (enrichmentData.virusTotal) {
      const vt = enrichmentData.virusTotal;
      
      if (vt.attributes.last_analysis_stats) {
        const { malicious, suspicious, harmless, undetected } = vt.attributes.last_analysis_stats;
        const total = malicious + suspicious + harmless + undetected;
        
        if (total > 0) {
          const maliciousRate = (malicious + suspicious) / total;
          
          if (maliciousRate > 0.5) {
            riskScore += 50;
            reasons.push(`High malicious detection rate: ${(maliciousRate * 100).toFixed(1)}%`);
            mitigations.push('Block immediately');
          } else if (maliciousRate > 0.2) {
            riskScore += 25;
            reasons.push(`Moderate detection rate: ${(maliciousRate * 100).toFixed(1)}%`);
            mitigations.push('Quarantine and analyze');
          }

          if (malicious > 5) {
            riskScore += 15;
            reasons.push(`Multiple engines detect as malicious: ${malicious}`);
          }
        }
      }

      if (vt.attributes.total_votes) {
        const { malicious: malVotes, harmless: harmVotes } = vt.attributes.total_votes;
        if (malVotes > harmVotes && malVotes > 10) {
          riskScore += 20;
          reasons.push(`Community votes indicate malicious: ${malVotes} vs ${harmVotes}`);
        }
      }

      confidence += 0.3;
    }

    // Determine overall risk level
    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 80) {
      overallRisk = 'critical';
      mitigations.unshift('Immediate containment required');
    } else if (riskScore >= 60) {
      overallRisk = 'high';
      mitigations.unshift('High priority investigation');
    } else if (riskScore >= 30) {
      overallRisk = 'medium';
      mitigations.unshift('Monitor and investigate');
    } else {
      overallRisk = 'low';
      mitigations.unshift('Routine monitoring sufficient');
    }

    // Update enrichment result
    enrichmentResult.riskAssessment = {
      overallRisk,
      riskScore: Math.min(100, riskScore),
      confidence: Math.min(1.0, confidence),
      reasons,
      mitigations
    };
  }

  /**
   * Check if country code represents high risk
   */
  private isHighRiskCountry(countryCode: string): boolean {
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR', 'SY'];
    return highRiskCountries.includes(countryCode.toUpperCase());
  }
}

/**
 * IOC Enrichment Engine - Main orchestrator
 */
export class IOCEnrichmentEngine {
  private abuseIPDB?: AbuseIPDBClient;
  private otx?: OTXClient;
  private virusTotal?: VirusTotalClient;
  private cache = new IOCCacheManager();
  private riskAssessor = new IOCRiskAssessor();

  constructor(apiKeys: {
    abuseIPDB?: string;
    otx?: string;
    virusTotal?: string;
  }) {
    if (apiKeys.abuseIPDB) {
      this.abuseIPDB = new AbuseIPDBClient(apiKeys.abuseIPDB);
    }
    if (apiKeys.otx) {
      this.otx = new OTXClient(apiKeys.otx);
    }
    if (apiKeys.virusTotal) {
      this.virusTotal = new VirusTotalClient(apiKeys.virusTotal);
    }
  }

  /**
   * Enrich single IOC
   */
  async enrichIOC(ioc: IOC, useCache = true): Promise<IOCEnrichmentResult> {
    // Check cache first
    if (useCache) {
      const cacheKey = this.cache.generateKey(ioc);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const enrichmentData: IOCEnrichmentResult['enrichmentData'] = {};

    try {
      // Enrich based on IOC type
      switch (ioc.type) {
        case 'ip':
          if (this.abuseIPDB) {
            enrichmentData.abuseIPDB = await this.abuseIPDB.checkIP(ioc.value);
          }
          if (this.otx) {
            enrichmentData.otx = await this.otx.getIndicator(ioc.value, 'IPv4');
          }
          if (this.virusTotal) {
            enrichmentData.virusTotal = await this.virusTotal.getIPReport(ioc.value);
          }
          break;

        case 'domain':
          if (this.otx) {
            enrichmentData.otx = await this.otx.getIndicator(ioc.value, 'domain');
          }
          if (this.virusTotal) {
            enrichmentData.virusTotal = await this.virusTotal.getDomainReport(ioc.value);
          }
          break;

        case 'url':
          if (this.otx) {
            enrichmentData.otx = await this.otx.getIndicator(ioc.value, 'URL');
          }
          if (this.virusTotal) {
            enrichmentData.virusTotal = await this.virusTotal.getURLReport(ioc.value);
          }
          break;

        case 'hash':
          if (this.otx) {
            const hashType = this.detectHashType(ioc.value);
            enrichmentData.otx = await this.otx.getIndicator(ioc.value, hashType);
          }
          if (this.virusTotal) {
            enrichmentData.virusTotal = await this.virusTotal.getHashReport(ioc.value);
          }
          break;
      }

      const result: IOCEnrichmentResult = {
        ioc,
        enrichmentData,
        riskAssessment: {
          overallRisk: 'low',
          riskScore: 0,
          confidence: 0,
          reasons: [],
          mitigations: []
        },
        timestamp: new Date(),
        ttl: 3600
      };

      // Assess risk
      this.riskAssessor.assessRisk(result);

      // Cache the result
      if (useCache) {
        const cacheKey = this.cache.generateKey(ioc);
        this.cache.set(cacheKey, result);
      }

      return result;

    } catch (error) {
      console.error(`IOC enrichment failed for ${ioc.value}:`, error);
      
      // Return minimal result on error
      return {
        ioc,
        enrichmentData: {},
        riskAssessment: {
          overallRisk: 'low',
          riskScore: 0,
          confidence: 0,
          reasons: ['Enrichment failed'],
          mitigations: ['Manual investigation required']
        },
        timestamp: new Date(),
        ttl: 300 // Shorter TTL for failed lookups
      };
    }
  }

  /**
   * Batch enrich multiple IOCs
   */
  async enrichIOCsBatch(
    iocs: IOC[],
    options: {
      maxConcurrent?: number;
      useCache?: boolean;
      delayMs?: number;
    } = {}
  ): Promise<IOCBatchResult> {
    const {
      maxConcurrent = 5,
      useCache = true,
      delayMs = 1000
    } = options;

    const sessionId = crypto.randomUUID();
    const startTime = Date.now();
    const results: IOCEnrichmentResult[] = [];
    const errors: IOCBatchResult['errors'] = [];

    // Process in batches to respect rate limits
    for (let i = 0; i < iocs.length; i += maxConcurrent) {
      const batch = iocs.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (ioc) => {
        try {
          const result = await this.enrichIOC(ioc, useCache);
          return { success: true as const, result };
        } catch (error) {
          return {
            success: false as const,
            error: {
              ioc: ioc.value,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date()
            }
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value.result);
          } else {
            errors.push(result.value.error);
          }
        } else {
          errors.push({
            ioc: 'unknown',
            error: result.reason?.toString() || 'Promise rejected',
            timestamp: new Date()
          });
        }
      });

      // Delay between batches to respect rate limits
      if (i + maxConcurrent < iocs.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Get combined rate limit status
    const rateLimit = this.getCombinedRateLimit();

    return {
      sessionId,
      processedCount: iocs.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
      processingTime: Date.now() - startTime,
      rateLimit
    };
  }

  /**
   * Detect hash type based on length
   */
  private detectHashType(hash: string): string {
    switch (hash.length) {
      case 32: return 'MD5';
      case 40: return 'SHA1';
      case 64: return 'SHA256';
      case 128: return 'SHA512';
      default: return 'file';
    }
  }

  /**
   * Get combined rate limit status
   */
  private getCombinedRateLimit(): { remaining: number; resetTime: Date } {
    let minRemaining = Infinity;
    let maxResetTime = new Date(0);

    if (this.abuseIPDB) {
      const limit = this.abuseIPDB.getRateLimit();
      minRemaining = Math.min(minRemaining, limit.remaining);
      maxResetTime = new Date(Math.max(maxResetTime.getTime(), limit.resetTime.getTime()));
    }

    if (this.otx) {
      const limit = this.otx.getRateLimit();
      minRemaining = Math.min(minRemaining, limit.remaining);
      maxResetTime = new Date(Math.max(maxResetTime.getTime(), limit.resetTime.getTime()));
    }

    if (this.virusTotal) {
      const limit = this.virusTotal.getRateLimit();
      minRemaining = Math.min(minRemaining, limit.remaining);
      maxResetTime = new Date(Math.max(maxResetTime.getTime(), limit.resetTime.getTime()));
    }

    return {
      remaining: minRemaining === Infinity ? 1000 : minRemaining,
      resetTime: maxResetTime
    };
  }

  /**
   * Extract IOCs from SOC events
   */
  extractIOCsFromEvents(events: SocEvent[]): IOC[] {
    const iocs: IOC[] = [];
    const seen = new Set<string>();

    for (const event of events) {
      // Extract IP addresses
      const ips = this.extractIPs(JSON.stringify(event));
      ips.forEach(ip => {
        const key = `ip:${ip}`;
        if (!seen.has(key)) {
          seen.add(key);
          iocs.push({
            id: crypto.randomUUID(),
            type: 'ip',
            value: ip,
            source: event.source,
            firstSeen: event.timestamp,
            lastSeen: event.timestamp,
            confidence: 0.8,
            riskScore: 0,
            tags: ['extracted']
          });
        }
      });

      // Extract domains
      const domains = this.extractDomains(JSON.stringify(event));
      domains.forEach(domain => {
        const key = `domain:${domain}`;
        if (!seen.has(key)) {
          seen.add(key);
          iocs.push({
            id: crypto.randomUUID(),
            type: 'domain',
            value: domain,
            source: event.source,
            firstSeen: event.timestamp,
            lastSeen: event.timestamp,
            confidence: 0.7,
            riskScore: 0,
            tags: ['extracted']
          });
        }
      });

      // Extract URLs
      const urls = this.extractURLs(JSON.stringify(event));
      urls.forEach(url => {
        const key = `url:${url}`;
        if (!seen.has(key)) {
          seen.add(key);
          iocs.push({
            id: crypto.randomUUID(),
            type: 'url',
            value: url,
            source: event.source,
            firstSeen: event.timestamp,
            lastSeen: event.timestamp,
            confidence: 0.9,
            riskScore: 0,
            tags: ['extracted']
          });
        }
      });

      // Extract file hashes
      const hashes = this.extractHashes(JSON.stringify(event));
      hashes.forEach(hash => {
        const key = `hash:${hash}`;
        if (!seen.has(key)) {
          seen.add(key);
          iocs.push({
            id: crypto.randomUUID(),
            type: 'hash',
            value: hash,
            source: event.source,
            firstSeen: event.timestamp,
            lastSeen: event.timestamp,
            confidence: 1.0,
            riskScore: 0,
            tags: ['extracted']
          });
        }
      });
    }

    return iocs;
  }

  /**
   * Extract IP addresses from text
   */
  private extractIPs(text: string): string[] {
    const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
    return text.match(ipRegex) || [];
  }

  /**
   * Extract domains from text
   */
  private extractDomains(text: string): string[] {
    const domainRegex = /\b[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z]{2,}\b/g;
    return text.match(domainRegex) || [];
  }

  /**
   * Extract URLs from text
   */
  private extractURLs(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    return text.match(urlRegex) || [];
  }

  /**
   * Extract file hashes from text
   */
  private extractHashes(text: string): string[] {
    const hashRegex = /\b[a-fA-F0-9]{32}\b|\b[a-fA-F0-9]{40}\b|\b[a-fA-F0-9]{64}\b|\b[a-fA-F0-9]{128}\b/g;
    return text.match(hashRegex) || [];
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    memoryUsage: number;
    hitRate: number;
  } {
    return this.cache.getStats();
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache(): number {
    return this.cache.cleanup();
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance with environment API keys
export const iocEnrichment = new IOCEnrichmentEngine({
  abuseIPDB: process.env.ABUSEIPDB_API_KEY,
  otx: process.env.OTX_API_KEY,
  virusTotal: process.env.VIRUSTOTAL_API_KEY
});
