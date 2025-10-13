/**
 * Crypto Utility Functions
 * Type-safe conversions for Web Crypto API
 * White-hat discipline: Strict TypeScript compliance
 */

/**
 * Converts Uint8Array to ArrayBuffer (proper type)
 * Ensures compatibility with Web Crypto API
 */
export function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const sliced = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  // Ensure we return ArrayBuffer, not SharedArrayBuffer
  if (sliced instanceof ArrayBuffer) {
    return sliced;
  }
  // If SharedArrayBuffer, copy to regular ArrayBuffer
  return new Uint8Array(data).buffer;
}

/**
 * Converts Uint8Array to BufferSource (proper type for Web Crypto)
 * This creates a proper BufferSource that TypeScript accepts
 */
export function toBufferSource(data: Uint8Array): BufferSource {
  // Return the underlying ArrayBuffer which is a valid BufferSource
  return toArrayBuffer(data);
}

/**
 * Ensures data is a proper ArrayBuffer (not ArrayBufferLike)
 */
export function ensureArrayBuffer(data: ArrayBuffer | ArrayBufferLike): ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    return data;
  }
  // For SharedArrayBuffer or other ArrayBufferLike, we need to copy
  return new Uint8Array(data as any).buffer.slice(0);
}

/**
 * Creates a proper Uint8Array with ArrayBuffer (not ArrayBufferLike)
 */
export function createUint8Array(data: BufferSource | ArrayBuffer): Uint8Array {
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (data instanceof Uint8Array) {
    // Create a new ArrayBuffer copy to ensure it's not SharedArrayBuffer
    const buffer = new ArrayBuffer(data.byteLength);
    const view = new Uint8Array(buffer);
    view.set(data);
    return view;
  }
  // For other ArrayBufferView types
  const arr = new Uint8Array(data as any);
  const buffer = new ArrayBuffer(arr.byteLength);
  const view = new Uint8Array(buffer);
  view.set(arr);
  return view;
}

/**
 * Safely converts any array-like to Uint8Array with proper ArrayBuffer
 */
export function safeUint8Array(length: number): Uint8Array {
  return new Uint8Array(new ArrayBuffer(length));
}
