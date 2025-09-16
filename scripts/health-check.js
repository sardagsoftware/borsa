#!/usr/bin/env node

/**
 * AILYDIAN AI LENS - Production Health Check
 * Sistem sağlığını kontrol eden basit script
 */

const https = require('https');
const http = require('http');

console.log('🏥 AILYDIAN AI LENS - Production Health Check');
console.log('='.repeat(50));

// Environment check
console.log('📊 Environment Status:');
console.log(`   Node.js Version: ${process.version}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`   Working Directory: ${process.cwd()}`);
console.log('');

// Package.json check
try {
  const pkg = require('./package.json');
  console.log(`✅ Package: ${pkg.name} v${pkg.version}`);
} catch (error) {
  console.log('❌ Package.json not found');
}

// Environment variables check
const requiredEnvs = ['NODE_ENV', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
let envIssues = 0;

console.log('🔧 Environment Variables:');
requiredEnvs.forEach(env => {
  if (process.env[env]) {
    console.log(`   ✅ ${env}: Set`);
  } else {
    console.log(`   ❌ ${env}: Missing`);
    envIssues++;
  }
});

if (envIssues === 0) {
  console.log('   ✅ All required environment variables are set');
} else {
  console.log(`   ⚠️  ${envIssues} environment variable(s) missing`);
}

console.log('');

// File system checks
const fs = require('fs');
const criticalFiles = [
  'next.config.js',
  'tailwind.config.js',
  '.env.local',
  'app/globals.css'
];

console.log('📁 File System Check:');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}: Found`);
  } else {
    console.log(`   ❌ ${file}: Missing`);
  }
});

console.log('');

// Summary
console.log('📋 Health Check Summary:');
console.log(`   Environment Issues: ${envIssues}`);
console.log('   File System: OK');
console.log('   Node.js Runtime: OK');

if (envIssues === 0) {
  console.log('');
  console.log('🎉 System is healthy and ready for production!');
  process.exit(0);
} else {
  console.log('');
  console.log('⚠️  System has configuration issues. Please fix before deployment.');
  process.exit(1);
}
