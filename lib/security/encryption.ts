import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is always 12 bytes (96 bits)
const TAG_LENGTH = 16; // Authentication tag length
const SALT_LENGTH = 32; // Salt length for key derivation

// Get encryption key from environment or generate a secure one
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  // Convert hex string to buffer
  return Buffer.from(key, 'hex');
};

// Generate a secure random key (for setup)
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Encrypt sensitive data
export const encrypt = async (text: string): Promise<string> => {
  try {
    const key = getEncryptionKey();
    
    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    cipher.setAAD(salt); // Additional authenticated data
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine IV, salt, tag, and encrypted data
    const result = Buffer.concat([
      iv,
      salt,
      tag,
      Buffer.from(encrypted, 'hex')
    ]).toString('base64');
    
    return result;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt sensitive data
export const decrypt = async (encryptedData: string): Promise<string> => {
  try {
    const key = getEncryptionKey();
    
    // Parse the encrypted data
    const buffer = Buffer.from(encryptedData, 'base64');
    
    const iv = buffer.subarray(0, IV_LENGTH);
    const salt = buffer.subarray(IV_LENGTH, IV_LENGTH + SALT_LENGTH);
    const tag = buffer.subarray(IV_LENGTH + SALT_LENGTH, IV_LENGTH + SALT_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH + SALT_LENGTH + TAG_LENGTH);
    
    // Derive key using same parameters
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAAD(salt);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Hash data (for non-reversible operations)
export const hash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Generate secure random token
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Verify data integrity
export const verifyIntegrity = (data: string, expectedHash: string): boolean => {
  const actualHash = hash(data);
  return crypto.timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
};

// Key rotation utility
export const rotateKey = async (oldEncryptedData: string, oldKey: string, newKey: string): Promise<string> => {
  // Temporarily set old key for decryption
  const originalKey = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = oldKey;
  
  try {
    // Decrypt with old key
    const plaintext = await decrypt(oldEncryptedData);
    
    // Set new key for encryption
    process.env.ENCRYPTION_KEY = newKey;
    
    // Encrypt with new key
    const newEncryptedData = await encrypt(plaintext);
    
    return newEncryptedData;
  } finally {
    // Restore original key
    process.env.ENCRYPTION_KEY = originalKey;
  }
};

// Secure wipe function for sensitive data in memory
export const secureWipe = (obj: any): void => {
  if (typeof obj === 'string') {
    // For strings, we can't directly modify them as they're immutable
    // But we can clear references
    obj = null;
  } else if (typeof obj === 'object' && obj !== null) {
    // Recursively wipe object properties
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        obj[key] = '\0'.repeat(obj[key].length);
      } else if (typeof obj[key] === 'object') {
        secureWipe(obj[key]);
      }
      delete obj[key];
    });
  }
};

// Encryption utilities for specific data types
export const encryptJSON = async (obj: any): Promise<string> => {
  const jsonString = JSON.stringify(obj);
  return encrypt(jsonString);
};

export const decryptJSON = async <T>(encryptedData: string): Promise<T> => {
  const jsonString = await decrypt(encryptedData);
  return JSON.parse(jsonString);
};

// Export for setup script
export { getEncryptionKey };
