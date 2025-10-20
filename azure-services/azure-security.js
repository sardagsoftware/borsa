// Azure Security and Authentication Service
// Enterprise-grade security, authentication, and authorization for AiLydian Ultra Pro

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const AzureConfigManager = require('./azure-config');
const AzureLoggerService = require('./azure-logger');

class AzureSecurityService {
    constructor() {
        this.configManager = new AzureConfigManager();
        this.logger = null;
        this.config = {
            jwtSecret: process.env.JWT_SECRET || this.generateSecureSecret(),
            jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
            refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
            bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
            maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
            lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900000, // 15 minutes
            sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
            requireMFA: process.env.REQUIRE_MFA === 'true',
            allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
            encryptionKey: process.env.ENCRYPTION_KEY || this.generateEncryptionKey()
        };

        this.rateLimiters = new Map();
        this.activeSessions = new Map();
        this.refreshTokens = new Map();
        this.loginAttempts = new Map();
        this.suspiciousActivities = new Map();

        this.initialize();
    }

    /**
     * Initialize security service
     */
    async initialize() {
        try {
            this.logger = new AzureLoggerService();
            await this.logger.initialize();

            this.setupRateLimiters();
            this.setupSecurityMonitoring();

            console.log('Azure Security Service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Azure Security Service:', error);
            throw error;
        }
    }

    /**
     * Setup rate limiters for security
     */
    setupRateLimiters() {
        // Login attempt rate limiter
        this.rateLimiters.set('login', new RateLimiterMemory({
            keyGenerator: (req) => req.ip,
            points: this.config.maxLoginAttempts,
            duration: 900, // 15 minutes
            blockDuration: this.config.lockoutDuration / 1000 // Convert to seconds
        }));

        // Password reset rate limiter
        this.rateLimiters.set('passwordReset', new RateLimiterMemory({
            keyGenerator: (req) => req.ip,
            points: 3, // Max 3 password reset attempts
            duration: 3600, // Per hour
            blockDuration: 3600 // Block for 1 hour
        }));

        // API rate limiter
        this.rateLimiters.set('api', new RateLimiterMemory({
            keyGenerator: (req) => req.ip,
            points: 1000, // Max 1000 requests
            duration: 3600, // Per hour
            blockDuration: 300 // Block for 5 minutes
        }));

        // Suspicious activity rate limiter
        this.rateLimiters.set('suspicious', new RateLimiterMemory({
            keyGenerator: (req) => req.ip,
            points: 1, // Single strike
            duration: 86400, // 24 hours
            blockDuration: 86400 // Block for 24 hours
        }));
    }

    /**
     * Setup security monitoring and alerts
     */
    setupSecurityMonitoring() {
        // Clean up expired sessions every 5 minutes
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 5 * 60 * 1000);

        // Clean up old login attempts every hour
        setInterval(() => {
            this.cleanupOldLoginAttempts();
        }, 60 * 60 * 1000);

        // Monitor suspicious activities every 10 minutes
        setInterval(() => {
            this.analyzeSuspiciousActivities();
        }, 10 * 60 * 1000);
    }

    /**
     * Generate secure JWT secret
     */
    generateSecureSecret() {
        return crypto.randomBytes(64).toString('hex');
    }

    /**
     * Generate encryption key for sensitive data
     */
    generateEncryptionKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Hash password with bcrypt
     */
    async hashPassword(password) {
        try {
            if (!password || password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }

            const salt = await bcrypt.genSalt(this.config.bcryptRounds);
            const hashedPassword = await bcrypt.hash(password, salt);

            this.logger.logSecurityEvent('password_hashed', {
                algorithm: 'bcrypt',
                rounds: this.config.bcryptRounds
            }, 'info');

            return hashedPassword;
        } catch (error) {
            this.logger.logError(error, { operation: 'hashPassword' }, 'security');
            throw error;
        }
    }

    /**
     * Verify password against hash
     */
    async verifyPassword(password, hashedPassword) {
        try {
            const isValid = await bcrypt.compare(password, hashedPassword);

            this.logger.logSecurityEvent('password_verified', {
                success: isValid,
                algorithm: 'bcrypt'
            }, isValid ? 'info' : 'warn');

            return isValid;
        } catch (error) {
            this.logger.logError(error, { operation: 'verifyPassword' }, 'security');
            throw error;
        }
    }

    /**
     * Generate JWT token
     */
    generateJWTToken(payload, options = {}) {
        try {
            const tokenPayload = {
                ...payload,
                iat: Math.floor(Date.now() / 1000),
                jti: crypto.randomUUID() // Unique token ID
            };

            const tokenOptions = {
                expiresIn: options.expiresIn || this.config.jwtExpiresIn,
                issuer: 'ailydian-ultra-pro',
                audience: 'ailydian-users'
            };

            const token = jwt.sign(tokenPayload, this.config.jwtSecret, tokenOptions);

            this.logger.logSecurityEvent('jwt_token_generated', {
                userId: payload.userId,
                expiresIn: tokenOptions.expiresIn,
                tokenId: tokenPayload.jti
            }, 'info');

            return token;
        } catch (error) {
            this.logger.logError(error, { operation: 'generateJWTToken' }, 'security');
            throw error;
        }
    }

    /**
     * Verify JWT token
     */
    verifyJWTToken(token) {
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret, {
                issuer: 'ailydian-ultra-pro',
                audience: 'ailydian-users'
            });

            this.logger.logSecurityEvent('jwt_token_verified', {
                userId: decoded.userId,
                tokenId: decoded.jti,
                expiresAt: new Date(decoded.exp * 1000)
            }, 'info');

            return decoded;
        } catch (error) {
            this.logger.logSecurityEvent('jwt_token_verification_failed', {
                error: error.message,
                token: token.substring(0, 20) + '...' // Log only first 20 chars for security
            }, 'warn');

            throw error;
        }
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(userId) {
        try {
            const refreshToken = crypto.randomBytes(40).toString('hex');
            const expiresAt = new Date(Date.now() + this.parseTimeString(this.config.refreshTokenExpiry));

            this.refreshTokens.set(refreshToken, {
                userId,
                expiresAt,
                createdAt: new Date()
            });

            this.logger.logSecurityEvent('refresh_token_generated', {
                userId,
                expiresAt
            }, 'info');

            return refreshToken;
        } catch (error) {
            this.logger.logError(error, { operation: 'generateRefreshToken', userId }, 'security');
            throw error;
        }
    }

    /**
     * Verify refresh token
     */
    verifyRefreshToken(refreshToken) {
        try {
            const tokenData = this.refreshTokens.get(refreshToken);

            if (!tokenData) {
                throw new Error('Invalid refresh token');
            }

            if (tokenData.expiresAt < new Date()) {
                this.refreshTokens.delete(refreshToken);
                throw new Error('Refresh token expired');
            }

            this.logger.logSecurityEvent('refresh_token_verified', {
                userId: tokenData.userId
            }, 'info');

            return tokenData;
        } catch (error) {
            this.logger.logSecurityEvent('refresh_token_verification_failed', {
                error: error.message
            }, 'warn');

            throw error;
        }
    }

    /**
     * Revoke refresh token
     */
    revokeRefreshToken(refreshToken) {
        try {
            const tokenData = this.refreshTokens.get(refreshToken);
            if (tokenData) {
                this.refreshTokens.delete(refreshToken);

                this.logger.logSecurityEvent('refresh_token_revoked', {
                    userId: tokenData.userId
                }, 'info');

                return true;
            }
            return false;
        } catch (error) {
            this.logger.logError(error, { operation: 'revokeRefreshToken' }, 'security');
            throw error;
        }
    }

    /**
     * Create user session
     */
    createSession(userId, userInfo, request) {
        try {
            const sessionId = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + this.config.sessionTimeout);

            const sessionData = {
                userId,
                userInfo,
                sessionId,
                createdAt: new Date(),
                expiresAt,
                lastActivity: new Date(),
                ipAddress: request.ip,
                userAgent: request.get('User-Agent'),
                fingerprint: this.generateFingerprint(request)
            };

            this.activeSessions.set(sessionId, sessionData);

            this.logger.logSecurityEvent('session_created', {
                userId,
                sessionId,
                ipAddress: request.ip,
                userAgent: request.get('User-Agent'),
                expiresAt
            }, 'info');

            return sessionId;
        } catch (error) {
            this.logger.logError(error, { operation: 'createSession', userId }, 'security');
            throw error;
        }
    }

    /**
     * Validate session
     */
    validateSession(sessionId, request) {
        try {
            const session = this.activeSessions.get(sessionId);

            if (!session) {
                throw new Error('Session not found');
            }

            if (session.expiresAt < new Date()) {
                this.activeSessions.delete(sessionId);
                throw new Error('Session expired');
            }

            // Validate session fingerprint for security
            const currentFingerprint = this.generateFingerprint(request);
            if (session.fingerprint !== currentFingerprint) {
                this.logger.logSecurityEvent('session_fingerprint_mismatch', {
                    sessionId,
                    userId: session.userId,
                    ipAddress: request.ip,
                    suspectedHijack: true
                }, 'error');

                this.activeSessions.delete(sessionId);
                throw new Error('Session security violation detected');
            }

            // Update last activity
            session.lastActivity = new Date();

            this.logger.logSecurityEvent('session_validated', {
                sessionId,
                userId: session.userId,
                lastActivity: session.lastActivity
            }, 'info');

            return session;
        } catch (error) {
            this.logger.logSecurityEvent('session_validation_failed', {
                sessionId,
                error: error.message,
                ipAddress: request.ip
            }, 'warn');

            throw error;
        }
    }

    /**
     * Destroy session
     */
    destroySession(sessionId) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (session) {
                this.activeSessions.delete(sessionId);

                this.logger.logSecurityEvent('session_destroyed', {
                    sessionId,
                    userId: session.userId,
                    duration: Date.now() - session.createdAt.getTime()
                }, 'info');

                return true;
            }
            return false;
        } catch (error) {
            this.logger.logError(error, { operation: 'destroySession', sessionId }, 'security');
            throw error;
        }
    }

    /**
     * Generate device/browser fingerprint
     */
    generateFingerprint(request) {
        const components = [
            request.ip,
            request.get('User-Agent'),
            request.get('Accept-Language'),
            request.get('Accept-Encoding')
        ].filter(Boolean);

        return crypto.createHash('sha256')
            .update(components.join('|'))
            .digest('hex');
    }

    /**
     * Check for suspicious activity
     */
    async checkSuspiciousActivity(request, action) {
        try {
            const ipAddress = request.ip;
            const userAgent = request.get('User-Agent');
            const key = `${ipAddress}_${action}`;

            // Check for rapid successive requests
            if (!this.suspiciousActivities.has(key)) {
                this.suspiciousActivities.set(key, []);
            }

            const activities = this.suspiciousActivities.get(key);
            const now = Date.now();
            const fiveMinutesAgo = now - (5 * 60 * 1000);

            // Remove old activities
            const recentActivities = activities.filter(timestamp => timestamp > fiveMinutesAgo);
            this.suspiciousActivities.set(key, recentActivities);

            // Add current activity
            recentActivities.push(now);

            // Check thresholds
            const suspiciousThresholds = {
                login: 10,      // 10 login attempts in 5 minutes
                api_call: 500,  // 500 API calls in 5 minutes
                password_reset: 5, // 5 password reset attempts in 5 minutes
                registration: 3 // 3 registration attempts in 5 minutes
            };

            const threshold = suspiciousThresholds[action] || 100;

            if (recentActivities.length > threshold) {
                this.logger.logSecurityEvent('suspicious_activity_detected', {
                    ipAddress,
                    action,
                    attemptCount: recentActivities.length,
                    threshold,
                    userAgent,
                    timeWindow: '5 minutes'
                }, 'error');

                // Block this IP for suspicious activity
                await this.rateLimiters.get('suspicious').consume(ipAddress);
                return true;
            }

            return false;
        } catch (error) {
            this.logger.logError(error, { operation: 'checkSuspiciousActivity' }, 'security');
            return false;
        }
    }

    /**
     * Record login attempt
     */
    recordLoginAttempt(ipAddress, success, userId = null) {
        try {
            if (!this.loginAttempts.has(ipAddress)) {
                this.loginAttempts.set(ipAddress, []);
            }

            const attempts = this.loginAttempts.get(ipAddress);
            attempts.push({
                timestamp: Date.now(),
                success,
                userId
            });

            // Keep only last 10 attempts
            if (attempts.length > 10) {
                attempts.splice(0, attempts.length - 10);
            }

            this.logger.logSecurityEvent('login_attempt_recorded', {
                ipAddress,
                success,
                userId,
                totalAttempts: attempts.length
            }, success ? 'info' : 'warn');

        } catch (error) {
            this.logger.logError(error, { operation: 'recordLoginAttempt' }, 'security');
        }
    }

    /**
     * Check rate limits
     */
    async checkRateLimit(type, request) {
        try {
            const limiter = this.rateLimiters.get(type);
            if (!limiter) {
                return true; // No rate limiter configured
            }

            await limiter.consume(request.ip);
            return true;
        } catch (rateLimitResult) {
            this.logger.logSecurityEvent('rate_limit_exceeded', {
                type,
                ipAddress: request.ip,
                remainingPoints: rateLimitResult.remainingPoints,
                resetTime: new Date(Date.now() + rateLimitResult.msBeforeNext)
            }, 'warn');

            throw new Error(`Rate limit exceeded for ${type}. Try again in ${Math.ceil(rateLimitResult.msBeforeNext / 1000)} seconds.`);
        }
    }

    /**
     * Encrypt sensitive data
     */
    encryptData(data) {
        try {
            const algorithm = 'aes-256-gcm';
            const key = Buffer.from(this.config.encryptionKey, 'hex');
            const iv = crypto.randomBytes(16);

            const cipher = crypto.createCipher(algorithm, key);
            cipher.setAAD(Buffer.from('ailydian-ultra-pro', 'utf8'));

            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            return {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            this.logger.logError(error, { operation: 'encryptData' }, 'security');
            throw error;
        }
    }

    /**
     * Decrypt sensitive data
     */
    decryptData(encryptedData) {
        try {
            const algorithm = 'aes-256-gcm';
            const key = Buffer.from(this.config.encryptionKey, 'hex');
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const authTag = Buffer.from(encryptedData.authTag, 'hex');

            const decipher = crypto.createDecipher(algorithm, key);
            decipher.setAAD(Buffer.from('ailydian-ultra-pro', 'utf8'));
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            this.logger.logError(error, { operation: 'decryptData' }, 'security');
            throw error;
        }
    }

    /**
     * Generate secure random string
     */
    generateSecureRandomString(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Validate password strength
     */
    validatePasswordStrength(password) {
        const requirements = {
            minLength: 8,
            maxLength: 128,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            disallowCommonPasswords: true
        };

        const issues = [];

        if (password.length < requirements.minLength) {
            issues.push(`Password must be at least ${requirements.minLength} characters long`);
        }

        if (password.length > requirements.maxLength) {
            issues.push(`Password must be less than ${requirements.maxLength} characters long`);
        }

        if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
            issues.push('Password must contain at least one uppercase letter');
        }

        if (requirements.requireLowercase && !/[a-z]/.test(password)) {
            issues.push('Password must contain at least one lowercase letter');
        }

        if (requirements.requireNumbers && !/\d/.test(password)) {
            issues.push('Password must contain at least one number');
        }

        if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            issues.push('Password must contain at least one special character');
        }

        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ];

        if (requirements.disallowCommonPasswords && commonPasswords.includes(password.toLowerCase())) {
            issues.push('Password is too common. Please choose a more secure password');
        }

        return {
            isValid: issues.length === 0,
            issues,
            strength: this.calculatePasswordStrength(password)
        };
    }

    /**
     * Calculate password strength score
     */
    calculatePasswordStrength(password) {
        let score = 0;

        // Length scoring
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;

        // Character variety scoring
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

        // Pattern complexity
        if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
        if (!/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde)/.test(password.toLowerCase())) score += 1;

        const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        const strengthIndex = Math.min(Math.floor(score / 1.5), strengthLevels.length - 1);

        return {
            score,
            level: strengthLevels[strengthIndex],
            percentage: Math.min((score / 9) * 100, 100)
        };
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        try {
            const now = new Date();
            let expiredCount = 0;

            for (const [sessionId, session] of this.activeSessions.entries()) {
                if (session.expiresAt < now) {
                    this.activeSessions.delete(sessionId);
                    expiredCount++;
                }
            }

            if (expiredCount > 0) {
                this.logger.logSecurityEvent('expired_sessions_cleaned', {
                    expiredCount,
                    activeSessions: this.activeSessions.size
                }, 'info');
            }
        } catch (error) {
            this.logger.logError(error, { operation: 'cleanupExpiredSessions' }, 'security');
        }
    }

    /**
     * Clean up old login attempts
     */
    cleanupOldLoginAttempts() {
        try {
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            let cleanedIPs = 0;

            for (const [ipAddress, attempts] of this.loginAttempts.entries()) {
                const recentAttempts = attempts.filter(attempt => attempt.timestamp > oneHourAgo);

                if (recentAttempts.length === 0) {
                    this.loginAttempts.delete(ipAddress);
                    cleanedIPs++;
                } else {
                    this.loginAttempts.set(ipAddress, recentAttempts);
                }
            }

            if (cleanedIPs > 0) {
                this.logger.logSecurityEvent('old_login_attempts_cleaned', {
                    cleanedIPs,
                    remainingIPs: this.loginAttempts.size
                }, 'info');
            }
        } catch (error) {
            this.logger.logError(error, { operation: 'cleanupOldLoginAttempts' }, 'security');
        }
    }

    /**
     * Analyze suspicious activities
     */
    analyzeSuspiciousActivities() {
        try {
            const now = Date.now();
            const oneHourAgo = now - (60 * 60 * 1000);
            let suspiciousIPs = [];

            for (const [key, activities] of this.suspiciousActivities.entries()) {
                const recentActivities = activities.filter(timestamp => timestamp > oneHourAgo);

                if (recentActivities.length > 50) { // More than 50 activities in an hour
                    const ipAddress = key.split('_')[0];
                    suspiciousIPs.push({
                        ipAddress,
                        activityCount: recentActivities.length,
                        actions: key.split('_').slice(1)
                    });
                }

                this.suspiciousActivities.set(key, recentActivities);
            }

            if (suspiciousIPs.length > 0) {
                this.logger.logSecurityEvent('suspicious_ips_detected', {
                    suspiciousIPs,
                    analysisTime: new Date().toISOString()
                }, 'error');
            }
        } catch (error) {
            this.logger.logError(error, { operation: 'analyzeSuspiciousActivities' }, 'security');
        }
    }

    /**
     * Parse time string to milliseconds
     */
    parseTimeString(timeString) {
        const units = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };

        const match = timeString.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error('Invalid time format');
        }

        const [, value, unit] = match;
        return parseInt(value) * units[unit];
    }

    /**
     * Get comprehensive security status
     */
    getSecurityStatus() {
        try {
            const status = {
                service: 'azure-security',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                statistics: {
                    activeSessions: this.activeSessions.size,
                    refreshTokens: this.refreshTokens.size,
                    loginAttempts: this.loginAttempts.size,
                    suspiciousActivities: this.suspiciousActivities.size,
                    rateLimiters: this.rateLimiters.size
                },
                configuration: {
                    jwtExpiresIn: this.config.jwtExpiresIn,
                    refreshTokenExpiry: this.config.refreshTokenExpiry,
                    maxLoginAttempts: this.config.maxLoginAttempts,
                    lockoutDuration: this.config.lockoutDuration,
                    sessionTimeout: this.config.sessionTimeout,
                    requireMFA: this.config.requireMFA,
                    bcryptRounds: this.config.bcryptRounds
                },
                security: {
                    encryptionEnabled: !!this.config.encryptionKey,
                    jwtSecretConfigured: !!this.config.jwtSecret,
                    rateLimitingEnabled: this.rateLimiters.size > 0,
                    sessionManagementEnabled: true,
                    securityMonitoringEnabled: true
                }
            };

            return status;
        } catch (error) {
            return {
                service: 'azure-security',
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = AzureSecurityService;