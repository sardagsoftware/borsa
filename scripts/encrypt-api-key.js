#!/usr/bin/env node

/**
 * Z.AI API Key Encryption Script
 * Usage: node scripts/encrypt-api-key.js your_api_key
 */

const crypto = require('crypto');
const readline = require('readline');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function encryptAPIKey(apiKey, masterKey) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha512');
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('zai-api-key', 'utf8'));
    
    let encrypted = cipher.update(apiKey, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const tag = cipher.getAuthTag();
    
    const result = Buffer.concat([salt, iv, tag, encrypted]);
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    process.exit(1);
  }
}

function generateMasterKey() {
  return crypto.randomBytes(32).toString('hex');
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  console.log('🔐 Z.AI API Key Encryption Tool\n');

  try {
    // Get API key
    let apiKey = process.argv[2];
    if (!apiKey) {
      apiKey = await question('Enter your Z.AI API key: ');
    }

    if (!apiKey || apiKey.length < 10) {
      console.error('❌ Invalid API key provided');
      process.exit(1);
    }

    // Get or generate master key
    let masterKey = process.env.ENCRYPTION_KEY;
    if (!masterKey) {
      console.log('⚠️  ENCRYPTION_KEY not found in environment');
      const generate = await question('Generate new master key? (y/n): ');
      
      if (generate.toLowerCase() === 'y') {
        masterKey = generateMasterKey();
        console.log('\n🔑 Generated Master Key (save this in your .env file):');
        console.log(`ENCRYPTION_KEY=${masterKey}\n`);
      } else {
        masterKey = await question('Enter master key (64 hex chars): ');
      }
    }

    if (!masterKey || masterKey.length < 32) {
      console.error('❌ Master key must be at least 32 characters');
      process.exit(1);
    }

    // Encrypt the API key
    const encryptedKey = encryptAPIKey(apiKey, masterKey);

    console.log('\n✅ Encryption successful!\n');
    console.log('Add this to your .env file:');
    console.log(`ZAI_API_KEY_ENCRYPTED=${encryptedKey}\n`);
    console.log('You can now remove the plain ZAI_API_KEY from your .env file');

    // Verify encryption by attempting decrypt
    console.log('\n🔍 Verifying encryption...');
    try {
      const { decryptAPIKey } = require('../lib/utils/encryption');
      process.env.ENCRYPTION_KEY = masterKey;
      const decrypted = decryptAPIKey(encryptedKey);
      
      if (decrypted === apiKey) {
        console.log('✅ Verification successful - encryption/decryption working correctly');
      } else {
        console.log('❌ Verification failed - decrypted key does not match original');
      }
    } catch (error) {
      console.log('⚠️  Verification skipped - encryption utilities not available');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}
