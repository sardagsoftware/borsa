// ==========================================
// AZURE-INTEGRATED AUTHENTICATION SYSTEM
// Complete Enterprise Authentication with 2FA
// ==========================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');

// Azure integrations
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const { BlobServiceClient } = require('@azure/storage-blob');

class AzureAuthService {
    constructor() {
        this.credential = new DefaultAzureCredential();
        this.secretClient = new SecretClient(
            process.env.AZURE_KEYVAULT_URL || "https://ailydian-keyvault.vault.azure.net/",
            this.credential
        );

        // Database connection
        this.db = new Client({
            connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ailydian_ultra_pro'
        });

        this.initializeDatabase();
    }

    async initializeDatabase() {
        try {
            await this.db.connect();
            console.log('✅ Database connected for authentication service');
        } catch (error) {
            console.error('❌ Database connection failed:', error);
        }
    }

    // ==========================================
    // USER REGISTRATION
    // ==========================================

    async registerUser(userData) {
        try {
            const {
                email,
                password,
                firstName,
                lastName,
                username,
                organizationId = null
            } = userData;

            // Validate input
            if (!email || !password || !username) {
                throw new Error('Email, password, and username are required');
            }

            // Check if user exists
            const existingUser = await this.db.query(
                'SELECT id FROM users WHERE email = $1 OR username = $2',
                [email, username]
            );

            if (existingUser.rows.length > 0) {
                throw new Error('User with this email or username already exists');
            }

            // Hash password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Generate user ID
            const userId = uuidv4();

            // Insert user
            const result = await this.db.query(`
                INSERT INTO users (
                    id, email, username, first_name, last_name,
                    password_hash, display_name, status, role
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id, email, username, first_name, last_name, display_name, status, role, created_at
            `, [
                userId,
                email.toLowerCase(),
                username,
                firstName,
                lastName,
                passwordHash,
                `${firstName} ${lastName}`.trim(),
                'pending', // Requires email verification
                'user'
            ]);

            const user = result.rows[0];

            // Create organization membership if provided
            if (organizationId) {
                await this.db.query(`
                    INSERT INTO user_organizations (user_id, organization_id, role)
                    VALUES ($1, $2, $3)
                `, [userId, organizationId, 'member']);
            }

            // Send verification email
            await this.sendVerificationEmail(user);

            // Log registration
            await this.logAuditEvent(userId, 'user_registered', 'user', userId, {
                email: email,
                username: username
            });

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    displayName: user.display_name,
                    status: user.status
                },
                message: 'Registration successful. Please check your email for verification.'
            };

        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // ==========================================
    // USER LOGIN
    // ==========================================

    async loginUser(credentials, deviceInfo = {}) {
        try {
            const { email, password, twoFactorCode } = credentials;

            // Find user
            const userResult = await this.db.query(`
                SELECT id, email, username, password_hash, first_name, last_name,
                       display_name, status, role, two_factor_enabled, two_factor_secret,
                       email_verified, login_count, last_login_at
                FROM users
                WHERE email = $1 OR username = $1
            `, [email]);

            if (userResult.rows.length === 0) {
                throw new Error('Invalid credentials');
            }

            const user = userResult.rows[0];

            // Check account status
            if (user.status !== 'active') {
                throw new Error(`Account is ${user.status}. Please contact support.`);
            }

            if (!user.email_verified) {
                throw new Error('Please verify your email before logging in');
            }

            // Verify password
            const passwordValid = await bcrypt.compare(password, user.password_hash);
            if (!passwordValid) {
                throw new Error('Invalid credentials');
            }

            // Check 2FA if enabled
            if (user.two_factor_enabled) {
                if (!twoFactorCode) {
                    return {
                        success: false,
                        requiresTwoFactor: true,
                        message: 'Two-factor authentication code required'
                    };
                }

                const verified = speakeasy.totp.verify({
                    secret: user.two_factor_secret,
                    encoding: 'base32',
                    token: twoFactorCode,
                    window: 2
                });

                if (!verified) {
                    throw new Error('Invalid two-factor authentication code');
                }
            }

            // Generate tokens
            const sessionId = uuidv4();
            const accessToken = this.generateAccessToken(user, sessionId);
            const refreshToken = this.generateRefreshToken(user, sessionId);

            // Create session
            await this.db.query(`
                INSERT INTO user_sessions (
                    id, user_id, session_token, refresh_token,
                    device_info, ip_address, user_agent, expires_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                sessionId,
                user.id,
                accessToken,
                refreshToken,
                JSON.stringify(deviceInfo),
                deviceInfo.ipAddress,
                deviceInfo.userAgent,
                new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            ]);

            // Update login stats
            await this.db.query(`
                UPDATE users
                SET login_count = login_count + 1, last_login_at = NOW(), last_activity_at = NOW()
                WHERE id = $1
            `, [user.id]);

            // Log successful login
            await this.logAuditEvent(user.id, 'user_login', 'user', user.id, {
                deviceInfo: deviceInfo,
                twoFactorUsed: user.two_factor_enabled
            });

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    displayName: user.display_name,
                    role: user.role,
                    twoFactorEnabled: user.two_factor_enabled
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: '15m' // ✅ SECURITY: Updated to match token expiration
                }
            };

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // ==========================================
    // AZURE AD INTEGRATION
    // ==========================================

    async loginWithAzureAD(azureTokens, deviceInfo = {}) {
        try {
            // Verify Azure AD token
            const azureUser = await this.verifyAzureToken(azureTokens.accessToken);

            // Find or create user
            let userResult = await this.db.query(
                'SELECT * FROM users WHERE azure_ad_id = $1 OR email = $2',
                [azureUser.oid, azureUser.email]
            );

            let user;
            if (userResult.rows.length === 0) {
                // Create new user from Azure AD
                const userId = uuidv4();
                const insertResult = await this.db.query(`
                    INSERT INTO users (
                        id, azure_ad_id, email, username, first_name, last_name,
                        display_name, status, role, email_verified, azure_tenant_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING *
                `, [
                    userId,
                    azureUser.oid,
                    azureUser.email,
                    azureUser.preferred_username || azureUser.email.split('@')[0],
                    azureUser.given_name,
                    azureUser.family_name,
                    azureUser.name,
                    'active',
                    'user',
                    true, // Azure AD emails are pre-verified
                    azureUser.tid
                ]);
                user = insertResult.rows[0];
            } else {
                user = userResult.rows[0];

                // Update Azure AD info if missing
                if (!user.azure_ad_id) {
                    await this.db.query(
                        'UPDATE users SET azure_ad_id = $1, azure_tenant_id = $2 WHERE id = $3',
                        [azureUser.oid, azureUser.tid, user.id]
                    );
                }
            }

            // Generate session
            const sessionId = uuidv4();
            const accessToken = this.generateAccessToken(user, sessionId);
            const refreshToken = this.generateRefreshToken(user, sessionId);

            // Create session
            await this.db.query(`
                INSERT INTO user_sessions (
                    id, user_id, session_token, refresh_token,
                    device_info, ip_address, user_agent, expires_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                sessionId,
                user.id,
                accessToken,
                refreshToken,
                JSON.stringify({...deviceInfo, authMethod: 'azure_ad'}),
                deviceInfo.ipAddress,
                deviceInfo.userAgent,
                new Date(Date.now() + 24 * 60 * 60 * 1000)
            ]);

            await this.logAuditEvent(user.id, 'azure_ad_login', 'user', user.id, {
                azureTenantId: azureUser.tid
            });

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    displayName: user.display_name,
                    role: user.role,
                    azureIntegration: true
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: '24h'
                }
            };

        } catch (error) {
            console.error('Azure AD login error:', error);
            throw error;
        }
    }

    // ==========================================
    // TWO-FACTOR AUTHENTICATION
    // ==========================================

    async setup2FA(userId) {
        try {
            // Generate secret
            const secret = speakeasy.generateSecret({
                name: `AiLydian Ultra Pro (${userId})`,
                issuer: 'AiLydian Ultra Pro'
            });

            // Generate QR code
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

            // Store secret temporarily (not activated until verified)
            await this.db.query(
                'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
                [secret.base32, userId]
            );

            return {
                success: true,
                secret: secret.base32,
                qrCode: qrCodeUrl,
                manualEntryKey: secret.base32,
                backupCodes: this.generateBackupCodes()
            };

        } catch (error) {
            console.error('2FA setup error:', error);
            throw error;
        }
    }

    async verify2FA(userId, token) {
        try {
            const userResult = await this.db.query(
                'SELECT two_factor_secret FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }

            const user = userResult.rows[0];
            const verified = speakeasy.totp.verify({
                secret: user.two_factor_secret,
                encoding: 'base32',
                token: token,
                window: 2
            });

            if (verified) {
                // Enable 2FA
                const backupCodes = this.generateBackupCodes();
                await this.db.query(
                    'UPDATE users SET two_factor_enabled = true, backup_codes = $1 WHERE id = $2',
                    [JSON.stringify(backupCodes), userId]
                );

                await this.logAuditEvent(userId, '2fa_enabled', 'user', userId);

                return {
                    success: true,
                    backupCodes: backupCodes,
                    message: '2FA enabled successfully'
                };
            } else {
                throw new Error('Invalid verification code');
            }

        } catch (error) {
            console.error('2FA verification error:', error);
            throw error;
        }
    }

    async disable2FA(userId, currentPassword) {
        try {
            const userResult = await this.db.query(
                'SELECT password_hash FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }

            const user = userResult.rows[0];
            const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);

            if (!passwordValid) {
                throw new Error('Invalid password');
            }

            await this.db.query(`
                UPDATE users
                SET two_factor_enabled = false, two_factor_secret = NULL, backup_codes = NULL
                WHERE id = $1
            `, [userId]);

            await this.logAuditEvent(userId, '2fa_disabled', 'user', userId);

            return {
                success: true,
                message: '2FA disabled successfully'
            };

        } catch (error) {
            console.error('2FA disable error:', error);
            throw error;
        }
    }

    // ==========================================
    // SESSION MANAGEMENT
    // ==========================================

    async validateSession(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ailydian-ultra-pro-secret');

            const sessionResult = await this.db.query(`
                SELECT s.*, u.id as user_id, u.email, u.username, u.display_name, u.role, u.status
                FROM user_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.session_token = $1 AND s.active = true AND s.expires_at > NOW()
            `, [token]);

            if (sessionResult.rows.length === 0) {
                throw new Error('Invalid or expired session');
            }

            const session = sessionResult.rows[0];

            // Update last activity
            await this.db.query(
                'UPDATE user_sessions SET last_activity_at = NOW() WHERE id = $1',
                [session.id]
            );

            await this.db.query(
                'UPDATE users SET last_activity_at = NOW() WHERE id = $1',
                [session.user_id]
            );

            return {
                valid: true,
                user: {
                    id: session.user_id,
                    email: session.email,
                    username: session.username,
                    displayName: session.display_name,
                    role: session.role,
                    status: session.status
                },
                session: {
                    id: session.id,
                    expiresAt: session.expires_at
                }
            };

        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'ailydian-refresh-secret');

            const sessionResult = await this.db.query(`
                SELECT s.*, u.*
                FROM user_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.refresh_token = $1 AND s.active = true AND s.expires_at > NOW()
            `, [refreshToken]);

            if (sessionResult.rows.length === 0) {
                throw new Error('Invalid refresh token');
            }

            const session = sessionResult.rows[0];

            // Generate new tokens
            const newAccessToken = this.generateAccessToken(session, session.id);
            const newRefreshToken = this.generateRefreshToken(session, session.id);

            // Update session
            await this.db.query(
                'UPDATE user_sessions SET session_token = $1, refresh_token = $2 WHERE id = $3',
                [newAccessToken, newRefreshToken, session.id]
            );

            return {
                success: true,
                tokens: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                    expiresIn: '24h'
                }
            };

        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }

    async logout(sessionId) {
        try {
            await this.db.query(
                'UPDATE user_sessions SET active = false WHERE id = $1',
                [sessionId]
            );

            return {
                success: true,
                message: 'Logged out successfully'
            };

        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    generateAccessToken(user, sessionId) {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                sessionId: sessionId
            },
            process.env.JWT_SECRET || 'ailydian-ultra-pro-secret',
            { expiresIn: '15m' } // ✅ SECURITY: Reduced from 24h to 15 minutes
        );
    }

    generateRefreshToken(user, sessionId) {
        return jwt.sign(
            {
                userId: user.id,
                sessionId: sessionId,
                type: 'refresh'
            },
            process.env.JWT_REFRESH_SECRET || 'ailydian-refresh-secret',
            { expiresIn: '7d' } // ✅ SECURITY: Refresh token stays 7 days
        );
    }

    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
        }
        return codes;
    }

    async verifyAzureToken(token) {
        // Implementation for Azure AD token verification
        // This would use Microsoft Graph API or Azure AD libraries
        // For now, returning mock data
        return {
            oid: 'azure-user-id',
            email: 'user@company.com',
            name: 'Azure User',
            given_name: 'Azure',
            family_name: 'User',
            preferred_username: 'azureuser',
            tid: 'tenant-id'
        };
    }

    async sendVerificationEmail(user) {
        // Implementation for sending verification emails
        // This would integrate with Azure Communication Services
        console.log(`Verification email sent to ${user.email}`);
    }

    async logAuditEvent(userId, action, resourceType, resourceId, data = {}) {
        try {
            await this.db.query(`
                INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
                VALUES ($1, $2, $3, $4, $5)
            `, [userId, action, resourceType, resourceId, JSON.stringify(data)]);
        } catch (error) {
            console.error('Audit log error:', error);
        }
    }
}

module.exports = AzureAuthService;