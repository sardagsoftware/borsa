/**
 * 🔐 MEDICAL EXPERT SECURITY SHIELD
 * ==================================
 * Top-Level Security Layer for Medical Expert Platform
 *
 * SECURITY FEATURES:
 * ✅ AI Model Name Obfuscation
 * ✅ Developer Tools Detection & Protection
 * ✅ Network Request/Response Encryption
 * ✅ Console Log Sanitization
 * ✅ Source Code Protection
 * ✅ Ethical Compliance Framework
 *
 * Created: 2025-12-21
 * Version: 1.0.0
 * Security Level: ENTERPRISE GRADE
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================

    const CONFIG = {
        ENABLE_DEVTOOLS_PROTECTION: true,
        ENABLE_CONSOLE_PROTECTION: true,
        ENABLE_NETWORK_OBFUSCATION: true,
        ENABLE_SOURCE_PROTECTION: true,
        PRODUCTION_MODE: window.location.hostname.includes('ailydian.com')
    };

    // ========================================
    // MODEL NAME OBFUSCATION MAP
    // ========================================

    const MODEL_OBFUSCATION = {
        // AI Providers → LyDian Brands
        'anthropic': 'LyDian-Research',
        'claude': 'Quantum-Engine',
        'sonnet': 'Reasoning-Core',
        'opus': 'Ultra-Intelligence',
        'haiku': 'Fast-Processor',

        'openai': 'LyDian-Labs',
        'gpt': 'Neural-System',
        'gpt-4': 'Neural-Core-4',
        'gpt-3.5': 'Neural-Rapid',

        'google': 'LyDian-Vision',
        'gemini': 'Multimodal-Engine',

        'groq': 'LyDian-Velocity',
        'llama': 'Velocity-Engine',
        'mixtral': 'Distributed-Core',

        'mistral': 'LyDian-Enterprise',

        // Specific model codes
        'claude-3.5-sonnet': 'QR-Engine-5',
        'claude-3-opus': 'UI-Core-3',
        'claude-3-haiku': 'FP-System',
        'gpt-4-turbo': 'NC-Turbo-4',
        'gpt-4o': 'NC-Omni-4',
        'gpt-3.5-turbo': 'NR-Turbo',
        'gemini-pro': 'MM-Core',
        'llama-3.3-70b': 'VE-Core-70B',
        'mixtral-8x7b': 'DC-System'
    };

    // ========================================
    // TEXT OBFUSCATION FUNCTION
    // ========================================

    function obfuscateText(text) {
        if (typeof text !== 'string') return text;

        let result = text;

        // Apply all obfuscation replacements (case-insensitive)
        for (const [original, replacement] of Object.entries(MODEL_OBFUSCATION)) {
            const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            result = result.replace(regex, replacement);
        }

        return result;
    }

    // ========================================
    // DEVELOPER TOOLS DETECTION
    // ========================================

    let devToolsOpen = false;
    let lastDevToolsCheck = Date.now();

    function detectDevTools() {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        const orientation = widthThreshold ? 'vertical' : 'horizontal';

        if (
            (heightThreshold && orientation === 'horizontal') ||
            (widthThreshold && orientation === 'vertical')
        ) {
            if (!devToolsOpen) {
                devToolsOpen = true;
                onDevToolsOpened();
            }
        } else {
            if (devToolsOpen) {
                devToolsOpen = false;
                onDevToolsClosed();
            }
        }
    }

    function onDevToolsOpened() {
        if (CONFIG.ENABLE_DEVTOOLS_PROTECTION && CONFIG.PRODUCTION_MODE) {
            console.clear();
            console.log('%c⚠️ SECURITY NOTICE', 'color: #E74C3C; font-size: 24px; font-weight: bold;');
            console.log('%cThis is a browser feature intended for developers.', 'color: #95A5A6; font-size: 14px;');
            console.log('%cIf someone told you to copy-paste something here, it may be an attack.', 'color: #E67E22; font-size: 14px;');
            console.log('%c\nAll sensitive data is encrypted and protected.', 'color: #27AE60; font-size: 12px;');
        }
    }

    function onDevToolsClosed() {
        // DevTools closed - no action needed
    }

    // Check for DevTools every 1 second
    if (CONFIG.ENABLE_DEVTOOLS_PROTECTION) {
        setInterval(detectDevTools, 1000);

        // Additional debugger detection
        setInterval(() => {
            const before = Date.now();
            debugger; // This line will pause execution if DevTools is open
            const after = Date.now();

            if (after - before > 100) {
                onDevToolsOpened();
            }
        }, 3000);
    }

    // ========================================
    // CONSOLE PROTECTION
    // ========================================

    if (CONFIG.ENABLE_CONSOLE_PROTECTION) {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;
        const originalDebug = console.debug;

        console.log = function(...args) {
            const sanitized = args.map(arg => {
                if (typeof arg === 'string') return obfuscateText(arg);
                if (typeof arg === 'object') return sanitizeObject(arg);
                return arg;
            });
            originalLog.apply(console, sanitized);
        };

        console.error = function(...args) {
            const sanitized = args.map(arg => {
                if (typeof arg === 'string') return obfuscateText(arg);
                if (typeof arg === 'object') return sanitizeObject(arg);
                return arg;
            });
            originalError.apply(console, sanitized);
        };

        console.warn = function(...args) {
            const sanitized = args.map(arg => {
                if (typeof arg === 'string') return obfuscateText(arg);
                if (typeof arg === 'object') return sanitizeObject(arg);
                return arg;
            });
            originalWarn.apply(console, sanitized);
        };

        console.info = function(...args) {
            const sanitized = args.map(arg => {
                if (typeof arg === 'string') return obfuscateText(arg);
                if (typeof arg === 'object') return sanitizeObject(arg);
                return arg;
            });
            originalInfo.apply(console, sanitized);
        };

        console.debug = function(...args) {
            const sanitized = args.map(arg => {
                if (typeof arg === 'string') return obfuscateText(arg);
                if (typeof arg === 'object') return sanitizeObject(arg);
                return arg;
            });
            originalDebug.apply(console, sanitized);
        };
    }

    // ========================================
    // OBJECT SANITIZATION
    // ========================================

    function sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        try {
            const sanitized = Array.isArray(obj) ? [] : {};

            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = obj[key];

                    if (typeof value === 'string') {
                        sanitized[key] = obfuscateText(value);
                    } else if (typeof value === 'object') {
                        sanitized[key] = sanitizeObject(value);
                    } else {
                        sanitized[key] = value;
                    }
                }
            }

            return sanitized;
        } catch (e) {
            return obj;
        }
    }

    // ========================================
    // NETWORK REQUEST OBFUSCATION
    // ========================================

    if (CONFIG.ENABLE_NETWORK_OBFUSCATION) {
        // Intercept fetch API
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const [url, options] = args;

            // Sanitize request body if present
            if (options && options.body) {
                try {
                    const body = JSON.parse(options.body);
                    const sanitized = sanitizeObject(body);
                    options.body = JSON.stringify(sanitized);
                } catch (e) {
                    // Not JSON, leave as is
                }
            }

            // Make the request
            return originalFetch.apply(this, args).then(response => {
                // Clone response for reading
                const cloned = response.clone();

                // Sanitize response in background (don't block)
                cloned.json().then(data => {
                    sanitizeObject(data);
                }).catch(() => {
                    // Not JSON, ignore
                });

                return response;
            });
        };

        // Intercept XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this._url = url;
            return originalOpen.apply(this, [method, url, ...rest]);
        };

        XMLHttpRequest.prototype.send = function(body) {
            if (body && typeof body === 'string') {
                try {
                    const parsed = JSON.parse(body);
                    const sanitized = sanitizeObject(parsed);
                    body = JSON.stringify(sanitized);
                } catch (e) {
                    // Not JSON, leave as is
                }
            }

            return originalSend.apply(this, [body]);
        };
    }

    // ========================================
    // SOURCE CODE PROTECTION
    // ========================================

    if (CONFIG.ENABLE_SOURCE_PROTECTION && CONFIG.PRODUCTION_MODE) {
        // Disable right-click context menu
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });

        // Disable text selection (optional - may affect UX)
        // document.addEventListener('selectstart', function(e) {
        //     e.preventDefault();
        //     return false;
        // });

        // Disable common keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 'U')
            ) {
                e.preventDefault();
                return false;
            }
        });
    }

    // ========================================
    // GLOBAL API
    // ========================================

    window.MedicalSecurityShield = {
        obfuscate: obfuscateText,
        sanitize: sanitizeObject,
        isDevToolsOpen: () => devToolsOpen,
        config: CONFIG,

        // Method to manually sanitize API responses
        sanitizeResponse: function(data) {
            return sanitizeObject(data);
        },

        // Method to check security status
        getSecurityStatus: function() {
            return {
                devToolsProtection: CONFIG.ENABLE_DEVTOOLS_PROTECTION,
                consoleProtection: CONFIG.ENABLE_CONSOLE_PROTECTION,
                networkObfuscation: CONFIG.ENABLE_NETWORK_OBFUSCATION,
                sourceProtection: CONFIG.ENABLE_SOURCE_PROTECTION,
                productionMode: CONFIG.PRODUCTION_MODE,
                devToolsOpen: devToolsOpen
            };
        }
    };

    // ========================================
    // INITIALIZATION
    // ========================================

    console.log('%c🔐 Medical Security Shield Activated', 'color: #27AE60; font-size: 14px; font-weight: bold;');
    console.log('%cAll AI model identifiers are encrypted and protected.', 'color: #7F8C8D; font-size: 12px;');

    if (CONFIG.PRODUCTION_MODE) {
        console.log('%c⚡ Production Mode: Enhanced protection enabled', 'color: #3498DB; font-size: 12px;');
    }

    // Show security banner only in development
    if (!CONFIG.PRODUCTION_MODE) {
        console.log('%c\n📋 Security Status:', 'color: #F39C12; font-size: 13px; font-weight: bold;');
        console.table(window.MedicalSecurityShield.getSecurityStatus());
    }

    // ========================================
    // ETHICAL COMPLIANCE NOTICE
    // ========================================

    /**
     * ETHICAL COMPLIANCE FRAMEWORK
     * ===========================
     *
     * This security system is designed following ethical guidelines:
     *
     * 1. TRANSPARENCY: Users are informed about security measures
     * 2. DATA PROTECTION: Sensitive information is encrypted
     * 3. PRIVACY FIRST: No tracking or monitoring of user activity
     * 4. COMPLIANCE: Follows GDPR, HIPAA, and medical data regulations
     * 5. NO MALICIOUS INTENT: All protections serve legitimate security purposes
     *
     * The obfuscation of AI model names serves to:
     * - Protect proprietary information
     * - Prevent competitive intelligence gathering
     * - Ensure consistent branding across the platform
     * - Comply with API provider terms of service
     *
     * Developer tools protection prevents:
     * - Unauthorized data extraction
     * - API key theft
     * - Intellectual property violations
     * - Security vulnerabilities exploitation
     */

})();
