/**
 * 🗄️ DATABASE SECURITY LAYER
 * Advanced database protection and query validation
 * SQL injection prevention and data encryption
 */

const crypto = require('crypto');

class DatabaseSecurity {
    constructor() {
        this.queryWhitelist = new Set([
            'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'INDEX'
        ]);

        this.dangerousPatterns = [
            /(\b(exec|execute|sp_executesql)\b)/gi,
            /(\b(union\s+select)\b)/gi,
            /(\b(drop\s+table)\b)/gi,
            /(\b(delete\s+from)\b)/gi,
            /(\b(insert\s+into)\b)/gi,
            /(\b(update\s+\w+\s+set)\b)/gi,
            /(--[\s\S]*$)/gm,
            /(\b(or\s+1\s*=\s*1)\b)/gi,
            /(\b(and\s+1\s*=\s*1)\b)/gi,
            /('.*'|".*")/g,
            /(;\s*drop\s+)/gi,
            /(;\s*delete\s+)/gi,
            /(;\s*insert\s+)/gi,
            /(;\s*update\s+)/gi,
            /(\b(xp_cmdshell)\b)/gi,
            /(\b(sp_configure)\b)/gi
        ];

        this.encryptionKey = crypto.randomBytes(32);
        this.encryptionAlgorithm = 'aes-256-cbc';
    }

    // Query validation and sanitization
    validateQuery(query, params = []) {
        if (!query || typeof query !== 'string') {
            throw new Error('Invalid query: Query must be a non-empty string');
        }

        // Check for dangerous patterns
        for (const pattern of this.dangerousPatterns) {
            if (pattern.test(query)) {
                throw new Error(`Potentially malicious query detected: ${pattern.source}`);
            }
        }

        // Validate parameters
        if (params && Array.isArray(params)) {
            for (const param of params) {
                this.validateParameter(param);
            }
        }

        return true;
    }

    validateParameter(param) {
        if (param === null || param === undefined) {
            return true;
        }

        const paramStr = String(param);

        // Check for SQL injection patterns in parameters
        for (const pattern of this.dangerousPatterns) {
            if (pattern.test(paramStr)) {
                throw new Error(`Potentially malicious parameter detected: ${paramStr}`);
            }
        }

        return true;
    }

    // Data encryption for sensitive fields
    // 🔒 SECURITY FIX: Use createCipheriv instead of deprecated createCipher
    encryptSensitiveData(data) {
        if (!data) return data;

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.encryptionAlgorithm, this.encryptionKey, iv);

        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return {
            encrypted,
            iv: iv.toString('hex'),
            algorithm: this.encryptionAlgorithm
        };
    }

    decryptSensitiveData(encryptedData) {
        if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv) return null;

        try {
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, this.encryptionKey, iv);

            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return JSON.parse(decrypted);
        } catch (error) {
            console.error('❌ Failed to decrypt data:', error);
            return null;
        }
    }

    // Connection pool security
    secureConnectionConfig(config) {
        return {
            ...config,
            ssl: {
                rejectUnauthorized: true,
                ca: config.sslCA || null,
                key: config.sslKey || null,
                cert: config.sslCert || null
            },
            connectionLimit: 100,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true,
            charset: 'utf8mb4'
        };
    }

    // Audit logging
    logDatabaseOperation(operation, query, params, userId, result) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            queryHash: crypto.createHash('sha256').update(query).digest('hex'),
            paramCount: params ? params.length : 0,
            userId,
            success: !result.error,
            error: result.error || null,
            rowsAffected: result.affectedRows || 0,
            executionTime: result.executionTime || 0
        };

        console.log('🗄️ Database Operation:', logEntry);
        return logEntry;
    }

    // Data anonymization
    anonymizeData(data, fields = []) {
        if (!data || !fields.length) return data;

        const anonymized = { ...data };

        for (const field of fields) {
            if (anonymized[field]) {
                if (field.includes('email')) {
                    anonymized[field] = this.anonymizeEmail(anonymized[field]);
                } else if (field.includes('phone')) {
                    anonymized[field] = this.anonymizePhone(anonymized[field]);
                } else {
                    anonymized[field] = this.anonymizeGeneral(anonymized[field]);
                }
            }
        }

        return anonymized;
    }

    anonymizeEmail(email) {
        const [name, domain] = email.split('@');
        const anonymizedName = name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
        return `${anonymizedName}@${domain}`;
    }

    anonymizePhone(phone) {
        return phone.replace(/\d(?=\d{4})/g, '*');
    }

    anonymizeGeneral(value) {
        if (typeof value === 'string' && value.length > 2) {
            return value.charAt(0) + '*'.repeat(value.length - 2) + value.charAt(value.length - 1);
        }
        return '*'.repeat(value.toString().length);
    }
}

module.exports = DatabaseSecurity;