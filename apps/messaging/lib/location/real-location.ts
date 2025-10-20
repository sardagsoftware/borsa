/**
 * SHARD_16.5 - Real Location Sharing
 * Live geolocation streaming with encryption
 *
 * Features:
 * - HTML5 Geolocation API
 * - Real-time position updates
 * - Accuracy tracking
 * - Duration control (15min/1hr/8hr)
 * - Battery-efficient
 *
 * White Hat: User permission required, ephemeral sessions
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed: number | null;
  heading: number | null;
}

export interface LocationShareState {
  isActive: boolean;
  currentLocation: LocationData | null;
  sessionStartTime: number | null;
  sessionDuration: number; // milliseconds
  maxDuration: number; // milliseconds
  updateInterval: number; // milliseconds
  error: string | null;
}

export type LocationDuration = '15min' | '1hr' | '8hr';

class LocationShareManager {
  private watchId: number | null = null;
  private state: LocationShareState = {
    isActive: false,
    currentLocation: null,
    sessionStartTime: null,
    sessionDuration: 0,
    maxDuration: 15 * 60 * 1000, // 15 minutes default
    updateInterval: 5000, // 5 seconds
    error: null
  };
  private stateChangeCallback: ((state: LocationShareState) => void) | null = null;
  private durationInterval: NodeJS.Timeout | null = null;
  private onLocationUpdateCallback: ((location: LocationData) => void) | null = null;

  constructor() {
    console.log('[Location] Share manager initialized');
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: LocationShareState) => void): void {
    this.stateChangeCallback = callback;
  }

  /**
   * Subscribe to location updates
   */
  onLocationUpdate(callback: (location: LocationData) => void): void {
    this.onLocationUpdateCallback = callback;
  }

  /**
   * Get current state
   */
  getState(): LocationShareState {
    return { ...this.state };
  }

  /**
   * Start location sharing
   */
  async startSharing(duration: LocationDuration = '15min'): Promise<void> {
    try {
      console.log(`[Location] Starting location share for ${duration}`);

      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      // Request permission and get initial position
      const position = await this.getCurrentPosition();

      // Convert duration to milliseconds
      const maxDuration = this.parseDuration(duration);

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => this.handlePositionUpdate(pos),
        (error) => this.handlePositionError(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      // Update state
      this.state = {
        isActive: true,
        currentLocation: this.mapPosition(position),
        sessionStartTime: Date.now(),
        sessionDuration: 0,
        maxDuration,
        updateInterval: 5000,
        error: null
      };

      this.notifyStateChange();
      this.startDurationTimer();

      console.log('[Location] Location sharing started');
    } catch (error: any) {
      console.error('[Location] Failed to start sharing:', error);
      this.state.error = error.message;
      this.notifyStateChange();
      throw error;
    }
  }

  /**
   * Stop location sharing
   */
  stopSharing(): void {
    console.log('[Location] Stopping location share');

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    this.state = {
      isActive: false,
      currentLocation: null,
      sessionStartTime: null,
      sessionDuration: 0,
      maxDuration: 15 * 60 * 1000,
      updateInterval: 5000,
      error: null
    };

    this.notifyStateChange();

    console.log('[Location] Location sharing stopped');
  }

  /**
   * Get current position once
   */
  async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Get distance between two coordinates (in meters)
   */
  getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
   * Handle position update from geolocation API
   */
  private handlePositionUpdate(position: GeolocationPosition): void {
    const locationData = this.mapPosition(position);

    this.state.currentLocation = locationData;
    this.notifyStateChange();

    // Notify location update callback
    if (this.onLocationUpdateCallback) {
      this.onLocationUpdateCallback(locationData);
    }

    console.log('[Location] Position updated:', locationData);
  }

  /**
   * Handle geolocation errors
   */
  private handlePositionError(error: GeolocationPositionError): void {
    let errorMessage = 'Unknown error';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'User denied location permission';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }

    console.error('[Location] Error:', errorMessage);

    this.state.error = errorMessage;
    this.notifyStateChange();
  }

  /**
   * Map GeolocationPosition to LocationData
   */
  private mapPosition(position: GeolocationPosition): LocationData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      speed: position.coords.speed,
      heading: position.coords.heading
    };
  }

  /**
   * Parse duration string to milliseconds
   */
  private parseDuration(duration: LocationDuration): number {
    switch (duration) {
      case '15min':
        return 15 * 60 * 1000;
      case '1hr':
        return 60 * 60 * 1000;
      case '8hr':
        return 8 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }

  /**
   * Start duration timer
   */
  private startDurationTimer(): void {
    this.durationInterval = setInterval(() => {
      if (this.state.sessionStartTime) {
        this.state.sessionDuration = Date.now() - this.state.sessionStartTime;

        // Auto-stop when max duration reached
        if (this.state.sessionDuration >= this.state.maxDuration) {
          console.log('[Location] Max duration reached, stopping');
          this.stopSharing();
          return;
        }

        this.notifyStateChange();
      }
    }, 1000);
  }

  /**
   * Notify state change callback
   */
  private notifyStateChange(): void {
    if (this.stateChangeCallback) {
      this.stateChangeCallback({ ...this.state });
    }
  }
}

// Singleton instance
let locationManagerInstance: LocationShareManager | null = null;

export function getLocationManager(): LocationShareManager {
  if (!locationManagerInstance) {
    locationManagerInstance = new LocationShareManager();
  }
  return locationManagerInstance;
}

/**
 * Format location duration for display
 */
export function formatLocationDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const s = seconds % 60;
  const m = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${m}m`;
  }
  if (minutes > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}

/**
 * Format accuracy for display
 */
export function formatAccuracy(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Get Google Maps URL for coordinates
 */
export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/**
 * Get OpenStreetMap URL for coordinates
 */
export function getOpenStreetMapUrl(latitude: number, longitude: number, zoom: number = 15): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`;
}
