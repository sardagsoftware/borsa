/**
 * 🛡️ AILYDIAN AI LENS TRADER - Ownership & Copyright
 * Telif/sahiplik banner injection, runtime headers & /ownership manifest
 * © Emrah Şardağ. All rights reserved.
 */

import { getOwnershipInfo } from './secret';

export interface OwnershipInfo {
  legalName: string;
  copyright: string;
  contact: string;
  timestamp: string;
  buildHash?: string;
}

export interface OwnershipAttestation {
  id: string;
  timestamp: string;
  signer: string;
  hash: string;
  metadata: {
    buildTime: string;
    version: string;
    environment: string;
    components: string[];
  };
}

export class OwnershipManager {
  private static instance: OwnershipManager;
  private attestations: OwnershipAttestation[] = [];

  private constructor() {}

  static getInstance(): OwnershipManager {
    if (!OwnershipManager.instance) {
      OwnershipManager.instance = new OwnershipManager();
    }
    return OwnershipManager.instance;
  }

  getOwnershipInfo(): OwnershipInfo {
    const info = getOwnershipInfo();
    return {
      ...info,
      timestamp: new Date().toISOString(),
      buildHash: this.getBuildHash()
    };
  }

  getBuildHash(): string | undefined {
    // Try to get build hash from various sources
    return process.env.VERCEL_GIT_COMMIT_SHA ||
           process.env.GITHUB_SHA ||
           process.env.BUILD_HASH ||
           undefined;
  }

  generateCopyrightBanner(): string {
    const info = this.getOwnershipInfo();
    return [
      '/*!',
      ` * ${info.copyright}`,
      ` * ${info.legalName}`,
      ' * Unauthorized copying, modification or distribution is prohibited.',
      ` * Contact: ${info.contact}`,
      ` * Build: ${info.buildHash || 'development'} at ${info.timestamp}`,
      ' */'
    ].join('\n');
  }

  generateWebpackBanner(): string {
    const info = this.getOwnershipInfo();
    return `${info.copyright} — ${info.legalName}. Unauthorized copying, modification or distribution is prohibited.`;
  }

  getOwnershipManifest(): {
    legal: OwnershipInfo;
    attestations: OwnershipAttestation[];
    verification: {
      integrity: string;
      timestamp: string;
    };
  } {
    const info = this.getOwnershipInfo();
    const content = JSON.stringify({ legal: info, attestations: this.attestations });
    const integrity = this.calculateIntegrity(content);

    return {
      legal: info,
      attestations: this.attestations,
      verification: {
        integrity,
        timestamp: new Date().toISOString()
      }
    };
  }

  addAttestation(attestation: Omit<OwnershipAttestation, 'timestamp'>): void {
    const fullAttestation: OwnershipAttestation = {
      ...attestation,
      timestamp: new Date().toISOString()
    };
    
    this.attestations.push(fullAttestation);
  }

  createBuildAttestation(): OwnershipAttestation {
    const info = this.getOwnershipInfo();
    const packageJson = this.loadPackageJson();
    
    return {
      id: `build-${Date.now()}`,
      timestamp: new Date().toISOString(),
      signer: info.legalName,
      hash: info.buildHash || 'development',
      metadata: {
        buildTime: info.timestamp,
        version: packageJson?.version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        components: this.extractComponents(packageJson)
      }
    };
  }

  private loadPackageJson(): any {
    try {
      return require('../../package.json');
    } catch {
      return null;
    }
  }

  private extractComponents(packageJson: any): string[] {
    if (!packageJson) return [];
    
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    
    return [...dependencies, ...devDependencies].slice(0, 20); // Top 20 for manifest size
  }

  private calculateIntegrity(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  // Legal notice generator for UI
  generateLegalNotice(): {
    title: string;
    content: string;
    contact: string;
    lastUpdated: string;
  } {
    const info = this.getOwnershipInfo();
    
    return {
      title: 'Telif Hakkı ve Sahiplik Bildirimi / Copyright and Ownership Notice',
      content: [
        `Bu yazılım ve tüm bileşenleri ${info.legalName} tarafından geliştirilmiş olup, telif hakkı koruması altındadır.`,
        '',
        'This software and all its components have been developed by Emrah Şardağ and are protected by copyright.',
        '',
        '• İzinsiz kopyalama, değiştirme veya dağıtım yasaktır',
        '• Unauthorized copying, modification or distribution is prohibited',
        '• Ticari kullanım için özel lisans gereklidir',
        '• Commercial use requires special licensing',
        '',
        `© ${new Date().getFullYear()} ${info.legalName}. Tüm hakları saklıdır / All rights reserved.`
      ].join('\n'),
      contact: info.contact,
      lastUpdated: new Date().toISOString()
    };
  }

  // Footer information
  getFooterInfo(): {
    copyright: string;
    contact: string;
    year: number;
  } {
    const info = this.getOwnershipInfo();
    
    return {
      copyright: info.copyright,
      contact: info.contact,
      year: new Date().getFullYear()
    };
  }

  // Inject ownership headers into API responses
  getOwnershipHeaders(): Record<string, string> {
    const info = this.getOwnershipInfo();
    
    return {
      'X-Copyright': info.copyright,
      'X-Owner': info.legalName,
      'X-Contact': info.contact,
      'X-Build-Hash': info.buildHash || 'development'
    };
  }

  // Anti-tampering verification
  verifyIntegrity(expectedHash?: string): {
    valid: boolean;
    actualHash: string;
    expectedHash?: string;
  } {
    const manifest = this.getOwnershipManifest();
    const actualHash = manifest.verification.integrity;
    
    return {
      valid: !expectedHash || actualHash === expectedHash,
      actualHash,
      expectedHash
    };
  }
}

// Singleton instance
export const ownershipManager = OwnershipManager.getInstance();

// Convenience functions
export const getOwnershipManifest = () => ownershipManager.getOwnershipManifest();
export const getCopyrightBanner = () => ownershipManager.generateCopyrightBanner();
export const getWebpackBanner = () => ownershipManager.generateWebpackBanner();
export const getLegalNotice = () => ownershipManager.generateLegalNotice();
export const getFooterInfo = () => ownershipManager.getFooterInfo();
export const getOwnershipHeaders = () => ownershipManager.getOwnershipHeaders();
export { getOwnershipInfo } from './secret';

// Auto-generate build attestation
if (process.env.NODE_ENV === 'production') {
  const buildAttestation = ownershipManager.createBuildAttestation();
  ownershipManager.addAttestation(buildAttestation);
}
