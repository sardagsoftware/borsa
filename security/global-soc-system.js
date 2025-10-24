/**
 * 🛡️ GLOBAL SECURITY OPERATIONS CENTER (SOC) SYSTEM
 * Deep-level security and cyber protection implementation
 * Enterprise-grade security monitoring and threat detection
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class GlobalSOCSystem extends EventEmitter {
    constructor() {
        super();
        this.threats = new Map();
        this.blacklist = new Set();
        this.whitelist = new Set();
        this.securityLogs = [];
        this.encryptionKeys = new Map();
        this.activeConnections = new Map();
        this.rateLimiter = new Map();
        this.securityPolicies = {
            maxConnectionsPerIP: 100,
            rateLimitWindow: 60000, // 1 minute
            maxRequestsPerMinute: 1000,
            encryptionAlgorithm: 'aes-256-gcm',
            hashAlgorithm: 'sha256',
            maxPayloadSize: 50 * 1024 * 1024, // 50MB
            allowedFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.mp3', '.wav'],
            blockedPatterns: [
                /(<script[^>]*>.*?<\/script>)/gi,
                /(javascript:)/gi,
                /(onload|onclick|onerror)/gi,
                /(eval\()/gi,
                /(document\.cookie)/gi,
                /(window\.location)/gi
            ]
        };

        this.init();
    }

    async init() {
        console.log('🛡️ Initializing Global SOC System...');

        await this.setupSecurityDirectories();
        await this.loadSecurityPolicies();
        await this.initializeEncryption();
        this.startThreatMonitoring();
        this.setupSecurityMiddleware();

        console.log('✅ Global SOC System initialized');
    }

    async setupSecurityDirectories() {
        const securityDirs = [
            '/Users/sardag/Desktop/ailydian-ultra-pro/security',
            '/Users/sardag/Desktop/ailydian-ultra-pro/security/logs',
            '/Users/sardag/Desktop/ailydian-ultra-pro/security/keys',
            '/Users/sardag/Desktop/ailydian-ultra-pro/security/policies',
            '/Users/sardag/Desktop/ailydian-ultra-pro/security/quarantine'
        ];

        for (const dir of securityDirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    console.error(`❌ Failed to create security directory ${dir}:`, error);
                }
            }
        }
    }

    async loadSecurityPolicies() {
        try {
            const policiesPath = path.join('/Users/sardag/Desktop/ailydian-ultra-pro/security/policies', 'security-policies.json');
            const policiesData = await fs.readFile(policiesPath, 'utf8');
            this.securityPolicies = { ...this.securityPolicies, ...JSON.parse(policiesData) };
        } catch (error) {
            // Use default policies if file doesn't exist
            await this.saveSecurityPolicies();
        }
    }

    async saveSecurityPolicies() {
        const policiesPath = path.join('/Users/sardag/Desktop/ailydian-ultra-pro/security/policies', 'security-policies.json');
        await fs.writeFile(policiesPath, JSON.stringify(this.securityPolicies, null, 2));
    }

    async initializeEncryption() {
        // Generate master encryption key
        const masterKey = crypto.randomBytes(32);
        this.encryptionKeys.set('master', masterKey);

        // Generate session keys
        for (let i = 0; i < 10; i++) {
            const sessionKey = crypto.randomBytes(32);
            this.encryptionKeys.set(`session_${i}`, sessionKey);
        }

        console.log('🔐 Encryption keys initialized');
    }

    // Security Middleware
    securityMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            const clientIP = this.getClientIP(req);
            const userAgent = req.get('User-Agent') || 'Unknown';

            // Rate limiting
            if (!this.checkRateLimit(clientIP)) {
                this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip: clientIP, userAgent });
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    retryAfter: 60
                });
            }

            // IP Blacklist check
            if (this.blacklist.has(clientIP)) {
                this.logSecurityEvent('BLACKLISTED_IP_ACCESS', { ip: clientIP, userAgent });
                return res.status(403).json({ error: 'Access denied' });
            }

            // Malicious payload detection
            if (this.detectMaliciousPayload(req)) {
                this.logSecurityEvent('MALICIOUS_PAYLOAD_DETECTED', {
                    ip: clientIP,
                    userAgent,
                    url: req.url,
                    body: req.body
                });
                return res.status(400).json({ error: 'Malicious content detected' });
            }

            // Request size validation
            if (req.headers['content-length'] && parseInt(req.headers['content-length']) > this.securityPolicies.maxPayloadSize) {
                this.logSecurityEvent('PAYLOAD_SIZE_EXCEEDED', { ip: clientIP, size: req.headers['content-length'] });
                return res.status(413).json({ error: 'Payload too large' });
            }

            // Add security headers
            this.addSecurityHeaders(res);

            // Track active connections
            this.trackConnection(clientIP, req);

            // Continue to next middleware
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                this.logRequest(req, res, responseTime);
            });

            next();
        };
    }

    getClientIP(req) {
        return req.headers['x-forwarded-for'] ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               '127.0.0.1';
    }

    checkRateLimit(ip) {
        const now = Date.now();
        const windowStart = now - this.securityPolicies.rateLimitWindow;

        if (!this.rateLimiter.has(ip)) {
            this.rateLimiter.set(ip, []);
        }

        const requests = this.rateLimiter.get(ip);

        // Remove old requests outside the window
        const validRequests = requests.filter(timestamp => timestamp > windowStart);

        if (validRequests.length >= this.securityPolicies.maxRequestsPerMinute) {
            return false;
        }

        validRequests.push(now);
        this.rateLimiter.set(ip, validRequests);

        return true;
    }

    detectMaliciousPayload(req) {
        const checkString = (str) => {
            if (!str) return false;
            return this.securityPolicies.blockedPatterns.some(pattern => pattern.test(str));
        };

        // Check URL
        if (checkString(req.url)) return true;

        // Check query parameters
        if (req.query) {
            for (const [key, value] of Object.entries(req.query)) {
                if (checkString(key) || checkString(String(value))) return true;
            }
        }

        // Check body
        if (req.body) {
            const bodyStr = JSON.stringify(req.body);
            if (checkString(bodyStr)) return true;
        }

        // Check headers
        const suspiciousHeaders = ['x-forwarded-for', 'user-agent', 'referer'];
        for (const header of suspiciousHeaders) {
            if (checkString(req.get(header))) return true;
        }

        return false;
    }

    addSecurityHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        res.setHeader('X-Download-Options', 'noopen');
    }

    trackConnection(ip, req) {
        const connectionId = crypto.randomUUID();
        this.activeConnections.set(connectionId, {
            ip,
            userAgent: req.get('User-Agent'),
            timestamp: Date.now(),
            url: req.url,
            method: req.method
        });

        // Clean up old connections (older than 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [id, conn] of this.activeConnections.entries()) {
            if (conn.timestamp < oneHourAgo) {
                this.activeConnections.delete(id);
            }
        }
    }

    logSecurityEvent(eventType, details) {
        const event = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type: eventType,
            severity: this.getEventSeverity(eventType),
            details,
            source: 'GlobalSOC'
        };

        this.securityLogs.push(event);
        this.emit('securityEvent', event);

        // Keep only last 10000 logs in memory
        if (this.securityLogs.length > 10000) {
            this.securityLogs = this.securityLogs.slice(-10000);
        }

        // Save critical events to disk
        if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
            this.saveSecurityLog(event);
        }

        console.log(`🚨 Security Event [${event.severity}]: ${eventType}`, details);
    }

    getEventSeverity(eventType) {
        const severityMap = {
            'RATE_LIMIT_EXCEEDED': 'MEDIUM',
            'BLACKLISTED_IP_ACCESS': 'HIGH',
            'MALICIOUS_PAYLOAD_DETECTED': 'HIGH',
            'PAYLOAD_SIZE_EXCEEDED': 'MEDIUM',
            'UNAUTHORIZED_ACCESS': 'HIGH',
            'BRUTE_FORCE_ATTEMPT': 'HIGH',
            'SQL_INJECTION_ATTEMPT': 'CRITICAL',
            'XSS_ATTEMPT': 'HIGH',
            'FILE_UPLOAD_THREAT': 'HIGH',
            'SUSPICIOUS_ACTIVITY': 'MEDIUM'
        };

        return severityMap[eventType] || 'LOW';
    }

    async saveSecurityLog(event) {
        try {
            const logPath = path.join('/Users/sardag/Desktop/ailydian-ultra-pro/security/logs', `security-${new Date().toISOString().split('T')[0]}.log`);
            const logEntry = `${event.timestamp} [${event.severity}] ${event.type}: ${JSON.stringify(event.details)}\n`;
            await fs.appendFile(logPath, logEntry);
        } catch (error) {
            console.error('❌ Failed to save security log:', error);
        }
    }

    logRequest(req, res, responseTime) {
        const log = {
            timestamp: new Date().toISOString(),
            ip: this.getClientIP(req),
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime,
            userAgent: req.get('User-Agent'),
            contentLength: res.get('Content-Length') || 0
        };

        // Log suspicious patterns
        if (responseTime > 5000 || res.statusCode >= 400) {
            this.logSecurityEvent('SUSPICIOUS_ACTIVITY', log);
        }
    }

    // Encryption methods (CRITICAL FIX: AES-256-GCM)
    encrypt(data, keyName = 'master') {
        const key = this.encryptionKeys.get(keyName);
        if (!key) throw new Error(`Encryption key '${keyName}' not found`);

        const iv = crypto.randomBytes(16);
        // ✅ FIXED: Modern AES-256-GCM with authenticated encryption
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get authentication tag for integrity verification
        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: authTag.toString('hex')
        };
    }

    decrypt(encryptedData, keyName = 'master') {
        const key = this.encryptionKeys.get(keyName);
        if (!key) throw new Error(`Encryption key '${keyName}' not found`);

        // ✅ FIXED: Modern AES-256-GCM decryption with authentication
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            key,
            Buffer.from(encryptedData.iv, 'hex')
        );

        // Set authentication tag for integrity verification
        if (encryptedData.tag) {
            decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
        }

        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    // Hash methods
    hash(data) {
        return crypto.createHash(this.securityPolicies.hashAlgorithm).update(data).digest('hex');
    }

    verifyHash(data, hash) {
        return this.hash(data) === hash;
    }

    // File security validation
    validateFile(filename, content) {
        const ext = path.extname(filename).toLowerCase();

        if (!this.securityPolicies.allowedFileTypes.includes(ext)) {
            return { valid: false, reason: 'File type not allowed' };
        }

        if (content.length > this.securityPolicies.maxPayloadSize) {
            return { valid: false, reason: 'File too large' };
        }

        // Check for embedded scripts or malicious content
        const contentStr = content.toString();
        for (const pattern of this.securityPolicies.blockedPatterns) {
            if (pattern.test(contentStr)) {
                return { valid: false, reason: 'Malicious content detected' };
            }
        }

        return { valid: true };
    }

    // Threat monitoring
    startThreatMonitoring() {
        setInterval(() => {
            this.analyzeThreats();
            this.cleanupOldData();
        }, 60000); // Every minute

        console.log('🔍 Threat monitoring started');
    }

    analyzeThreats() {
        // Analyze rate limiting patterns
        for (const [ip, requests] of this.rateLimiter.entries()) {
            if (requests.length > this.securityPolicies.maxRequestsPerMinute * 0.8) {
                this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
                    ip,
                    requestCount: requests.length,
                    reason: 'High request rate'
                });
            }
        }

        // Analyze active connections
        const connectionsByIP = new Map();
        for (const connection of this.activeConnections.values()) {
            const count = connectionsByIP.get(connection.ip) || 0;
            connectionsByIP.set(connection.ip, count + 1);
        }

        for (const [ip, count] of connectionsByIP.entries()) {
            if (count > this.securityPolicies.maxConnectionsPerIP) {
                this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
                    ip,
                    connectionCount: count,
                    reason: 'Too many connections'
                });

                // Auto-blacklist if too many connections
                this.blacklist.add(ip);
            }
        }
    }

    cleanupOldData() {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);

        // Clean rate limiter
        for (const [ip, requests] of this.rateLimiter.entries()) {
            const validRequests = requests.filter(timestamp => timestamp > oneHourAgo);
            if (validRequests.length === 0) {
                this.rateLimiter.delete(ip);
            } else {
                this.rateLimiter.set(ip, validRequests);
            }
        }

        // Clean security logs (keep only last 24 hours)
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        this.securityLogs = this.securityLogs.filter(log =>
            new Date(log.timestamp).getTime() > oneDayAgo
        );
    }

    // Admin methods
    addToBlacklist(ip) {
        this.blacklist.add(ip);
        this.logSecurityEvent('IP_BLACKLISTED', { ip });
    }

    removeFromBlacklist(ip) {
        this.blacklist.delete(ip);
        this.logSecurityEvent('IP_WHITELISTED', { ip });
    }

    addToWhitelist(ip) {
        this.whitelist.add(ip);
        this.logSecurityEvent('IP_WHITELISTED', { ip });
    }

    getSecurityStatus() {
        return {
            activeConnections: this.activeConnections.size,
            blacklistedIPs: Array.from(this.blacklist),
            whitelistedIPs: Array.from(this.whitelist),
            recentThreats: this.securityLogs.slice(-10),
            rateLimiterEntries: this.rateLimiter.size,
            encryptionKeysCount: this.encryptionKeys.size,
            securityPolicies: this.securityPolicies
        };
    }
}

module.exports = GlobalSOCSystem;