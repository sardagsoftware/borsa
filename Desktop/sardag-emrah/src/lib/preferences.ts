/**
 * USER PREFERENCES
 *
 * Manage user preferences using LocalStorage
 * - Signal types to show
 * - Quiet hours
 * - Scanner settings
 */

export interface UserPreferences {
  notifications: {
    enabled: boolean;
    signalTypes: ('STRONG_BUY' | 'BUY')[];
    mutedCoins: string[]; // ["BTCUSDT", "ETHUSDT"]
    quietHours: {
      enabled: boolean;
      start: string; // "23:00"
      end: string; // "08:00"
    };
    sound: boolean;
  };
  scanner: {
    interval: number; // minutes
    limit: number; // number of coins to scan
  };
  display: {
    showTopPerformers: boolean;
    gridSize: 'compact' | 'normal' | 'large';
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: {
    enabled: false,
    signalTypes: ['STRONG_BUY'],
    mutedCoins: [],
    quietHours: {
      enabled: false,
      start: '23:00',
      end: '08:00'
    },
    sound: true
  },
  scanner: {
    interval: 5,
    limit: 20
  },
  display: {
    showTopPerformers: true,
    gridSize: 'normal'
  }
};

const STORAGE_KEY = 'ukalai-preferences';

/**
 * Get user preferences from LocalStorage
 */
export function getPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;

    const parsed = JSON.parse(stored);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (error) {
    console.error('[Preferences] Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save user preferences to LocalStorage
 */
export function savePreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getPreferences();
    const updated = {
      ...current,
      ...preferences,
      // Deep merge notifications
      notifications: {
        ...current.notifications,
        ...(preferences.notifications || {})
      },
      // Deep merge scanner
      scanner: {
        ...current.scanner,
        ...(preferences.scanner || {})
      },
      // Deep merge display
      display: {
        ...current.display,
        ...(preferences.display || {})
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('[Preferences] Preferences saved:', updated);
  } catch (error) {
    console.error('[Preferences] Error saving preferences:', error);
  }
}

/**
 * Reset preferences to default
 */
export function resetPreferences(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Preferences] Preferences reset to default');
  } catch (error) {
    console.error('[Preferences] Error resetting preferences:', error);
  }
}

/**
 * Check if current time is within quiet hours
 */
export function isQuietHours(): boolean {
  const prefs = getPreferences();
  if (!prefs.notifications.quietHours.enabled) return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const { start, end } = prefs.notifications.quietHours;

  // Handle overnight quiet hours (e.g., 23:00-08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }

  return currentTime >= start && currentTime <= end;
}

/**
 * Check if coin is muted
 */
export function isCoinMuted(symbol: string): boolean {
  const prefs = getPreferences();
  return prefs.notifications.mutedCoins.includes(symbol);
}

/**
 * Check if signal type is enabled
 */
export function isSignalTypeEnabled(signalType: 'STRONG_BUY' | 'BUY'): boolean {
  const prefs = getPreferences();
  return prefs.notifications.signalTypes.includes(signalType);
}
