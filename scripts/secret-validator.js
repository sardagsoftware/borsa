#!/usr/bin/env node
// ============================================================================
// AILYDIAN - Secret Validator
// ============================================================================
// Validates secrets in .env file for strength, expiration, and best practices.
// ============================================================================

const fs = require('fs');

/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-object-injection */

// ============================================================================
// Configuration
// ============================================================================

const config = {
  envPath: '.env',
  envExamplePath: '.env.example',

  // Secret strength requirements
  requirements: {
    minLength: {
      SECRET: 32,
      KEY: 32,
      TOKEN: 32,
      PASSWORD: 16,
      DEFAULT: 16,
    },
    // Entropy requirement (bits)
    minEntropy: 128,
  },

  // Excluded patterns (example/demo values)
  excludePatterns: [
    'your-',
    'your_',
    'EXAMPLE_',
    'TEST_',
    'DEMO_',
    'sk-test-',
    'InstrumentationKey=your-',
    'https://your-',
    'http://localhost',
  ],

  // Common weak patterns
  weakPatterns: [
    { pattern: /^(password|secret|key|token)$/i, message: 'Using the word itself as a secret' },
    { pattern: /^(admin|root|user|test|demo)$/i, message: 'Common default value' },
    { pattern: /^(123|abc|qwerty|letmein)/i, message: 'Weak/common pattern' },
    { pattern: /^(.)\1{5,}/, message: 'Repeated characters' },
  ],
};

// ============================================================================
// Secret Analysis
// ============================================================================

class SecretValidator {
  constructor() {
    this.results = {
      passed: [],
      warnings: [],
      failures: [],
      stats: {
        total: 0,
        strong: 0,
        weak: 0,
        missing: 0,
      },
    };
  }

  /**
   * Calculate Shannon entropy
   */
  calculateEntropy(string) {
    const len = string.length;
    const frequencies = {};

    for (let i = 0; i < len; i++) {
      const char = string[i];
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const char in frequencies) {
      const p = frequencies[char] / len;
      entropy -= p * Math.log2(p);
    }

    return entropy * len; // Bits of entropy
  }

  /**
   * Check if value is excluded (example/demo)
   */
  isExcluded(value) {
    return config.excludePatterns.some(pattern => value.includes(pattern));
  }

  /**
   * Get minimum length requirement for key
   */
  getMinLength(key) {
    for (const [type, length] of Object.entries(config.requirements.minLength)) {
      if (key.includes(type)) {
        return length;
      }
    }
    return config.requirements.minLength.DEFAULT;
  }

  /**
   * Validate a single secret
   */
  validateSecret(key, value) {
    // Skip empty values
    if (!value || value.trim() === '') {
      this.results.failures.push({
        key,
        issue: 'Empty value',
        severity: 'high',
      });
      this.results.stats.missing++;
      return false;
    }

    // Skip excluded values
    if (this.isExcluded(value)) {
      this.results.warnings.push({
        key,
        issue: 'Appears to be an example value',
        severity: 'medium',
      });
      return true; // Not counted as failure for examples
    }

    let isWeak = false;
    const minLength = this.getMinLength(key);

    // Check 1: Length
    if (value.length < minLength) {
      this.results.warnings.push({
        key,
        issue: `Too short (${value.length} chars, min: ${minLength})`,
        severity: 'medium',
      });
      isWeak = true;
    }

    // Check 2: Entropy
    const entropy = this.calculateEntropy(value);
    if (entropy < config.requirements.minEntropy) {
      this.results.warnings.push({
        key,
        issue: `Low entropy (${Math.round(entropy)} bits, min: ${config.requirements.minEntropy})`,
        severity: 'low',
      });
      isWeak = true;
    }

    // Check 3: Weak patterns
    for (const { pattern, message } of config.weakPatterns) {
      if (pattern.test(value)) {
        this.results.failures.push({
          key,
          issue: message,
          severity: 'high',
        });
        isWeak = true;
      }
    }

    // Check 4: Character diversity
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasSpecial = /[^a-zA-Z0-9]/.test(value);

    const diversity = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

    if (diversity < 3 && value.length < 32) {
      this.results.warnings.push({
        key,
        issue: `Low character diversity (${diversity}/4 types)`,
        severity: 'low',
      });
      isWeak = true;
    }

    // Update stats
    if (isWeak) {
      this.results.stats.weak++;
    } else {
      this.results.stats.strong++;
      this.results.passed.push({
        key,
        strength: this.getStrengthLabel(value),
      });
    }

    return !isWeak;
  }

  /**
   * Get strength label
   */
  getStrengthLabel(value) {
    const entropy = this.calculateEntropy(value);
    if (entropy > 256) return 'Very Strong';
    if (entropy > 192) return 'Strong';
    if (entropy > 128) return 'Good';
    return 'Weak';
  }

  /**
   * Validate all secrets in .env
   */
  validateEnvFile() {
    if (!fs.existsSync(config.envPath)) {
      console.log('⚠️  No .env file found');
      return this.results;
    }

    const content = fs.readFileSync(config.envPath, 'utf8');
    const lines = content.split('\n');

    // Parse .env file
    lines.forEach(line => {
      line = line.trim();

      // Skip comments and empty lines
      if (!line || line.startsWith('#')) return;

      // Parse key=value
      const match = line.match(/^([^=]+)=(.*)$/);
      if (!match) return;

      const [, key, value] = match;
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      // Only validate secrets (containing SECRET, KEY, TOKEN, PASSWORD)
      const isSecret = ['SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'DSN'].some(term =>
        trimmedKey.includes(term)
      );

      if (!isSecret) return;

      this.results.stats.total++;
      this.validateSecret(trimmedKey, trimmedValue);
    });

    return this.results;
  }

  /**
   * Print validation report
   */
  printReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 SECRET VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`File: ${config.envPath}`);
    console.log(`Date: ${new Date().toISOString()}`);
    console.log('='.repeat(80));

    // Statistics
    console.log('\n📊 STATISTICS:');
    console.log(`   Total secrets:  ${this.results.stats.total}`);
    console.log(`   Strong:         ${this.results.stats.strong} ✅`);
    console.log(`   Weak:           ${this.results.stats.weak} ⚠️`);
    console.log(`   Missing:        ${this.results.stats.missing} ❌`);

    // Strong secrets
    if (this.results.passed.length > 0) {
      console.log('\n✅ STRONG SECRETS:');
      this.results.passed.forEach(({ key, strength }) => {
        console.log(`   ✓ ${key.padEnd(40)} [${strength}]`);
      });
    }

    // Warnings
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach(({ key, issue, severity }) => {
        console.log(`   ! ${key.padEnd(40)} ${issue} [${severity}]`);
      });
    }

    // Failures
    if (this.results.failures.length > 0) {
      console.log('\n❌ FAILURES:');
      this.results.failures.forEach(({ key, issue, severity }) => {
        console.log(`   ✗ ${key.padEnd(40)} ${issue} [${severity}]`);
      });
    }

    // Recommendations
    if (this.results.warnings.length > 0 || this.results.failures.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('   1. Use scripts/secret-rotation-helper.js to generate strong secrets');
      console.log('   2. Ensure secrets are at least 32 characters long');
      console.log('   3. Use a mix of lowercase, uppercase, digits, and special characters');
      console.log('   4. Never commit .env file to version control');
      console.log('   5. Rotate secrets regularly (every 90 days)');
    }

    // Final summary
    console.log('\n' + '='.repeat(80));
    const percentage = Math.round(
      (this.results.stats.strong / Math.max(this.results.stats.total, 1)) * 100
    );

    if (this.results.stats.missing > 0) {
      console.log('🚨 CRITICAL: Missing required secrets!');
    } else if (percentage >= 90) {
      console.log(`✅ EXCELLENT: ${percentage}% of secrets are strong`);
    } else if (percentage >= 70) {
      console.log(`⚠️  GOOD: ${percentage}% of secrets are strong (aim for 90%+)`);
    } else {
      console.log(
        `❌ POOR: Only ${percentage}% of secrets are strong (critical improvement needed)`
      );
    }

    console.log('='.repeat(80) + '\n');
  }

  /**
   * Generate JSON report
   */
  toJSON() {
    return {
      timestamp: new Date().toISOString(),
      file: config.envPath,
      statistics: this.results.stats,
      passed: this.results.passed,
      warnings: this.results.warnings,
      failures: this.results.failures,
      score: Math.round((this.results.stats.strong / Math.max(this.results.stats.total, 1)) * 100),
    };
  }
}

// ============================================================================
// Main Function
// ============================================================================

function main() {
  const validator = new SecretValidator();

  console.log('🔐 AILYDIAN Secret Validator');
  console.log('Analyzing secrets in .env file...\n');

  validator.validateEnvFile();
  validator.printReport();

  // Output JSON if requested
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(validator.toJSON(), null, 2));
  }

  // Exit with appropriate code
  if (validator.results.stats.missing > 0 || validator.results.failures.length > 0) {
    process.exit(1); // Failures
  } else if (validator.results.warnings.length > 0) {
    process.exit(0); // Warnings OK
  } else {
    process.exit(0); // Success
  }
}

// ============================================================================
// Run
// ============================================================================

if (require.main === module) {
  main();
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  SecretValidator,
  config,
};
