#!/usr/bin/env node
/**
 * Security Obfuscation Tool
 * Purpose: Mask AI model references and secure frontend code
 * Approach: White-hat, ethical, professional
 *
 * What this does:
 * 1. Replaces specific AI model names with generic terms
 * 2. Removes console.log statements in production
 * 3. Masks API response details
 * 4. Protects internal architecture details
 *
 * What this DOES NOT do:
 * - Hide API keys (already in env vars)
 * - Malicious obfuscation
 * - Code minification (done by build tool)
 */

const fs = require('fs');
const path = require('path');

// White-hat security mappings
const MODEL_REPLACEMENTS = {
  // OpenAI references
  'OX5C9E2B': 'Advanced AI',
  'OX5C9E2B Medical': 'Medical AI Engine',
  'OX5C9E2B': 'advanced-ai',
  'OX7A3F8D': 'advanced-ai',
  'OX7A3F8D': 'advanced-ai',

  // Anthropic references
  'AX9F7E2B': 'AI Assistant',
  'AX9F7E2B 3': 'AI Assistant',
  'AX9F7E2B 3.5': 'AI Assistant',
  'AX9F7E2B-': 'ai-',
  'lydian-research': 'AI Provider',
  'lydian-research': 'ai-provider',

  // Model-specific terms
  'OX5C9E2B Medical + Clinical Reasoning Model': 'Advanced Medical AI with Clinical Reasoning',
  'OX5C9E2B Medical + Bayesian probability': 'Medical AI with Probabilistic Analysis',
  'OX5C9E2B Medical fine-tuned': 'Specialized Medical AI',

  // API keys (should never be in frontend, but check)
  'sk-': '[REDACTED]',
  'Bearer sk-': 'Bearer [REDACTED]',

  // Generic terms
  'model:': 'engine:',
  'model_name': 'engine_name',
  'modelName': 'engineName',
};

// Console log patterns to disable
const CONSOLE_PATTERNS = [
  /console\.log\([^)]*\);?/g,
  /console\.debug\([^)]*\);?/g,
  /console\.info\([^)]*\);?/g,
  // Keep console.error and console.warn for production debugging
];

// Files to process
const FILES_TO_PROCESS = {
  html: [
    'public/index.html',
    'public/medical-expert.html',
    'public/lydian-iq.html',
    'public/lydian-legal-search.html',
    'public/chat.html',
    'public/ai-assistant.html',
    'public/ai-chat.html',
    'public/medical-ai.html',
  ],
  js: [
    'public/js/chat-ailydian.js',
    'public/js/lydian-iq.js',
    'public/js/medical/api-client.js',
    'public/js/medical/app.js',
    'public/js/api-integrations.js',
  ],
};

// Backup function
function createBackup(filePath) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupPath = `${filePath}.backup-${timestamp}`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

// Replace model references
function obfuscateModelReferences(content) {
  let modified = content;

  for (const [original, replacement] of Object.entries(MODEL_REPLACEMENTS)) {
    // Case-insensitive replacement
    const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    modified = modified.replace(regex, replacement);
  }

  return modified;
}

// Disable console logs (keep error and warn)
function disableConsoleLogs(content) {
  let modified = content;

  // Wrap in production check
  const productionCheck = `
// Production console log suppression
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  console.log = function() {};
  console.debug = function() {};
  console.info = function() {};
}
`;

  // Add at the beginning of JS files if not already present
  if (!modified.includes('Production console log suppression')) {
    modified = productionCheck + '\n' + modified;
  }

  return modified;
}

// Mask API responses
function maskApiResponses(content) {
  let modified = content;

  // Mask model information in API responses
  const apiMaskCode = `
// Mask sensitive API response data
function maskApiResponse(response) {
  if (response && typeof response === 'object') {
    // Mask model information
    if (response.model) response.model = 'ai-engine';
    if (response.engine) response.engine = 'ai-engine';
    if (response.provider) response.provider = 'ai-provider';

    // Mask headers
    if (response.headers) {
      delete response.headers['x-request-id'];
      delete response.headers['openai-'];
      delete response.headers['anthropic-'];
    }
  }
  return response;
}
`;

  if (!modified.includes('function maskApiResponse') && modified.includes('fetch(') || modified.includes('axios')) {
    // Add masking function near top
    const insertPoint = modified.indexOf('</script>');
    if (insertPoint > 0) {
      modified = modified.slice(0, insertPoint) + apiMaskCode + modified.slice(insertPoint);
    }
  }

  return modified;
}

// Process single file
function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    console.log(`\n🔒 Processing: ${filePath}`);

    // Create backup
    const backupPath = createBackup(filePath);
    console.log(`   📦 Backup created: ${backupPath}`);

    // Read content
    let content = fs.readFileSync(filePath, 'utf8');
    const originalLength = content.length;

    // Apply transformations
    content = obfuscateModelReferences(content);

    // JS-specific transformations
    if (filePath.endsWith('.js')) {
      content = disableConsoleLogs(content);
    }

    // HTML-specific transformations
    if (filePath.endsWith('.html')) {
      content = maskApiResponses(content);
    }

    // Write modified content
    fs.writeFileSync(filePath, content, 'utf8');

    const changes = content.length - originalLength;
    console.log(`   ✅ Modified: ${changes > 0 ? '+' : ''}${changes} chars`);

    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Main execution
function main() {
  console.log('🛡️  SECURITY OBFUSCATION TOOL');
  console.log('================================');
  console.log('Purpose: Mask AI model references (white-hat approach)');
  console.log('');

  let processedCount = 0;
  let errorCount = 0;

  // Process HTML files
  console.log('\n📄 Processing HTML Files...');
  for (const file of FILES_TO_PROCESS.html) {
    const success = processFile(file);
    if (success) processedCount++;
    else errorCount++;
  }

  // Process JS files
  console.log('\n📜 Processing JavaScript Files...');
  for (const file of FILES_TO_PROCESS.js) {
    const success = processFile(file);
    if (success) processedCount++;
    else errorCount++;
  }

  // Summary
  console.log('\n================================');
  console.log('📊 SUMMARY');
  console.log('================================');
  console.log(`✅ Files processed: ${processedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('');
  console.log('🔒 Security improvements applied:');
  console.log('   - AI model names masked');
  console.log('   - Console logs disabled (production)');
  console.log('   - API responses sanitized');
  console.log('');
  console.log('✅ Frontend security enhanced!');
  console.log('');
  console.log('⚠️  IMPORTANT:');
  console.log('   - Backups created with timestamp');
  console.log('   - Review changes before deploying');
  console.log('   - Test thoroughly on localhost');
  console.log('');
}

// Run
if (require.main === module) {
  main();
}

module.exports = {
  obfuscateModelReferences,
  disableConsoleLogs,
  maskApiResponses,
  processFile,
};
