/**
 * SHARD_10.1 - Device Management
 * Track and manage user devices
 *
 * Security: Per-device encryption keys, revocation support
 * White Hat: User controls devices, clear security status
 */

export interface Device {
  id: string;
  userId: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'web';
  os: string;
  browser?: string;
  lastActive: number;
  createdAt: number;
  isCurrent: boolean;
  isTrusted: boolean;
  ipAddress?: string;
  location?: {
    city: string;
    country: string;
  };
  publicKey: string; // Device's public key for E2EE
}

export interface DeviceSession {
  deviceId: string;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}

/**
 * In-memory device store (in production, use DB)
 */
const deviceStore = new Map<string, Device[]>();
const sessionStore = new Map<string, DeviceSession[]>();

/**
 * Register new device
 */
export function registerDevice(
  userId: string,
  deviceInfo: {
    name: string;
    type: Device['type'];
    os: string;
    browser?: string;
    ipAddress?: string;
    location?: Device['location'];
    publicKey: string;
  }
): Device {
  const device: Device = {
    id: crypto.randomUUID(),
    userId,
    name: deviceInfo.name,
    type: deviceInfo.type,
    os: deviceInfo.os,
    browser: deviceInfo.browser,
    lastActive: Date.now(),
    createdAt: Date.now(),
    isCurrent: false,
    isTrusted: false,
    ipAddress: deviceInfo.ipAddress,
    location: deviceInfo.location,
    publicKey: deviceInfo.publicKey
  };

  const devices = deviceStore.get(userId) || [];
  devices.push(device);
  deviceStore.set(userId, devices);

  return device;
}

/**
 * Get all devices for user
 */
export function getUserDevices(userId: string): Device[] {
  return deviceStore.get(userId) || [];
}

/**
 * Get device by ID
 */
export function getDevice(userId: string, deviceId: string): Device | null {
  const devices = getUserDevices(userId);
  return devices.find((d) => d.id === deviceId) || null;
}

/**
 * Update device last active
 */
export function updateDeviceActivity(userId: string, deviceId: string): void {
  const devices = getUserDevices(userId);
  const device = devices.find((d) => d.id === deviceId);

  if (device) {
    device.lastActive = Date.now();
    deviceStore.set(userId, devices);
  }
}

/**
 * Set current device
 */
export function setCurrentDevice(userId: string, deviceId: string): void {
  const devices = getUserDevices(userId);

  devices.forEach((d) => {
    d.isCurrent = d.id === deviceId;
  });

  deviceStore.set(userId, devices);
}

/**
 * Trust device
 */
export function trustDevice(userId: string, deviceId: string): void {
  const devices = getUserDevices(userId);
  const device = devices.find((d) => d.id === deviceId);

  if (device) {
    device.isTrusted = true;
    deviceStore.set(userId, devices);
  }
}

/**
 * Untrust device
 */
export function untrustDevice(userId: string, deviceId: string): void {
  const devices = getUserDevices(userId);
  const device = devices.find((d) => d.id === deviceId);

  if (device) {
    device.isTrusted = false;
    deviceStore.set(userId, devices);
  }
}

/**
 * Remove device (revoke access)
 */
export function removeDevice(userId: string, deviceId: string): boolean {
  const devices = getUserDevices(userId);
  const index = devices.findIndex((d) => d.id === deviceId);

  if (index === -1) {
    return false;
  }

  // Can't remove current device
  if (devices[index].isCurrent) {
    throw new Error('Cannot remove current device');
  }

  devices.splice(index, 1);
  deviceStore.set(userId, devices);

  // Remove all sessions for this device
  const sessions = sessionStore.get(userId) || [];
  const filteredSessions = sessions.filter((s) => s.deviceId !== deviceId);
  sessionStore.set(userId, filteredSessions);

  return true;
}

/**
 * Create device session
 */
export function createDeviceSession(
  userId: string,
  deviceId: string,
  durationMs: number = 30 * 24 * 60 * 60 * 1000 // 30 days
): DeviceSession {
  const session: DeviceSession = {
    deviceId,
    sessionId: crypto.randomUUID(),
    createdAt: Date.now(),
    expiresAt: Date.now() + durationMs,
    isActive: true
  };

  const sessions = sessionStore.get(userId) || [];
  sessions.push(session);
  sessionStore.set(userId, sessions);

  return session;
}

/**
 * Get active sessions for user
 */
export function getActiveSessions(userId: string): DeviceSession[] {
  const sessions = sessionStore.get(userId) || [];
  const now = Date.now();

  return sessions.filter((s) => s.isActive && s.expiresAt > now);
}

/**
 * Revoke session
 */
export function revokeSession(userId: string, sessionId: string): boolean {
  const sessions = sessionStore.get(userId) || [];
  const session = sessions.find((s) => s.sessionId === sessionId);

  if (!session) {
    return false;
  }

  session.isActive = false;
  sessionStore.set(userId, sessions);

  return true;
}

/**
 * Revoke all sessions except current
 */
export function revokeAllSessionsExceptCurrent(
  userId: string,
  currentDeviceId: string
): number {
  const sessions = sessionStore.get(userId) || [];
  let revokedCount = 0;

  sessions.forEach((s) => {
    if (s.deviceId !== currentDeviceId && s.isActive) {
      s.isActive = false;
      revokedCount++;
    }
  });

  sessionStore.set(userId, sessions);

  return revokedCount;
}

/**
 * Get device type icon
 */
export function getDeviceIcon(type: Device['type']): string {
  switch (type) {
    case 'desktop':
      return '🖥️';
    case 'mobile':
      return '📱';
    case 'tablet':
      return '📱';
    case 'web':
      return '🌐';
  }
}

/**
 * Format last active time
 */
export function formatLastActive(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Şimdi aktif';
  if (minutes < 60) return `${minutes} dk önce`;
  if (hours < 24) return `${hours} saat önce`;
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  return `${Math.floor(days / 30)} ay önce`;
}

/**
 * Get device count by type
 */
export function getDeviceCountByType(userId: string): Record<Device['type'], number> {
  const devices = getUserDevices(userId);

  return {
    desktop: devices.filter((d) => d.type === 'desktop').length,
    mobile: devices.filter((d) => d.type === 'mobile').length,
    tablet: devices.filter((d) => d.type === 'tablet').length,
    web: devices.filter((d) => d.type === 'web').length
  };
}

/**
 * Get trusted device count
 */
export function getTrustedDeviceCount(userId: string): number {
  const devices = getUserDevices(userId);
  return devices.filter((d) => d.isTrusted).length;
}

/**
 * Check if device is suspicious
 */
export function isDeviceSuspicious(device: Device): boolean {
  const now = Date.now();
  const daysSinceCreated = (now - device.createdAt) / 86400000;

  // New device (< 1 day old) and not trusted
  if (daysSinceCreated < 1 && !device.isTrusted) {
    return true;
  }

  // Not used in > 30 days
  const daysSinceActive = (now - device.lastActive) / 86400000;
  if (daysSinceActive > 30) {
    return true;
  }

  return false;
}

/**
 * Generate device fingerprint (simplified)
 */
export function generateDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency
  ];

  const data = components.join('|');
  return btoa(data).substring(0, 32);
}
