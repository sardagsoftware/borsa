/**
 * 📊 AZURE APPLICATION INSIGHTS - BROWSER SDK
 * Client-side telemetry for real user monitoring (RUM)
 *
 * Features:
 * - Page view tracking
 * - Custom event tracking
 * - Exception tracking
 * - Performance monitoring
 * - User behavior analytics
 * - AJAX request tracking
 */

// Application Insights Browser SDK initialization
(function() {
    'use strict';

    // Configuration from environment
    const INSIGHTS_CONFIG = {
        connectionString: window.AZURE_INSIGHTS_CONNECTION_STRING || '',
        instrumentationKey: window.AZURE_INSIGHTS_KEY || '',
        enableAutoRouteTracking: true,
        enableCorsCorrelation: true,
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
        disableFetchTracking: false,
        disableAjaxTracking: false,
        maxAjaxCallsPerView: 500,
        disableExceptionTracking: false,
        disableTelemetry: false,
        enableDebug: false,
        loggingLevelConsole: 0,
        loggingLevelTelemetry: 1,
        samplingPercentage: 100, // Track 100% of sessions
        autoTrackPageVisitTime: true,
        disablePageUnloadEvents: [],
        overridePageViewDuration: false,
        maxBatchSizeInBytes: 10000,
        maxBatchInterval: 15000,
        disableCorrelationHeaders: false,
        distributedTracingMode: 1 // AI and W3C mode
    };

    // Initialize Application Insights
    const appInsights = window.applicationInsights || {};

    // Configuration object
    const config = {
        instrumentationKey: INSIGHTS_CONFIG.instrumentationKey,
        connectionString: INSIGHTS_CONFIG.connectionString,
        enableAutoRouteTracking: INSIGHTS_CONFIG.enableAutoRouteTracking,
        enableCorsCorrelation: INSIGHTS_CONFIG.enableCorsCorrelation,
        enableRequestHeaderTracking: INSIGHTS_CONFIG.enableRequestHeaderTracking,
        enableResponseHeaderTracking: INSIGHTS_CONFIG.enableResponseHeaderTracking,
        disableFetchTracking: INSIGHTS_CONFIG.disableFetchTracking,
        disableAjaxTracking: INSIGHTS_CONFIG.disableAjaxTracking,
        maxAjaxCallsPerView: INSIGHTS_CONFIG.maxAjaxCallsPerView,
        disableExceptionTracking: INSIGHTS_CONFIG.disableExceptionTracking,
        disableTelemetry: INSIGHTS_CONFIG.disableTelemetry,
        enableDebug: INSIGHTS_CONFIG.enableDebug,
        loggingLevelConsole: INSIGHTS_CONFIG.loggingLevelConsole,
        loggingLevelTelemetry: INSIGHTS_CONFIG.loggingLevelTelemetry,
        samplingPercentage: INSIGHTS_CONFIG.samplingPercentage,
        autoTrackPageVisitTime: INSIGHTS_CONFIG.autoTrackPageVisitTime
    };

    // Custom telemetry initializer for PII scrubbing
    const telemetryInitializer = (envelope) => {
        // Remove PII from URLs
        if (envelope.baseData && envelope.baseData.url) {
            envelope.baseData.url = scrubPII(envelope.baseData.url);
        }

        // Remove PII from messages
        if (envelope.baseData && envelope.baseData.message) {
            envelope.baseData.message = scrubPII(envelope.baseData.message);
        }

        // Add custom properties
        envelope.data = envelope.data || {};
        envelope.data.environment = window.location.hostname.includes('localhost') ? 'development' : 'production';
        envelope.data.userAgent = navigator.userAgent;
        envelope.data.screenResolution = `${screen.width}x${screen.height}`;
        envelope.data.viewport = `${window.innerWidth}x${window.innerHeight}`;
        envelope.data.language = navigator.language;
        envelope.data.platform = navigator.platform;

        return true;
    };

    // PII scrubbing function
    function scrubPII(text) {
        if (!text) return text;

        // Remove email addresses
        text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');

        // Remove phone numbers (international format)
        text = text.replace(/\+?[\d\s\-\(\)]{10,}/g, '[PHONE_REDACTED]');

        // Remove credit card numbers
        text = text.replace(/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, '[CARD_REDACTED]');

        // Remove IP addresses
        text = text.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]');

        // Remove API keys (common patterns)
        text = text.replace(/[a-zA-Z0-9]{32,}/g, (match) => {
            if (match.length > 32) return '[API_KEY_REDACTED]';
            return match;
        });

        // Remove JWT tokens
        text = text.replace(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[JWT_REDACTED]');

        // Remove social security numbers (SSN)
        text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');

        return text;
    }

    // Initialize Application Insights if connection string is available
    if (INSIGHTS_CONFIG.connectionString || INSIGHTS_CONFIG.instrumentationKey) {
        try {
            // Load Application Insights SDK from CDN
            const script = document.createElement('script');
            script.src = 'https://js.monitor.azure.com/scripts/b/ai.2.min.js';
            script.async = true;
            script.crossOrigin = 'anonymous';

            script.onload = function() {
                if (window.Microsoft && window.Microsoft.ApplicationInsights) {
                    const ApplicationInsights = window.Microsoft.ApplicationInsights;
                    const appInsightsInstance = new ApplicationInsights.ApplicationInsights({
                        config: config
                    });

                    // Add telemetry initializer
                    appInsightsInstance.addTelemetryInitializer(telemetryInitializer);

                    // Load and track
                    appInsightsInstance.loadAppInsights();
                    appInsightsInstance.trackPageView();

                    // Expose to global scope
                    window.appInsights = appInsightsInstance;

                    console.log('✅ Azure Application Insights Browser SDK initialized');
                }
            };

            script.onerror = function() {
                console.warn('⚠️ Failed to load Azure Application Insights SDK');
            };

            document.head.appendChild(script);
        } catch (error) {
            console.error('❌ Azure Application Insights initialization error:', error);
        }
    } else {
        console.warn('⚠️ Azure Application Insights not configured - set AZURE_INSIGHTS_CONNECTION_STRING');
    }

    // Helper functions for custom tracking
    window.AilydianInsights = {
        // Track custom event
        trackEvent: function(name, properties, measurements) {
            if (window.appInsights) {
                window.appInsights.trackEvent({
                    name: name,
                    properties: properties || {},
                    measurements: measurements || {}
                });
            }
        },

        // Track custom metric
        trackMetric: function(name, average, properties) {
            if (window.appInsights) {
                window.appInsights.trackMetric({
                    name: name,
                    average: average,
                    properties: properties || {}
                });
            }
        },

        // Track exception
        trackException: function(exception, properties) {
            if (window.appInsights) {
                window.appInsights.trackException({
                    exception: exception,
                    properties: properties || {}
                });
            }
        },

        // Track page view (manual)
        trackPageView: function(name, url, properties, measurements) {
            if (window.appInsights) {
                window.appInsights.trackPageView({
                    name: name,
                    uri: url || window.location.href,
                    properties: properties || {},
                    measurements: measurements || {}
                });
            }
        },

        // Track AJAX request
        trackDependency: function(id, method, url, duration, success, resultCode) {
            if (window.appInsights) {
                window.appInsights.trackDependencyData({
                    id: id,
                    method: method,
                    absoluteUrl: url,
                    duration: duration,
                    success: success,
                    resultCode: resultCode
                });
            }
        },

        // Set authenticated user context
        setAuthenticatedUser: function(userId, accountId) {
            if (window.appInsights) {
                window.appInsights.setAuthenticatedUserContext(userId, accountId, true);
            }
        },

        // Clear authenticated user context
        clearAuthenticatedUser: function() {
            if (window.appInsights) {
                window.appInsights.clearAuthenticatedUserContext();
            }
        },

        // Start tracking page load time
        startTrackPage: function(name) {
            if (window.appInsights) {
                window.appInsights.startTrackPage(name);
            }
        },

        // Stop tracking page load time
        stopTrackPage: function(name, url, properties) {
            if (window.appInsights) {
                window.appInsights.stopTrackPage(name, url, properties || {});
            }
        },

        // Flush telemetry (force send)
        flush: function() {
            if (window.appInsights) {
                window.appInsights.flush();
            }
        }
    };

    // Automatic event tracking
    document.addEventListener('DOMContentLoaded', function() {
        // Track all button clicks
        document.addEventListener('click', function(e) {
            const target = e.target.closest('button, a[href], [data-track]');
            if (target) {
                const eventName = target.getAttribute('data-track-event') || 'ButtonClick';
                const properties = {
                    elementId: target.id || 'unknown',
                    elementClass: target.className || 'unknown',
                    elementText: target.textContent?.substring(0, 50) || 'unknown',
                    elementTag: target.tagName,
                    pageUrl: window.location.pathname
                };

                window.AilydianInsights.trackEvent(eventName, properties);
            }
        });

        // Track form submissions
        document.addEventListener('submit', function(e) {
            const form = e.target;
            const properties = {
                formId: form.id || 'unknown',
                formAction: form.action || window.location.href,
                formMethod: form.method || 'GET',
                pageUrl: window.location.pathname
            };

            window.AilydianInsights.trackEvent('FormSubmit', properties);
        });

        // Track input focus (for engagement tracking)
        let focusedInputs = new Set();
        document.addEventListener('focus', function(e) {
            if (e.target.matches('input, textarea, select')) {
                const inputId = e.target.id || e.target.name || 'unknown';
                if (!focusedInputs.has(inputId)) {
                    focusedInputs.add(inputId);
                    window.AilydianInsights.trackEvent('InputFocus', {
                        inputId: inputId,
                        inputType: e.target.type || 'unknown',
                        pageUrl: window.location.pathname
                    });
                }
            }
        }, true);

        // Track scroll depth
        let maxScrollDepth = 0;
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                const scrollDepth = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
                if (scrollDepth > maxScrollDepth) {
                    maxScrollDepth = scrollDepth;
                    if (maxScrollDepth >= 25 && maxScrollDepth < 50) {
                        window.AilydianInsights.trackEvent('ScrollDepth', { depth: '25%', pageUrl: window.location.pathname });
                    } else if (maxScrollDepth >= 50 && maxScrollDepth < 75) {
                        window.AilydianInsights.trackEvent('ScrollDepth', { depth: '50%', pageUrl: window.location.pathname });
                    } else if (maxScrollDepth >= 75 && maxScrollDepth < 100) {
                        window.AilydianInsights.trackEvent('ScrollDepth', { depth: '75%', pageUrl: window.location.pathname });
                    } else if (maxScrollDepth >= 100) {
                        window.AilydianInsights.trackEvent('ScrollDepth', { depth: '100%', pageUrl: window.location.pathname });
                    }
                }
            }, 500);
        });

        // Track page visibility changes
        document.addEventListener('visibilitychange', function() {
            window.AilydianInsights.trackEvent('PageVisibilityChange', {
                state: document.hidden ? 'hidden' : 'visible',
                pageUrl: window.location.pathname
            });
        });

        // Track page unload (session end)
        window.addEventListener('beforeunload', function() {
            window.AilydianInsights.trackEvent('PageUnload', {
                pageUrl: window.location.pathname,
                sessionDuration: Date.now() - window.performance.timing.navigationStart
            });
            window.AilydianInsights.flush();
        });
    });

    // Track unhandled errors
    window.addEventListener('error', function(e) {
        window.AilydianInsights.trackException(e.error || new Error(e.message), {
            source: 'window.onerror',
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            pageUrl: window.location.pathname
        });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', function(e) {
        window.AilydianInsights.trackException(new Error(e.reason), {
            source: 'unhandledrejection',
            pageUrl: window.location.pathname
        });
    });

    // Track performance metrics
    window.addEventListener('load', function() {
        setTimeout(function() {
            if (window.performance && window.performance.timing) {
                const timing = window.performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
                const responseTime = timing.responseEnd - timing.requestStart;
                const renderTime = timing.domComplete - timing.domLoading;

                window.AilydianInsights.trackMetric('PageLoadTime', loadTime, {
                    pageUrl: window.location.pathname
                });

                window.AilydianInsights.trackMetric('DOMReadyTime', domReadyTime, {
                    pageUrl: window.location.pathname
                });

                window.AilydianInsights.trackMetric('ResponseTime', responseTime, {
                    pageUrl: window.location.pathname
                });

                window.AilydianInsights.trackMetric('RenderTime', renderTime, {
                    pageUrl: window.location.pathname
                });
            }
        }, 0);
    });

    console.log('📊 Azure Application Insights Browser SDK script loaded');
})();
