/**
 * Quorum I/O for Multi-Region Consistency
 *
 * Implements quorum reads/writes across multiple regions
 * Provides tunable consistency guarantees (R + W > N)
 */

import { HLCTimestamp, HybridLogicalClock } from './hlc';

export interface QuorumConfig {
  totalReplicas: number; // N
  readQuorum: number;    // R
  writeQuorum: number;   // W
}

export interface ReplicaNode {
  nodeId: string;
  region: string;
  endpoint: string;
  healthy: boolean;
}

export interface QuorumWriteRequest {
  key: string;
  value: any;
  timestamp: HLCTimestamp;
}

export interface QuorumWriteResponse {
  success: boolean;
  acks: number;
  timestamp: HLCTimestamp;
}

export interface QuorumReadRequest {
  key: string;
}

export interface QuorumReadResponse {
  value: any;
  timestamp: HLCTimestamp;
  consensus: boolean;
}

export class QuorumIO {
  private config: QuorumConfig;
  private replicas: Map<string, ReplicaNode> = new Map();

  constructor(config: QuorumConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  /**
   * Validate quorum configuration
   */
  private validateConfig(config: QuorumConfig): void {
    if (config.readQuorum + config.writeQuorum <= config.totalReplicas) {
      throw new Error(
        'Invalid quorum config: R + W must be > N for strong consistency'
      );
    }

    if (config.readQuorum > config.totalReplicas) {
      throw new Error('Read quorum cannot exceed total replicas');
    }

    if (config.writeQuorum > config.totalReplicas) {
      throw new Error('Write quorum cannot exceed total replicas');
    }
  }

  /**
   * Register a replica node
   */
  addReplica(node: ReplicaNode): void {
    this.replicas.set(node.nodeId, node);
  }

  /**
   * Remove a replica node
   */
  removeReplica(nodeId: string): void {
    this.replicas.delete(nodeId);
  }

  /**
   * Get healthy replicas
   */
  private getHealthyReplicas(): ReplicaNode[] {
    return Array.from(this.replicas.values()).filter((r) => r.healthy);
  }

  /**
   * Quorum write operation
   */
  async write(request: QuorumWriteRequest): Promise<QuorumWriteResponse> {
    const healthyReplicas = this.getHealthyReplicas();

    if (healthyReplicas.length < this.config.writeQuorum) {
      throw new Error(
        `Insufficient healthy replicas: need ${this.config.writeQuorum}, have ${healthyReplicas.length}`
      );
    }

    // Send write to all healthy replicas
    const writePromises = healthyReplicas.map((replica) =>
      this.writeToReplica(replica, request)
    );

    // Wait for write quorum
    const results = await Promise.allSettled(writePromises);
    const successCount = results.filter((r) => r.status === 'fulfilled').length;

    if (successCount < this.config.writeQuorum) {
      throw new Error(
        `Write failed: got ${successCount} acks, need ${this.config.writeQuorum}`
      );
    }

    return {
      success: true,
      acks: successCount,
      timestamp: request.timestamp,
    };
  }

  /**
   * Write to a single replica (simulated, in production use HTTP/gRPC)
   */
  private async writeToReplica(
    replica: ReplicaNode,
    request: QuorumWriteRequest
  ): Promise<void> {
    // In production, this would be an HTTP/gRPC call to the replica
    // For now, simulate write latency
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

    // Simulate 5% failure rate
    if (Math.random() < 0.05) {
      throw new Error(`Write to ${replica.nodeId} failed`);
    }
  }

  /**
   * Quorum read operation
   */
  async read(request: QuorumReadRequest): Promise<QuorumReadResponse> {
    const healthyReplicas = this.getHealthyReplicas();

    if (healthyReplicas.length < this.config.readQuorum) {
      throw new Error(
        `Insufficient healthy replicas: need ${this.config.readQuorum}, have ${healthyReplicas.length}`
      );
    }

    // Read from read quorum replicas
    const replicasToRead = healthyReplicas.slice(0, this.config.readQuorum);
    const readPromises = replicasToRead.map((replica) =>
      this.readFromReplica(replica, request)
    );

    const results = await Promise.allSettled(readPromises);
    const successfulReads = results
      .filter((r) => r.status === 'fulfilled')
      .map((r: any) => r.value);

    if (successfulReads.length < this.config.readQuorum) {
      throw new Error(
        `Read failed: got ${successfulReads.length} responses, need ${this.config.readQuorum}`
      );
    }

    // Find most recent value using HLC timestamps
    let mostRecent = successfulReads[0];
    for (const read of successfulReads) {
      if (HybridLogicalClock.compare(read.timestamp, mostRecent.timestamp) > 0) {
        mostRecent = read;
      }
    }

    // Check if all reads agree (consensus)
    const allAgree = successfulReads.every(
      (r) => HybridLogicalClock.compare(r.timestamp, mostRecent.timestamp) === 0
    );

    return {
      value: mostRecent.value,
      timestamp: mostRecent.timestamp,
      consensus: allAgree,
    };
  }

  /**
   * Read from a single replica (simulated)
   */
  private async readFromReplica(
    replica: ReplicaNode,
    request: QuorumReadRequest
  ): Promise<{ value: any; timestamp: HLCTimestamp }> {
    // In production, this would be an HTTP/gRPC call
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

    // Simulate 5% failure rate
    if (Math.random() < 0.05) {
      throw new Error(`Read from ${replica.nodeId} failed`);
    }

    // Simulated response (in production, actual data from replica)
    return {
      value: `value-from-${replica.nodeId}`,
      timestamp: {
        physical: Date.now(),
        logical: 0,
        nodeId: replica.nodeId,
      },
    };
  }

  /**
   * Check cluster health
   */
  getClusterHealth(): {
    totalReplicas: number;
    healthyReplicas: number;
    canWrite: boolean;
    canRead: boolean;
  } {
    const healthy = this.getHealthyReplicas().length;

    return {
      totalReplicas: this.replicas.size,
      healthyReplicas: healthy,
      canWrite: healthy >= this.config.writeQuorum,
      canRead: healthy >= this.config.readQuorum,
    };
  }

  /**
   * Update replica health status
   */
  setReplicaHealth(nodeId: string, healthy: boolean): void {
    const replica = this.replicas.get(nodeId);
    if (replica) {
      replica.healthy = healthy;
    }
  }
}
