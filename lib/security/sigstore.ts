/**
 * 🛡️ AILYDIAN AI LENS TRADER - Sigstore Supply Chain Security
 * Software signing & verification with Sigstore
 * © Emrah Şardağ. All rights reserved.
 */

import { getSecret } from './secret';
import { sendSecurityAlert } from './alerts';

export interface SignatureInfo {
  signature: string;
  certificate: string;
  bundleId?: string;
  timestamp: string;
  keyId?: string;
  subject?: string;
  issuer?: string;
}

export interface VerificationResult {
  verified: boolean;
  signature: SignatureInfo;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

export interface ArtifactInfo {
  name: string;
  version: string;
  hash: string;
  type: 'npm' | 'docker' | 'file' | 'release';
  size: number;
  path?: string;
  url?: string;
}

export interface AttestationBundle {
  artifact: ArtifactInfo;
  signatures: SignatureInfo[];
  sbom?: any;
  provenance?: any;
  vulnerability_scan?: any;
  created: string;
  creator: string;
}

export class SigstoreManager {
  private static instance: SigstoreManager;
  private cosignBinary: string = 'cosign';
  private rekorUrl: string = 'https://rekor.sigstore.dev';
  private fulcioUrl: string = 'https://fulcio.sigstore.dev';

  private constructor() {
    this.initializeConfig();
  }

  static getInstance(): SigstoreManager {
    if (!SigstoreManager.instance) {
      SigstoreManager.instance = new SigstoreManager();
    }
    return SigstoreManager.instance;
  }

  private initializeConfig(): void {
    const customRekor = getSecret('SIGSTORE_REKOR_URL');
    const customFulcio = getSecret('SIGSTORE_FULCIO_URL');
    const customCosign = getSecret('SIGSTORE_COSIGN_PATH');

    if (customRekor) this.rekorUrl = customRekor;
    if (customFulcio) this.fulcioUrl = customFulcio;
    if (customCosign) this.cosignBinary = customCosign;
  }

  // Sign artifacts using Cosign
  async signArtifact(
    artifactPath: string,
    options: {
      keyless?: boolean;
      privateKeyPath?: string;
      password?: string;
      outputSignature?: string;
      outputCertificate?: string;
      annotations?: Record<string, string>;
    } = {}
  ): Promise<SignatureInfo> {
    const { spawn } = require('child_process');
    const crypto = require('crypto');

    // Build cosign command
    const args = ['sign'];
    
    if (options.keyless) {
      args.push('--yes'); // Auto-approve keyless signing
    } else if (options.privateKeyPath) {
      args.push('--key', options.privateKeyPath);
    }

    if (options.outputSignature) {
      args.push('--output-signature', options.outputSignature);
    }

    if (options.outputCertificate) {
      args.push('--output-certificate', options.outputCertificate);
    }

    // Add annotations
    if (options.annotations) {
      Object.entries(options.annotations).forEach(([key, value]) => {
        args.push('-a', `${key}=${value}`);
      });
    }

    args.push(artifactPath);

    try {
      const result = await this.executeCosign(args, options.password);
      
      // Read signature and certificate if they were output to files
      let signature = '';
      let certificate = '';

      if (options.outputSignature) {
        const fs = require('fs');
        signature = await fs.promises.readFile(options.outputSignature, 'utf8');
      }

      if (options.outputCertificate) {
        const fs = require('fs');
        certificate = await fs.promises.readFile(options.outputCertificate, 'utf8');
      }

      const signatureInfo: SignatureInfo = {
        signature: signature || result.signature || '',
        certificate: certificate || result.certificate || '',
        timestamp: new Date().toISOString(),
        subject: this.extractCertificateSubject(certificate),
        issuer: this.extractCertificateIssuer(certificate)
      };

      await sendSecurityAlert(
        'Artifact Signed',
        `Successfully signed artifact: ${artifactPath}`,
        'LOW',
        'SIGSTORE',
        { artifact: artifactPath, signature: signatureInfo }
      );

      return signatureInfo;

    } catch (error) {
      await sendSecurityAlert(
        'Signing Failed',
        `Failed to sign artifact: ${artifactPath}. Error: ${error}`,
        'HIGH',
        'SIGSTORE',
        { artifact: artifactPath, error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  // Verify signatures using Cosign
  async verifyArtifact(
    artifactPath: string,
    options: {
      publicKeyPath?: string;
      certificatePath?: string;
      certificateOidcIssuer?: string;
      certificateIdentity?: string;
      signaturePath?: string;
      annotations?: Record<string, string>;
    } = {}
  ): Promise<VerificationResult> {
    const args = ['verify'];

    if (options.publicKeyPath) {
      args.push('--key', options.publicKeyPath);
    }

    if (options.certificatePath) {
      args.push('--certificate', options.certificatePath);
    }

    if (options.certificateOidcIssuer) {
      args.push('--certificate-oidc-issuer', options.certificateOidcIssuer);
    }

    if (options.certificateIdentity) {
      args.push('--certificate-identity', options.certificateIdentity);
    }

    if (options.signaturePath) {
      args.push('--signature', options.signaturePath);
    }

    // Add annotation checks
    if (options.annotations) {
      Object.entries(options.annotations).forEach(([key, value]) => {
        args.push('-a', `${key}=${value}`);
      });
    }

    args.push(artifactPath);

    try {
      const result = await this.executeCosign(args);
      
      const verificationResult: VerificationResult = {
        verified: true,
        signature: {
          signature: result.signature || '',
          certificate: result.certificate || '',
          timestamp: new Date().toISOString(),
          subject: this.extractCertificateSubject(result.certificate),
          issuer: this.extractCertificateIssuer(result.certificate)
        },
        errors: [],
        warnings: result.warnings || []
      };

      await sendSecurityAlert(
        'Signature Verified',
        `Successfully verified signature for: ${artifactPath}`,
        'LOW',
        'SIGSTORE',
        { artifact: artifactPath, verification: verificationResult }
      );

      return verificationResult;

    } catch (error) {
      const verificationResult: VerificationResult = {
        verified: false,
        signature: {
          signature: '',
          certificate: '',
          timestamp: new Date().toISOString()
        },
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      };

      await sendSecurityAlert(
        'Signature Verification Failed',
        `Failed to verify signature for: ${artifactPath}. Error: ${error}`,
        'MEDIUM',
        'SIGSTORE',
        { artifact: artifactPath, verification: verificationResult }
      );

      return verificationResult;
    }
  }

  // Generate attestations (SLSA provenance, SBOM, etc.)
  async generateAttestation(
    artifact: ArtifactInfo,
    attestationType: 'slsaprovenance' | 'spdxjson' | 'cyclonedx' | 'vuln',
    predicateFile?: string
  ): Promise<string> {
    const args = ['attest'];

    switch (attestationType) {
      case 'slsaprovenance':
        args.push('--type', 'slsaprovenance');
        break;
      case 'spdxjson':
        args.push('--type', 'spdxjson');
        break;
      case 'cyclonedx':
        args.push('--type', 'cyclonedx');
        break;
      case 'vuln':
        args.push('--type', 'vuln');
        break;
    }

    if (predicateFile) {
      args.push('--predicate', predicateFile);
    }

    // Add artifact reference
    if (artifact.path) {
      args.push(artifact.path);
    } else if (artifact.url) {
      args.push(artifact.url);
    } else {
      throw new Error('Artifact path or URL required for attestation');
    }

    try {
      const result = await this.executeCosign(args);
      
      await sendSecurityAlert(
        'Attestation Generated',
        `Generated ${attestationType} attestation for ${artifact.name}`,
        'LOW',
        'SIGSTORE',
        { artifact, attestationType, result }
      );

      return result.output || '';

    } catch (error) {
      await sendSecurityAlert(
        'Attestation Generation Failed',
        `Failed to generate ${attestationType} attestation for ${artifact.name}. Error: ${error}`,
        'MEDIUM',
        'SIGSTORE',
        { artifact, attestationType, error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  // Verify attestations
  async verifyAttestation(
    artifact: ArtifactInfo,
    attestationType: string,
    options: {
      publicKeyPath?: string;
      certificateOidcIssuer?: string;
      certificateIdentity?: string;
      policy?: string;
    } = {}
  ): Promise<VerificationResult> {
    const args = ['verify-attestation'];

    args.push('--type', attestationType);

    if (options.publicKeyPath) {
      args.push('--key', options.publicKeyPath);
    }

    if (options.certificateOidcIssuer) {
      args.push('--certificate-oidc-issuer', options.certificateOidcIssuer);
    }

    if (options.certificateIdentity) {
      args.push('--certificate-identity', options.certificateIdentity);
    }

    if (options.policy) {
      args.push('--policy', options.policy);
    }

    // Add artifact reference
    if (artifact.path) {
      args.push(artifact.path);
    } else if (artifact.url) {
      args.push(artifact.url);
    }

    try {
      const result = await this.executeCosign(args);
      
      return {
        verified: true,
        signature: {
          signature: result.signature || '',
          certificate: result.certificate || '',
          timestamp: new Date().toISOString()
        },
        errors: [],
        warnings: result.warnings || []
      };

    } catch (error) {
      return {
        verified: false,
        signature: {
          signature: '',
          certificate: '',
          timestamp: new Date().toISOString()
        },
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      };
    }
  }

  // Create attestation bundle for release
  async createAttestationBundle(
    artifact: ArtifactInfo,
    options: {
      includeProvenance?: boolean;
      includeSBOM?: boolean;
      includeVulnScan?: boolean;
      sbomFile?: string;
      provenanceFile?: string;
      vulnScanFile?: string;
    } = {}
  ): Promise<AttestationBundle> {
    const bundle: AttestationBundle = {
      artifact,
      signatures: [],
      created: new Date().toISOString(),
      creator: 'AILYDIAN-AI-LENS-TRADER'
    };

    try {
      // Sign the artifact first
      const signature = await this.signArtifact(artifact.path || artifact.url!, {
        keyless: true,
        annotations: {
          'ailydian.com/artifact': artifact.name,
          'ailydian.com/version': artifact.version,
          'ailydian.com/type': artifact.type
        }
      });
      
      bundle.signatures.push(signature);

      // Generate SLSA Provenance if requested
      if (options.includeProvenance) {
        try {
          const provenance = await this.generateAttestation(
            artifact,
            'slsaprovenance',
            options.provenanceFile
          );
          bundle.provenance = JSON.parse(provenance);
        } catch (error) {
          console.warn('Failed to generate provenance:', error);
        }
      }

      // Generate SBOM if requested
      if (options.includeSBOM) {
        try {
          const sbom = await this.generateAttestation(
            artifact,
            'spdxjson',
            options.sbomFile
          );
          bundle.sbom = JSON.parse(sbom);
        } catch (error) {
          console.warn('Failed to generate SBOM:', error);
        }
      }

      // Generate vulnerability scan if requested
      if (options.includeVulnScan) {
        try {
          const vulnScan = await this.generateAttestation(
            artifact,
            'vuln',
            options.vulnScanFile
          );
          bundle.vulnerability_scan = JSON.parse(vulnScan);
        } catch (error) {
          console.warn('Failed to generate vulnerability scan:', error);
        }
      }

      await sendSecurityAlert(
        'Attestation Bundle Created',
        `Created complete attestation bundle for ${artifact.name}`,
        'LOW',
        'SIGSTORE',
        { bundle }
      );

      return bundle;

    } catch (error) {
      await sendSecurityAlert(
        'Bundle Creation Failed',
        `Failed to create attestation bundle for ${artifact.name}. Error: ${error}`,
        'MEDIUM',
        'SIGSTORE',
        { artifact, error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  // Execute cosign command
  private async executeCosign(args: string[], password?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      
      const process = spawn(this.cosignBinary, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      if (password) {
        process.stdin.write(password + '\n');
      }

      process.on('close', (code: number) => {
        if (code === 0) {
          resolve({
            output: stdout,
            warnings: stderr ? [stderr] : [],
            signature: this.extractSignatureFromOutput(stdout),
            certificate: this.extractCertificateFromOutput(stdout)
          });
        } else {
          reject(new Error(`Cosign exited with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error: Error) => {
        reject(error);
      });

      process.stdin.end();
    });
  }

  // Extract signature from cosign output
  private extractSignatureFromOutput(output: string): string {
    const signatureMatch = output.match(/-----BEGIN SIGNATURE-----\n(.*?)\n-----END SIGNATURE-----/s);
    return signatureMatch ? signatureMatch[0] : '';
  }

  // Extract certificate from cosign output
  private extractCertificateFromOutput(output: string): string {
    const certMatch = output.match(/-----BEGIN CERTIFICATE-----\n(.*?)\n-----END CERTIFICATE-----/s);
    return certMatch ? certMatch[0] : '';
  }

  // Extract subject from certificate
  private extractCertificateSubject(certificate: string): string {
    if (!certificate) return '';
    
    try {
      const crypto = require('crypto');
      const cert = new crypto.X509Certificate(certificate);
      return cert.subject;
    } catch {
      return '';
    }
  }

  // Extract issuer from certificate
  private extractCertificateIssuer(certificate: string): string {
    if (!certificate) return '';
    
    try {
      const crypto = require('crypto');
      const cert = new crypto.X509Certificate(certificate);
      return cert.issuer;
    } catch {
      return '';
    }
  }

  // Check if cosign is available
  async checkCosignAvailability(): Promise<boolean> {
    try {
      await this.executeCosign(['version']);
      return true;
    } catch {
      return false;
    }
  }

  // Get Sigstore configuration
  getConfiguration(): {
    cosignBinary: string;
    rekorUrl: string;
    fulcioUrl: string;
    available: boolean;
  } {
    return {
      cosignBinary: this.cosignBinary,
      rekorUrl: this.rekorUrl,
      fulcioUrl: this.fulcioUrl,
      available: false // Will be set by health check
    };
  }

  // Health check
  async healthCheck(): Promise<{
    cosignAvailable: boolean;
    rekorReachable: boolean;
    fulcioReachable: boolean;
    overall: boolean;
  }> {
    const [cosignAvailable, rekorReachable, fulcioReachable] = await Promise.allSettled([
      this.checkCosignAvailability(),
      this.checkServiceReachable(this.rekorUrl + '/api/v1/log'),
      this.checkServiceReachable(this.fulcioUrl + '/api/v1/status')
    ]);

    const result = {
      cosignAvailable: cosignAvailable.status === 'fulfilled' && cosignAvailable.value,
      rekorReachable: rekorReachable.status === 'fulfilled' && rekorReachable.value,
      fulcioReachable: fulcioReachable.status === 'fulfilled' && fulcioReachable.value,
      overall: false
    };

    result.overall = result.cosignAvailable && result.rekorReachable && result.fulcioReachable;
    return result;
  }

  private async checkServiceReachable(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const sigstoreManager = SigstoreManager.getInstance();

// Convenience functions
export const signArtifact = (artifactPath: string, options?: any) =>
  sigstoreManager.signArtifact(artifactPath, options);

export const verifyArtifact = (artifactPath: string, options?: any) =>
  sigstoreManager.verifyArtifact(artifactPath, options);

export const createAttestationBundle = (artifact: ArtifactInfo, options?: any) =>
  sigstoreManager.createAttestationBundle(artifact, options);

export const checkSigstoreHealth = () =>
  sigstoreManager.healthCheck();
