/**
 * LyDian Data Encryption & Privacy
 *
 * Features:
 * - AES-256-GCM encryption for data at rest
 * - Field-level encryption for sensitive data
 * - Encryption key rotation
 * - PII (Personally Identifiable Information) detection and masking
 * - Data anonymization
 * - GDPR/KVKK compliant data handling
 *
 * @version 2.1.0
 */

const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment or generate
 */
function getEncryptionKey(keyId = 'default') {
  const envKey = process.env[`ENCRYPTION_KEY_${keyId.toUpperCase()}`];

  if (envKey) {
    // Derive 256-bit key from environment variable
    return crypto.scryptSync(envKey, 'lydian-salt', KEY_LENGTH);
  }

  // For development only - generate random key
  console.warn('[SECURITY] Using randomly generated encryption key. Set ENCRYPTION_KEY_DEFAULT in production!');
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Encrypt data using AES-256-GCM
 */
function encrypt(plaintext, keyId = 'default') {
  try {
    const key = getEncryptionKey(keyId);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    // Return: iv + authTag + encrypted data (all base64 encoded)
    const result = Buffer.concat([iv, authTag, encrypted]).toString('base64');

    return {
      ciphertext: result,
      keyId,
      algorithm: ALGORITHM,
      version: 1
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
function decrypt(encryptedData, keyId = 'default') {
  try {
    const key = getEncryptionKey(keyId);

    let ciphertext;
    if (typeof encryptedData === 'object') {
      ciphertext = encryptedData.ciphertext;
      keyId = encryptedData.keyId || keyId;
    } else {
      ciphertext = encryptedData;
    }

    const buffer = Buffer.from(ciphertext, 'base64');

    // Extract: iv + authTag + encrypted data
    const iv = buffer.slice(0, IV_LENGTH);
    const authTag = buffer.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buffer.slice(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way)
 */
function hash(data, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  }

  const hash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512').toString('hex');

  return {
    hash,
    salt,
    algorithm: 'pbkdf2-sha512',
    iterations: 100000
  };
}

/**
 * Verify hashed data
 */
function verifyHash(data, hashedData) {
  const { hash: storedHash, salt } = hashedData;
  const { hash: computedHash } = hash(data, salt);
  return storedHash === computedHash;
}

/**
 * Field-level encryption for objects
 */
function encryptFields(obj, fieldsToEncrypt = [], keyId = 'default') {
  const result = { ...obj };

  for (const field of fieldsToEncrypt) {
    if (result[field] !== undefined && result[field] !== null) {
      const plaintext = typeof result[field] === 'string'
        ? result[field]
        : JSON.stringify(result[field]);

      result[field] = encrypt(plaintext, keyId);
      result[`${field}_encrypted`] = true;
    }
  }

  return result;
}

/**
 * Field-level decryption for objects
 */
function decryptFields(obj, fieldsToDecrypt = [], keyId = 'default') {
  const result = { ...obj };

  for (const field of fieldsToDecrypt) {
    if (result[field] && result[`${field}_encrypted`]) {
      const decrypted = decrypt(result[field], keyId);

      try {
        result[field] = JSON.parse(decrypted);
      } catch {
        result[field] = decrypted;
      }

      delete result[`${field}_encrypted`];
    }
  }

  return result;
}

/**
 * PII Detection patterns
 */
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  tcKimlik: /\b\d{11}\b/g, // Turkish ID number
  iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b/g
};

/**
 * Detect PII in text
 */
function detectPII(text) {
  const detected = [];

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      detected.push({
        type,
        count: matches.length,
        samples: matches.slice(0, 3) // First 3 matches
      });
    }
  }

  return detected;
}

/**
 * Mask PII in text
 */
function maskPII(text, maskChar = '*') {
  let masked = text;

  // Email: show first 2 chars and domain
  masked = masked.replace(PII_PATTERNS.email, (match) => {
    const [name, domain] = match.split('@');
    return `${name.substring(0, 2)}${'*'.repeat(Math.max(name.length - 2, 3))}@${domain}`;
  });

  // Phone: show last 4 digits
  masked = masked.replace(PII_PATTERNS.phone, (match) => {
    const digits = match.replace(/\D/g, '');
    return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
  });

  // Credit card: show last 4 digits
  masked = masked.replace(PII_PATTERNS.creditCard, (match) => {
    const digits = match.replace(/\D/g, '');
    return `${'*'.repeat(12)}${digits.slice(-4)}`;
  });

  // SSN, TC Kimlik: show last 2 digits
  masked = masked.replace(PII_PATTERNS.ssn, (match) => {
    return `${'*'.repeat(match.length - 2)}${match.slice(-2)}`;
  });

  masked = masked.replace(PII_PATTERNS.tcKimlik, (match) => {
    return `${'*'.repeat(9)}${match.slice(-2)}`;
  });

  // IBAN: show country code and last 4 chars
  masked = masked.replace(PII_PATTERNS.iban, (match) => {
    return `${match.substring(0, 2)}${'*'.repeat(match.length - 6)}${match.slice(-4)}`;
  });

  // IP addresses
  masked = masked.replace(PII_PATTERNS.ipAddress, () => 'xxx.xxx.xxx.xxx');

  return masked;
}

/**
 * Anonymize data (irreversible)
 */
function anonymize(data) {
  const anonymized = { ...data };

  // Remove or hash PII fields
  const piiFields = ['email', 'phone', 'ssn', 'tcKimlik', 'iban', 'address', 'name', 'surname'];

  for (const field of piiFields) {
    if (anonymized[field]) {
      // Keep only hash of the value for uniqueness
      anonymized[field] = crypto.createHash('sha256').update(anonymized[field]).digest('hex').substring(0, 16);
    }
  }

  // Replace IP with hash
  if (anonymized.ip) {
    anonymized.ip = crypto.createHash('sha256').update(anonymized.ip).digest('hex').substring(0, 8);
  }

  // Add anonymization timestamp
  anonymized._anonymized = true;
  anonymized._anonymizedAt = new Date().toISOString();

  return anonymized;
}

/**
 * Middleware to encrypt response data
 */
function encryptResponse(fieldsToEncrypt = []) {
  return (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
      if (data && typeof data === 'object' && fieldsToEncrypt.length > 0) {
        data = encryptFields(data, fieldsToEncrypt);
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Middleware to decrypt request data
 */
function decryptRequest(fieldsToDecrypt = []) {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object' && fieldsToDecrypt.length > 0) {
      try {
        req.body = decryptFields(req.body, fieldsToDecrypt);
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid encrypted data',
          code: 'DECRYPTION_FAILED'
        });
      }
    }

    next();
  };
}

/**
 * Middleware to mask PII in logs
 */
function maskPIIInLogs(req, res, next) {
  const originalJson = res.json;

  res.json = function (data) {
    // Deep clone to avoid modifying original
    let logData = JSON.parse(JSON.stringify(data));

    // Recursively mask PII in object
    function maskObject(obj) {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = maskPII(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          maskObject(obj[key]);
        }
      }
      return obj;
    }

    logData = maskObject(logData);

    // Log masked data
    console.log('[API Response]', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      data: logData
    });

    return originalJson.call(this, data);
  };

  next();
}

/**
 * Generate encryption key pair for asymmetric encryption
 */
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { publicKey, privateKey };
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  verifyHash,
  encryptFields,
  decryptFields,
  detectPII,
  maskPII,
  anonymize,
  encryptResponse,
  decryptRequest,
  maskPIIInLogs,
  generateKeyPair,
  PII_PATTERNS
};
