#!/usr/bin/env node

/**
 * LyDian CLI Executable
 * This is the entry point when running 'lydian' command
 */

// Check Node.js version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);

if (majorVersion < 16) {
  console.error('Error: LyDian CLI requires Node.js 16.0.0 or higher');
  console.error(`Current version: ${nodeVersion}`);
  console.error('Please update Node.js: https://nodejs.org/');
  process.exit(1);
}

// Load TypeScript if in development, compiled JS in production
try {
  if (require('fs').existsSync(__dirname + '/../dist/index.js')) {
    require('../dist/index.js');
  } else {
    require('ts-node/register');
    require('../src/index.ts');
  }
} catch (error) {
  console.error('Error loading CLI:', error.message);
  process.exit(1);
}
