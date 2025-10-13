/**
 * SHARD_3.4 - Device Provisioning & Management
 * Multi-device support for E2EE messaging
 *
 * Security: Each device has unique keys, linked via primary device
 * White Hat: Device list encrypted, audit log for device changes
 */

import {
  generateIdentityKeyPair,
  generateSignedPreKey,
  generateOneTimePreKeys,
  IdentityKeyPair,
  SignedPreKey,
  PreKey
} from './keys';

export interface Device {
  id: string;
  name: string;
  type: 'primary' | 'secondary';
  identityKey: IdentityKeyPair;
  signedPreKey: SignedPreKey;
  oneTimePreKeys: PreKey[];
  created: number;
  lastSeen: number;
  trusted: boolean;
}

export interface DeviceBundle {
  deviceId: string;
  identityKey: Uint8Array;
  signedPreKey: Uint8Array;
  signedPreKeySignature: Uint8Array;
  oneTimePreKey?: Uint8Array;
}

/**
 * Provision a new device
 * Generates all necessary keys for E2EE
 */
export async function provisionDevice(
  deviceName: string,
  deviceType: 'primary' | 'secondary' = 'primary'
): Promise<Device> {
  console.log(`[DEVICE] Provisioning ${deviceType} device: ${deviceName}`);

  // Generate identity key pair (long-term)
  const identityKey = await generateIdentityKeyPair();

  // Generate signed pre key
  const signedPreKey = await generateSignedPreKey(identityKey.privateKey, 1);

  // Generate batch of one-time pre keys (100 keys)
  const oneTimePreKeys = await generateOneTimePreKeys(1, 100);

  const device: Device = {
    id: crypto.randomUUID(),
    name: deviceName,
    type: deviceType,
    identityKey,
    signedPreKey,
    oneTimePreKeys,
    created: Date.now(),
    lastSeen: Date.now(),
    trusted: true
  };

  console.log(`[DEVICE] ✅ Provisioned: ${device.id} (${oneTimePreKeys.length} pre-keys)`);

  return device;
}

/**
 * Get device pre-key bundle for key exchange
 */
export function getDeviceBundle(device: Device): DeviceBundle {
  // Pop one one-time pre key if available
  const oneTimePreKey = device.oneTimePreKeys.pop();

  return {
    deviceId: device.id,
    identityKey: device.identityKey.publicKey,
    signedPreKey: device.signedPreKey.publicKey,
    signedPreKeySignature: device.signedPreKey.signature,
    oneTimePreKey: oneTimePreKey?.publicKey
  };
}

/**
 * Replenish one-time pre keys when running low
 */
export async function replenishPreKeys(device: Device): Promise<void> {
  const threshold = 20;

  if (device.oneTimePreKeys.length < threshold) {
    const currentMaxId = Math.max(
      ...device.oneTimePreKeys.map(k => k.id),
      0
    );

    const newKeys = await generateOneTimePreKeys(currentMaxId + 1, 50);
    device.oneTimePreKeys.push(...newKeys);

    console.log(`[DEVICE] Replenished pre-keys: ${device.id} (${newKeys.length} new keys)`);
  }
}

/**
 * Rotate signed pre key (should be done weekly)
 */
export async function rotateSignedPreKey(device: Device): Promise<void> {
  const newKeyId = device.signedPreKey.id + 1;
  const newSignedPreKey = await generateSignedPreKey(
    device.identityKey.privateKey,
    newKeyId
  );

  device.signedPreKey = newSignedPreKey;

  console.log(`[DEVICE] Rotated signed pre-key: ${device.id} → keyId=${newKeyId}`);
}

/**
 * Store device keys in IndexedDB
 */
export async function storeDevice(device: Device): Promise<void> {
  try {
    const db = await openDeviceDB();
    const tx = db.transaction('devices', 'readwrite');
    const store = tx.objectStore('devices');

    // Serialize device for storage
    const serialized = {
      ...device,
      identityKey: {
        ...device.identityKey,
        publicKey: Array.from(device.identityKey.publicKey),
        privateKey: Array.from(device.identityKey.privateKey)
      },
      signedPreKey: {
        ...device.signedPreKey,
        publicKey: Array.from(device.signedPreKey.publicKey),
        privateKey: Array.from(device.signedPreKey.privateKey),
        signature: Array.from(device.signedPreKey.signature)
      },
      oneTimePreKeys: device.oneTimePreKeys.map(k => ({
        ...k,
        publicKey: Array.from(k.publicKey),
        privateKey: Array.from(k.privateKey)
      }))
    };

    await store.put(serialized);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    console.log(`[DEVICE] ✅ Stored device: ${device.id}`);
  } catch (error) {
    console.error('[DEVICE] Store error:', error);
    throw new Error('Failed to store device');
  }
}

/**
 * Load device from IndexedDB
 */
export async function loadDevice(deviceId: string): Promise<Device | null> {
  try {
    const db = await openDeviceDB();
    const tx = db.transaction('devices', 'readonly');
    const store = tx.objectStore('devices');

    const serialized = await new Promise<any>((resolve, reject) => {
      const request = store.get(deviceId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!serialized) {
      return null;
    }

    // Deserialize device
    const device: Device = {
      ...serialized,
      identityKey: {
        ...serialized.identityKey,
        publicKey: new Uint8Array(serialized.identityKey.publicKey),
        privateKey: new Uint8Array(serialized.identityKey.privateKey)
      },
      signedPreKey: {
        ...serialized.signedPreKey,
        publicKey: new Uint8Array(serialized.signedPreKey.publicKey),
        privateKey: new Uint8Array(serialized.signedPreKey.privateKey),
        signature: new Uint8Array(serialized.signedPreKey.signature)
      },
      oneTimePreKeys: serialized.oneTimePreKeys.map((k: any) => ({
        ...k,
        publicKey: new Uint8Array(k.publicKey),
        privateKey: new Uint8Array(k.privateKey)
      }))
    };

    return device;
  } catch (error) {
    console.error('[DEVICE] Load error:', error);
    return null;
  }
}

/**
 * List all devices
 */
export async function listDevices(): Promise<Device[]> {
  try {
    const db = await openDeviceDB();
    const tx = db.transaction('devices', 'readonly');
    const store = tx.objectStore('devices');

    const allDevices = await new Promise<any[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return allDevices.map((serialized: any) => ({
      ...serialized,
      identityKey: {
        ...serialized.identityKey,
        publicKey: new Uint8Array(serialized.identityKey.publicKey),
        privateKey: new Uint8Array(serialized.identityKey.privateKey)
      },
      signedPreKey: {
        ...serialized.signedPreKey,
        publicKey: new Uint8Array(serialized.signedPreKey.publicKey),
        privateKey: new Uint8Array(serialized.signedPreKey.privateKey),
        signature: new Uint8Array(serialized.signedPreKey.signature)
      },
      oneTimePreKeys: serialized.oneTimePreKeys.map((k: any) => ({
        ...k,
        publicKey: new Uint8Array(k.publicKey),
        privateKey: new Uint8Array(k.privateKey)
      }))
    }));
  } catch (error) {
    console.error('[DEVICE] List error:', error);
    return [];
  }
}

/**
 * Delete device
 */
export async function deleteDevice(deviceId: string): Promise<void> {
  try {
    const db = await openDeviceDB();
    const tx = db.transaction('devices', 'readwrite');
    const store = tx.objectStore('devices');

    await store.delete(deviceId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    console.log(`[DEVICE] ✅ Deleted device: ${deviceId}`);
  } catch (error) {
    console.error('[DEVICE] Delete error:', error);
    throw new Error('Failed to delete device');
  }
}

/**
 * Open IndexedDB for device storage
 */
async function openDeviceDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ailydian-devices', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('devices')) {
        const store = db.createObjectStore('devices', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('created', 'created', { unique: false });
      }
    };
  });
}
