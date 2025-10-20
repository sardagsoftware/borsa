/**
 * SHARD_12.4 - Input Validation
 * Sanitize and validate user inputs
 *
 * Security: Prevent injection, XSS, path traversal
 * White Hat: Secure by default, clear error messages
 */

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: any;
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  // Trim whitespace
  const sanitized = email.trim().toLowerCase();

  // Check length
  if (sanitized.length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  if (sanitized.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  // RFC 5322 simplified regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, sanitized };
}

/**
 * Password validation
 */
export function validatePassword(password: string): ValidationResult {
  // Check length
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' };
  }

  // Check complexity
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const complexity = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  if (complexity < 3) {
    return {
      valid: false,
      error: 'Password must contain at least 3 of: uppercase, lowercase, number, special character'
    };
  }

  return { valid: true, sanitized: password };
}

/**
 * Username validation
 */
export function validateUsername(username: string): ValidationResult {
  // Trim and lowercase
  const sanitized = username.trim().toLowerCase();

  // Check length
  if (sanitized.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (sanitized.length > 30) {
    return { valid: false, error: 'Username is too long' };
  }

  // Alphanumeric + underscore/hyphen
  const usernameRegex = /^[a-z0-9_-]+$/;

  if (!usernameRegex.test(sanitized)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscore, hyphen' };
  }

  // No consecutive special chars
  if (/__|-_|_-|--/.test(sanitized)) {
    return { valid: false, error: 'Username cannot have consecutive special characters' };
  }

  // No start/end with special chars
  if (/^[_-]|[_-]$/.test(sanitized)) {
    return { valid: false, error: 'Username cannot start or end with special characters' };
  }

  return { valid: true, sanitized };
}

/**
 * Sanitize HTML (prevent XSS)
 */
export function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize filename
 */
export function validateFilename(filename: string): ValidationResult {
  // Check length
  if (filename.length === 0) {
    return { valid: false, error: 'Filename is required' };
  }

  if (filename.length > 255) {
    return { valid: false, error: 'Filename is too long' };
  }

  // Check for path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { valid: false, error: 'Invalid filename (path traversal attempt)' };
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    return { valid: false, error: 'Invalid filename (null byte)' };
  }

  // Sanitize: remove special chars
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  return { valid: true, sanitized };
}

/**
 * Validate URL
 */
export function validateURL(url: string): ValidationResult {
  try {
    const parsed = new URL(url);

    // Only allow https in production
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS URLs are allowed' };
    }

    // Block localhost in production
    if (process.env.NODE_ENV === 'production') {
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return { valid: false, error: 'Localhost URLs are not allowed' };
      }
    }

    return { valid: true, sanitized: url };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate JSON
 */
export function validateJSON(input: string): ValidationResult {
  try {
    const parsed = JSON.parse(input);
    return { valid: true, sanitized: parsed };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format' };
  }
}

/**
 * Validate phone number (international format)
 */
export function validatePhone(phone: string): ValidationResult {
  // Remove spaces, dashes, parentheses
  const sanitized = phone.replace(/[\s\-()]/g, '');

  // Check format: + followed by 1-15 digits
  const phoneRegex = /^\+[1-9]\d{1,14}$/;

  if (!phoneRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid phone number (use international format: +1234567890)' };
  }

  return { valid: true, sanitized };
}

/**
 * Validate UUID
 */
export function validateUUID(uuid: string): ValidationResult {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' };
  }

  return { valid: true, sanitized: uuid.toLowerCase() };
}

/**
 * Validate integer
 */
export function validateInteger(
  value: any,
  min?: number,
  max?: number
): ValidationResult {
  const num = parseInt(value, 10);

  if (isNaN(num)) {
    return { valid: false, error: 'Invalid integer' };
  }

  if (min !== undefined && num < min) {
    return { valid: false, error: `Value must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `Value must be at most ${max}` };
  }

  return { valid: true, sanitized: num };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  min?: number,
  max?: number,
  fieldName: string = 'Field'
): ValidationResult {
  const length = value.length;

  if (min !== undefined && length < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters` };
  }

  if (max !== undefined && length > max) {
    return { valid: false, error: `${fieldName} must be at most ${max} characters` };
  }

  return { valid: true, sanitized: value };
}

/**
 * Validate enum value
 */
export function validateEnum<T>(
  value: any,
  allowedValues: T[],
  fieldName: string = 'Value'
): ValidationResult {
  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`
    };
  }

  return { valid: true, sanitized: value };
}

/**
 * Sanitize object (remove undefined/null, trim strings)
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Check for SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION\s+SELECT)/i,
    /(OR\s+1\s*=\s*1)/i,
    /(;\s*DROP\s+TABLE)/i,
    /(-{2}|\/\*|\*\/)/
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Comprehensive input validation
 */
export function validateInput(
  input: string,
  maxLength: number = 1000
): ValidationResult {
  // Check length
  if (input.length > maxLength) {
    return { valid: false, error: 'Input is too long' };
  }

  // Check for SQL injection
  if (detectSQLInjection(input)) {
    return { valid: false, error: 'Input contains suspicious patterns (SQL injection)' };
  }

  // Check for XSS
  if (detectXSS(input)) {
    return { valid: false, error: 'Input contains suspicious patterns (XSS)' };
  }

  // Sanitize
  const sanitized = sanitizeHTML(input.trim());

  return { valid: true, sanitized };
}
