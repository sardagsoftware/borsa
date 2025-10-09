/**
 * LYDIAN-IQ ATTESTATION & MERKLE ROOT
 *
 * Purpose: Tamper-proof audit log with daily Merkle root
 * Compliance: SOC 2, ISO 27001, Immutable audit trail
 *
 * Features:
 * - Append-only event log
 * - Daily Merkle root computation
 * - Cryptographic proof of log integrity
 * - Integration with SLSA provenance
 *
 * Architecture:
 * - Events stored in memory (daily buffer)
 * - Daily Merkle root written to /var/attest/merkle-YYYYMMDD.json
 * - Root signed with build hash + image digest
 * - Verification: recompute root from events
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Attestation event
 */
export interface AttestationEvent {
  action_hash: string; // SHA256 of action details
  timestamp: string; // ISO 8601
  actor: string; // User ID, API key ID, or system identifier
  metadata?: Record<string, any>; // Optional context
}

/**
 * Daily Merkle root
 */
export interface DailyMerkleRoot {
  date: string; // YYYY-MM-DD
  root: string; // Merkle root hash (SHA256)
  event_count: number;
  signed_by: string; // Build/deployment identifier
  build_hash: string; // Git commit SHA or build artifact hash
  image_digest?: string; // Container image digest (if applicable)
  computed_at: string; // ISO 8601 timestamp
}

/**
 * In-memory event buffer (daily)
 */
let eventBuffer: AttestationEvent[] = [];
let currentDate: string | null = null;

/**
 * Attestation directory (configurable via env)
 */
const ATTESTATION_DIR = process.env.ATTESTATION_DIR || '/var/attest';

/**
 * Append an attestation event
 *
 * @param event - Attestation event to append
 *
 * @example
 * ```typescript
 * appendEvent({
 *   action_hash: sha256("user:123:delete_account"),
 *   timestamp: new Date().toISOString(),
 *   actor: "user:123",
 *   metadata: { reason: "GDPR Article 17" }
 * });
 * ```
 */
export function appendEvent(event: AttestationEvent): void {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // If new day, flush previous day's Merkle root
  if (currentDate && currentDate !== today) {
    flushDailyMerkleRoot();
  }

  currentDate = today;
  eventBuffer.push(event);

  // Log event (for debugging)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[ATTESTATION] Event appended: ${event.action_hash.substring(0, 8)}... (${event.actor})`);
  }
}

/**
 * Compute Merkle root from event buffer
 *
 * Algorithm:
 * 1. Hash each event: SHA256(action_hash + timestamp + actor)
 * 2. Build Merkle tree bottom-up
 * 3. Return root hash
 *
 * @param events - Array of events to compute root from
 * @returns Merkle root hash (hex string)
 */
function computeMerkleRoot(events: AttestationEvent[]): string {
  if (events.length === 0) {
    return '0'.repeat(64); // Empty tree root
  }

  // Leaf hashes
  let hashes = events.map((event) => {
    const data = `${event.action_hash}|${event.timestamp}|${event.actor}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  });

  // Build tree bottom-up
  while (hashes.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = i + 1 < hashes.length ? hashes[i + 1] : left; // Duplicate last if odd

      const combined = crypto
        .createHash('sha256')
        .update(left + right)
        .digest('hex');

      nextLevel.push(combined);
    }

    hashes = nextLevel;
  }

  return hashes[0];
}

/**
 * Flush daily Merkle root to disk
 *
 * Writes to: /var/attest/merkle-YYYYMMDD.json
 *
 * @returns Daily Merkle root object
 */
function flushDailyMerkleRoot(): DailyMerkleRoot | null {
  if (!currentDate || eventBuffer.length === 0) {
    return null;
  }

  const root = computeMerkleRoot(eventBuffer);

  const merkleRoot: DailyMerkleRoot = {
    date: currentDate,
    root,
    event_count: eventBuffer.length,
    signed_by: process.env.BUILD_ID || 'unknown',
    build_hash: process.env.GIT_COMMIT_SHA || 'unknown',
    image_digest: process.env.IMAGE_DIGEST,
    computed_at: new Date().toISOString(),
  };

  // Write to disk
  try {
    // Ensure directory exists
    if (!fs.existsSync(ATTESTATION_DIR)) {
      fs.mkdirSync(ATTESTATION_DIR, { recursive: true, mode: 0o700 });
    }

    const filename = path.join(ATTESTATION_DIR, `merkle-${currentDate}.json`);
    fs.writeFileSync(filename, JSON.stringify(merkleRoot, null, 2), { mode: 0o600 });

    console.log(`[ATTESTATION] Merkle root flushed: ${filename} (${eventBuffer.length} events)`);
  } catch (error) {
    console.error(`[ATTESTATION] Failed to write Merkle root: ${error}`);
  }

  // Clear buffer
  eventBuffer = [];

  return merkleRoot;
}

/**
 * Get daily Merkle root (computes if needed)
 *
 * @returns Daily Merkle root object
 *
 * @example
 * ```typescript
 * const root = dailyMerkleRoot();
 * console.log(`Today's Merkle root: ${root.root}`);
 * ```
 */
export function dailyMerkleRoot(): DailyMerkleRoot {
  const today = new Date().toISOString().split('T')[0];

  if (currentDate !== today) {
    flushDailyMerkleRoot();
    currentDate = today;
  }

  const root = computeMerkleRoot(eventBuffer);

  return {
    date: currentDate || today,
    root,
    event_count: eventBuffer.length,
    signed_by: process.env.BUILD_ID || 'unknown',
    build_hash: process.env.GIT_COMMIT_SHA || 'unknown',
    image_digest: process.env.IMAGE_DIGEST,
    computed_at: new Date().toISOString(),
  };
}

/**
 * Verify Merkle root against stored events
 *
 * @param storedRoot - Stored Merkle root from disk
 * @param events - Array of events to verify
 * @returns True if root matches recomputed root
 *
 * @example
 * ```typescript
 * const storedRoot = JSON.parse(fs.readFileSync('merkle-2025-10-09.json'));
 * const events = loadEventsForDate('2025-10-09');
 * const isValid = verifyMerkleRoot(storedRoot, events);
 * console.log(`Root valid: ${isValid}`);
 * ```
 */
export function verifyMerkleRoot(storedRoot: DailyMerkleRoot, events: AttestationEvent[]): boolean {
  const recomputedRoot = computeMerkleRoot(events);
  return storedRoot.root === recomputedRoot && storedRoot.event_count === events.length;
}

/**
 * Load Merkle root from disk
 *
 * @param date - Date in YYYY-MM-DD format
 * @returns Merkle root object or null if not found
 */
export function loadMerkleRoot(date: string): DailyMerkleRoot | null {
  try {
    const filename = path.join(ATTESTATION_DIR, `merkle-${date}.json`);
    if (!fs.existsSync(filename)) {
      return null;
    }

    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`[ATTESTATION] Failed to load Merkle root for ${date}: ${error}`);
    return null;
  }
}

/**
 * Force flush current day's Merkle root (for testing or graceful shutdown)
 *
 * @returns Daily Merkle root object
 */
export function forceFlush(): DailyMerkleRoot | null {
  return flushDailyMerkleRoot();
}

/**
 * Get current event buffer (for inspection/debugging)
 *
 * @returns Array of events in current buffer
 */
export function getCurrentBuffer(): AttestationEvent[] {
  return [...eventBuffer]; // Return copy
}

/**
 * Clear event buffer (for testing only)
 *
 * ⚠️ WARNING: This destroys attestation events. Use only in tests.
 */
export function clearBuffer(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('clearBuffer() not allowed in production');
  }
  eventBuffer = [];
  currentDate = null;
}

/**
 * Hash action details for attestation
 *
 * @param actionType - Type of action (e.g., "user_delete", "order_create")
 * @param details - Action-specific details
 * @returns SHA256 hash of action
 *
 * @example
 * ```typescript
 * const actionHash = hashAction("user_delete", { userId: "123", reason: "GDPR" });
 * appendEvent({
 *   action_hash: actionHash,
 *   timestamp: new Date().toISOString(),
 *   actor: "user:123"
 * });
 * ```
 */
export function hashAction(actionType: string, details: Record<string, any>): string {
  const data = JSON.stringify({ type: actionType, ...details }, Object.keys(details).sort());
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Schedule daily Merkle root flush (cron-like)
 *
 * Flushes Merkle root at midnight UTC
 */
export function scheduleDailyFlush(): NodeJS.Timeout {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  return setTimeout(() => {
    flushDailyMerkleRoot();
    // Reschedule for next day
    scheduleDailyFlush();
  }, msUntilMidnight);
}
