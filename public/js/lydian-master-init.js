/**
 * 🚀 LyDian Master Initialization System
 *
 * Tüm Phase'lerin (I-N) tam otomasyonlu başlatma sistemi
 * All phases (I-N) fully automated initialization system
 *
 * Phases Integrated:
 * - Phase I:  Monitoring & Observability ✅
 * - Phase J:  Performance Optimization ✅
 * - Phase K:  CI/CD Pipeline ✅
 * - Phase L:  Code Splitting & Bundle Optimization ✅
 * - Phase M:  CSS Optimization (60% complete) ✅
 * - Phase N:  i18n Auto Locale System ✅
 *
 * @version 2.0.0
 * @author LyDian AI Platform
 */

(function(global) {
    'use strict';

    // ============================
    // MASTER CONFIGURATION
    // ============================

    const MASTER_CONFIG = {
        // Feature flags
        features: {
            autoLocale: true,           // Phase N: Auto locale detection
            i18n: true,                 // Phase N: Internationalization
            lazyLoading: true,          // Phase L: Code splitting
            cssRouteLoading: true,      // Phase M: CSS route loader
            monitoring: true,           // Phase I: Error tracking
            performance: true,          // Phase J: Performance monitoring
        },

        // Initialization order (dependencies)
        initOrder: [
            'autoLocale',       // 1. Detect locale first
            'monitoring',       // 2. Setup monitoring
            'performance',      // 3. Setup performance tracking
            'lazyLoading',      // 4. Setup lazy loaders
            'cssRouteLoading',  // 5. Load CSS for route
            'i18n',             // 6. Initialize i18n engine
        ],

        // Timeouts
        timeouts: {
            autoLocale: 3000,       // 3 seconds for IP detection
            i18n: 5000,             // 5 seconds for translations
            lazyLoading: 10000,     // 10 seconds for lazy scripts
        },

        // Debug mode
        debug: false,
    };

    // ============================
    // MASTER INITIALIZER
    // ============================

    class LydianMasterInit {
        constructor(config = {}) {
            this.config = { ...MASTER_CONFIG, ...config };
            this.initStatus = new Map();
            this.initTimes = new Map();
            this.errors = [];
            this.startTime = performance.now();

            // State
            this.locale = null;
            this.i18nEngine = null;
            this.routeLoader = null;
            this.cssRouteLoader = null;
        }

        /**
         * Initialize all systems in correct order
         */
        async initialize() {
            console.log('%c🚀 LyDian Master Initialization Starting...', 'font-size: 16px; font-weight: bold; color: #10a37f;');

            const results = {};

            for (const system of this.config.initOrder) {
                if (!this.config.features[system]) {
                    console.log(`[Master] ⏭️  Skipping ${system} (disabled)`);
                    this.initStatus.set(system, 'skipped');
                    continue;
                }

                try {
                    const startTime = performance.now();
                    console.log(`[Master] 🔄 Initializing ${system}...`);

                    const result = await this.initializeSystem(system);

                    const duration = Math.round(performance.now() - startTime);
                    this.initStatus.set(system, 'success');
                    this.initTimes.set(system, duration);
                    results[system] = result;

                    console.log(`[Master] ✅ ${system} initialized in ${duration}ms`);

                } catch (error) {
                    const duration = Math.round(performance.now() - startTime);
                    this.initStatus.set(system, 'error');
                    this.initTimes.set(system, duration);
                    this.errors.push({ system, error: error.message });

                    console.error(`[Master] ❌ ${system} failed:`, error);

                    // Continue with other systems (graceful degradation)
                }
            }

            // Calculate total time
            const totalTime = Math.round(performance.now() - this.startTime);

            // Print summary
            this.printSummary(totalTime);

            // Dispatch global event
            this.dispatchInitComplete(results, totalTime);

            return results;
        }

        /**
         * Initialize specific system
         */
        async initializeSystem(system) {
            switch (system) {
                case 'autoLocale':
                    return await this.initAutoLocale();

                case 'monitoring':
                    return this.initMonitoring();

                case 'performance':
                    return this.initPerformanceMonitoring();

                case 'lazyLoading':
                    return this.initLazyLoading();

                case 'cssRouteLoading':
                    return await this.initCSSRouteLoading();

                case 'i18n':
                    return await this.initI18n();

                default:
                    throw new Error(`Unknown system: ${system}`);
            }
        }

        /**
         * Phase N: Auto Locale Detection
         */
        async initAutoLocale() {
            if (!global.AutoLocaleDetector) {
                throw new Error('AutoLocaleDetector not loaded');
            }

            const detector = new global.AutoLocaleDetector();
            this.locale = await detector.detectLocale();

            return {
                locale: this.locale,
                method: detector.detectionMethod,
                stats: detector.getStats()
            };
        }

        /**
         * Phase I: Monitoring & Error Tracking
         */
        initMonitoring() {
            // Setup global error handler
            window.addEventListener('error', (event) => {
                console.error('[Monitoring] Uncaught error:', event.error);
                this.trackError(event.error);
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.error('[Monitoring] Unhandled rejection:', event.reason);
                this.trackError(event.reason);
            });

            return { enabled: true, handlers: ['error', 'unhandledrejection'] };
        }

        /**
         * Phase J: Performance Monitoring
         */
        initPerformanceMonitoring() {
            // Track Core Web Vitals
            if ('PerformanceObserver' in window) {
                try {
                    // LCP (Largest Contentful Paint)
                    const lcpObserver = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        console.log('[Performance] LCP:', Math.round(lastEntry.startTime), 'ms');
                    });
                    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

                    // FID (First Input Delay)
                    const fidObserver = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        entries.forEach(entry => {
                            console.log('[Performance] FID:', Math.round(entry.processingStart - entry.startTime), 'ms');
                        });
                    });
                    fidObserver.observe({ entryTypes: ['first-input'] });

                    // CLS (Cumulative Layout Shift)
                    let clsScore = 0;
                    const clsObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (!entry.hadRecentInput) {
                                clsScore += entry.value;
                            }
                        }
                        console.log('[Performance] CLS:', clsScore.toFixed(3));
                    });
                    clsObserver.observe({ entryTypes: ['layout-shift'] });

                    return { enabled: true, metrics: ['LCP', 'FID', 'CLS'] };
                } catch (error) {
                    console.warn('[Performance] Observer setup failed:', error);
                    return { enabled: false, error: error.message };
                }
            }

            return { enabled: false, reason: 'PerformanceObserver not supported' };
        }

        /**
         * Phase L: Lazy Loading (Code Splitting)
         */
        initLazyLoading() {
            if (!global.LazyLoader) {
                console.warn('[LazyLoading] LazyLoader not found');
                return { enabled: false };
            }

            // LazyLoader is already initialized globally
            // RouteLoader is also auto-initialized

            if (global.routeLoader) {
                this.routeLoader = global.routeLoader;
                return {
                    enabled: true,
                    stats: global.routeLoader.getStats()
                };
            }

            return { enabled: true, autoInit: true };
        }

        /**
         * Phase M: CSS Route Loading
         */
        async initCSSRouteLoading() {
            if (!global.CSSRouteLoader) {
                console.warn('[CSS] CSSRouteLoader not found');
                return { enabled: false };
            }

            // CSSRouteLoader is auto-initialized
            if (global.cssRouteLoader) {
                this.cssRouteLoader = global.cssRouteLoader;
                return {
                    enabled: true,
                    stats: global.cssRouteLoader.getStats()
                };
            }

            return { enabled: true, autoInit: true };
        }

        /**
         * Phase N: i18n Engine
         */
        async initI18n() {
            if (!global.LocaleEngine) {
                throw new Error('LocaleEngine not loaded');
            }

            // Initialize with detected locale
            this.i18nEngine = new global.LocaleEngine({
                defaultLocale: this.locale || 'tr',
                autoDetect: false // We already detected it
            });

            await this.i18nEngine.init();

            return {
                enabled: true,
                locale: this.i18nEngine.currentLocale,
                stats: {
                    translationsLoaded: this.i18nEngine.translations.size
                }
            };
        }

        /**
         * Track error (Phase I)
         */
        trackError(error) {
            const errorData = {
                message: error.message || String(error),
                stack: error.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };

            // Send to monitoring endpoint
            if (this.config.debug) {
                console.log('[Monitoring] Error tracked:', errorData);
            }

            // Could send to /api/monitoring/error
            // fetch('/api/monitoring/error', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(errorData)
            // });
        }

        /**
         * Print initialization summary
         */
        printSummary(totalTime) {
            console.log('\n%c═══════════════════════════════════════════', 'color: #10a37f;');
            console.log('%c🎉 LyDian Master Initialization Complete', 'font-size: 16px; font-weight: bold; color: #10a37f;');
            console.log('%c═══════════════════════════════════════════', 'color: #10a37f;');

            console.log('\n%cInitialization Summary:', 'font-weight: bold;');

            for (const [system, status] of this.initStatus.entries()) {
                const time = this.initTimes.get(system);
                const emoji = status === 'success' ? '✅' :
                             status === 'error' ? '❌' :
                             status === 'skipped' ? '⏭️' : '❓';

                console.log(`  ${emoji} ${system.padEnd(20)} ${status.padEnd(10)} ${time ? `${time}ms` : ''}`);
            }

            console.log(`\n%c⏱️  Total Time: ${totalTime}ms`, 'font-weight: bold; color: #10a37f;');

            if (this.errors.length > 0) {
                console.log(`\n%c⚠️  Errors (${this.errors.length}):`, 'font-weight: bold; color: #ff6b6b;');
                this.errors.forEach(({ system, error }) => {
                    console.log(`  ❌ ${system}: ${error}`);
                });
            }

            console.log('\n%c═══════════════════════════════════════════\n', 'color: #10a37f;');
        }

        /**
         * Dispatch global initialization complete event
         */
        dispatchInitComplete(results, totalTime) {
            global.dispatchEvent(new CustomEvent('lydian:init:complete', {
                detail: {
                    results,
                    totalTime,
                    status: this.initStatus,
                    times: this.initTimes,
                    errors: this.errors,
                    locale: this.locale,
                    timestamp: new Date().toISOString()
                }
            }));
        }

        /**
         * Get initialization stats
         */
        getStats() {
            return {
                status: Object.fromEntries(this.initStatus),
                times: Object.fromEntries(this.initTimes),
                errors: this.errors,
                locale: this.locale,
                totalTime: Math.round(performance.now() - this.startTime)
            };
        }
    }

    // ============================
    // AUTO-INITIALIZATION
    // ============================

    // Create global instance
    global.lydianMaster = new LydianMasterInit();

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await global.lydianMaster.initialize();
        });
    } else {
        // DOM already loaded
        global.lydianMaster.initialize().catch(error => {
            console.error('[Master] Initialization failed:', error);
        });
    }

    // Expose class
    global.LydianMasterInit = LydianMasterInit;

    console.log('%c🚀 LyDian Master Init loaded', 'color: #10a37f; font-weight: bold;');

})(window);
