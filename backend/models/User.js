/**
 * User Model
 * Handles all user-related database operations
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const { getDatabase } = require('../../database/init-db');

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'ailydian-ultra-pro-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 12;

class User {
  /**
   * Validate password strength (Beyaz Şapkalı Security)
   * @param {string} password - Password to validate
   * @returns {Object} - { valid: boolean, errors: string[] }
   */
  static validatePasswordStrength(password) {
    const errors = [];

    // Minimum length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    // Maximum length check (prevent DoS attacks)
    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    // Uppercase letter check
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Lowercase letter check
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Common password check (basic list - expand in production)
    const commonPasswords = [
      'password', 'password123', '12345678', 'qwerty', 'abc123',
      'password1', '111111', '123123', 'admin', 'letmein',
      'welcome', 'monkey', 'dragon', 'master', 'sunshine',
      'princess', 'football', 'shadow', 'iloveyou', '123456789'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a stronger password');
    }

    // Sequential characters check
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
      errors.push('Password should not contain sequential characters');
    }

    // Repeated characters check
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password should not contain repeated characters (e.g., aaa, 111)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a new user
   */
  static async createUser({ email, password, name, phone = null }) {
    const db = getDatabase();

    try {
      // Validate input
      if (!email || !password || !name) {
        throw new Error('Email, password, and name are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Validate password strength (Beyaz Şapkalı Security)
      const passwordValidation = this.validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        throw new Error(`Password validation failed:\n${passwordValidation.errors.join('\n')}`);
      }

      // Check if user already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert user
      const result = db.prepare(`
        INSERT INTO users (email, passwordHash, name, phone)
        VALUES (?, ?, ?, ?)
      `).run(email, passwordHash, name, phone);

      const userId = result.lastInsertRowid;

      // Create initial usage stats
      db.prepare(`
        INSERT INTO usage_stats (userId, date)
        VALUES (?, CURRENT_DATE)
      `).run(userId);

      // Log activity
      this.logActivity({
        userId,
        action: 'user_registered',
        description: 'New user registration'
      });

      return {
        id: userId,
        email,
        name,
        phone,
        subscription: 'free',
        credits: 100
      };

    } catch (error) {
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Login user
   */
  static async login({ email, password, ipAddress = null, userAgent = null }) {
    const db = getDatabase();

    try {
      // Find user
      const user = db.prepare(`
        SELECT * FROM users WHERE email = ? AND status = 'active'
      `).get(email);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Return user info without token, client needs to verify 2FA
        return {
          requiresTwoFactor: true,
          userId: user.id,
          email: user.email
        };
      }

      // Generate JWT token
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Calculate expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create session
      db.prepare(`
        INSERT INTO sessions (userId, token, refreshToken, ipAddress, userAgent, expiresAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(user.id, token, refreshToken, ipAddress, userAgent, expiresAt.toISOString());

      // Update last login
      db.prepare('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

      // Log activity
      this.logActivity({
        userId: user.id,
        action: 'user_login',
        description: 'User logged in',
        ipAddress,
        userAgent
      });

      return {
        token,
        refreshToken,
        user: this.sanitizeUser(user)
      };

    } catch (error) {
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Verify 2FA code and complete login
   */
  static async verifyTwoFactor({ userId, code, ipAddress = null, userAgent = null }) {
    const db = getDatabase();

    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

      if (!user || !user.twoFactorEnabled) {
        throw new Error('Two-factor authentication not enabled');
      }

      // Verify the code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2 // Allow 2 time steps before/after
      });

      if (!verified) {
        throw new Error('Invalid two-factor code');
      }

      // Generate tokens
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create session
      db.prepare(`
        INSERT INTO sessions (userId, token, refreshToken, ipAddress, userAgent, expiresAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(user.id, token, refreshToken, ipAddress, userAgent, expiresAt.toISOString());

      // Update last login
      db.prepare('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

      // Log activity
      this.logActivity({
        userId: user.id,
        action: 'user_login_2fa',
        description: 'User logged in with 2FA',
        ipAddress,
        userAgent
      });

      return {
        token,
        refreshToken,
        user: this.sanitizeUser(user)
      };

    } catch (error) {
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Enable Two-Factor Authentication
   */
  static enableTwoFactor(userId) {
    const db = getDatabase();

    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Ailydian Ultra Pro (${userId})`,
        length: 32
      });

      // Save secret to database
      db.prepare(`
        UPDATE users SET twoFactorSecret = ?, twoFactorEnabled = 0 WHERE id = ?
      `).run(secret.base32, userId);

      // Return QR code data
      return {
        secret: secret.base32,
        qrCode: secret.otpauth_url
      };

    } catch (error) {
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Confirm and activate 2FA
   */
  static confirmTwoFactor(userId, code) {
    const db = getDatabase();

    try {
      const user = db.prepare('SELECT twoFactorSecret FROM users WHERE id = ?').get(userId);

      if (!user || !user.twoFactorSecret) {
        throw new Error('Two-factor setup not initiated');
      }

      // Verify the code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2
      });

      if (!verified) {
        throw new Error('Invalid verification code');
      }

      // Enable 2FA
      db.prepare('UPDATE users SET twoFactorEnabled = 1 WHERE id = ?').run(userId);

      // Log activity
      this.logActivity({
        userId,
        action: 'two_factor_enabled',
        description: 'Two-factor authentication enabled'
      });

      return { success: true };

    } catch (error) {
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Verify password (for login API compatibility)
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Find user by email
   */
  static findByEmail(email) {
    const db = getDatabase();
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      return user;  // Don't sanitize here - login needs passwordHash
    } finally {
      db.close();
    }
  }

  /**
   * Find user by ID
   */
  static findById(id) {
    const db = getDatabase();
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      return user ? this.sanitizeUser(user) : null;
    } finally {
      db.close();
    }
  }

  /**
   * Get user with stats
   */
  static getUserWithStats(userId) {
    const db = getDatabase();

    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (!user) return null;

      // Get today's usage
      const stats = db.prepare(`
        SELECT * FROM usage_stats WHERE userId = ? AND date = CURRENT_DATE
      `).get(userId);

      // Get recent activity
      const recentActivity = db.prepare(`
        SELECT action, description, createdAt
        FROM activity_log
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT 10
      `).all(userId);

      return {
        ...this.sanitizeUser(user),
        stats: stats || { chatMessages: 0, imagesGenerated: 0, voiceMinutes: 0, creditsUsed: 0 },
        recentActivity
      };

    } finally {
      db.close();
    }
  }

  /**
   * Update user profile
   */
  static updateProfile(userId, updates) {
    const db = getDatabase();

    try {
      const allowedFields = ['name', 'phone', 'bio', 'avatar'];
      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(userId);

      db.prepare(`
        UPDATE users SET ${fields.join(', ')} WHERE id = ?
      `).run(...values);

      return this.findById(userId);

    } finally {
      db.close();
    }
  }

  /**
   * Update user role (RBAC)
   */
  static updateUserRole(userId, role) {
    const db = getDatabase();

    try {
      // Get user before update to track previous role
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

      if (!user) {
        return null;
      }

      const previousRole = user.role || 'USER';

      // Update role
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);

      // Log activity
      this.logActivity({
        userId,
        action: 'role_changed',
        description: `Role changed from ${previousRole} to ${role}`,
        metadata: { previousRole, newRole: role }
      });

      // Get updated user
      const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

      return {
        ...this.sanitizeUser(updatedUser),
        previousRole
      };

    } finally {
      db.close();
    }
  }

  /**
   * Get all users with filters and pagination
   */
  static getAllUsers({ page = 1, limit = 50, role = null, search = null }) {
    const db = getDatabase();

    try {
      let query = 'SELECT * FROM users WHERE 1=1';
      const params = [];

      // Filter by role
      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      // Search by name or email
      if (search) {
        query += ' AND (name LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Add pagination
      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
      params.push(limit, (page - 1) * limit);

      const users = db.prepare(query).all(...params);

      return users.map(user => this.sanitizeUser(user));

    } finally {
      db.close();
    }
  }

  /**
   * Logout user (invalidate session)
   */
  static logout(token) {
    const db = getDatabase();
    try {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return { success: true };
    } finally {
      db.close();
    }
  }

  /**
   * Generate JWT token
   */
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        subscription: user.subscription,
        role: user.role || 'USER'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * Log user activity
   */
  static logActivity({ userId, action, description = null, ipAddress = null, userAgent = null, metadata = null }) {
    const db = getDatabase();
    try {
      db.prepare(`
        INSERT INTO activity_log (userId, action, description, ipAddress, userAgent, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        action,
        description,
        ipAddress,
        userAgent,
        metadata ? JSON.stringify(metadata) : null
      );
    } finally {
      db.close();
    }
  }

  /**
   * Update usage statistics
   */
  static updateUsage(userId, { chatMessages = 0, imagesGenerated = 0, voiceMinutes = 0, creditsUsed = 0 }) {
    const db = getDatabase();

    try {
      // Ensure today's record exists
      db.prepare(`
        INSERT OR IGNORE INTO usage_stats (userId, date)
        VALUES (?, CURRENT_DATE)
      `).run(userId);

      // Update stats
      db.prepare(`
        UPDATE usage_stats
        SET chatMessages = chatMessages + ?,
            imagesGenerated = imagesGenerated + ?,
            voiceMinutes = voiceMinutes + ?,
            creditsUsed = creditsUsed + ?
        WHERE userId = ? AND date = CURRENT_DATE
      `).run(chatMessages, imagesGenerated, voiceMinutes, creditsUsed, userId);

      // Update user credits
      if (creditsUsed > 0) {
        db.prepare(`
          UPDATE users SET credits = credits - ? WHERE id = ?
        `).run(creditsUsed, userId);
      }

    } finally {
      db.close();
    }
  }

  /**
   * Remove sensitive data from user object
   */
  static sanitizeUser(user) {
    const { passwordHash, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = User;
