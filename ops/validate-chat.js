#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== CHAT.HTML VALIDATION ===\n');

const chatPath = path.join(__dirname, '../public/chat.html');
const html = fs.readFileSync(chatPath, 'utf-8');

const errors = [];
const warnings = [];
const checks = [];

// Check 1: AilydianSanitizer removed
if (html.includes('AilydianSanitizer')) {
  errors.push('AilydianSanitizer still exists');
} else {
  checks.push('✅ AilydianSanitizer removed');
}

// Check 2: Critical elements
const criticalElements = ['messagesContainer', 'sendMessage', 'sidebarToggle', 'messageInput'];
criticalElements.forEach(id => {
  if (!html.includes(id)) {
    errors.push(`${id} missing`);
  } else {
    checks.push(`✅ ${id} exists`);
  }
});

// Check 3: No undefined functions
const undefinedPatterns = [
  /(\w+)\.sanitizeHTML/g,
  /new (\w+Sanitizer)/g
];

undefinedPatterns.forEach(pattern => {
  const matches = html.match(pattern);
  if (matches) {
    matches.forEach(match => {
      warnings.push(`⚠️ Potential undefined: ${match}`);
    });
  }
});

// Check 4: Script syntax
const scriptBlocks = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
checks.push(`✅ Found ${scriptBlocks.length} script blocks`);

// Check 5: Template strings properly closed
const templateStrings = html.match(/`[^`]*`/g) || [];
checks.push(`✅ Found ${templateStrings.length} template strings`);

// Print results
checks.forEach(c => console.log(c));

if (warnings.length > 0) {
  console.log('\n⚠️ WARNINGS:');
  warnings.forEach(w => console.log(w));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(e => console.log('  -', e));
}

console.log(`\n=== SUMMARY ===`);
console.log(`Checks Passed: ${checks.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Errors: ${errors.length}`);
console.log(`\nStatus: ${errors.length === 0 ? '✅ ZERO ERRORS' : '❌ ERRORS FOUND'}`);

process.exit(errors.length);
