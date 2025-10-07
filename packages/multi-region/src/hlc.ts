/**
 * Hybrid Logical Clock (HLC)
 *
 * Provides causally consistent timestamps for distributed systems
 * Combines physical time with logical counters to maintain ordering
 */

export interface HLCTimestamp {
  physical: number; // Wall-clock time (ms since epoch)
  logical: number;  // Logical counter for same physical time
  nodeId: string;   // Unique node identifier
}

export class HybridLogicalClock {
  private physical: number = 0;
  private logical: number = 0;
  private readonly nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  /**
   * Generate new timestamp for local event
   */
  now(): HLCTimestamp {
    const wallTime = Date.now();

    if (wallTime > this.physical) {
      this.physical = wallTime;
      this.logical = 0;
    } else {
      this.logical += 1;
    }

    return {
      physical: this.physical,
      logical: this.logical,
      nodeId: this.nodeId,
    };
  }

  /**
   * Update clock based on received timestamp (for message receipt)
   */
  update(remoteTimestamp: HLCTimestamp): HLCTimestamp {
    const wallTime = Date.now();

    const maxPhysical = Math.max(wallTime, this.physical, remoteTimestamp.physical);

    if (maxPhysical === wallTime && maxPhysical > this.physical) {
      this.physical = maxPhysical;
      this.logical = 0;
    } else if (maxPhysical === this.physical && maxPhysical === remoteTimestamp.physical) {
      this.logical = Math.max(this.logical, remoteTimestamp.logical) + 1;
    } else if (maxPhysical === remoteTimestamp.physical) {
      this.physical = remoteTimestamp.physical;
      this.logical = remoteTimestamp.logical + 1;
    } else if (maxPhysical === this.physical) {
      this.logical += 1;
    }

    return {
      physical: this.physical,
      logical: this.logical,
      nodeId: this.nodeId,
    };
  }

  /**
   * Compare two timestamps
   * Returns: -1 (a < b), 0 (concurrent), 1 (a > b)
   */
  static compare(a: HLCTimestamp, b: HLCTimestamp): number {
    if (a.physical !== b.physical) {
      return a.physical < b.physical ? -1 : 1;
    }

    if (a.logical !== b.logical) {
      return a.logical < b.logical ? -1 : 1;
    }

    // Same physical and logical time = concurrent
    // Use nodeId as tiebreaker for deterministic ordering
    return a.nodeId.localeCompare(b.nodeId);
  }

  /**
   * Check if timestamp 'a' happened-before 'b'
   */
  static happenedBefore(a: HLCTimestamp, b: HLCTimestamp): boolean {
    return this.compare(a, b) < 0;
  }

  /**
   * Check if timestamps are concurrent (no causal relationship)
   */
  static isConcurrent(a: HLCTimestamp, b: HLCTimestamp): boolean {
    // If physical times differ, they're not concurrent
    if (a.physical !== b.physical) return false;
    // If logical times differ, they're not concurrent
    if (a.logical !== b.logical) return false;
    // Same physical+logical but different nodes = concurrent
    return a.nodeId !== b.nodeId;
  }

  /**
   * Serialize timestamp to string
   */
  static toString(ts: HLCTimestamp): string {
    return `${ts.physical}-${ts.logical}-${ts.nodeId}`;
  }

  /**
   * Parse timestamp from string
   */
  static fromString(str: string): HLCTimestamp {
    const [physical, logical, nodeId] = str.split('-');
    return {
      physical: parseInt(physical, 10),
      logical: parseInt(logical, 10),
      nodeId,
    };
  }
}
