#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Comprehensive obfuscation map
const obfuscationMap = {
  // Claude/Anthropic (exact matches)
  'claude-3.5-sonnet-20241022': 'AX9F7E2B',
  'claude-3.5-sonnet': 'AX9F7E2B',
  'claude-3-5-sonnet': 'AX9F7E2B',
  'claude-3-sonnet': 'AX8D4C1A',
  'claude-3-opus': 'AX7B2F9E',
  'claude-3-haiku': 'AX6C3E8D',
  'claude': 'AX_CORE',
  'anthropic': 'APEX_SYS',
  'Anthropic': 'APEX_SYS',

  // OpenAI/GPT
  'gpt-4-turbo-preview': 'OX7A3F8D',
  'gpt-4-turbo': 'OX7A3F8D',
  'gpt-4o-mini': 'OX8B4E9C',
  'gpt-4o': 'OX8B4E9C',
  'gpt-4': 'OX6D2A7F',
  'gpt-3.5-turbo-16k': 'OX5C1B6E',
  'gpt-3.5-turbo': 'OX5C1B6E',
  'openai': 'OMEGA_SYS',
  'OpenAI': 'OMEGA_SYS',

  // Google
  'gemini-1.5-pro-latest': 'GX8D3E1B',
  'gemini-1.5-pro': 'GX8D3E1B',
  'gemini-pro': 'GX9E4F2C',
  'gemini': 'GX_CORE',
  'Gemini': 'GX_CORE',

  // Meta/Llama
  'llama-3.3-70b': 'GX8E2D9A',
  'llama-3.3': 'GX8E2D9A',
  'llama-3.2': 'GX7F3C8B',
  'llama': 'LX_CORE',
  'Llama': 'LX_CORE',

  // Display names (user-facing - keep user-friendly)
  'Claude 3.5 Sonnet': 'Premium AI Model',
  'Claude Sonnet': 'Advanced Model',
  'Claude Opus': 'Premium Model',
  'Claude Haiku': 'Fast Model',
  'GPT-4 Turbo': 'Advanced LLM',
  'GPT-4o': 'Optimized LLM',
  'GPT-4': 'Premium LLM',
  'Gemini Pro': 'Advanced MM Engine',
  'Llama 3.3': 'Open Source Model',
};

console.log('🔐 Comprehensive AI Name Obfuscation');
console.log('=' .repeat(60));
console.log('');

// Find all HTML and JS files
const findFiles = () => {
  try {
    const output = execSync('find public -type f \\( -name "*.html" -o -name "*.js" \\)', { encoding: 'utf8' });
    return output.trim().split('\n').filter(f => f);
  } catch (e) {
    return [];
  }
};

const files = findFiles();
console.log(`📂 Found ${files.length} files to process\n`);

let totalReplacements = 0;
let filesModified = 0;

files.forEach((file, index) => {
  if (!fs.existsSync(file)) return;

  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  let fileReplacements = 0;

  // Replace all occurrences
  Object.keys(obfuscationMap).forEach(original => {
    const obfuscated = obfuscationMap[original];

    // Exact match replacement (preserve case in code)
    const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);

    if (matches) {
      content = content.replace(regex, obfuscated);
      fileReplacements += matches.length;
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
    totalReplacements += fileReplacements;

    if (fileReplacements > 0) {
      console.log(`✅ [${index + 1}/${files.length}] ${file}: ${fileReplacements} replacements`);
    }
  }
});

console.log('');
console.log('=' .repeat(60));
console.log(`🎉 Obfuscation Complete!`);
console.log(`   Files Modified: ${filesModified}`);
console.log(`   Total Replacements: ${totalReplacements}`);
console.log('');
console.log('✅ All AI provider names have been securely obfuscated.');
console.log('   System functionality preserved with secure codes.');
console.log('');

// Save comprehensive mapping
const mappingDir = path.join(__dirname, '..', 'security');
if (!fs.existsSync(mappingDir)) {
  fs.mkdirSync(mappingDir, { recursive: true });
}

const reverseMap = {};
Object.keys(obfuscationMap).forEach(key => {
  reverseMap[obfuscationMap[key]] = key;
});

fs.writeFileSync(
  path.join(mappingDir, 'ai-obfuscation-map.json'),
  JSON.stringify({ obfuscationMap, reverseMap, timestamp: new Date().toISOString() }, null, 2),
  'utf8'
);

console.log('💾 Secure mapping saved to: security/ai-obfuscation-map.json');
console.log('');
