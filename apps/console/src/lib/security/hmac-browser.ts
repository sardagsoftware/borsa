/**
 * Browser-compatible HMAC signing using Web Crypto API
 * For realtime WebSocket/SSE authentication
 */

'use client';

/**
 * Generate random nonce (browser-compatible)
 */
function generateNonce(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert string to Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sign message with HMAC-SHA256 (browser-compatible)
 */
export async function signBrowser(body: string, secret: string): Promise<{
  ts: string;
  nonce: string;
  sig: string;
}> {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();
  const message = `${ts}.${nonce}.${body}`;

  // Import secret as crypto key
  const keyData = stringToUint8Array(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign message
  const messageData = stringToUint8Array(message);
  const signature = await crypto.subtle.sign('HMAC', key, messageData);

  // Convert to hex
  const sig = uint8ArrayToHex(new Uint8Array(signature));

  return { ts, nonce, sig };
}
