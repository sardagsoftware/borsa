/**
 * Last-Write-Wins Map (LWW-Map) CRDT
 *
 * Conflict-free replicated data type for eventually consistent key-value storage
 * Uses HLC timestamps to resolve conflicts deterministically
 */

import { HybridLogicalClock, HLCTimestamp } from './hlc';

export interface LWWMapEntry<V> {
  value: V;
  timestamp: HLCTimestamp;
  deleted?: boolean;
}

export interface LWWMapOperation<V> {
  type: 'set' | 'delete';
  key: string;
  value?: V;
  timestamp: HLCTimestamp;
}

export class LWWMap<V = any> {
  private data: Map<string, LWWMapEntry<V>> = new Map();
  private clock: HybridLogicalClock;

  constructor(nodeId: string) {
    this.clock = new HybridLogicalClock(nodeId);
  }

  /**
   * Set a key-value pair
   */
  set(key: string, value: V): HLCTimestamp {
    const timestamp = this.clock.now();

    this.data.set(key, {
      value,
      timestamp,
      deleted: false,
    });

    return timestamp;
  }

  /**
   * Get value for key (returns undefined if deleted or not exists)
   */
  get(key: string): V | undefined {
    const entry = this.data.get(key);
    if (!entry || entry.deleted) return undefined;
    return entry.value;
  }

  /**
   * Delete a key (tombstone approach)
   */
  delete(key: string): HLCTimestamp {
    const timestamp = this.clock.now();

    const existing = this.data.get(key);
    if (existing) {
      this.data.set(key, {
        value: existing.value,
        timestamp,
        deleted: true,
      });
    } else {
      // Create tombstone even if key doesn't exist
      this.data.set(key, {
        value: undefined as any,
        timestamp,
        deleted: true,
      });
    }

    return timestamp;
  }

  /**
   * Check if key exists (and not deleted)
   */
  has(key: string): boolean {
    const entry = this.data.get(key);
    return !!entry && !entry.deleted;
  }

  /**
   * Get all active keys
   */
  keys(): string[] {
    const result: string[] = [];
    for (const [key, entry] of this.data) {
      if (!entry.deleted) {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * Get all active entries
   */
  entries(): [string, V][] {
    const result: [string, V][] = [];
    for (const [key, entry] of this.data) {
      if (!entry.deleted) {
        result.push([key, entry.value]);
      }
    }
    return result;
  }

  /**
   * Merge with remote LWW-Map state
   */
  merge(remoteOps: LWWMapOperation<V>[]): void {
    for (const op of remoteOps) {
      this.applyRemoteOperation(op);
    }
  }

  /**
   * Apply a remote operation
   */
  private applyRemoteOperation(op: LWWMapOperation<V>): void {
    // Update local clock with remote timestamp
    this.clock.update(op.timestamp);

    const existing = this.data.get(op.key);

    // No existing entry - accept remote operation
    if (!existing) {
      this.data.set(op.key, {
        value: op.value!,
        timestamp: op.timestamp,
        deleted: op.type === 'delete',
      });
      return;
    }

    // Compare timestamps to resolve conflict
    const comparison = HybridLogicalClock.compare(op.timestamp, existing.timestamp);

    // Remote operation is newer - accept it
    if (comparison > 0) {
      this.data.set(op.key, {
        value: op.value!,
        timestamp: op.timestamp,
        deleted: op.type === 'delete',
      });
    }
    // Remote operation is older - keep local state
    else if (comparison < 0) {
      // Do nothing, local state wins
    }
    // Concurrent operations (same timestamp) - should not happen with HLC
    else {
      // Tiebreaker already handled by nodeId in HLC.compare
      // Keep local if comparison is 0 (local nodeId > remote nodeId lexicographically)
    }
  }

  /**
   * Get all operations for synchronization
   */
  getOperations(): LWWMapOperation<V>[] {
    const ops: LWWMapOperation<V>[] = [];

    for (const [key, entry] of this.data) {
      ops.push({
        type: entry.deleted ? 'delete' : 'set',
        key,
        value: entry.value,
        timestamp: entry.timestamp,
      });
    }

    return ops;
  }

  /**
   * Get operations since a given timestamp (for delta sync)
   */
  getOperationsSince(sinceTimestamp: HLCTimestamp): LWWMapOperation<V>[] {
    const ops: LWWMapOperation<V>[] = [];

    for (const [key, entry] of this.data) {
      if (HybridLogicalClock.compare(entry.timestamp, sinceTimestamp) > 0) {
        ops.push({
          type: entry.deleted ? 'delete' : 'set',
          key,
          value: entry.value,
          timestamp: entry.timestamp,
        });
      }
    }

    return ops;
  }

  /**
   * Get size (number of active keys)
   */
  size(): number {
    let count = 0;
    for (const entry of this.data.values()) {
      if (!entry.deleted) count++;
    }
    return count;
  }

  /**
   * Clear all entries (creates tombstones)
   */
  clear(): void {
    const timestamp = this.clock.now();
    for (const [key, entry] of this.data) {
      this.data.set(key, {
        value: entry.value,
        timestamp,
        deleted: true,
      });
    }
  }

  /**
   * Garbage collect old tombstones (optional, for space reclamation)
   */
  garbageCollect(olderThan: number): number {
    let removed = 0;
    const cutoff = Date.now() - olderThan;

    for (const [key, entry] of this.data) {
      if (entry.deleted && entry.timestamp.physical < cutoff) {
        this.data.delete(key);
        removed++;
      }
    }

    return removed;
  }
}
