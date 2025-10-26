#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 🔐 Security: P0-3 Fix - 2025-10-26
 *
 * Validates all required environment variables before app startup
 * Prevents production deployment with missing/weak secrets
 *
 * Usage:
 *   node scripts/validate-environment.js
 *   npm run validate:env
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const ENV_FILE = path.join(__dirname, '..', '.env');
const ENV_EXAMPLE = path.join(__dirname, '..', '.env.example');

// Required environment variables
const REQUIRED_VARS = {
  // Server
  NODE_ENV: {
    required: true,
    values: ['development', 'production', 'test'],
    default: 'development'
  },
  PORT: {
    required: false,
    default: '3100'
  },

  // Security Secrets
  SESSION_SECRET: {
    required: true,
    minLength: 32,
    productionOnly: true,
    critical: true
  },
  JWT_SECRET: {
    required: true,
    minLength: 32,
    productionOnly: true,
    critical: true
  },

  // Database
  DATABASE_URL: {
    required: false,
    format: /^postgresql:\/\/.+/,
    productionOnly: true
  },

  // Redis
  REDIS_HOST: {
    required: false
  },
  REDIS_PASSWORD: {
    required: false,
    productionOnly: true
  },

  // AI Providers (at least one required)
  OPENAI_API_KEY: {
    required: false,
    minLength: 20
  },
  ANTHROPIC_API_KEY: {
    required: false,
    minLength: 20
  },
  GOOGLE_API_KEY: {
    required: false,
    minLength: 20
  },

  // Payment
  STRIPE_SECRET_KEY: {
    required: false,
    format: /^sk_(test|live)_/,
    productionOnly: true
  }
};

// Weak/default values that should never be used
const WEAK_VALUES = [
  'secret',
  'password',
  'your-secret-here',
  'change-me',
  'jwt-secret',
  'session-secret',
  'ailydian',
  'lydian',
  'test',
  '123456',
  'default',
  'example',
  'changeme',
  'your-',
  'replace-this'
];

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  error(message) {
    this.errors.push(message);
    this.log(`❌ ERROR: ${message}`, 'red');
  }

  warn(message) {
    this.warnings.push(message);
    this.log(`⚠️  WARNING: ${message}`, 'yellow');
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  infoLog(message) {
    this.info.push(message);
    this.log(`ℹ️  ${message}`, 'cyan');
  }

  checkFileExists() {
    this.log('\n📁 Checking .env file...', 'blue');

    if (!fs.existsSync(ENV_FILE)) {
      this.warn('.env file not found');

      if (fs.existsSync(ENV_EXAMPLE)) {
        this.infoLog('Copy .env.example to .env and fill in your values');
        this.infoLog(`  cp ${ENV_EXAMPLE} ${ENV_FILE}`);
      }

      if (!this.isProduction) {
        this.infoLog('Running in development mode without .env');
        return false;
      } else {
        this.error('.env file is required in production');
        return false;
      }
    }

    this.success('.env file found');
    return true;
  }

  validateVariable(name, config) {
    const value = process.env[name];

    // Check if required
    if (config.required || (config.productionOnly && this.isProduction)) {
      if (!value) {
        if (config.critical && this.isProduction) {
          // Only error in production
          this.error(`${name} is required and critical in production`);
        } else if (config.critical) {
          // Warning in development
          this.warn(`${name} is required in production (using fallback for dev)`);
        } else if (this.isProduction) {
          this.error(`${name} is required`);
        } else {
          this.warn(`${name} is recommended`);
        }
        return !this.isProduction; // Pass in development, fail in production
      }
    }

    if (!value) {
      if (config.default) {
        this.infoLog(`${name} not set, using default: ${config.default}`);
      }
      return true;
    }

    // Check minimum length
    if (config.minLength && value.length < config.minLength) {
      this.error(`${name} must be at least ${config.minLength} characters (current: ${value.length})`);
      return false;
    }

    // Check format
    if (config.format && !config.format.test(value)) {
      this.error(`${name} has invalid format`);
      return false;
    }

    // Check for weak values
    const valueLower = value.toLowerCase();
    for (const weak of WEAK_VALUES) {
      if (valueLower.includes(weak)) {
        this.error(`${name} contains weak/default value: '${weak}'`);
        this.infoLog(`Generate a secure secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`);
        return false;
      }
    }

    // Check allowed values
    if (config.values && !config.values.includes(value)) {
      this.error(`${name} must be one of: ${config.values.join(', ')} (current: ${value})`);
      return false;
    }

    // Warn if using test keys in production
    if (this.isProduction && value.includes('test')) {
      this.warn(`${name} appears to contain 'test' - verify this is correct for production`);
    }

    this.success(`${name} validated`);
    return true;
  }

  validateAllVariables() {
    this.log('\n🔐 Validating environment variables...', 'blue');

    for (const [name, config] of Object.entries(REQUIRED_VARS)) {
      this.validateVariable(name, config);
    }
  }

  checkAIProviders() {
    this.log('\n🤖 Checking AI provider configuration...', 'blue');

    const providers = [
      { name: 'OpenAI', key: 'OPENAI_API_KEY' },
      { name: 'Anthropic', key: 'ANTHROPIC_API_KEY' },
      { name: 'Google', key: 'GOOGLE_API_KEY' },
      { name: 'Azure OpenAI', key: 'AZURE_OPENAI_API_KEY' },
      { name: 'Groq', key: 'GROQ_API_KEY' }
    ];

    const configured = providers.filter(p => process.env[p.key]);

    if (configured.length === 0) {
      this.warn('No AI providers configured');
      this.infoLog('At least one AI provider is recommended');
    } else {
      this.success(`${configured.length} AI provider(s) configured: ${configured.map(p => p.name).join(', ')}`);
    }
  }

  checkDatabaseFiles() {
    this.log('\n🗄️  Checking for exposed database files...', 'blue');

    const dbFiles = [
      'database/ailydian.db',
      'apps/ecw-api/prisma/dev.db',
      '*.sqlite',
      '*.db'
    ];

    const gitTrackedDB = [];

    // Check .gitignore
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');

      if (!gitignore.includes('*.db') && !gitignore.includes('*.sqlite')) {
        this.warn('.gitignore missing database file patterns');
        this.infoLog('Add to .gitignore: *.db, *.sqlite, *.sqlite3');
      } else {
        this.success('.gitignore includes database patterns');
      }
    }

    this.infoLog('Verify database files are not committed to git');
    this.infoLog('  git rm --cached database/*.db');
  }

  generateSecrets() {
    this.log('\n🔑 Generate secure secrets:', 'blue');
    this.log('');

    console.log('SESSION_SECRET=' + crypto.randomBytes(64).toString('hex'));
    console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
    this.log('');
    this.infoLog('Copy these to your .env file');
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'blue');
    this.log('VALIDATION SUMMARY', 'blue');
    this.log('='.repeat(60), 'blue');

    this.log(`\nErrors: ${this.errors.length}`, this.errors.length > 0 ? 'red' : 'green');
    this.log(`Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'yellow' : 'green');
    this.log(`Info: ${this.info.length}`, 'cyan');

    if (this.errors.length > 0) {
      this.log('\n❌ VALIDATION FAILED', 'red');
      this.log('Fix the errors above before deploying to production', 'red');
      return false;
    }

    if (this.warnings.length > 0 && this.isProduction) {
      this.log('\n⚠️  VALIDATION PASSED WITH WARNINGS', 'yellow');
      this.log('Review warnings before deploying to production', 'yellow');
      return true;
    }

    this.log('\n✅ VALIDATION PASSED', 'green');
    return true;
  }

  run() {
    this.log('🔐 AILYDIAN Environment Validation', 'magenta');
    this.log(`Environment: ${this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`, 'cyan');

    this.checkFileExists();
    this.validateAllVariables();
    this.checkAIProviders();
    this.checkDatabaseFiles();

    const passed = this.printSummary();

    if (!passed && this.isProduction) {
      this.log('\n🚫 Production deployment blocked due to validation errors', 'red');
      process.exit(1);
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.generateSecrets();
    }

    return passed;
  }
}

// Run validation
if (require.main === module) {
  const validator = new EnvironmentValidator();
  validator.run();
}

module.exports = EnvironmentValidator;
