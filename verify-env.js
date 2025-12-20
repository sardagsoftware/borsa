#!/usr/bin/env node

/**
 * 🔐 ENVIRONMENT VARIABLES VALIDATION
 * Checks all required env vars before deployment
 */

const requiredEnvVars = [
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_GPT4_DEPLOYMENT',
  'AZURE_GPT4_VISION_DEPLOYMENT'
];

const optionalEnvVars = [
  'AZURE_SPEECH_KEY',
  'AZURE_SPEECH_REGION',
  'ANTHROPIC_API_KEY',
  'GOOGLE_API_KEY',
  'OPENAI_API_KEY',
  'GROQ_API_KEY'
];

console.log('🔍 ENVIRONMENT VARIABLES VALIDATION\n');
console.log('━'.repeat(60));

let missingRequired = [];
let missingOptional = [];

// Check required vars
console.log('\n✅ Required Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const maskedValue = value.length > 10
      ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
      : '***';
    console.log(`  ✓ ${varName}: ${maskedValue}`);
  } else {
    console.log(`  ✗ ${varName}: MISSING`);
    missingRequired.push(varName);
  }
});

// Check optional vars
console.log('\n⚙️  Optional Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const maskedValue = value.length > 10
      ? value.substring(0, 8) + '...'
      : '***';
    console.log(`  ✓ ${varName}: ${maskedValue}`);
  } else {
    console.log(`  - ${varName}: Not set`);
    missingOptional.push(varName);
  }
});

console.log('\n' + '━'.repeat(60));

// Results
if (missingRequired.length === 0) {
  console.log('\n✅ ALL REQUIRED VARIABLES PRESENT!');
  console.log('   System ready for production deployment');

  if (missingOptional.length > 0) {
    console.log('\n⚠️  Optional features disabled:');
    missingOptional.forEach(varName => {
      if (varName.includes('SPEECH')) {
        console.log(`   - Voice analysis (${varName})`);
      } else if (varName.includes('lydian-research')) {
        console.log(`   - AX9F7E2B AI models (${varName})`);
      } else if (varName.includes('lydian-vision')) {
        console.log(`   - Gemini models (${varName})`);
      } else if (varName.includes('lydian-labs')) {
        console.log(`   - OpenAI GPT models (${varName})`);
      } else if (varName.includes('lydian-velocity')) {
        console.log(`   - Groq models (${varName})`);
      }
    });
  }

  process.exit(0);
} else {
  console.log('\n❌ MISSING REQUIRED VARIABLES:');
  missingRequired.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📝 Add these to your .env file or Vercel environment variables');
  console.log('   Deployment will fail without these!\n');
  process.exit(1);
}
