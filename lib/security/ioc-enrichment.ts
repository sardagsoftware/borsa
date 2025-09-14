// Advanced IOC (Indicators of Compromise) Enrichment with VirusTotal Integration
export class IOCEnrichment {
  private apiKey: string;
  private cache: Map<string, any> = new Map();
  private rateLimitDelay: number = 15000; // 15 seconds for free tier
  private lastRequest: number = 0;

  constructor(apiKey: string = process.env.VIRUSTOTAL_API_KEY || '') {
    this.apiKey = apiKey;
  }

  // Enrich IOCs with threat intelligence
  async enrichIOCs(iocs: Array<{ type: string; value: string; metadata?: any }>): Promise<any> {
    const enrichedIOCs = [];
    
    for (const ioc of iocs) {
      const enriched = await this.enrichSingleIOC(ioc);
      enrichedIOCs.push(enriched);
      
      // Rate limiting for VirusTotal API
      await this.respectRateLimit();
    }

    return {
      enriched_iocs: enrichedIOCs,
      total_processed: iocs.length,
      malicious_count: enrichedIOCs.filter(ioc => ioc.threat_score > 70).length,
      suspicious_count: enrichedIOCs.filter(ioc => ioc.threat_score > 40 && ioc.threat_score <= 70).length,
      clean_count: enrichedIOCs.filter(ioc => ioc.threat_score <= 40).length,
      timestamp: new Date().toISOString()
    };
  }

  // Enrich single IOC
  private async enrichSingleIOC(ioc: { type: string; value: string; metadata?: any }): Promise<any> {
    const cacheKey = `${ioc.type}:${ioc.value}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let enriched = {
      ...ioc,
      threat_score: 0,
      threat_labels: [] as string[],
      first_seen: null,
      last_seen: null,
      reputation: 'unknown',
      sources: [] as string[],
      enrichment_timestamp: new Date().toISOString()
    };

    try {
      // Enrich based on IOC type
      switch (ioc.type.toLowerCase()) {
        case 'ip':
        case 'ip_address':
          enriched = await this.enrichIPAddress(enriched);
          break;
        case 'domain':
        case 'hostname':
          enriched = await this.enrichDomain(enriched);
          break;
        case 'url':
          enriched = await this.enrichURL(enriched);
          break;
        case 'file_hash':
        case 'md5':
        case 'sha1':
        case 'sha256':
          enriched = await this.enrichFileHash(enriched);
          break;
        case 'wallet_address':
        case 'bitcoin_address':
        case 'ethereum_address':
          enriched = await this.enrichWalletAddress(enriched);
          break;
        default:
          enriched.threat_score = 0;
          enriched.reputation = 'unknown';
      }

      // Additional enrichment from local threat intelligence
      enriched = await this.addLocalThreatIntelligence(enriched);
      
      // Cache the result
      this.cache.set(cacheKey, enriched);
      
    } catch (error) {
      console.error(`Failed to enrich IOC ${ioc.value}:`, error);
      enriched.threat_score = -1; // Error indicator
      enriched.reputation = 'error';
    }

    return enriched;
  }

  // Enrich IP Address
  private async enrichIPAddress(ioc: any): Promise<any> {
    if (!this.apiKey) {
      return { ...ioc, reputation: 'no_api_key' };
    }

    try {
      const response = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ioc.value}`, {
        headers: {
          'x-apikey': this.apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        const stats = data.data?.attributes?.last_analysis_stats;
        
        if (stats) {
          const maliciousCount = stats.malicious || 0;
          const totalEngines = Object.values(stats).reduce((sum: number, count) => sum + (count as number), 0);
          const threatScore = totalEngines > 0 ? (maliciousCount / totalEngines) * 100 : 0;

          ioc.threat_score = threatScore;
          ioc.threat_labels = data.data?.attributes?.tags || [];
          ioc.reputation = maliciousCount > 2 ? 'malicious' : maliciousCount > 0 ? 'suspicious' : 'clean';
          ioc.sources.push('virustotal');
          
          // Add geolocation data
          const geoInfo = data.data?.attributes?.country;
          if (geoInfo) {
            ioc.metadata = { ...ioc.metadata, country: geoInfo };
          }
        }
      }
    } catch (error) {
      console.error('VirusTotal IP enrichment failed:', error);
    }

    return ioc;
  }

  // Enrich Domain
  private async enrichDomain(ioc: any): Promise<any> {
    if (!this.apiKey) {
      return { ...ioc, reputation: 'no_api_key' };
    }

    try {
      const response = await fetch(`https://www.virustotal.com/api/v3/domains/${ioc.value}`, {
        headers: {
          'x-apikey': this.apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        const stats = data.data?.attributes?.last_analysis_stats;
        
        if (stats) {
          const maliciousCount = stats.malicious || 0;
          const totalEngines = Object.values(stats).reduce((sum: number, count) => sum + (count as number), 0);
          const threatScore = totalEngines > 0 ? (maliciousCount / totalEngines) * 100 : 0;

          ioc.threat_score = threatScore;
          ioc.threat_labels = data.data?.attributes?.categories || [];
          ioc.reputation = maliciousCount > 2 ? 'malicious' : maliciousCount > 0 ? 'suspicious' : 'clean';
          ioc.sources.push('virustotal');
          
          // Add registration data
          const registrar = data.data?.attributes?.registrar;
          if (registrar) {
            ioc.metadata = { ...ioc.metadata, registrar };
          }
        }
      }
    } catch (error) {
      console.error('VirusTotal domain enrichment failed:', error);
    }

    return ioc;
  }

  // Enrich URL
  private async enrichURL(ioc: any): Promise<any> {
    if (!this.apiKey) {
      return { ...ioc, reputation: 'no_api_key' };
    }

    try {
      // URL needs to be base64 encoded for VT API
      const encodedUrl = btoa(ioc.value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      const response = await fetch(`https://www.virustotal.com/api/v3/urls/${encodedUrl}`, {
        headers: {
          'x-apikey': this.apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        const stats = data.data?.attributes?.last_analysis_stats;
        
        if (stats) {
          const maliciousCount = stats.malicious || 0;
          const totalEngines = Object.values(stats).reduce((sum: number, count) => sum + (count as number), 0);
          const threatScore = totalEngines > 0 ? (maliciousCount / totalEngines) * 100 : 0;

          ioc.threat_score = threatScore;
          ioc.threat_labels = data.data?.attributes?.categories || [];
          ioc.reputation = maliciousCount > 2 ? 'malicious' : maliciousCount > 0 ? 'suspicious' : 'clean';
          ioc.sources.push('virustotal');
        }
      }
    } catch (error) {
      console.error('VirusTotal URL enrichment failed:', error);
    }

    return ioc;
  }

  // Enrich File Hash
  private async enrichFileHash(ioc: any): Promise<any> {
    if (!this.apiKey) {
      return { ...ioc, reputation: 'no_api_key' };
    }

    try {
      const response = await fetch(`https://www.virustotal.com/api/v3/files/${ioc.value}`, {
        headers: {
          'x-apikey': this.apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        const stats = data.data?.attributes?.last_analysis_stats;
        
        if (stats) {
          const maliciousCount = stats.malicious || 0;
          const totalEngines = Object.values(stats).reduce((sum: number, count) => sum + (count as number), 0);
          const threatScore = totalEngines > 0 ? (maliciousCount / totalEngines) * 100 : 0;

          ioc.threat_score = threatScore;
          ioc.threat_labels = data.data?.attributes?.tags || [];
          ioc.reputation = maliciousCount > 5 ? 'malicious' : maliciousCount > 0 ? 'suspicious' : 'clean';
          ioc.sources.push('virustotal');
          
          // Add file metadata
          const fileInfo = {
            size: data.data?.attributes?.size,
            type: data.data?.attributes?.type_description,
            names: data.data?.attributes?.names
          };
          ioc.metadata = { ...ioc.metadata, file_info: fileInfo };
        }
      }
    } catch (error) {
      console.error('VirusTotal file enrichment failed:', error);
    }

    return ioc;
  }

  // Enrich Wallet Address (simplified blockchain analysis)
  private async enrichWalletAddress(ioc: any): Promise<any> {
    // This would integrate with blockchain analysis services
    // For now, we'll use a simplified local analysis
    
    const knownMaliciousWallets = new Set([
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xfedcba0987654321fedcba0987654321fedcba09',
      '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', // Bitcoin example
    ]);

    if (knownMaliciousWallets.has(ioc.value)) {
      ioc.threat_score = 100;
      ioc.reputation = 'malicious';
      ioc.threat_labels = ['known_malicious_wallet', 'cryptocurrency_theft'];
      ioc.sources.push('local_blacklist');
    } else {
      ioc.threat_score = 0;
      ioc.reputation = 'unknown';
    }

    // Add blockchain type detection
    if (ioc.value.startsWith('0x') && ioc.value.length === 42) {
      ioc.metadata = { ...ioc.metadata, blockchain: 'ethereum' };
    } else if (ioc.value.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/)) {
      ioc.metadata = { ...ioc.metadata, blockchain: 'bitcoin' };
    }

    return ioc;
  }

  // Add local threat intelligence
  private async addLocalThreatIntelligence(ioc: any): Promise<any> {
    // Trading platform specific threat intelligence
    const tradingThreatPatterns = {
      domains: [
        'fake-binance.com',
        'metamask-phishing.net',
        'crypto-giveaway-scam.org'
      ],
      ips: [
        '192.168.1.100', // Example malicious IP
        '10.0.0.1'
      ],
      wallet_addresses: [
        '0x1234567890abcdef1234567890abcdef12345678'
      ]
    };

    // Check against local threat intelligence
    let localThreatFound = false;
    
    switch (ioc.type.toLowerCase()) {
      case 'domain':
        if (tradingThreatPatterns.domains.includes(ioc.value)) {
          localThreatFound = true;
          ioc.threat_labels.push('trading_platform_threat');
        }
        break;
      case 'ip':
      case 'ip_address':
        if (tradingThreatPatterns.ips.includes(ioc.value)) {
          localThreatFound = true;
          ioc.threat_labels.push('trading_platform_threat');
        }
        break;
      case 'wallet_address':
        if (tradingThreatPatterns.wallet_addresses.includes(ioc.value)) {
          localThreatFound = true;
          ioc.threat_labels.push('known_malicious_wallet');
        }
        break;
    }

    if (localThreatFound) {
      ioc.threat_score = Math.max(ioc.threat_score, 85);
      ioc.reputation = 'malicious';
      ioc.sources.push('ailydian_threat_intel');
    }

    return ioc;
  }

  // Rate limiting helper
  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequest = Date.now();
  }

  // Bulk IOC analysis
  async analyzeBulkIOCs(iocs: any[]): Promise<any> {
    const batchSize = 4; // VT API allows 4 requests per minute for free tier
    const batches = [];
    
    for (let i = 0; i < iocs.length; i += batchSize) {
      batches.push(iocs.slice(i, i + batchSize));
    }

    const results = [];
    
    for (const batch of batches) {
      const batchResults = await this.enrichIOCs(batch);
      results.push(batchResults);
      
      // Wait between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute wait
      }
    }

    return {
      bulk_analysis: {
        total_batches: batches.length,
        total_iocs: iocs.length,
        batch_results: results,
        analysis_timestamp: new Date().toISOString()
      }
    };
  }

  // Get threat intelligence summary
  getThreatIntelSummary(enrichedIOCs: any[]): any {
    const summary = {
      total_iocs: enrichedIOCs.length,
      reputation_breakdown: {
        malicious: 0,
        suspicious: 0,
        clean: 0,
        unknown: 0,
        error: 0
      },
      threat_score_distribution: {
        critical: 0, // 80-100
        high: 0,     // 60-79
        medium: 0,   // 40-59
        low: 0,      // 20-39
        minimal: 0   // 0-19
      },
      top_threat_labels: new Map<string, number>(),
      sources_used: new Set<string>(),
      average_threat_score: 0,
      recommendations: [] as string[]
    };

    let totalScore = 0;

    enrichedIOCs.forEach(ioc => {
      // Reputation breakdown
      summary.reputation_breakdown[ioc.reputation as keyof typeof summary.reputation_breakdown]++;
      
      // Threat score distribution
      if (ioc.threat_score >= 80) summary.threat_score_distribution.critical++;
      else if (ioc.threat_score >= 60) summary.threat_score_distribution.high++;
      else if (ioc.threat_score >= 40) summary.threat_score_distribution.medium++;
      else if (ioc.threat_score >= 20) summary.threat_score_distribution.low++;
      else summary.threat_score_distribution.minimal++;

      totalScore += ioc.threat_score;

      // Threat labels
      ioc.threat_labels?.forEach((label: string) => {
        summary.top_threat_labels.set(label, (summary.top_threat_labels.get(label) || 0) + 1);
      });

      // Sources
      ioc.sources?.forEach((source: string) => {
        summary.sources_used.add(source);
      });
    });

    summary.average_threat_score = enrichedIOCs.length > 0 ? totalScore / enrichedIOCs.length : 0;

    // Generate recommendations
    if (summary.reputation_breakdown.malicious > 0) {
      summary.recommendations.push('Block all malicious IOCs immediately');
      summary.recommendations.push('Review related security events and incidents');
    }
    
    if (summary.reputation_breakdown.suspicious > 0) {
      summary.recommendations.push('Monitor suspicious IOCs closely');
      summary.recommendations.push('Consider additional investigation');
    }

    if (summary.average_threat_score > 50) {
      summary.recommendations.push('Implement enhanced monitoring and alerting');
      summary.recommendations.push('Consider threat hunting activities');
    }

    return {
      ...summary,
      top_threat_labels: Array.from(summary.top_threat_labels.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      sources_used: Array.from(summary.sources_used),
      analysis_timestamp: new Date().toISOString()
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): any {
    return {
      cache_size: this.cache.size,
      cache_keys: Array.from(this.cache.keys()).slice(0, 10), // First 10 keys
      last_cleared: new Date().toISOString()
    };
  }
}
