/**
 * 🔒 PII SCRUBBING MIDDLEWARE
 * Removes personally identifiable information (PII) from logs, telemetry, and responses
 *
 * Purpose: GDPR/CCPA compliance for Azure Application Insights telemetry
 *
 * Scrubbed data types:
 * - Email addresses
 * - Phone numbers (international format)
 * - Credit card numbers
 * - IP addresses
 * - API keys & secrets
 * - JWT tokens
 * - Social Security Numbers (SSN)
 * - Passwords
 * - OAuth tokens
 */

// Regex patterns for PII detection
const PII_PATTERNS = {
    // Email addresses (RFC 5322 simplified)
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

    // Phone numbers (international)
    phone: /\+?[\d\s\-\(\)]{10,}/g,

    // Credit card numbers (Visa, Mastercard, Amex, Discover)
    creditCard: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,

    // IP addresses (IPv4)
    ipv4: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,

    // API keys (32+ alphanumeric characters)
    apiKey: /\b[a-zA-Z0-9]{32,}\b/g,

    // JWT tokens (3 base64 segments separated by dots)
    jwt: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,

    // Social Security Numbers (SSN) - US format
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,

    // Passwords in JSON/query strings
    password: /(password|passwd|pwd|secret)["\s:=]+([^&\s"']+)/gi,

    // OAuth access tokens
    oauthToken: /(access_token|bearer)["\s:=]+([a-zA-Z0-9_\-\.]+)/gi,

    // Authorization headers
    authHeader: /(Authorization:\s*Bearer\s+)([a-zA-Z0-9_\-\.]+)/gi
};

// Replacement text for scrubbed data
const REPLACEMENTS = {
    email: '[EMAIL_REDACTED]',
    phone: '[PHONE_REDACTED]',
    creditCard: '[CARD_REDACTED]',
    ipv4: '[IP_REDACTED]',
    apiKey: '[API_KEY_REDACTED]',
    jwt: '[JWT_REDACTED]',
    ssn: '[SSN_REDACTED]',
    password: '$1[PASSWORD_REDACTED]',
    oauthToken: '$1[TOKEN_REDACTED]',
    authHeader: '$1[TOKEN_REDACTED]'
};

/**
 * Scrub PII from a string
 * @param {string} text - Input text
 * @returns {string} - Scrubbed text
 */
function scrubText(text) {
    if (typeof text !== 'string' || !text) return text;

    let scrubbed = text;

    // Apply all PII patterns
    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
        scrubbed = scrubbed.replace(pattern, REPLACEMENTS[type]);
    }

    return scrubbed;
}

/**
 * Recursively scrub PII from an object
 * @param {*} obj - Input object
 * @returns {*} - Scrubbed object
 */
function scrubObject(obj) {
    if (obj === null || obj === undefined) return obj;

    // Handle primitives
    if (typeof obj === 'string') {
        return scrubText(obj);
    }

    if (typeof obj !== 'object') {
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => scrubObject(item));
    }

    // Handle objects
    const scrubbed = {};
    for (const [key, value] of Object.entries(obj)) {
        // Skip certain keys entirely (don't even scrub, just remove)
        if (['password', 'passwordHash', 'secret', 'apiKey', 'token', 'accessToken', 'refreshToken'].includes(key)) {
            scrubbed[key] = '[REDACTED]';
        } else {
            scrubbed[key] = scrubObject(value);
        }
    }

    return scrubbed;
}

/**
 * Express middleware for PII scrubbing
 * Scrubs request and response data before logging/telemetry
 */
function piiScrubbingMiddleware(req, res, next) {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Override res.json to scrub PII
    res.json = function(data) {
        const scrubbedData = scrubObject(data);
        return originalJson(scrubbedData);
    };

    // Override res.send to scrub PII
    res.send = function(data) {
        if (typeof data === 'object') {
            const scrubbedData = scrubObject(data);
            return originalSend(scrubbedData);
        }
        if (typeof data === 'string') {
            const scrubbedData = scrubText(data);
            return originalSend(scrubbedData);
        }
        return originalSend(data);
    };

    // Scrub request body (for logging)
    if (req.body) {
        req.scrubbedBody = scrubObject(req.body);
    }

    // Scrub query parameters
    if (req.query) {
        req.scrubbedQuery = scrubObject(req.query);
    }

    // Scrub request headers (for logging)
    if (req.headers) {
        const scrubbedHeaders = { ...req.headers };
        if (scrubbedHeaders.authorization) {
            scrubbedHeaders.authorization = '[REDACTED]';
        }
        if (scrubbedHeaders['x-api-key']) {
            scrubbedHeaders['x-api-key'] = '[REDACTED]';
        }
        req.scrubbedHeaders = scrubbedHeaders;
    }

    next();
}

/**
 * Scrub PII from Azure Application Insights telemetry
 * Use with appInsights.defaultClient.addTelemetryProcessor
 */
function azureInsightsTelemetryProcessor(envelope) {
    // Scrub URL
    if (envelope.data && envelope.data.baseData && envelope.data.baseData.url) {
        envelope.data.baseData.url = scrubText(envelope.data.baseData.url);
    }

    // Scrub message
    if (envelope.data && envelope.data.baseData && envelope.data.baseData.message) {
        envelope.data.baseData.message = scrubText(envelope.data.baseData.message);
    }

    // Scrub properties
    if (envelope.data && envelope.data.baseData && envelope.data.baseData.properties) {
        envelope.data.baseData.properties = scrubObject(envelope.data.baseData.properties);
    }

    // Scrub custom dimensions
    if (envelope.data && envelope.data.baseData && envelope.data.baseData.customDimensions) {
        envelope.data.baseData.customDimensions = scrubObject(envelope.data.baseData.customDimensions);
    }

    // Scrub exception details
    if (envelope.data && envelope.data.baseData && envelope.data.baseData.exceptions) {
        envelope.data.baseData.exceptions = envelope.data.baseData.exceptions.map(exception => {
            return {
                ...exception,
                message: scrubText(exception.message),
                stack: scrubText(exception.stack || '')
            };
        });
    }

    return true; // Return true to keep the telemetry
}

/**
 * Console log wrapper that scrubs PII before logging
 */
const secureLogs = {
    log: (...args) => {
        console.log(...args.map(arg => typeof arg === 'object' ? scrubObject(arg) : scrubText(String(arg))));
    },

    info: (...args) => {
        console.info(...args.map(arg => typeof arg === 'object' ? scrubObject(arg) : scrubText(String(arg))));
    },

    warn: (...args) => {
        console.warn(...args.map(arg => typeof arg === 'object' ? scrubObject(arg) : scrubText(String(arg))));
    },

    error: (...args) => {
        console.error(...args.map(arg => typeof arg === 'object' ? scrubObject(arg) : scrubText(String(arg))));
    },

    debug: (...args) => {
        if (process.env.DEBUG) {
            console.debug(...args.map(arg => typeof arg === 'object' ? scrubObject(arg) : scrubText(String(arg))));
        }
    }
};

/**
 * Utility: Check if a string contains PII
 * @param {string} text - Input text
 * @returns {boolean} - True if PII detected
 */
function containsPII(text) {
    if (typeof text !== 'string' || !text) return false;

    for (const pattern of Object.values(PII_PATTERNS)) {
        if (pattern.test(text)) {
            return true;
        }
    }

    return false;
}

/**
 * Utility: Get PII types found in text
 * @param {string} text - Input text
 * @returns {string[]} - Array of PII types found
 */
function detectPIITypes(text) {
    if (typeof text !== 'string' || !text) return [];

    const found = [];

    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
        if (pattern.test(text)) {
            found.push(type);
        }
    }

    return found;
}

module.exports = {
    scrubText,
    scrubObject,
    piiScrubbingMiddleware,
    azureInsightsTelemetryProcessor,
    secureLogs,
    containsPII,
    detectPIITypes,
    PII_PATTERNS,
    REPLACEMENTS
};
