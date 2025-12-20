// ============================================
// ⚙️ REDIS PREFERENCES STORE
// User Preferences Management with Redis
// Settings for AI models, language, theme, etc.
// ============================================

const { Redis } = require('@upstash/redis');

// Initialize Upstash Redis
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis credentials not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
}

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// ============================================
// 🎨 DEFAULT PREFERENCES
// ============================================

const DEFAULT_PREFERENCES = {
    // Language & Localization
    language: 'tr-TR',
    locale: 'tr',
    timezone: 'Europe/Istanbul',

    // AI Model Preferences (Phase 1 Week 2: Anonymized model IDs)
    aiModel: {
        default: 'm1',        // Premium model
        medical: 'm1',        // Premium model
        legal: 'm1',          // Premium model
        general: 'm3',        // Standard model
        vision: 'm5',         // Multimodal model
        coding: 'm4'          // Reasoning model
    },

    // AI Behavior
    temperature: 0.7,
    maxTokens: 4000,
    streamingEnabled: true,

    // UI/UX Preferences
    theme: 'dark', // 'light', 'dark', 'auto'
    fontSize: 'medium', // 'small', 'medium', 'large'
    compactMode: false,
    sidebarCollapsed: false,

    // Conversation Settings
    defaultDomain: 'general', // 'medical', 'legal', 'general', 'coding'
    autoSaveEnabled: true,
    conversationRetention: 90, // days

    // Notifications
    notifications: {
        email: true,
        push: false,
        sound: true,
        desktop: false
    },

    // Privacy & Security
    privacy: {
        dataCollection: true,
        analytics: true,
        crashReports: true,
        shareUsageData: false
    },

    // Accessibility
    accessibility: {
        highContrast: false,
        screenReader: false,
        keyboardNavigation: true,
        reducedMotion: false
    },

    // Feature Flags
    features: {
        betaFeatures: false,
        experimentalModels: false,
        multimodalInput: true,
        voiceInput: false
    }
};

// ============================================
// 📥 GET PREFERENCES
// ============================================

/**
 * Get user preferences (merged with defaults)
 * @param {string} userId - User ID
 * @returns {Object} User preferences
 */
async function getPreferences(userId) {
    try {
        const data = await redis.get(`preferences:${userId}`);

        if (!data) {
            // Return defaults if no preferences exist
            return DEFAULT_PREFERENCES;
        }

        const userPrefs = typeof data === 'string' ? JSON.parse(data) : data;

        // Deep merge with defaults (user preferences override defaults)
        const mergedPrefs = deepMerge(DEFAULT_PREFERENCES, userPrefs);

        return mergedPrefs;
    } catch (error) {
        console.error('❌ Error getting preferences:', error);
        return DEFAULT_PREFERENCES;
    }
}

/**
 * Get specific preference value
 * @param {string} userId - User ID
 * @param {string} key - Preference key (supports dot notation, e.g., 'aiModel.default')
 */
async function getPreference(userId, key) {
    try {
        const prefs = await getPreferences(userId);

        // Support dot notation (e.g., 'aiModel.default')
        const keys = key.split('.');
        let value = prefs;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }

        return value;
    } catch (error) {
        console.error('❌ Error getting preference:', error);
        return null;
    }
}

// ============================================
// 💾 UPDATE PREFERENCES
// ============================================

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {Object} updates - Preference updates (supports nested objects)
 * @returns {Object} Updated preferences
 */
async function updatePreferences(userId, updates) {
    try {
        // Get current preferences
        const currentPrefs = await getPreferences(userId);

        // Deep merge updates
        const updatedPrefs = deepMerge(currentPrefs, updates);

        // Add metadata
        updatedPrefs._metadata = {
            userId: userId,
            updatedAt: new Date().toISOString(),
            version: '1.0'
        };

        // Save to Redis (180 days TTL)
        await redis.setex(
            `preferences:${userId}`,
            180 * 24 * 60 * 60,
            JSON.stringify(updatedPrefs)
        );

        console.log(`✅ Preferences updated for user: ${userId}`);

        return updatedPrefs;
    } catch (error) {
        console.error('❌ Error updating preferences:', error);
        throw error;
    }
}

/**
 * Update single preference
 * @param {string} userId - User ID
 * @param {string} key - Preference key (supports dot notation)
 * @param {any} value - New value
 */
async function updatePreference(userId, key, value) {
    try {
        const updates = setNestedValue({}, key, value);
        return await updatePreferences(userId, updates);
    } catch (error) {
        console.error('❌ Error updating preference:', error);
        throw error;
    }
}

// ============================================
// 🔄 RESET PREFERENCES
// ============================================

/**
 * Reset preferences to defaults
 * @param {string} userId - User ID
 * @returns {Object} Default preferences
 */
async function resetPreferences(userId) {
    try {
        // Delete user preferences from Redis
        await redis.del(`preferences:${userId}`);

        console.log(`✅ Preferences reset for user: ${userId}`);

        return DEFAULT_PREFERENCES;
    } catch (error) {
        console.error('❌ Error resetting preferences:', error);
        throw error;
    }
}

// ============================================
// 🛠️ UTILITY FUNCTIONS
// ============================================

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
    const output = { ...target };

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }

    return output;
}

/**
 * Check if value is a plain object
 */
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();

    let current = obj;
    for (const key of keys) {
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }

    current[lastKey] = value;
    return obj;
}

/**
 * Validate preference update
 */
function validatePreferences(updates) {
    const errors = [];

    // Validate language
    if (updates.language) {
        const validLanguages = ['tr-TR', 'en-US', 'ar-SA', 'de-DE', 'fr-FR'];
        if (!validLanguages.includes(updates.language)) {
            errors.push(`Invalid language: ${updates.language}`);
        }
    }

    // Validate theme
    if (updates.theme) {
        const validThemes = ['light', 'dark', 'auto'];
        if (!validThemes.includes(updates.theme)) {
            errors.push(`Invalid theme: ${updates.theme}`);
        }
    }

    // Validate AI model
    if (updates.aiModel && updates.aiModel.default) {
        const validModels = [
            'OX7A3F8D',
            'OX7A3F8D-mini',
            'OX7A3F8D',
            'AX9F7E2B',
            'AX4D8C1A',
            'gemini-2.0-flash-exp'
        ];
        if (!validModels.includes(updates.aiModel.default)) {
            errors.push(`Invalid AI model: ${updates.aiModel.default}`);
        }
    }

    // Validate temperature
    if (updates.temperature !== undefined) {
        if (typeof updates.temperature !== 'number' || updates.temperature < 0 || updates.temperature > 2) {
            errors.push('Temperature must be between 0 and 2');
        }
    }

    // Validate maxTokens
    if (updates.maxTokens !== undefined) {
        if (typeof updates.maxTokens !== 'number' || updates.maxTokens < 100 || updates.maxTokens > 128000) {
            errors.push('maxTokens must be between 100 and 128000');
        }
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// ============================================
// 📊 PREFERENCE PRESETS
// ============================================

const PRESETS = {
    // Medical professional preset
    medical: {
        aiModel: {
            default: 'OX7A3F8D',
            medical: 'OX7A3F8D',
            legal: 'OX7A3F8D',
            general: 'OX7A3F8D-mini'
        },
        defaultDomain: 'medical',
        temperature: 0.3, // More conservative for medical
        maxTokens: 8000,
        language: 'tr-TR'
    },

    // Legal professional preset
    legal: {
        aiModel: {
            default: 'OX7A3F8D',
            medical: 'OX7A3F8D',
            legal: 'OX7A3F8D',
            general: 'OX7A3F8D-mini'
        },
        defaultDomain: 'legal',
        temperature: 0.3, // More conservative for legal
        maxTokens: 8000,
        language: 'tr-TR'
    },

    // Developer preset
    developer: {
        aiModel: {
            default: 'AX9F7E2B',
            coding: 'AX9F7E2B',
            general: 'OX7A3F8D-mini'
        },
        defaultDomain: 'coding',
        temperature: 0.7,
        maxTokens: 8000,
        theme: 'dark',
        features: {
            betaFeatures: true,
            experimentalModels: true
        }
    },

    // General user preset
    general: {
        ...DEFAULT_PREFERENCES
    }
};

/**
 * Apply preset to user preferences
 */
async function applyPreset(userId, presetName) {
    try {
        if (!PRESETS[presetName]) {
            throw new Error(`Invalid preset: ${presetName}`);
        }

        return await updatePreferences(userId, PRESETS[presetName]);
    } catch (error) {
        console.error('❌ Error applying preset:', error);
        throw error;
    }
}

// ============================================
// 📤 EXPORT
// ============================================

module.exports = {
    redis,
    DEFAULT_PREFERENCES,
    PRESETS,
    // Main functions
    getPreferences,
    getPreference,
    updatePreferences,
    updatePreference,
    resetPreferences,
    applyPreset,
    // Utilities
    validatePreferences
};
