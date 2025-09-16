/**
 * Encryption Utility - Z.AI API Key Security
 * AES-256-GCM ile güvenli şifreleme
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Encryption key'i environment variable'dan al
const MASTER_KEY = process.env.ENCRYPTION_KEY;

if (!MASTER_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('ENCRYPTION_KEY environment variable is required in production');
}

/**
 * API key'i güvenli şekilde şifrele
 */
export function encryptAPIKey(apiKey: string): string {
  if (!MASTER_KEY) {
    console.warn('⚠️ Encryption disabled - ENCRYPTION_KEY not set');
    return apiKey; // Development mode
  }

  try {
    // Random IV ve salt oluştur
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Master key'den türetilmiş key oluştur
    const key = crypto.pbkdf2Sync(MASTER_KEY, salt, 100000, KEY_LENGTH, 'sha512');
    
    // Şifrele
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('zai-api-key', 'utf8'));
    
    let encrypted = cipher.update(apiKey, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Authentication tag al
    const tag = cipher.getAuthTag();
    
    // Tüm bileşenleri birleştir
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      encrypted
    ]);
    
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Şifrelenmiş API key'i çöz
 */
export function decryptAPIKey(encryptedKey: string): string {
  if (!MASTER_KEY) {
    console.warn('⚠️ Decryption disabled - ENCRYPTION_KEY not set');
    return encryptedKey; // Development mode
  }

  try {
    const data = Buffer.from(encryptedKey, 'base64');
    
    // Bileşenleri ayır
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Key'i türet
    const key = crypto.pbkdf2Sync(MASTER_KEY, salt, 100000, KEY_LENGTH, 'sha512');
    
    // Şifreyi çöz
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('zai-api-key', 'utf8'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * API key'in geçerli olup olmadığını kontrol et
 */
export function validateAPIKey(apiKey: string): boolean {
  if (!apiKey || apiKey.length < 10) {
    return false;
  }
  
  // Basic format validation
  const apiKeyPattern = /^[A-Za-z0-9\-_\.]+$/;
  return apiKeyPattern.test(apiKey);
}

/**
 * API key'i maskele (logs için)
 */
export function maskAPIKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '***';
  }
  
  const start = apiKey.substring(0, 4);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}***${end}`;
}

/**
 * Güvenli random string oluştur
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash oluştur (password'lar için)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Password doğrula
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const [salt, hash] = hashedPassword.split(':');
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return computed === hash;
  } catch {
    return false;
  }
}

/**
 * Environment variables güvenliğini kontrol et
 */
export function checkSecurityConfig(): {
  encryption: boolean;
  nextauth_secret: boolean;
  secure_cookies: boolean;
  https_only: boolean;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  
  const encryption = !!MASTER_KEY;
  if (!encryption) {
    recommendations.push('ENCRYPTION_KEY environment variable should be set');
  }
  
  const nextauth_secret = !!process.env.NEXTAUTH_SECRET && 
                         process.env.NEXTAUTH_SECRET.length >= 32;
  if (!nextauth_secret) {
    recommendations.push('NEXTAUTH_SECRET should be at least 32 characters');
  }
  
  const secure_cookies = process.env.NODE_ENV === 'production';
  const https_only = process.env.NEXTAUTH_URL?.startsWith('https://') || false;
  
  if (process.env.NODE_ENV === 'production' && !https_only) {
    recommendations.push('NEXTAUTH_URL should use HTTPS in production');
  }
  
  return {
    encryption,
    nextauth_secret,
    secure_cookies,
    https_only,
    recommendations
  };
}

/**
 * Rate limiting için IP hash
 */
export function hashIP(ip: string): string {
  return crypto.createHash('sha256')
               .update(ip + (process.env.IP_SALT || 'default-salt'))
               .digest('hex');
}

/**
 * Audit log için güvenli JSON
 */
export function createAuditLog(action: string, userId: string, details: any = {}) {
  return {
    timestamp: new Date().toISOString(),
    action,
    user_id: userId,
    details: {
      ...details,
      api_key: details.api_key ? maskAPIKey(details.api_key) : undefined
    },
    request_id: generateSecureToken(16)
  };
}
