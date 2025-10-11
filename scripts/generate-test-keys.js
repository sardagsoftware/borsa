#!/usr/bin/env node
/**
 * 🔐 Generate Test API Keys Script
 *
 * Usage:
 *   node scripts/generate-test-keys.js
 *   node scripts/generate-test-keys.js --save-env
 *
 * WHITE-HAT: Test keys only, never use in production
 */

const fs = require('fs');
const path = require('path');
const { createStandardTestKeys, generateTestKeyDocs } = require('../lib/test-api-keys');

// Generate standard test keys
const keys = createStandardTestKeys();
const docs = generateTestKeyDocs(keys);

// Display generated keys
console.log('🔐 TEST API KEYS GENERATED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('⚠️  WHITE-HAT POLICY: Test keys only - never use in production!');
console.log('');

console.log('📖 READ-ONLY KEY (50 req/hour)');
console.log('─────────────────────────────────────');
console.log(`Key:    ${keys.readOnly.apiKey}`);
console.log(`Scopes: ${keys.readOnly.metadata.scopes}`);
console.log(`User:   ${keys.readOnly.metadata.user_id}`);
console.log('');

console.log('✏️  READ/WRITE KEY (100 req/hour)');
console.log('─────────────────────────────────────');
console.log(`Key:    ${keys.readWrite.apiKey}`);
console.log(`Scopes: ${keys.readWrite.metadata.scopes}`);
console.log(`User:   ${keys.readWrite.metadata.user_id}`);
console.log('');

console.log('👑 ADMIN KEY (200 req/hour)');
console.log('─────────────────────────────────────');
console.log(`Key:    ${keys.admin.apiKey}`);
console.log(`Scopes: ${keys.admin.metadata.scopes}`);
console.log(`User:   ${keys.admin.metadata.user_id}`);
console.log('');

console.log('⏰ EXPIRATION');
console.log('─────────────────────────────────────');
console.log(`All keys expire: ${keys.readOnly.metadata.expires_at}`);
console.log('');

// Save to .env.test if --save-env flag is provided
if (process.argv.includes('--save-env')) {
  const envContent = `# 🔐 TEST API KEYS
# Generated: ${new Date().toISOString()}
# Expires: ${keys.readOnly.metadata.expires_at}
# WHITE-HAT: Test environment only!

TEST_API_KEY_READ_ONLY=${keys.readOnly.apiKey}
TEST_API_KEY_READ_WRITE=${keys.readWrite.apiKey}
TEST_API_KEY_ADMIN=${keys.admin.apiKey}

# Key hashes for database
TEST_API_KEY_READ_ONLY_HASH=${keys.readOnly.metadata.key_hash}
TEST_API_KEY_READ_WRITE_HASH=${keys.readWrite.metadata.key_hash}
TEST_API_KEY_ADMIN_HASH=${keys.admin.metadata.key_hash}
`;

  const envPath = path.join(__dirname, '../.env.test');
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Saved to .env.test`);
  console.log('');
}

// Save documentation
const docsPath = path.join(__dirname, '../TEST-API-KEYS-DOCUMENTATION.json');
fs.writeFileSync(docsPath, JSON.stringify(docs, null, 2));
console.log(`📚 Documentation saved to: TEST-API-KEYS-DOCUMENTATION.json`);
console.log('');

// Display usage examples
console.log('📋 USAGE EXAMPLES');
console.log('─────────────────────────────────────');
console.log('');
console.log('1. Export to environment:');
console.log('   export TEST_API_KEY_READ_ONLY="' + keys.readOnly.apiKey + '"');
console.log('');
console.log('2. Use in Playwright tests:');
console.log('   await request.get("/api/v1/smart-cities/cities", {');
console.log('     headers: { "X-API-Key": process.env.TEST_API_KEY_READ_ONLY }');
console.log('   });');
console.log('');
console.log('3. Use in curl:');
console.log('   curl -H "X-API-Key: ' + keys.readOnly.apiKey + '" \\');
console.log('        http://localhost:3100/api/v1/smart-cities/cities');
console.log('');

console.log('🔒 WHITE-HAT POLICY');
console.log('─────────────────────────────────────');
docs.whiteHatPolicy.rules.forEach(rule => console.log(`  ${rule}`));
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Test keys generated successfully!');
console.log('');
console.log('Next steps:');
console.log('  1. Add keys to .env.test (run with --save-env)');
console.log('  2. Update tests to use TEST_API_KEY_* env vars');
console.log('  3. Run tests: npm test');
console.log('  4. Revoke keys after testing');
console.log('');
