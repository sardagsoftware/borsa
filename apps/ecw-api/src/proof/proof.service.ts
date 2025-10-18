import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { ProofResponseDto, serializeProof } from './dto/proof-response.dto';

/**
 * ECW v7.3 - Proof Service
 * White-Hat Cryptographic Proof System:
 * - JWS signing (JOSE - ES256 algorithm)
 * - Merkle tree construction
 * - RFC3161 timestamping (TSA)
 * - Proof verification
 * - ARP integration (Audit Record Pointer)
 */
@Injectable()
export class ProofService {
  private readonly logger = new Logger(ProofService.name);
  private privateKey: crypto.KeyObject | null = null;
  private publicKey: crypto.KeyObject | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.initializeKeys();
  }

  /**
   * Initialize ES256 key pair for JWS signing
   * White-Hat:
   * - Uses environment variable for private key (production)
   * - Generates ephemeral key pair for development/testing
   * - ES256 (ECDSA P-256) for optimal security + performance
   */
  private async initializeKeys(): Promise<void> {
    try {
      // Try to load keys from environment
      const privateKeyPem = this.configService.get<string>('JWS_PRIVATE_KEY');
      const publicKeyPem = this.configService.get<string>('JWS_PUBLIC_KEY');

      if (privateKeyPem && publicKeyPem) {
        this.privateKey = crypto.createPrivateKey(privateKeyPem);
        this.publicKey = crypto.createPublicKey(publicKeyPem);
        this.logger.log('✓ JWS keys loaded from environment');
      } else {
        // Development: Generate ephemeral key pair
        const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
          namedCurve: 'P-256',
        });
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.logger.warn(
          '⚠ JWS ephemeral keys generated (not for production!)',
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize JWS keys', error);
      throw error;
    }
  }

  /**
   * Generate Proof-of-Impact (JWS + Merkle + RFC3161)
   * White-Hat:
   * - Signs transaction data with ES256
   * - Builds Merkle tree (for batch verification)
   * - Requests RFC3161 timestamp (TSA)
   * - Stores in ProofOfImpact table
   * - Returns JWS token
   */
  async generateProof(transaction: {
    id: string;
    walletId: string;
    type: string;
    metric: string;
    amount: number;
    ethicsScore: number;
    impactScore: number;
  }): Promise<string> {
    this.logger.log(`Generating proof for transaction: ${transaction.id}`);

    // Step 1: Build payload
    const payload = {
      txId: transaction.id,
      walletId: transaction.walletId,
      type: transaction.type,
      metric: transaction.metric,
      amount: transaction.amount,
      ethicsScore: transaction.ethicsScore,
      impactScore: transaction.impactScore,
      timestamp: new Date().toISOString(),
    };

    // Step 2: Sign with JWS (ES256)
    const jws = await this.signJws(payload);

    // Step 3: Build Merkle tree (simplified - single leaf for now)
    const merkleRoot = this.buildMerkleRoot([jws]);

    // Step 4: Request RFC3161 timestamp (optional, async)
    let tsr: Buffer | null = null;
    try {
      tsr = await this.requestTimestamp(jws);
    } catch (error) {
      this.logger.warn('RFC3161 timestamp failed (non-blocking)', error);
      // Non-blocking: Continue without timestamp
    }

    // Step 5: Store ProofOfImpact record
    await this.prisma.proofOfImpact.create({
      data: {
        txId: transaction.id,
        jws,
        merkleRoot,
        tsr,
        verified: false, // Will be verified on first verification request
        arpId: null, // TODO: Generate ARP evidence pack
      },
    });

    this.logger.log(`✓ Proof generated: txId=${transaction.id}`);

    return jws;
  }

  /**
   * Verify Proof-of-Impact
   * White-Hat:
   * - Verifies JWS signature
   * - Verifies Merkle root
   * - Verifies RFC3161 timestamp (if present)
   * - Returns verification result
   */
  async verifyProof(txId: string): Promise<ProofResponseDto> {
    this.logger.log(`Verifying proof: txId=${txId}`);

    // Step 1: Fetch proof from database
    const proof = await this.prisma.proofOfImpact.findUnique({
      where: { txId },
    });

    if (!proof) {
      throw new NotFoundException(`Proof not found for transaction: ${txId}`);
    }

    // Step 2: Verify JWS signature
    let verified = false;
    let payload: any = {};

    try {
      const { payload: decodedPayload } = await jwtVerify(
        proof.jws,
        this.publicKey!,
        {
          algorithms: ['ES256'],
        },
      );
      payload = decodedPayload;
      verified = true;
    } catch (error) {
      this.logger.error('JWS verification failed', error);
      verified = false;
    }

    // Step 3: Verify Merkle root (simplified - single leaf)
    const expectedMerkleRoot = this.buildMerkleRoot([proof.jws]);
    if (proof.merkleRoot !== expectedMerkleRoot) {
      this.logger.warn('Merkle root mismatch');
      verified = false;
    }

    // Step 4: Verify RFC3161 timestamp (if present)
    let rfc3161Verified = false;
    if (proof.tsr) {
      rfc3161Verified = await this.verifyTimestamp(proof.jws, proof.tsr);
    }

    // Step 5: Update verified status
    if (verified && !proof.verified) {
      await this.prisma.proofOfImpact.update({
        where: { txId },
        data: { verified: true },
      });
    }

    return {
      txId: proof.txId,
      verified,
      jws: proof.jws,
      merkleRoot: proof.merkleRoot,
      timestamp: proof.createdAt.toISOString(),
      payload,
      rfc3161Verified,
      arpId: proof.arpId || undefined, // Convert null to undefined
    };
  }

  /**
   * PRIVATE: Sign payload with JWS (ES256)
   * White-Hat:
   * - Uses ES256 (ECDSA P-256)
   * - Includes issuer, issued time, expiry (1 year)
   */
  private async signJws(payload: any): Promise<string> {
    if (!this.privateKey) {
      throw new Error('JWS private key not initialized');
    }

    const jws = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt()
      .setIssuer('ecw-api')
      .setExpirationTime('1y') // Proof valid for 1 year
      .sign(this.privateKey);

    return jws;
  }

  /**
   * PRIVATE: Build Merkle root from JWS array
   * White-Hat:
   * - SHA-256 hashing
   * - Simplified: Single leaf for now (TODO: Batch support)
   */
  private buildMerkleRoot(jwsArray: string[]): string {
    // Simplified Merkle tree (single leaf)
    // TODO: Implement full Merkle tree for batch verification
    const hash = crypto.createHash('sha256');
    jwsArray.forEach((jws) => hash.update(jws));
    return hash.digest('hex');
  }

  /**
   * PRIVATE: Request RFC3161 timestamp from TSA
   * White-Hat:
   * - Uses free TSA (freetsa.org) for testing
   * - Production: Use paid TSA (DigiCert, etc)
   * - Returns TSR (Timestamp Response)
   */
  private async requestTimestamp(data: string): Promise<Buffer | null> {
    // TODO: Implement RFC3161 client
    // For now: Return null (non-blocking)
    this.logger.debug('RFC3161 timestamp skipped (not implemented yet)');
    return null;
  }

  /**
   * PRIVATE: Verify RFC3161 timestamp
   * White-Hat:
   * - Verifies TSR signature
   * - Verifies timestamp authority
   */
  private async verifyTimestamp(
    data: string,
    tsr: Buffer,
  ): Promise<boolean> {
    // TODO: Implement RFC3161 verification
    // For now: Return false (not implemented)
    this.logger.debug('RFC3161 verification skipped (not implemented yet)');
    return false;
  }

  /**
   * Get proof by transaction ID
   */
  async getProofByTxId(txId: string): Promise<ProofResponseDto> {
    const proof = await this.prisma.proofOfImpact.findUnique({
      where: { txId },
    });

    if (!proof) {
      throw new NotFoundException(`Proof not found for transaction: ${txId}`);
    }

    // Decode JWS to get payload
    let payload: any = {};
    try {
      const { payload: decodedPayload } = await jwtVerify(
        proof.jws,
        this.publicKey!,
        {
          algorithms: ['ES256'],
        },
      );
      payload = decodedPayload;
    } catch (error) {
      this.logger.warn('Failed to decode JWS payload', error);
    }

    return {
      txId: proof.txId,
      verified: proof.verified,
      jws: proof.jws,
      merkleRoot: proof.merkleRoot,
      timestamp: proof.createdAt.toISOString(),
      payload,
      rfc3161Verified: proof.tsr ? true : false,
      arpId: proof.arpId || undefined, // Convert null to undefined
    };
  }

  /**
   * Health check: Get proof statistics
   */
  async getProofStats(): Promise<{
    totalProofs: number;
    verifiedProofs: number;
    proofsWithTimestamp: number;
  }> {
    const [total, verified, withTimestamp] = await Promise.all([
      this.prisma.proofOfImpact.count(),
      this.prisma.proofOfImpact.count({ where: { verified: true } }),
      this.prisma.proofOfImpact.count({ where: { tsr: { not: null } } }),
    ]);

    return {
      totalProofs: total,
      verifiedProofs: verified,
      proofsWithTimestamp: withTimestamp,
    };
  }
}
