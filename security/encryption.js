/**
 * Enterprise-Grade Encryption Service
 * HIPAA/GDPR Compliant - AES-256-GCM Encryption
 * Zero-Knowledge Architecture for Medical Data Protection
 *
 * @module EncryptionService
 * @version 2.0.0
 * @security-level CRITICAL
 */

const crypto = require('crypto');
const { promisify } = require('util');

const randomBytes = promisify(crypto.randomBytes);
const scrypt = promisify(crypto.scrypt);
const pbkdf2 = promisify(crypto.pbkdf2);

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits for GCM
    this.authTagLength = 16; // 128 bits
    this.saltLength = 32;
    this.iterations = 100000; // PBKDF2 iterations

    // Master encryption key from environment (should be in Azure Key Vault)
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY;

    if (!this.masterKey) {
      console.warn('⚠️  WARNING: ENCRYPTION_MASTER_KEY not set! Using fallback (NOT for production!)');
      this.masterKey = this.generateFallbackKey();
    }
  }

  /**
   * Generate a fallback key for development (NOT FOR PRODUCTION)
   * @private
   */
  generateFallbackKey() {
    return crypto.createHash('sha256')
      .update('DEVELOPMENT_FALLBACK_KEY_DO_NOT_USE_IN_PRODUCTION')
      .digest('hex');
  }

  /**
   * Derive encryption key from master key and salt
   * @private
   */
  async deriveKey(salt) {
    const key = await scrypt(this.masterKey, salt, this.keyLength);
    return key;
  }

  /**
   * Encrypt sensitive medical data with AES-256-GCM
   * @param {string} plaintext - Data to encrypt
   * @param {string} [context] - Optional context for key derivation
   * @returns {Promise<Object>} Encrypted data with metadata
   */
  async encrypt(plaintext, context = 'medical-data') {
    try {
      if (!plaintext || typeof plaintext !== 'string') {
        throw new Error('Invalid plaintext: must be a non-empty string');
      }

      // Generate random salt and IV
      const salt = await randomBytes(this.saltLength);
      const iv = await randomBytes(this.ivLength);

      // Derive encryption key
      const key = await this.deriveKey(salt);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      // Add context as additional authenticated data (AAD)
      cipher.setAAD(Buffer.from(context, 'utf8'));

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        metadata: {
          algorithm: this.algorithm,
          keyId: crypto.createHash('sha256').update(salt).digest('hex').substring(0, 16),
          iv: iv.toString('hex'),
          authTag: authTag.toString('hex'),
          salt: salt.toString('hex'),
          context,
          encryptedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Encryption failed:', error.message);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt encrypted medical data
   * @param {string} encrypted - Encrypted data
   * @param {Object} metadata - Encryption metadata
   * @returns {Promise<string>} Decrypted plaintext
   */
  async decrypt(encrypted, metadata) {
    try {
      if (!encrypted || !metadata) {
        throw new Error('Invalid input: encrypted data and metadata required');
      }

      const { iv, authTag, salt, context } = metadata;

      if (!iv || !authTag || !salt) {
        throw new Error('Invalid metadata: missing required fields');
      }

      // Derive decryption key
      const key = await this.deriveKey(Buffer.from(salt, 'hex'));

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(iv, 'hex')
      );

      // Set authentication tag
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      // Set AAD
      if (context) {
        decipher.setAAD(Buffer.from(context, 'utf8'));
      }

      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('❌ Decryption failed:', error.message);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash password with PBKDF2 (for user authentication)
   * @param {string} password - Plain password
   * @returns {Promise<string>} Hashed password with salt
   */
  async hashPassword(password) {
    try {
      const salt = await randomBytes(this.saltLength);
      const hash = await pbkdf2(
        password,
        salt,
        this.iterations,
        64,
        'sha512'
      );

      return `${salt.toString('hex')}:${hash.toString('hex')}`;
    } catch (error) {
      console.error('❌ Password hashing failed:', error.message);
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain password to verify
   * @param {string} storedHash - Stored hash with salt
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, storedHash) {
    try {
      const [salt, hash] = storedHash.split(':');
      const hashBuffer = Buffer.from(hash, 'hex');

      const verifyHash = await pbkdf2(
        password,
        Buffer.from(salt, 'hex'),
        this.iterations,
        64,
        'sha512'
      );

      return crypto.timingSafeEqual(hashBuffer, verifyHash);
    } catch (error) {
      console.error('❌ Password verification failed:', error.message);
      return false;
    }
  }

  /**
   * Encrypt file (for medical images, documents)
   * @param {Buffer} fileBuffer - File data as buffer
   * @param {string} filename - Original filename
   * @returns {Promise<Object>} Encrypted file with metadata
   */
  async encryptFile(fileBuffer, filename) {
    try {
      const salt = await randomBytes(this.saltLength);
      const iv = await randomBytes(this.ivLength);
      const key = await this.deriveKey(salt);

      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      cipher.setAAD(Buffer.from(filename, 'utf8'));

      const encrypted = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final()
      ]);

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        metadata: {
          algorithm: this.algorithm,
          filename,
          originalSize: fileBuffer.length,
          encryptedSize: encrypted.length,
          iv: iv.toString('hex'),
          authTag: authTag.toString('hex'),
          salt: salt.toString('hex'),
          encryptedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ File encryption failed:', error.message);
      throw new Error(`File encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt file
   * @param {Buffer} encryptedBuffer - Encrypted file data
   * @param {Object} metadata - File encryption metadata
   * @returns {Promise<Buffer>} Decrypted file buffer
   */
  async decryptFile(encryptedBuffer, metadata) {
    try {
      const { iv, authTag, salt, filename } = metadata;
      const key = await this.deriveKey(Buffer.from(salt, 'hex'));

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      decipher.setAAD(Buffer.from(filename, 'utf8'));

      const decrypted = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final()
      ]);

      return decrypted;
    } catch (error) {
      console.error('❌ File decryption failed:', error.message);
      throw new Error(`File decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate secure random token (for session IDs, API keys)
   * @param {number} [length=32] - Token length in bytes
   * @returns {Promise<string>} Secure random token
   */
  async generateToken(length = 32) {
    const buffer = await randomBytes(length);
    return buffer.toString('hex');
  }

  /**
   * Hash sensitive data (for pseudonymization)
   * @param {string} data - Data to hash
   * @param {string} [algorithm='sha256'] - Hash algorithm
   * @returns {string} Hashed data
   */
  hash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm)
      .update(data)
      .digest('hex');
  }

  /**
   * Generate HMAC for data integrity verification
   * @param {string} data - Data to sign
   * @param {string} [secret] - HMAC secret (uses master key if not provided)
   * @returns {string} HMAC signature
   */
  generateHMAC(data, secret = this.masterKey) {
    return crypto.createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify HMAC signature
   * @param {string} data - Original data
   * @param {string} signature - HMAC signature to verify
   * @param {string} [secret] - HMAC secret
   * @returns {boolean} True if signature is valid
   */
  verifyHMAC(data, signature, secret = this.masterKey) {
    const expectedSignature = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

// Singleton instance
const encryptionService = new EncryptionService();

module.exports = encryptionService;
