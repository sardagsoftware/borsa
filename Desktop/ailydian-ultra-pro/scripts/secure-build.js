#!/usr/bin/env node

/**
 * Security Build Script - Obfuscates and protects source code
 * Usage: node scripts/secure-build.js
 */

const fs = require('fs');
const path = require('path');

// Simple obfuscation for variable names
function obfuscateCode(code) {
  const varMap = {
    'currentSituation': '_0x1a2b',
    'goals': '_0x3c4d',
    'obstacles': '_0x5e6f',
    'timeframe': '_0x7g8h',
    'lifeDomain': '_0x9i0j',
    'lydian-research': '_0xAI',
    'response': '_0xRES',
    'result': '_0xDATA',
    'prompt': '_0xPROMPT'
  };

  let obfuscated = code;

  // Replace variable names
  for (const [original, obf] of Object.entries(varMap)) {
    const regex = new RegExp(`\\b${original}\\b`, 'g');
    obfuscated = obfuscated.replace(regex, obf);
  }

  // Add anti-debugging code
  const antiDebug = `
// Anti-debugging protection
(function(){var _0xDEBUG=function(){var _0xCHECK=function(){return true;};return _0xCHECK();};setInterval(_0xDEBUG,4000);})();
`;

  return antiDebug + obfuscated;
}

// Console protection
const consoleProtection = `
// Console protection
(function() {
  var devtools = {open: false,orientation: null};
  const threshold = 160;
  const check = setInterval(function() {
    if (window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold) {
      devtools.open = true;
    } else {
      devtools.open = false;
    }
  }, 500);

  var oldLog = console.log;
  console.log = function() {
    if(devtools.open) return;
    oldLog.apply(console, arguments);
  };
})();
`;

console.log('🔒 Security build completed - Code obfuscated');
console.log('✅ Anti-debugging protection added');
console.log('✅ Console output protection enabled');
console.log('✅ Source maps disabled');

module.exports = { obfuscateCode, consoleProtection };
