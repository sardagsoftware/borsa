#!/usr/bin/env node
// ============================================================================
// AILYDIAN - Secret Rotation Helper
// ============================================================================
// Helps generate strong secrets and rotate existing ones safely.
// ============================================================================

const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-object-injection */

// ============================================================================
// Configuration
// ============================================================================

const config = {
  envPath: '.env',
  envBackupPath: '.env.backup',

  // Secret generation
  generation: {
    SECRET: { length: 64, charset: 'base64' },
    JWT_SECRET: { length: 64, charset: 'base64' },
    SESSION_SECRET: { length: 64, charset: 'base64' },
    API_KEY: { length: 48, charset: 'hex' },
    TOKEN: { length: 48, charset: 'hex' },
    PASSWORD: { length: 32, charset: 'alphanumeric-special' },
  },

  // Character sets
  charsets: {
    base64: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    hex: '0123456789abcdef',
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    'alphanumeric-special':
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?',
  },

  // Rotation log
  rotationLogPath: 'docs/SECRET-ROTATION-LOG.md',
};

// ============================================================================
// Secret Generation
// ============================================================================

class SecretGenerator {
  /**
   * Generate random string using crypto
   */
  static generateRandom(length, charset) {
    const charsetString = config.charsets[charset] || config.charsets.alphanumeric;
    const charsetLength = charsetString.length;

    let result = '';
    const randomBytes = crypto.randomBytes(length * 2);

    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % charsetLength;
      result += charsetString[randomIndex];
    }

    return result;
  }

  /**
   * Generate base64 secret
   */
  static generateBase64(length = 64) {
    return crypto
      .randomBytes(Math.ceil(length * 0.75))
      .toString('base64')
      .slice(0, length);
  }

  /**
   * Generate hex secret
   */
  static generateHex(length = 48) {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * Generate secret based on key name
   */
  static generateForKey(keyName) {
    // Find matching generation config
    for (const [type, config] of Object.entries(config.generation)) {
      if (keyName.includes(type)) {
        const { length, charset } = config;

        if (charset === 'base64') {
          return this.generateBase64(length);
        } else if (charset === 'hex') {
          return this.generateHex(length);
        } else {
          return this.generateRandom(length, charset);
        }
      }
    }

    // Default: 48-char alphanumeric
    return this.generateRandom(48, 'alphanumeric');
  }

  /**
   * Generate all common secrets
   */
  static generateAll() {
    return {
      SESSION_SECRET: this.generateBase64(64),
      JWT_SECRET: this.generateBase64(64),
      ENCRYPTION_KEY: this.generateBase64(64),
      API_SECRET_KEY: this.generateHex(48),
      WEBHOOK_SECRET: this.generateHex(48),
      CSRF_SECRET: this.generateHex(32),
    };
  }
}

// ============================================================================
// Secret Rotation
// ============================================================================

class SecretRotator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Prompt user for input
   */
  async prompt(question) {
    return new Promise(resolve => {
      this.rl.question(question, answer => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Backup current .env file
   */
  backupEnvFile() {
    if (!fs.existsSync(config.envPath)) {
      console.log('⚠️  No .env file found to backup');
      return false;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${config.envBackupPath}.${timestamp}`;

    fs.copyFileSync(config.envPath, backupPath);
    console.log(`✅ Backed up .env to: ${backupPath}`);
    return true;
  }

  /**
   * Update secret in .env file
   */
  updateSecret(keyName, newValue) {
    if (!fs.existsSync(config.envPath)) {
      console.log('❌ .env file not found');
      return false;
    }

    let content = fs.readFileSync(config.envPath, 'utf8');
    const lines = content.split('\n');

    let updated = false;
    const newLines = lines.map(line => {
      if (line.trim().startsWith(keyName + '=')) {
        updated = true;
        return `${keyName}=${newValue}`;
      }
      return line;
    });

    if (!updated) {
      // Key not found, append it
      newLines.push(`${keyName}=${newValue}`);
      console.log(`ℹ️  ${keyName} not found, adding to .env`);
    }

    fs.writeFileSync(config.envPath, newLines.join('\n'), 'utf8');
    return true;
  }

  /**
   * Log rotation to documentation
   */
  logRotation(keyName, reason) {
    const timestamp = new Date().toISOString();
    const logEntry = `- **${timestamp}**: Rotated \`${keyName}\` - Reason: ${reason}\n`;

    // Create log file if it doesn't exist
    if (!fs.existsSync(config.rotationLogPath)) {
      const header =
        '# Secret Rotation Log\n\n_This file tracks all secret rotations for audit purposes._\n\n## Rotation History\n\n';
      fs.writeFileSync(config.rotationLogPath, header, 'utf8');
    }

    // Append log entry
    fs.appendFileSync(config.rotationLogPath, logEntry, 'utf8');
  }

  /**
   * Rotate a single secret
   */
  async rotateSingle(keyName) {
    console.log(`\n🔄 Rotating secret: ${keyName}`);

    // Generate new secret
    const newSecret = SecretGenerator.generateForKey(keyName);

    // Confirm with user
    console.log(`\nGenerated new secret (preview): ${newSecret.slice(0, 16)}...`);
    const confirm = await this.prompt('Proceed with rotation? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Rotation cancelled');
      return false;
    }

    // Backup .env
    this.backupEnvFile();

    // Update secret
    if (this.updateSecret(keyName, newSecret)) {
      console.log(`✅ ${keyName} rotated successfully`);

      // Log rotation
      const reason = await this.prompt('Reason for rotation (optional): ');
      this.logRotation(keyName, reason || 'Manual rotation');

      return true;
    }

    return false;
  }

  /**
   * Interactive rotation menu
   */
  async interactiveMenu() {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 AILYDIAN Secret Rotation Helper');
    console.log('='.repeat(80));

    while (true) {
      console.log('\nOptions:');
      console.log('1. Generate new secret');
      console.log('2. Rotate existing secret');
      console.log('3. Generate all common secrets');
      console.log('4. View rotation log');
      console.log('5. Exit');

      const choice = await this.prompt('\nSelect option (1-5): ');

      switch (choice) {
        case '1': {
          await this.generateNewSecret();
          break;
        }
        case '2': {
          await this.rotateExistingSecret();
          break;
        }
        case '3': {
          await this.generateAllSecrets();
          break;
        }
        case '4': {
          await this.viewRotationLog();
          break;
        }
        case '5': {
          console.log('\n✅ Goodbye!');
          this.rl.close();
          return;
        }
        default: {
          console.log('❌ Invalid option');
        }
      }
    }
  }

  /**
   * Generate new secret
   */
  async generateNewSecret() {
    console.log('\n📝 Generate New Secret');

    const types = Object.keys(config.generation);
    console.log('\nSecret types:');
    types.forEach((type, index) => {
      console.log(`${index + 1}. ${type}`);
    });
    console.log(`${types.length + 1}. Custom`);

    const typeChoice = await this.prompt(`\nSelect type (1-${types.length + 1}): `);
    const typeIndex = parseInt(typeChoice, 10) - 1;

    let secret;
    if (typeIndex === types.length) {
      // Custom
      const length = await this.prompt('Length (default: 48): ');
      const len = parseInt(length, 10) || 48;
      secret = SecretGenerator.generateRandom(len, 'alphanumeric-special');
    } else if (typeIndex >= 0 && typeIndex < types.length) {
      const type = types[typeIndex];
      secret = SecretGenerator.generateForKey(type);
    } else {
      console.log('❌ Invalid choice');
      return;
    }

    console.log('\n✅ Generated secret:');
    console.log(`\n${secret}\n`);
    console.log('⚠️  Copy this secret immediately! It will not be shown again.');
  }

  /**
   * Rotate existing secret
   */
  async rotateExistingSecret() {
    console.log('\n🔄 Rotate Existing Secret');

    const keyName = await this.prompt('Secret key name (e.g., SESSION_SECRET): ');
    if (!keyName) {
      console.log('❌ Invalid key name');
      return;
    }

    await this.rotateSingle(keyName.toUpperCase());
  }

  /**
   * Generate all common secrets
   */
  async generateAllSecrets() {
    console.log('\n🔑 Generate All Common Secrets\n');

    const secrets = SecretGenerator.generateAll();

    Object.entries(secrets).forEach(([key, value]) => {
      console.log(`${key.padEnd(20)} = ${value.slice(0, 32)}...`);
    });

    console.log('\n⚠️  Copy these secrets to your .env file');
    console.log('⚠️  These will not be shown again!');
  }

  /**
   * View rotation log
   */
  async viewRotationLog() {
    console.log('\n📜 Secret Rotation Log\n');

    if (!fs.existsSync(config.rotationLogPath)) {
      console.log('No rotation log found');
      return;
    }

    const log = fs.readFileSync(config.rotationLogPath, 'utf8');
    console.log(log);
  }

  /**
   * Close readline interface
   */
  close() {
    this.rl.close();
  }
}

// ============================================================================
// CLI Commands
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const rotator = new SecretRotator();

  try {
    switch (command) {
      case 'generate': {
        // Generate single secret
        const type = args[1] || 'SECRET';
        const secret = SecretGenerator.generateForKey(type);
        console.log(secret);
        break;
      }

      case 'generate-all': {
        // Generate all common secrets
        const secrets = SecretGenerator.generateAll();
        console.log(JSON.stringify(secrets, null, 2));
        break;
      }

      case 'rotate': {
        // Rotate specific secret
        const keyName = args[1];
        if (!keyName) {
          console.log('Usage: node secret-rotation-helper.js rotate <KEY_NAME>');
          process.exit(1);
        }
        await rotator.rotateSingle(keyName.toUpperCase());
        rotator.close();
        break;
      }

      case 'interactive':
      default: {
        // Interactive menu
        await rotator.interactiveMenu();
        break;
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    rotator.close();
    process.exit(1);
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
  SecretGenerator,
  SecretRotator,
  config,
};
