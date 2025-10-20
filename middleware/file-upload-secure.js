/**
 * SECURE FILE UPLOAD MIDDLEWARE
 * MIME validation, filename sanitization, malware detection
 * SECURITY FIX: FILE-UPLOAD-VALIDATION-2025
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Allowed MIME types (whitelist approach)
const ALLOWED_MIME_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],

  // Documents
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/csv': ['.csv'],

  // Microsoft Office
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/msword': ['.doc'],
  'application/vnd.ms-excel': ['.xls'],

  // Archives
  'application/zip': ['.zip'],
  'application/x-tar': ['.tar'],
  'application/gzip': ['.gz']
};

// Maximum file sizes by type (bytes)
const MAX_FILE_SIZES = {
  'image/jpeg': 5 * 1024 * 1024,  // 5MB
  'image/png': 5 * 1024 * 1024,   // 5MB
  'image/gif': 2 * 1024 * 1024,   // 2MB
  'image/webp': 3 * 1024 * 1024,  // 3MB
  'application/pdf': 10 * 1024 * 1024, // 10MB
  'application/zip': 20 * 1024 * 1024, // 20MB
  'default': 5 * 1024 * 1024      // 5MB default
};

/**
 * Sanitize filename (prevent path traversal, XSS)
 */
function sanitizeFilename(filename) {
  if (!filename) return 'unnamed';

  // Remove path components (prevent path traversal)
  filename = path.basename(filename);

  // Remove dangerous characters
  // Allow only alphanumeric, dots, hyphens, underscores
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Remove multiple dots (prevent extension confusion)
  filename = filename.replace(/\.{2,}/g, '.');

  // Limit filename length
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  const sanitizedName = name.substring(0, 200);

  return sanitizedName + ext;
}

/**
 * Generate secure random filename
 */
function generateSecureFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase();
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${randomBytes}${ext}`;
}

/**
 * File filter - MIME type validation
 */
const fileFilter = (req, file, callback) => {
  const mimetype = file.mimetype;
  const ext = path.extname(file.originalname).toLowerCase();

  // Check if MIME type is allowed
  if (!ALLOWED_MIME_TYPES[mimetype]) {
    const allowedTypes = Object.keys(ALLOWED_MIME_TYPES).join(', ');
    return callback(
      new Error(`File type ${mimetype} not allowed. Allowed: ${allowedTypes}`),
      false
    );
  }

  // Check file extension matches MIME type
  const allowedExtensions = ALLOWED_MIME_TYPES[mimetype];
  if (!allowedExtensions.includes(ext)) {
    return callback(
      new Error(`Extension ${ext} doesn't match MIME type ${mimetype}`),
      false
    );
  }

  // Additional security: Check for double extensions
  const filename = file.originalname.toLowerCase();
  const suspiciousPatterns = [
    '.exe', '.sh', '.bat', '.cmd', '.com',
    '.js', '.jar', '.app', '.deb', '.rpm'
  ];

  for (const pattern of suspiciousPatterns) {
    if (filename.includes(pattern)) {
      return callback(
        new Error('Suspicious file extension detected'),
        false
      );
    }
  }

  callback(null, true);
};

/**
 * Scan file buffer for malware signatures
 */
async function scanFileForMalware(fileBuffer, filename) {
  const checks = [];

  // Check 1: Executable signatures
  const executableSignatures = [
    { name: 'Windows PE', sig: Buffer.from([0x4D, 0x5A]) },
    { name: 'ELF', sig: Buffer.from([0x7F, 0x45, 0x4C, 0x46]) },
    { name: 'Mach-O', sig: Buffer.from([0xCF, 0xFA, 0xED, 0xFE]) },
    { name: 'DOS MZ', sig: Buffer.from([0x4D, 0x5A, 0x90]) }
  ];

  for (const { name, sig } of executableSignatures) {
    if (fileBuffer.slice(0, sig.length).equals(sig)) {
      checks.push(`Executable detected: ${name}`);
    }
  }

  // Check 2: Script content in non-script files
  const ext = path.extname(filename).toLowerCase();
  if (!['.js', '.html', '.xml'].includes(ext)) {
    const fileString = fileBuffer.toString('utf8', 0, Math.min(2048, fileBuffer.length));

    const maliciousPatterns = [
      { pattern: /<script/i, name: 'Script tag' },
      { pattern: /javascript:/i, name: 'JavaScript protocol' },
      { pattern: /on\w+\s*=/i, name: 'Event handler' },
      { pattern: /<iframe/i, name: 'IFrame tag' },
      { pattern: /<object/i, name: 'Object tag' },
      { pattern: /<embed/i, name: 'Embed tag' },
      { pattern: /eval\s*\(/i, name: 'Eval function' },
      { pattern: /base64_decode/i, name: 'Base64 decode' }
    ];

    for (const { pattern, name } of maliciousPatterns) {
      if (pattern.test(fileString)) {
        checks.push(`Malicious content: ${name}`);
      }
    }
  }

  // Check 3: PHP code in images (polyglot attacks)
  if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
    const fileString = fileBuffer.toString('utf8', 0, Math.min(1024, fileBuffer.length));
    if (/<\?php/i.test(fileString) || /<\?=/i.test(fileString)) {
      checks.push('PHP code in image file');
    }
  }

  // Check 4: File size anomalies (Skip - let multer handle file size limits)
  // Size validation is handled by multer's fileSize limit

  // Return check results
  if (checks.length > 0) {
    throw new Error(`Security checks failed: ${checks.join(', ')}`);
  }

  return true;
}

/**
 * Secure upload configuration
 */
const secureUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max (will be further limited by MIME type)
    files: 10, // Max 10 files per request
    fields: 20, // Max 20 form fields
    fieldSize: 1 * 1024 * 1024 // 1MB per field
  }
});

/**
 * Middleware to apply malware scanning after upload
 */
const malwareScanMiddleware = async (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }

  try {
    const files = req.files || [req.file];

    for (const file of files) {
      if (!file) continue;
      await scanFileForMalware(file.buffer, file.originalname);

      // Sanitize filename
      file.sanitizedName = sanitizeFilename(file.originalname);
      file.secureFilename = generateSecureFilename(file.originalname);
    }

    next();
  } catch (error) {
    return res.status(400).json({
      error: 'File validation failed',
      message: error.message
    });
  }
};

module.exports = {
  secureUpload,
  malwareScanMiddleware,
  sanitizeFilename,
  generateSecureFilename,
  scanFileForMalware,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZES
};
