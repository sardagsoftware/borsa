// ============================================
// 🛡️ INPUT VALIDATION & SANITIZATION
// Beyaz Şapkalı Güvenlik - XSS/Injection Protection
// Version: 1.0.0
// ============================================

/**
 * Zod-like validation schema (lightweight alternative - no external dep)
 */
class InputValidator {
    /**
     * Sanitize string input (XSS protection)
     */
    static sanitizeString(input) {
        if (typeof input !== 'string') {
            return '';
        }

        // Remove HTML tags (basic XSS protection)
        let sanitized = input.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        sanitized = sanitized.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
        sanitized = sanitized.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
        sanitized = sanitized.replace(/<embed[^>]*>/gi, '');

        // Encode dangerous characters
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');

        return sanitized;
    }

    /**
     * Validate problem input
     */
    static validateProblem(problem) {
        const errors = [];

        // Type check
        if (typeof problem !== 'string') {
            errors.push('Problem must be a string');
            return { valid: false, errors };
        }

        // Trim whitespace
        problem = problem.trim();

        // Length validation
        if (problem.length < 5) {
            errors.push('Problem must be at least 5 characters');
        }

        if (problem.length > 10000) {
            errors.push('Problem cannot exceed 10,000 characters');
        }

        // Check for SQL injection patterns (basic)
        const sqlPatterns = [
            /(\bSELECT\b.*\bFROM\b)/i,
            /(\bINSERT\b.*\bINTO\b)/i,
            /(\bUPDATE\b.*\bSET\b)/i,
            /(\bDELETE\b.*\bFROM\b)/i,
            /(\bDROP\b.*\bTABLE\b)/i,
            /(\bUNION\b.*\bSELECT\b)/i
        ];

        for (const pattern of sqlPatterns) {
            if (pattern.test(problem)) {
                errors.push('Invalid input detected');
                break;
            }
        }

        // Check for command injection patterns
        const cmdPatterns = [
            /[;&|`$(){}[\]<>]/g
        ];

        let suspiciousChars = 0;
        for (const pattern of cmdPatterns) {
            const matches = problem.match(pattern);
            if (matches) {
                suspiciousChars += matches.length;
            }
        }

        // Allow some special chars but flag excessive use
        if (suspiciousChars > 20) {
            errors.push('Too many special characters detected');
        }

        return {
            valid: errors.length === 0,
            errors,
            sanitized: this.sanitizeString(problem)
        };
    }

    /**
     * Validate domain input
     */
    static validateDomain(domain) {
        const validDomains = [
            'mathematics',
            'coding',
            'science',
            'strategy',
            'logistics'
        ];

        if (!domain || typeof domain !== 'string') {
            return { valid: false, error: 'Domain is required' };
        }

        if (!validDomains.includes(domain.toLowerCase())) {
            return {
                valid: false,
                error: `Invalid domain. Must be one of: ${validDomains.join(', ')}`
            };
        }

        return { valid: true, sanitized: domain.toLowerCase() };
    }

    /**
     * Validate language input
     */
    static validateLanguage(language) {
        const validLanguages = [
            'tr-TR', 'en-US', 'en-GB', 'de-DE', 'fr-FR',
            'es-ES', 'it-IT', 'ru-RU', 'zh-CN', 'ja-JP', 'ar-SA'
        ];

        if (!language || typeof language !== 'string') {
            return { valid: true, sanitized: 'tr-TR' }; // Default to Turkish
        }

        if (!validLanguages.includes(language)) {
            return {
                valid: false,
                error: `Invalid language. Must be one of: ${validLanguages.join(', ')}`
            };
        }

        return { valid: true, sanitized: language };
    }

    /**
     * Validate entire request body
     */
    static validateRequest(body) {
        const errors = [];

        // Problem validation
        const problemValidation = this.validateProblem(body.problem);
        if (!problemValidation.valid) {
            errors.push(...problemValidation.errors);
        }

        // Domain validation
        const domain = body.domain || 'mathematics';
        const domainValidation = this.validateDomain(domain);
        if (!domainValidation.valid) {
            errors.push(domainValidation.error);
        }

        // Language validation
        const language = body.language || 'tr-TR';
        const languageValidation = this.validateLanguage(language);
        if (!languageValidation.valid) {
            errors.push(languageValidation.error);
        }

        // Options validation (basic)
        if (body.options && typeof body.options !== 'object') {
            errors.push('Options must be an object');
        }

        if (errors.length > 0) {
            return {
                valid: false,
                errors,
                message: 'Validation failed'
            };
        }

        // Return sanitized data
        return {
            valid: true,
            data: {
                problem: problemValidation.sanitized,
                domain: domainValidation.sanitized,
                language: languageValidation.sanitized,
                options: body.options || {}
            }
        };
    }
}

/**
 * Middleware for input validation
 */
function inputValidationMiddleware(req, res, next) {
    // Only validate POST requests
    if (req.method !== 'POST') {
        return next();
    }

    // Validate request body
    const validation = InputValidator.validateRequest(req.body || {});

    if (!validation.valid) {
        console.warn('[Input Validator] ⚠️ Validation failed:', validation.errors);

        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Gönderdiğiniz veriler geçersiz',
            details: validation.errors
        });
    }

    // Replace request body with sanitized data
    req.body = validation.data;

    console.log('[Input Validator] ✅ Input validated and sanitized');
    next();
}

module.exports = {
    InputValidator,
    inputValidationMiddleware
};
