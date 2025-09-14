/**
 * 🛡️ AILYDIAN AI LENS TRADER - OSINT & Security Feeds
 * CISA KEV, NVD, GHSA, npm advisories fetch/normalize
 * © Emrah Şardağ. All rights reserved.
 */

import { z } from 'zod';

// Schema definitions
const CISAKEVSchema = z.object({
  vulnerabilities: z.array(z.object({
    cveID: z.string(),
    vendorProject: z.string(),
    product: z.string(),
    vulnerabilityName: z.string(),
    dateAdded: z.string(),
    shortDescription: z.string(),
    requiredAction: z.string(),
    dueDate: z.string().optional(),
    notes: z.string().optional()
  }))
});

const NVDVulnSchema = z.object({
  vulnerabilities: z.array(z.object({
    cve: z.object({
      id: z.string(),
      descriptions: z.array(z.object({
        lang: z.string(),
        value: z.string()
      })),
      metrics: z.object({
        cvssMetricV31: z.array(z.object({
          cvssData: z.object({
            baseScore: z.number(),
            baseSeverity: z.string()
          })
        })).optional()
      }).optional()
    })
  }))
});

export interface NormalizedVulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score?: number;
  published: string;
  source: 'CISA' | 'NVD' | 'GITHUB' | 'NPM';
  affected?: {
    vendor?: string;
    product: string;
    versions?: string[];
  };
  references: string[];
  tags: string[];
}

export interface SecurityFeed {
  source: string;
  url: string;
  lastFetch?: Date;
  lastModified?: string;
  itemCount: number;
  errors: string[];
}

export class OSINTManager {
  private static instance: OSINTManager;
  private cache: Map<string, { data: any; timestamp: Date }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  private constructor() {}

  static getInstance(): OSINTManager {
    if (!OSINTManager.instance) {
      OSINTManager.instance = new OSINTManager();
    }
    return OSINTManager.instance;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp.getTime() < this.CACHE_TTL;
  }

  private getFromCache<T>(key: string): T | null {
    if (this.isCacheValid(key)) {
      return this.cache.get(key)?.data || null;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: new Date() });
  }

  async fetchCISAKEV(): Promise<NormalizedVulnerability[]> {
    const cacheKey = 'cisa-kev';
    const cached = this.getFromCache<NormalizedVulnerability[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = process.env.CISA_KEV_FEED || 
        'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'AILYDIAN-AI-LENS-TRADER/1.0' }
      });

      if (!response.ok) {
        throw new Error(`CISA KEV API returned ${response.status}`);
      }

      const data = await response.json();
      const parsed = CISAKEVSchema.parse(data);
      
      const normalized: NormalizedVulnerability[] = parsed.vulnerabilities.map(vuln => ({
        id: vuln.cveID,
        title: vuln.vulnerabilityName,
        description: vuln.shortDescription,
        severity: this.mapSeverity('HIGH'), // CISA KEV are exploited, assume HIGH
        published: vuln.dateAdded,
        source: 'CISA' as const,
        affected: {
          vendor: vuln.vendorProject,
          product: vuln.product
        },
        references: [],
        tags: ['exploited', 'cisa-kev']
      }));

      this.setCache(cacheKey, normalized);
      return normalized;
    } catch (error) {
      console.error('Failed to fetch CISA KEV:', error);
      return [];
    }
  }

  async fetchNVDCVEs(): Promise<NormalizedVulnerability[]> {
    const cacheKey = 'nvd-cve';
    const cached = this.getFromCache<NormalizedVulnerability[]>(cacheKey);
    if (cached) return cached;

    try {
      // Get vulnerabilities from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      
      const url = process.env.NVD_CVE_FEED ||
        `https://services.nvd.nist.gov/rest/json/cves/2.0?lastModStartDate=${dateStr}T00:00:00.000&resultsPerPage=100`;

      const response = await fetch(url, {
        headers: { 'User-Agent': 'AILYDIAN-AI-LENS-TRADER/1.0' }
      });

      if (!response.ok) {
        throw new Error(`NVD API returned ${response.status}`);
      }

      const data = await response.json();
      const parsed = NVDVulnSchema.parse(data);
      
      const normalized: NormalizedVulnerability[] = parsed.vulnerabilities.map(item => {
        const cve = item.cve;
        const description = cve.descriptions.find(d => d.lang === 'en')?.value || 'No description';
        const metrics = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
        
        return {
          id: cve.id,
          title: cve.id,
          description,
          severity: this.mapSeverity(metrics?.baseSeverity || 'MEDIUM'),
          score: metrics?.baseScore,
          published: new Date().toISOString(), // NVD doesn't provide this in simple format
          source: 'NVD' as const,
          references: [],
          tags: ['cve', 'nvd']
        };
      });

      this.setCache(cacheKey, normalized);
      return normalized;
    } catch (error) {
      console.error('Failed to fetch NVD CVEs:', error);
      return [];
    }
  }

  async fetchGitHubAdvisories(): Promise<NormalizedVulnerability[]> {
    const cacheKey = 'github-advisories';
    const cached = this.getFromCache<NormalizedVulnerability[]>(cacheKey);
    if (cached) return cached;

    try {
      const token = process.env.GITHUB_TOKEN;
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'AILYDIAN-AI-LENS-TRADER/1.0'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        'https://api.github.com/advisories?ecosystem=npm&per_page=50&sort=published&direction=desc',
        { headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub Advisory API returned ${response.status}`);
      }

      const advisories = await response.json();
      
      const normalized: NormalizedVulnerability[] = advisories.map((advisory: any) => ({
        id: advisory.ghsa_id || advisory.cve_id,
        title: advisory.summary || 'GitHub Security Advisory',
        description: advisory.description || advisory.summary || 'No description',
        severity: this.mapSeverity(advisory.severity),
        score: advisory.cvss?.score,
        published: advisory.published_at,
        source: 'GITHUB' as const,
        affected: {
          product: advisory.vulnerabilities?.[0]?.package?.name || 'unknown'
        },
        references: [advisory.html_url],
        tags: ['github', 'security-advisory']
      }));

      this.setCache(cacheKey, normalized);
      return normalized;
    } catch (error) {
      console.error('Failed to fetch GitHub advisories:', error);
      return [];
    }
  }

  async fetchNPMAdvisories(): Promise<NormalizedVulnerability[]> {
    if (!process.env.NPM_ADVISORY_ENABLE) return [];
    
    const cacheKey = 'npm-advisories';
    const cached = this.getFromCache<NormalizedVulnerability[]>(cacheKey);
    if (cached) return cached;

    try {
      // Note: npm audit API is complex, using a simplified approach
      const response = await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AILYDIAN-AI-LENS-TRADER/1.0'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`NPM Advisory API returned ${response.status}`);
      }

      const advisories = await response.json();
      
      const normalized: NormalizedVulnerability[] = Object.entries(advisories)
        .slice(0, 50) // Limit to recent 50
        .map(([id, advisory]: [string, any]) => ({
          id: `NPM-${id}`,
          title: advisory.title || advisory.overview || 'NPM Security Advisory',
          description: advisory.overview || advisory.title || 'No description',
          severity: this.mapSeverity(advisory.severity),
          published: advisory.created || new Date().toISOString(),
          source: 'NPM' as const,
          affected: {
            product: advisory.module_name || 'unknown'
          },
          references: advisory.url ? [advisory.url] : [],
          tags: ['npm', 'security-advisory']
        }));

      this.setCache(cacheKey, normalized);
      return normalized;
    } catch (error) {
      console.error('Failed to fetch NPM advisories:', error);
      return [];
    }
  }

  private mapSeverity(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const s = severity?.toUpperCase();
    switch (s) {
      case 'LOW': return 'LOW';
      case 'MODERATE':
      case 'MEDIUM': return 'MEDIUM';
      case 'HIGH': return 'HIGH';
      case 'CRITICAL': return 'CRITICAL';
      default: return 'MEDIUM';
    }
  }

  async getAllVulnerabilities(): Promise<{
    vulnerabilities: NormalizedVulnerability[];
    summary: {
      total: number;
      bySeverity: Record<string, number>;
      bySource: Record<string, number>;
      lastUpdated: string;
    };
    feeds: SecurityFeed[];
  }> {
    const startTime = Date.now();
    
    try {
      const [cisaKev, nvdCves, githubAdvisories, npmAdvisories] = await Promise.all([
        this.fetchCISAKEV(),
        this.fetchNVDCVEs(),
        this.fetchGitHubAdvisories(),
        this.fetchNPMAdvisories()
      ]);

      const allVulns = [...cisaKev, ...nvdCves, ...githubAdvisories, ...npmAdvisories];
      
      // Deduplicate by ID
      const uniqueVulns = allVulns.filter((vuln, index) => 
        allVulns.findIndex(v => v.id === vuln.id) === index
      );

      // Sort by severity and date
      uniqueVulns.sort((a, b) => {
        const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const aSeverity = severityOrder[a.severity] || 0;
        const bSeverity = severityOrder[b.severity] || 0;
        
        if (aSeverity !== bSeverity) {
          return bSeverity - aSeverity;
        }
        
        return new Date(b.published).getTime() - new Date(a.published).getTime();
      });

      const summary = {
        total: uniqueVulns.length,
        bySeverity: uniqueVulns.reduce((acc, vuln) => {
          acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        bySource: uniqueVulns.reduce((acc, vuln) => {
          acc[vuln.source] = (acc[vuln.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        lastUpdated: new Date().toISOString()
      };

      const feeds: SecurityFeed[] = [
        {
          source: 'CISA KEV',
          url: process.env.CISA_KEV_FEED || '',
          itemCount: cisaKev.length,
          errors: []
        },
        {
          source: 'NVD CVE',
          url: 'NVD API',
          itemCount: nvdCves.length,
          errors: []
        },
        {
          source: 'GitHub Advisories',
          url: 'GitHub API',
          itemCount: githubAdvisories.length,
          errors: []
        },
        {
          source: 'NPM Advisories',
          url: 'NPM API',
          itemCount: npmAdvisories.length,
          errors: []
        }
      ];

      const endTime = Date.now();
      console.log(`OSINT fetch completed in ${endTime - startTime}ms: ${uniqueVulns.length} vulnerabilities`);

      return {
        vulnerabilities: uniqueVulns,
        summary,
        feeds
      };
    } catch (error) {
      console.error('Failed to fetch all vulnerabilities:', error);
      return {
        vulnerabilities: [],
        summary: {
          total: 0,
          bySeverity: {},
          bySource: {},
          lastUpdated: new Date().toISOString()
        },
        feeds: []
      };
    }
  }

  // Filter vulnerabilities relevant to current SBOM
  filterRelevantVulnerabilities(
    vulnerabilities: NormalizedVulnerability[],
    sbomComponents: string[]
  ): NormalizedVulnerability[] {
    return vulnerabilities.filter(vuln => {
      if (!vuln.affected?.product) return false;
      
      return sbomComponents.some(component =>
        component.toLowerCase().includes(vuln.affected!.product.toLowerCase()) ||
        vuln.affected!.product.toLowerCase().includes(component.toLowerCase())
      );
    });
  }

  calculateThreatScore(vulnerabilities: NormalizedVulnerability[]): number {
    if (vulnerabilities.length === 0) return 0;
    
    const severityWeights = { CRITICAL: 10, HIGH: 7, MEDIUM: 3, LOW: 1 };
    const sourceWeights = { CISA: 2, GITHUB: 1.5, NVD: 1.2, NPM: 1 }; // CISA KEV has higher weight
    
    const totalScore = vulnerabilities.reduce((score, vuln) => {
      const severityWeight = severityWeights[vuln.severity] || 1;
      const sourceWeight = sourceWeights[vuln.source] || 1;
      const recencyWeight = this.getRecencyWeight(vuln.published);
      
      return score + (severityWeight * sourceWeight * recencyWeight);
    }, 0);
    
    // Normalize to 0-100 scale
    const maxPossible = vulnerabilities.length * 10 * 2 * 1; // max severity * max source * max recency
    return Math.min(100, Math.round((totalScore / maxPossible) * 100));
  }

  private getRecencyWeight(published: string): number {
    const publishDate = new Date(published);
    const now = new Date();
    const daysDiff = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 7) return 1.0;   // Last week
    if (daysDiff <= 30) return 0.8;  // Last month
    if (daysDiff <= 90) return 0.6;  // Last quarter
    return 0.4; // Older
  }

  /**
   * Health check for OSINT system
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      return {
        status: 'healthy',
        details: {
          cacheSize: this.cache.size,
          sources: {
            nvd: 'ok',
            github: 'ok',
            npm: 'ok'
          },
          lastUpdate: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }
}

// Singleton instance
export const osintManager = OSINTManager.getInstance();
