/**
 * SHARD_3.5 - Safety Number Verification
 * Verify identity keys between contacts using fingerprints
 *
 * Security: Prevents MITM attacks by verifying key authenticity
 * White Hat: QR codes for easy verification, numeric fingerprint fallback
 */

import { hash } from './keys';

export interface SafetyNumber {
  fingerprint: string;
  numeric: string;
  qrCode: string;
}

/**
 * Generate safety number from two identity keys
 * Used to verify that both parties have the correct keys
 *
 * @param localIdentityKey - Local user's identity public key
 * @param remoteIdentityKey - Remote user's identity public key
 * @param localId - Local user identifier
 * @param remoteId - Remote user identifier
 */
export async function generateSafetyNumber(
  localIdentityKey: Uint8Array,
  remoteIdentityKey: Uint8Array,
  localId: string,
  remoteId: string
): Promise<SafetyNumber> {
  // Concatenate keys and IDs in deterministic order
  const [first, second] = sortByLexicographic(
    { key: localIdentityKey, id: localId },
    { key: remoteIdentityKey, id: remoteId }
  );

  const combined = concatenateBytes([
    new TextEncoder().encode('ailydian-safety-v1'),
    new TextEncoder().encode(first.id),
    first.key,
    new TextEncoder().encode(second.id),
    second.key
  ]);

  // Hash to create fingerprint
  const fingerprintHash = await hash(combined);

  // Create hex fingerprint (64 chars)
  const fingerprint = Array.from(fingerprintHash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Create numeric safety number (60 digits, formatted in groups of 5)
  const numeric = createNumericFingerprint(fingerprintHash);

  // Create QR code data
  const qrCode = await generateQRCode(fingerprint, localId, remoteId);

  return {
    fingerprint,
    numeric,
    qrCode
  };
}

/**
 * Verify that two safety numbers match
 */
export function verifySafetyNumber(
  safety1: SafetyNumber,
  safety2: SafetyNumber
): boolean {
  return safety1.fingerprint === safety2.fingerprint;
}

/**
 * Format safety number for display
 * Returns: "12345 67890 12345 67890 12345 67890"
 */
export function formatSafetyNumber(safetyNumber: SafetyNumber): string {
  const numeric = safetyNumber.numeric;
  const groups: string[] = [];

  for (let i = 0; i < numeric.length; i += 5) {
    groups.push(numeric.substring(i, i + 5));
  }

  return groups.join(' ');
}

/**
 * Create numeric fingerprint from hash
 * Converts bytes to 60-digit number
 */
function createNumericFingerprint(hash: Uint8Array): string {
  let result = '';

  for (let i = 0; i < hash.length && result.length < 60; i += 2) {
    const chunk = (hash[i] << 8) | (hash[i + 1] || 0);
    const digits = (chunk % 100000).toString().padStart(5, '0');
    result += digits;
  }

  return result.substring(0, 60);
}

/**
 * Sort keys by lexicographic order (for deterministic ordering)
 */
function sortByLexicographic(
  a: { key: Uint8Array; id: string },
  b: { key: Uint8Array; id: string }
): [{ key: Uint8Array; id: string }, { key: Uint8Array; id: string }] {
  const aHex = Array.from(a.key).map(b => b.toString(16).padStart(2, '0')).join('');
  const bHex = Array.from(b.key).map(b => b.toString(16).padStart(2, '0')).join('');

  return aHex < bHex ? [a, b] : [b, a];
}

/**
 * Concatenate bytes
 */
function concatenateBytes(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

/**
 * Generate QR code SVG data
 */
async function generateQRCode(
  fingerprint: string,
  localId: string,
  remoteId: string
): Promise<string> {
  // QR code data format: ailydian://verify/<fingerprint>/<localId>/<remoteId>
  const data = `ailydian://verify/${fingerprint}/${localId}/${remoteId}`;

  // Return data URL (in production, would generate actual QR code SVG)
  return `data:text/plain,${encodeURIComponent(data)}`;
}

/**
 * Parse QR code data
 */
export function parseQRCode(qrData: string): {
  fingerprint: string;
  localId: string;
  remoteId: string;
} | null {
  const match = qrData.match(/^ailydian:\/\/verify\/([^/]+)\/([^/]+)\/([^/]+)$/);

  if (!match) {
    return null;
  }

  return {
    fingerprint: match[1],
    localId: match[2],
    remoteId: match[3]
  };
}

/**
 * Get color-coded trust level
 */
export function getTrustLevel(verified: boolean, changedSince?: Date): {
  level: 'verified' | 'changed' | 'unverified';
  color: string;
  label: string;
} {
  if (verified && !changedSince) {
    return {
      level: 'verified',
      color: '#10A37F',
      label: 'Doğrulanmış'
    };
  }

  if (changedSince) {
    return {
      level: 'changed',
      color: '#EAB308',
      label: 'Anahtar Değişti'
    };
  }

  return {
    level: 'unverified',
    color: '#6B7280',
    label: 'Doğrulanmamış'
  };
}

/**
 * Generate visual fingerprint (emoji-based)
 */
export function generateEmojiFingerprint(identityKey: Uint8Array): string {
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
    '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒'
  ];

  let result = '';

  for (let i = 0; i < 6; i++) {
    const index = identityKey[i] % emojis.length;
    result += emojis[index];
  }

  return result;
}
