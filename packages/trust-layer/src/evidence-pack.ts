/**
 * EVIDENCE PACK GENERATOR
 *
 * Purpose: Generate verifiable audit trails for compliance and auditing
 * Features: Merkle proofs, attestation logs, signed operations, explanations
 * Format: JSON or ZIP with all evidence
 */

import crypto from 'crypto';
import {
  EvidencePack,
  Explanation,
  SignedOperation,
  MerkleProof,
  MerkleNode,
  AttestationLogEntry,
} from './types';

/**
 * Merkle Tree Builder
 */
export class MerkleTreeBuilder {
  /**
   * Build a Merkle tree from data items
   */
  buildTree(data: string[]): MerkleNode {
    if (data.length === 0) {
      throw new Error('Cannot build Merkle tree from empty data');
    }

    // Create leaf nodes
    let nodes: MerkleNode[] = data.map((item) => ({
      hash: this.hashData(item),
      data: item,
    }));

    // Build tree bottom-up
    while (nodes.length > 1) {
      const parentNodes: MerkleNode[] = [];

      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];
        const right = i + 1 < nodes.length ? nodes[i + 1] : left; // Duplicate last if odd

        const parent: MerkleNode = {
          hash: this.hashData(left.hash + right.hash),
          left,
          right: right !== left ? right : undefined,
        };

        parentNodes.push(parent);
      }

      nodes = parentNodes;
    }

    return nodes[0]; // Root
  }

  /**
   * Generate Merkle proof for a data item
   */
  generateProof(data: string[], leafIndex: number): MerkleProof {
    if (leafIndex < 0 || leafIndex >= data.length) {
      throw new Error('Leaf index out of bounds');
    }

    const tree = this.buildTree(data);
    const leaf_hash = this.hashData(data[leafIndex]);
    const proof_path: Array<{ hash: string; position: 'left' | 'right' }> = [];

    // Traverse tree to collect proof path
    this.collectProofPath(tree, leaf_hash, proof_path);

    return {
      leaf_hash,
      root_hash: tree.hash,
      proof_path,
      leaf_index: leafIndex,
    };
  }

  /**
   * Verify a Merkle proof
   */
  verifyProof(proof: MerkleProof, leafData: string): boolean {
    let currentHash = this.hashData(leafData);

    // Recompute root hash using proof path
    for (const step of proof.proof_path) {
      if (step.position === 'left') {
        currentHash = this.hashData(step.hash + currentHash);
      } else {
        currentHash = this.hashData(currentHash + step.hash);
      }
    }

    return currentHash === proof.root_hash;
  }

  /**
   * Collect proof path recursively
   */
  private collectProofPath(
    node: MerkleNode,
    targetHash: string,
    path: Array<{ hash: string; position: 'left' | 'right' }>
  ): boolean {
    if (node.hash === targetHash) {
      return true;
    }

    if (!node.left && !node.right) {
      return false; // Leaf node, not found
    }

    // Check left subtree
    if (node.left && this.collectProofPath(node.left, targetHash, path)) {
      if (node.right) {
        path.push({ hash: node.right.hash, position: 'right' });
      }
      return true;
    }

    // Check right subtree
    if (node.right && this.collectProofPath(node.right, targetHash, path)) {
      if (node.left) {
        path.push({ hash: node.left.hash, position: 'left' });
      }
      return true;
    }

    return false;
  }

  /**
   * Hash data using SHA-256
   */
  private hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * Evidence Pack Generator
 */
export class EvidencePackGenerator {
  private merkleBuilder: MerkleTreeBuilder;

  constructor() {
    this.merkleBuilder = new MerkleTreeBuilder();
  }

  /**
   * Generate evidence pack for a decision
   */
  async generatePack(params: {
    decision_id: string;
    explanation?: Explanation;
    signed_operation?: SignedOperation;
    attestation_logs?: AttestationLogEntry[];
    format?: 'json' | 'zip';
  }): Promise<EvidencePack> {
    const pack_id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    const format = params.format || 'json';

    // Build Merkle proof if attestation logs provided
    let merkle_proof: MerkleProof | undefined;
    if (params.attestation_logs && params.attestation_logs.length > 0) {
      const logData = params.attestation_logs.map((log) => JSON.stringify(log));
      const targetIndex = logData.findIndex((log) =>
        log.includes(params.decision_id)
      );

      if (targetIndex >= 0) {
        merkle_proof = this.merkleBuilder.generateProof(logData, targetIndex);
      }
    }

    // Calculate integrity hash
    const packContent = JSON.stringify({
      pack_id,
      decision_id: params.decision_id,
      created_at,
      explanation: params.explanation,
      signed_operation: params.signed_operation,
      merkle_proof,
      attestation_logs: params.attestation_logs,
    });

    const integrity_hash = crypto.createHash('sha256').update(packContent).digest('hex');

    return {
      pack_id,
      decision_id: params.decision_id,
      created_at,
      includes: {
        explanation: params.explanation,
        signed_operation: params.signed_operation,
        merkle_proof,
        attestation_logs: params.attestation_logs,
      },
      integrity_hash,
      format,
    };
  }

  /**
   * Verify integrity of evidence pack
   */
  async verifyIntegrity(pack: EvidencePack): Promise<boolean> {
    // Reconstruct pack content
    const packContent = JSON.stringify({
      pack_id: pack.pack_id,
      decision_id: pack.decision_id,
      created_at: pack.created_at,
      explanation: pack.includes.explanation,
      signed_operation: pack.includes.signed_operation,
      merkle_proof: pack.includes.merkle_proof,
      attestation_logs: pack.includes.attestation_logs,
    });

    const computed_hash = crypto.createHash('sha256').update(packContent).digest('hex');

    return computed_hash === pack.integrity_hash;
  }

  /**
   * Export evidence pack as JSON
   */
  async exportJSON(pack: EvidencePack): Promise<string> {
    return JSON.stringify(pack, null, 2);
  }

  /**
   * Export evidence pack as ZIP (production: use archiver library)
   */
  async exportZIP(pack: EvidencePack): Promise<Buffer> {
    // Mock implementation - production would use 'archiver' npm package
    // to create a proper ZIP with:
    // - evidence-pack.json (main pack)
    // - explanation.json (if included)
    // - signed-operation.json (if included)
    // - merkle-proof.json (if included)
    // - attestation-logs.json (if included)
    // - README.txt (human-readable summary)

    const zipContent = JSON.stringify({
      note: 'This is a mock ZIP. Production would use archiver npm package.',
      pack,
    });

    return Buffer.from(zipContent, 'utf8');
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(pack: EvidencePack): string {
    const lines: string[] = [];

    lines.push('=== EVIDENCE PACK SUMMARY ===');
    lines.push(`Pack ID: ${pack.pack_id}`);
    lines.push(`Decision ID: ${pack.decision_id}`);
    lines.push(`Created: ${pack.created_at}`);
    lines.push(`Integrity Hash: ${pack.integrity_hash}`);
    lines.push('');

    if (pack.includes.explanation) {
      lines.push('--- EXPLANATION ---');
      lines.push(`Model: ${pack.includes.explanation.model_name} v${pack.includes.explanation.model_version}`);
      lines.push(`Prediction: ${pack.includes.explanation.prediction}`);
      lines.push(`Confidence: ${(pack.includes.explanation.confidence * 100).toFixed(1)}%`);
      lines.push(`Summary: ${pack.includes.explanation.natural_language_summary}`);
      lines.push('');
    }

    if (pack.includes.signed_operation) {
      lines.push('--- SIGNED OPERATION ---');
      lines.push(`Operation ID: ${pack.includes.signed_operation.operation_id}`);
      lines.push(`Type: ${pack.includes.signed_operation.operation_type}`);
      lines.push(`Actor: ${pack.includes.signed_operation.actor}`);
      lines.push(`Timestamp: ${pack.includes.signed_operation.timestamp}`);
      lines.push(`Signature: ${pack.includes.signed_operation.signature.substring(0, 32)}...`);
      lines.push('');
    }

    if (pack.includes.merkle_proof) {
      lines.push('--- MERKLE PROOF ---');
      lines.push(`Root Hash: ${pack.includes.merkle_proof.root_hash}`);
      lines.push(`Leaf Hash: ${pack.includes.merkle_proof.leaf_hash}`);
      lines.push(`Proof Path Length: ${pack.includes.merkle_proof.proof_path.length}`);
      lines.push('');
    }

    if (pack.includes.attestation_logs) {
      lines.push('--- ATTESTATION LOGS ---');
      lines.push(`Total Logs: ${pack.includes.attestation_logs.length}`);
      lines.push('');
    }

    return lines.join('\n');
  }
}

/**
 * Attestation log manager
 * Production: Use append-only database or blockchain
 */
export class AttestationLogManager {
  private logs: AttestationLogEntry[] = [];

  /**
   * Append log entry (immutable)
   */
  async append(entry: AttestationLogEntry): Promise<void> {
    this.logs.push(entry);
  }

  /**
   * Get all logs
   */
  async getAll(): Promise<AttestationLogEntry[]> {
    return [...this.logs]; // Return copy
  }

  /**
   * Get logs for specific actor
   */
  async getByActor(actor: string): Promise<AttestationLogEntry[]> {
    return this.logs.filter((log) => log.actor === actor);
  }

  /**
   * Get logs containing action hash
   */
  async getByActionHash(action_hash: string): Promise<AttestationLogEntry[]> {
    return this.logs.filter((log) => log.action_hash === action_hash);
  }

  /**
   * Generate Merkle proof for log entry
   */
  async generateProofForLog(action_hash: string): Promise<MerkleProof | null> {
    const index = this.logs.findIndex((log) => log.action_hash === action_hash);
    if (index === -1) {
      return null;
    }

    const builder = new MerkleTreeBuilder();
    const logData = this.logs.map((log) => JSON.stringify(log));

    return builder.generateProof(logData, index);
  }
}
