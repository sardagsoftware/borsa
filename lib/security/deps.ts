/**
 * 🛡️ AILYDIAN AI LENS TRADER - Dependencies & SBOM
 * SBOM üretimi (cyclonedx-json) ve advisory eşleme
 * © Emrah Şardağ. All rights reserved.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

const SBOMSchema = z.object({
  bomFormat: z.string(),
  specVersion: z.string(),
  version: z.number(),
  metadata: z.object({
    timestamp: z.string(),
    tools: z.array(z.any()).optional(),
  }),
  components: z.array(z.object({
    type: z.string(),
    'bom-ref': z.string(),
    name: z.string(),
    version: z.string().optional(),
    scope: z.string().optional(),
    purl: z.string().optional(),
    licenses: z.array(z.any()).optional(),
    hashes: z.array(z.any()).optional(),
  }))
});

export type SBOM = z.infer<typeof SBOMSchema>;
export type SBOMComponent = SBOM['components'][0];

export interface VulnerabilityMatch {
  component: string;
  version: string;
  vulnerability: {
    id: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    cvss?: number;
    advisory?: string;
  };
}

export class DependencyAnalyzer {
  private sbomPath: string;
  private advisoryCache: Map<string, any[]> = new Map();

  constructor(sbomPath = './public/sbom/latest.json') {
    this.sbomPath = sbomPath;
  }

  async loadSBOM(): Promise<SBOM | null> {
    try {
      const sbomFullPath = join(process.cwd(), this.sbomPath);
      if (!existsSync(sbomFullPath)) {
        console.warn(`SBOM file not found at ${sbomFullPath}`);
        return null;
      }

      const content = readFileSync(sbomFullPath, 'utf-8');
      const data = JSON.parse(content);
      return SBOMSchema.parse(data);
    } catch (error) {
      console.error('Failed to load SBOM:', error);
      return null;
    }
  }

  async generateSBOM(): Promise<boolean> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      await execAsync('npm run sbom');
      console.log('SBOM generated successfully');
      return true;
    } catch (error) {
      console.error('Failed to generate SBOM:', error);
      return false;
    }
  }

  extractComponents(sbom: SBOM): SBOMComponent[] {
    return sbom.components.filter(comp => 
      comp.type === 'library' && 
      comp.scope !== 'excluded'
    );
  }

  async fetchNPMAdvisories(): Promise<any[]> {
    try {
      if (this.advisoryCache.has('npm')) {
        return this.advisoryCache.get('npm') || [];
      }

      const response = await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`NPM Advisory API returned ${response.status}`);
      }

      const advisories = await response.json();
      this.advisoryCache.set('npm', advisories);
      return advisories;
    } catch (error) {
      console.error('Failed to fetch NPM advisories:', error);
      return [];
    }
  }

  async fetchGitHubAdvisories(): Promise<any[]> {
    try {
      if (this.advisoryCache.has('github')) {
        return this.advisoryCache.get('github') || [];
      }

      // GitHub Security Advisory API (requires token for higher limits)
      const token = process.env.GITHUB_TOKEN;
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('https://api.github.com/advisories?ecosystem=npm&per_page=100', {
        headers
      });

      if (!response.ok) {
        throw new Error(`GitHub Advisory API returned ${response.status}`);
      }

      const advisories = await response.json();
      this.advisoryCache.set('github', advisories);
      return advisories;
    } catch (error) {
      console.error('Failed to fetch GitHub advisories:', error);
      return [];
    }
  }

  async matchVulnerabilities(components: SBOMComponent[]): Promise<VulnerabilityMatch[]> {
    const matches: VulnerabilityMatch[] = [];
    
    try {
      const [npmAdvisories, githubAdvisories] = await Promise.all([
        this.fetchNPMAdvisories(),
        this.fetchGitHubAdvisories()
      ]);

      for (const component of components) {
        if (!component.name || !component.version) continue;

        // Check NPM advisories
        const npmMatches = this.checkNPMAdvisories(component, npmAdvisories);
        matches.push(...npmMatches);

        // Check GitHub advisories
        const ghMatches = this.checkGitHubAdvisories(component, githubAdvisories);
        matches.push(...ghMatches);
      }

      // Deduplicate by component + vulnerability ID
      const uniqueMatches = matches.filter((match, index) => {
        const key = `${match.component}:${match.vulnerability.id}`;
        return matches.findIndex(m => `${m.component}:${m.vulnerability.id}` === key) === index;
      });

      return uniqueMatches;
    } catch (error) {
      console.error('Failed to match vulnerabilities:', error);
      return [];
    }
  }

  private checkNPMAdvisories(component: SBOMComponent, advisories: any[]): VulnerabilityMatch[] {
    const matches: VulnerabilityMatch[] = [];
    
    for (const [id, advisory] of Object.entries(advisories)) {
      const adv = advisory as any;
      
      if (adv.module_name === component.name && 
          this.isVersionAffected(component.version || '0.0.0', adv.vulnerable_versions)) {
        matches.push({
          component: component.name,
          version: component.version || 'unknown',
          vulnerability: {
            id: `NPM-${id}`,
            severity: this.mapNPMSeverity(adv.severity),
            description: adv.overview || adv.title || 'No description',
            cvss: adv.cvss?.score,
            advisory: adv.url
          }
        });
      }
    }
    
    return matches;
  }

  private checkGitHubAdvisories(component: SBOMComponent, advisories: any[]): VulnerabilityMatch[] {
    const matches: VulnerabilityMatch[] = [];
    
    for (const advisory of advisories) {
      const affected = advisory.vulnerabilities?.[0]?.package;
      
      if (affected?.name === component.name &&
          this.isVersionAffected(component.version || '0.0.0', affected.vulnerable_version_range)) {
        matches.push({
          component: component.name,
          version: component.version || 'unknown',
          vulnerability: {
            id: advisory.ghsa_id || advisory.cve_id,
            severity: this.mapGitHubSeverity(advisory.severity),
            description: advisory.summary || 'No description',
            cvss: advisory.cvss?.score,
            advisory: advisory.html_url
          }
        });
      }
    }
    
    return matches;
  }

  private isVersionAffected(version: string, vulnerableRange: string): boolean {
    // Simplified version comparison - in production use semver library
    try {
      if (!vulnerableRange || vulnerableRange === '*') return true;
      
      // Basic range parsing (e.g., "<2.0.0", ">=1.0.0 <1.5.0")
      if (vulnerableRange.includes('<') && !vulnerableRange.includes('=')) {
        const targetVersion = vulnerableRange.replace(/[<>]/g, '').trim();
        return this.compareVersions(version, targetVersion) < 0;
      }
      
      return true; // Default to affected for safety
    } catch {
      return true; // Default to affected for safety
    }
  }

  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart < bPart) return -1;
      if (aPart > bPart) return 1;
    }
    
    return 0;
  }

  private mapNPMSeverity(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (severity?.toLowerCase()) {
      case 'low': return 'LOW';
      case 'moderate': return 'MEDIUM';
      case 'high': return 'HIGH';
      case 'critical': return 'CRITICAL';
      default: return 'MEDIUM';
    }
  }

  private mapGitHubSeverity(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (severity?.toLowerCase()) {
      case 'low': return 'LOW';
      case 'medium': return 'MEDIUM';
      case 'high': return 'HIGH';
      case 'critical': return 'CRITICAL';
      default: return 'MEDIUM';
    }
  }

  calculateRiskScore(vulnerabilities: VulnerabilityMatch[]): number {
    if (vulnerabilities.length === 0) return 0;
    
    const severityWeights = { LOW: 1, MEDIUM: 3, HIGH: 7, CRITICAL: 10 };
    const totalWeight = vulnerabilities.reduce((sum, vuln) => {
      return sum + severityWeights[vuln.vulnerability.severity];
    }, 0);
    
    // Normalize to 0-100 scale
    const maxPossibleWeight = vulnerabilities.length * 10;
    return Math.min(100, Math.round((totalWeight / maxPossibleWeight) * 100));
  }

  async getSecurityReport(): Promise<{
    sbom: SBOM | null;
    components: SBOMComponent[];
    vulnerabilities: VulnerabilityMatch[];
    riskScore: number;
    summary: {
      totalComponents: number;
      vulnerableComponents: number;
      criticalVulns: number;
      highVulns: number;
      mediumVulns: number;
      lowVulns: number;
    };
  }> {
    const sbom = await this.loadSBOM();
    if (!sbom) {
      return {
        sbom: null,
        components: [],
        vulnerabilities: [],
        riskScore: 0,
        summary: {
          totalComponents: 0,
          vulnerableComponents: 0,
          criticalVulns: 0,
          highVulns: 0,
          mediumVulns: 0,
          lowVulns: 0
        }
      };
    }

    const components = this.extractComponents(sbom);
    const vulnerabilities = await this.matchVulnerabilities(components);
    const riskScore = this.calculateRiskScore(vulnerabilities);

    const summary = {
      totalComponents: components.length,
      vulnerableComponents: new Set(vulnerabilities.map(v => v.component)).size,
      criticalVulns: vulnerabilities.filter(v => v.vulnerability.severity === 'CRITICAL').length,
      highVulns: vulnerabilities.filter(v => v.vulnerability.severity === 'HIGH').length,
      mediumVulns: vulnerabilities.filter(v => v.vulnerability.severity === 'MEDIUM').length,
      lowVulns: vulnerabilities.filter(v => v.vulnerability.severity === 'LOW').length
    };

    return {
      sbom,
      components,
      vulnerabilities,
      riskScore,
      summary
    };
  }
}

// Singleton instance
export const dependencyAnalyzer = new DependencyAnalyzer();
