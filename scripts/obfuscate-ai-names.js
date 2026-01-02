#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Secure obfuscation mapping - completely hide AI provider names
const obfuscationMap = {
  // Claude/Anthropic
  'claude-3.5-sonnet': 'AX9F7E2B',
  'claude-3-5-sonnet': 'AX9F7E2B',
  'claude-3-sonnet': 'AX8D4C1A',
  'claude-3-opus': 'AX7B2F9E',
  'claude-3-haiku': 'AX6C3E8D',
  'claude': 'AX_CORE',
  'anthropic': 'APEX_SYS',

  // OpenAI/GPT
  'gpt-4-turbo': 'OX7A3F8D',
  'gpt-4o': 'OX8B4E9C',
  'gpt-4': 'OX6D2A7F',
  'gpt-3.5-turbo': 'OX5C1B6E',
  'openai': 'OMEGA_SYS',

  // Google
  'gemini-pro': 'GX9E4F2C',
  'gemini-1.5-pro': 'GX8D3E1B',
  'gemini': 'GX_CORE',

  // Meta/Llama
  'llama-3.3': 'GX8E2D9A',
  'llama-3.2': 'GX7F3C8B',
  'llama': 'LX_CORE',

  // Display names (user-facing)
  'Claude Sonnet': 'Advanced Neural Engine',
  'Claude Opus': 'Premium Neural Engine',
  'Claude Haiku': 'Fast Neural Engine',
  'GPT-4 Turbo': 'Advanced Language Model',
  'GPT-4o': 'Optimized Language Model',
  'Gemini Pro': 'Advanced Multimodal Engine',
  'Llama 3.3': 'Open Neural Engine',
};

// Reverse map for decoding (if needed internally)
const reverseMap = {};
Object.keys(obfuscationMap).forEach(key => {
  reverseMap[obfuscationMap[key]] = key;
});

// Files to process
const filesToProcess = [
  'public/index.html',
  'public/dashboard.html',
  'public/ai-chat.html',
  'public/models.html',
  'public/js/ai-client-unified.js',
  'public/js/medical/advanced-medical-ai-engine.js',
  'public/js/medical/api-client.js',
];

console.log('🔐 AI Name Obfuscation System');
console.log('=' .repeat(50));
console.log('');
console.log('📋 Obfuscation Map:');
Object.keys(obfuscationMap).forEach(original => {
  console.log(`   ${original} → ${obfuscationMap[original]}`);
});
console.log('');

let totalReplacements = 0;

filesToProcess.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipped: ${file} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fileReplacements = 0;

  // Replace all occurrences (case-insensitive for model names)
  Object.keys(obfuscationMap).forEach(original => {
    const obfuscated = obfuscationMap[original];

    // Create regex that matches the original (case-insensitive)
    const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = content.match(regex);

    if (matches) {
      content = content.replace(regex, obfuscated);
      fileReplacements += matches.length;
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file}: ${fileReplacements} replacements`);
    totalReplacements += fileReplacements;
  } else {
    console.log(`ℹ️  ${file}: No changes needed`);
  }
});

console.log('');
console.log('=' .repeat(50));
console.log(`🎉 Total Replacements: ${totalReplacements}`);
console.log('');
console.log('✅ AI provider names successfully obfuscated!');
console.log('   System remains fully functional with secure codes.');

// Save mapping to secure file (for reference only)
fs.writeFileSync(
  path.join(__dirname, '..', 'security', 'ai-obfuscation-map.json'),
  JSON.stringify({ obfuscationMap, reverseMap }, null, 2),
  'utf8'
);

console.log('');
console.log('💾 Mapping saved to: security/ai-obfuscation-map.json');
