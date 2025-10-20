/**
 * USER PREFERENCES MANAGER
 * Session storage & auto-save for user settings
 */

export interface UserPreferences {
  // Display
  theme: 'dark' | 'light' | 'auto';

  // Market
  defaultMarketType: 'spot' | 'futures';
  defaultSort: '7d' | '24h' | 'volume' | 'rank';
  defaultTimeframe: '1h' | '4h' | '1d' | '1w';

  // Notifications
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;

  // Scanner
  scanInterval: number; // minutes
  autoScanEnabled: boolean;
  minConfidence: number; // 0-100

  // Display preferences
  compactView: boolean;
  showTraditionalMarkets: boolean;
  showTop10: boolean;

  // Advanced
  enableGroqAI: boolean;
  enableBacktest: boolean;
  enablePortfolio: boolean;
}

const STORAGE_KEY = 'sardag_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  defaultMarketType: 'futures',
  defaultSort: '7d',
  defaultTimeframe: '4h',
  notificationsEnabled: true,
  soundEnabled: true,
  pushEnabled: true,
  emailEnabled: false,
  scanInterval: 60, // 1 hour
  autoScanEnabled: true,
  minConfidence: 70,
  compactView: false,
  showTraditionalMarkets: true,
  showTop10: true,
  enableGroqAI: true,
  enableBacktest: true,
  enablePortfolio: true,
};

/**
 * Get user preferences
 */
export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;

    const parsed = JSON.parse(stored);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save user preferences
 */
export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getUserPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('[Preferences] Saved:', preferences);
  } catch (error) {
    console.error('[Preferences] Save error:', error);
  }
}

/**
 * Reset to defaults
 */
export function resetPreferences(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
}

/**
 * Update single preference
 */
export function updatePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): void {
  saveUserPreferences({ [key]: value } as Partial<UserPreferences>);
}
