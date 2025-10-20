/**
 * SHARD_8.1 - Geolocation API Wrapper
 * Real-time location tracking with privacy controls
 *
 * Security: User permission required, encrypted transmission
 * White Hat: Ephemeral tokens, time-limited sharing
 */

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationShareSession {
  id: string;
  userId: string;
  recipientId: string;
  startedAt: number;
  expiresAt: number;
  isLive: boolean;
  duration: number; // in milliseconds
}

/**
 * Get current position
 */
export async function getCurrentPosition(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Watch position (live tracking)
 */
export function watchPosition(
  callback: (location: Location) => void,
  errorCallback?: (error: Error) => void
): number {
  if (!('geolocation' in navigator)) {
    errorCallback?.(new Error('Geolocation not supported'));
    return -1;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp
      });
    },
    (error) => {
      errorCallback?.(new Error(`Geolocation error: ${error.message}`));
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  );
}

/**
 * Clear position watch
 */
export function clearWatch(watchId: number): void {
  if ('geolocation' in navigator) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'K' : 'G';
  const lonDir = lon >= 0 ? 'D' : 'B';
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lon).toFixed(6)}°${lonDir}`;
}

/**
 * Check if location permission is granted
 */
export async function checkLocationPermission(): Promise<PermissionState> {
  if (!('permissions' in navigator)) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    return 'prompt';
  }
}

/**
 * Create location share session
 */
export function createLocationSession(
  userId: string,
  recipientId: string,
  durationMinutes: number = 15
): LocationShareSession {
  const now = Date.now();
  const duration = durationMinutes * 60 * 1000;

  return {
    id: crypto.randomUUID(),
    userId,
    recipientId,
    startedAt: now,
    expiresAt: now + duration,
    isLive: true,
    duration
  };
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: LocationShareSession): boolean {
  return Date.now() > session.expiresAt;
}

/**
 * Get remaining time in session
 */
export function getSessionRemainingTime(session: LocationShareSession): number {
  const remaining = session.expiresAt - Date.now();
  return Math.max(0, remaining);
}

/**
 * Format session remaining time
 */
export function formatSessionTime(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}dk ${seconds}sn`;
  }
  return `${seconds}sn`;
}
