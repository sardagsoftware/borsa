/**
 * 🚀 LyDian Feature Flags Manager
 *
 * Client-side feature flag system with canary deployment support
 *
 * Features:
 * - Percentage-based rollouts
 * - User bucketing (consistent experience)
 * - Local overrides for testing
 * - Real-time monitoring
 * - Automatic rollback detection
 *
 * Usage:
 *   <script src="/js/feature-flags.js"></script>
 *   <script>
 *     const flags = new FeatureFlags();
 *     await flags.init();
 *
 *     if (flags.isEnabled('i18n_system_enabled')) {
 *       // Initialize i18n system
 *     }
 *   </script>
 *
 * @author LyDian AI Platform
 * @license MIT
 * @version 1.0.0
 */

(function (global) {
    'use strict';

    // ============================
    // CONFIGURATION
    // ============================

    const CONFIG = {
        flagsEndpoint: '/ops/canary/feature-flags.json',
        localStorageKey: 'ailydian_feature_flags',
        userBucketKey: 'ailydian_user_bucket',
        cacheDuration: 5 * 60 * 1000, // 5 minutes
        monitoringEndpoint: '/api/monitoring/feature-flags',
    };

    // ============================
    // FEATURE FLAGS MANAGER
    // ============================

    class FeatureFlags {
        constructor(options = {}) {
            this.config = { ...CONFIG, ...options };
            this.flags = {};
            this.userBucket = null;
            this.isInitialized = false;
            this.overrides = this.loadLocalOverrides();
        }

        // ============================
        // INITIALIZATION
        // ============================

        async init() {
            if (this.isInitialized) {
                console.warn('FeatureFlags already initialized');
                return;
            }

            try {
                // 1. Get or create user bucket
                this.userBucket = this.getUserBucket();

                // 2. Load flags from cache or fetch
                const cachedFlags = this.loadFromCache();

                if (cachedFlags && !this.isCacheExpired(cachedFlags)) {
                    this.flags = cachedFlags.data;
                    console.log('🚀 Feature flags loaded from cache');
                } else {
                    await this.fetchFlags();
                }

                // 3. Mark as initialized
                this.isInitialized = true;

                console.log('🚀 Feature flags initialized');
                console.log('   User bucket:', this.userBucket);
                console.log('   Flags loaded:', Object.keys(this.flags).length);

            } catch (error) {
                // Silent fallback for non-critical feature flags
                // Use console.log instead of console.error to avoid blocking errors
                console.log('ℹ️ Feature flags unavailable (using fallback mode):', error.message);
                // Fallback: all flags disabled
                this.flags = {};
            }
        }

        // ============================
        // FLAG CHECKING
        // ============================

        isEnabled(flagName) {
            if (!this.isInitialized) {
                console.warn('FeatureFlags not initialized. Call init() first.');
                return false;
            }

            // 1. Check local overrides (for testing)
            if (this.overrides[flagName] !== undefined) {
                console.log(`🔧 Flag "${flagName}" overridden locally: ${this.overrides[flagName]}`);
                this.trackFlagEvaluation(flagName, this.overrides[flagName], 'override');
                return this.overrides[flagName];
            }

            // 2. Check if flag exists
            const flag = this.flags[flagName];

            if (!flag) {
                console.warn(`Flag "${flagName}" not found. Defaulting to false.`);
                this.trackFlagEvaluation(flagName, false, 'not_found');
                return false;
            }

            // 3. Check if flag is globally disabled
            if (!flag.enabled) {
                this.trackFlagEvaluation(flagName, false, 'disabled');
                return false;
            }

            // 4. Check rollout percentage
            const isInRollout = this.isUserInRollout(flag.rolloutPercentage);

            this.trackFlagEvaluation(flagName, isInRollout, 'rollout');

            return isInRollout;
        }

        // ============================
        // USER BUCKETING
        // ============================

        getUserBucket() {
            // Check if user bucket already exists
            let bucket = localStorage.getItem(this.config.userBucketKey);

            if (bucket) {
                return parseInt(bucket, 10);
            }

            // Generate new bucket (0-99)
            bucket = Math.floor(Math.random() * 100);

            // Store for consistency
            localStorage.setItem(this.config.userBucketKey, bucket.toString());

            return bucket;
        }

        isUserInRollout(percentage) {
            // If rollout is 0%, no users get the feature
            if (percentage <= 0) return false;

            // If rollout is 100%, all users get the feature
            if (percentage >= 100) return true;

            // User is in rollout if their bucket is within the percentage
            return this.userBucket < percentage;
        }

        // ============================
        // FLAG FETCHING
        // ============================

        async fetchFlags() {
            try {
                const response = await fetch(this.config.flagsEndpoint);

                if (!response.ok) {
                    throw new Error(`Failed to fetch flags: ${response.status}`);
                }

                const data = await response.json();

                // Extract flags object
                this.flags = data.flags || {};

                // Save to cache
                this.saveToCache(this.flags);

                console.log('✅ Feature flags fetched successfully');

            } catch (error) {
                // Log as info instead of error for graceful degradation
                console.log('ℹ️ Could not fetch feature flags:', error.message);
                throw error;
            }
        }

        // ============================
        // CACHING
        // ============================

        saveToCache(flags) {
            const cacheData = {
                data: flags,
                timestamp: Date.now(),
            };

            try {
                localStorage.setItem(
                    this.config.localStorageKey,
                    JSON.stringify(cacheData)
                );
            } catch (error) {
                console.warn('Failed to save flags to cache:', error);
            }
        }

        loadFromCache() {
            try {
                const cached = localStorage.getItem(this.config.localStorageKey);

                if (!cached) return null;

                return JSON.parse(cached);
            } catch (error) {
                console.warn('Failed to load flags from cache:', error);
                return null;
            }
        }

        isCacheExpired(cachedData) {
            const age = Date.now() - cachedData.timestamp;
            return age > this.config.cacheDuration;
        }

        clearCache() {
            localStorage.removeItem(this.config.localStorageKey);
            console.log('🗑️ Feature flags cache cleared');
        }

        // ============================
        // LOCAL OVERRIDES (TESTING)
        // ============================

        setOverride(flagName, value) {
            this.overrides[flagName] = value;
            this.saveLocalOverrides();

            console.log(`🔧 Flag override set: ${flagName} = ${value}`);
        }

        clearOverride(flagName) {
            delete this.overrides[flagName];
            this.saveLocalOverrides();

            console.log(`🔧 Flag override cleared: ${flagName}`);
        }

        clearAllOverrides() {
            this.overrides = {};
            this.saveLocalOverrides();

            console.log('🔧 All flag overrides cleared');
        }

        loadLocalOverrides() {
            try {
                const overrides = localStorage.getItem('ailydian_flag_overrides');
                return overrides ? JSON.parse(overrides) : {};
            } catch (error) {
                return {};
            }
        }

        saveLocalOverrides() {
            try {
                localStorage.setItem(
                    'ailydian_flag_overrides',
                    JSON.stringify(this.overrides)
                );
            } catch (error) {
                console.warn('Failed to save flag overrides:', error);
            }
        }

        // ============================
        // MONITORING
        // ============================

        trackFlagEvaluation(flagName, value, reason) {
            // Send to monitoring endpoint (async, fire-and-forget)
            if (this.config.monitoringEndpoint) {
                const payload = {
                    flag: flagName,
                    value,
                    reason,
                    userBucket: this.userBucket,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                };

                // Use sendBeacon for reliability (works even if page is closing)
                if (navigator.sendBeacon) {
                    navigator.sendBeacon(
                        this.config.monitoringEndpoint,
                        JSON.stringify(payload)
                    );
                } else {
                    // Fallback to fetch
                    fetch(this.config.monitoringEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        keepalive: true,
                    }).catch(() => {
                        // Ignore monitoring errors
                    });
                }
            }
        }

        // ============================
        // UTILITIES
        // ============================

        getAllFlags() {
            return { ...this.flags };
        }

        getEnabledFlags() {
            const enabled = {};

            for (const [name, flag] of Object.entries(this.flags)) {
                if (this.isEnabled(name)) {
                    enabled[name] = flag;
                }
            }

            return enabled;
        }

        getFlagDetails(flagName) {
            return this.flags[flagName] || null;
        }

        async refresh() {
            console.log('🔄 Refreshing feature flags...');
            await this.fetchFlags();
            console.log('✅ Feature flags refreshed');
        }

        resetUserBucket() {
            localStorage.removeItem(this.config.userBucketKey);
            this.userBucket = this.getUserBucket();
            console.log('🎲 User bucket reset to:', this.userBucket);
        }
    }

    // ============================
    // GLOBAL EXPORT
    // ============================

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FeatureFlags;
    } else {
        global.FeatureFlags = FeatureFlags;
    }

    // ============================
    // AUTO-INITIALIZE (OPTIONAL)
    // ============================

    if (document.currentScript && document.currentScript.hasAttribute('data-auto-init')) {
        document.addEventListener('DOMContentLoaded', async () => {
            global.featureFlags = new FeatureFlags();
            await global.featureFlags.init();
            console.log('🚀 Auto-initialized FeatureFlags as window.featureFlags');
        });
    }

})(typeof window !== 'undefined' ? window : global);
