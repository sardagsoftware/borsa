#!/usr/bin/env node
/**
 * Test different PostgreSQL connection string formats for Supabase
 */

const { Client } = require('pg');

const projectRef = 'ceipxudbpixhfsnrfjvv';
const password = 'LCx3iR4$jLEA!3X';
const encodedPassword = encodeURIComponent(password);

// Test different regions (based on successful DNS resolution from previous test)
const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

// Different connection string formats to try
const formats = [
  {
    name: 'Format 1: postgres (no ref in username)',
    buildUrl: (region, port) =>
      `postgresql://postgres:${encodedPassword}@aws-0-${region}.pooler.supabase.com:${port}/postgres`
  },
  {
    name: 'Format 2: postgres.ref',
    buildUrl: (region, port) =>
      `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:${port}/postgres`
  },
  {
    name: 'Format 3: postgres@ref',
    buildUrl: (region, port) =>
      `postgresql://postgres:${encodedPassword}@aws-0-${region}.pooler.supabase.com:${port}/postgres?application_name=${projectRef}`
  },
  {
    name: 'Format 4: postgres with sslmode',
    buildUrl: (region, port) =>
      `postgresql://postgres:${encodedPassword}@aws-0-${region}.pooler.supabase.com:${port}/postgres?sslmode=require`
  },
];

async function testConnection(url, description) {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    const result = await client.query('SELECT version();');
    console.log(`   ✅✅ SUCCESS! ${description}`);
    console.log(`   📌 PostgreSQL: ${result.rows[0].version.substring(0, 70)}...`);
    console.log(`\n🎉 WORKING CONNECTION STRING:`);
    console.log(`   ${url.replace(encodedPassword, '[PASSWORD]')}\n`);
    await client.end();
    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message.substring(0, 50)}`);
    await client.end().catch(() => {});
    return false;
  }
}

async function findWorkingFormat() {
  console.log('🔧 Testing different connection string formats...\n');

  // Test pooler (port 6543) first as it's recommended for serverless
  console.log('============================================================');
  console.log('TESTING POOLER MODE (Port 6543) - Recommended for Vercel');
  console.log('============================================================\n');

  for (const region of regions) {
    console.log(`\n📍 Region: ${region}`);

    for (const format of formats) {
      console.log(`\n🔍 ${format.name}`);
      const url = format.buildUrl(region, 6543);

      if (await testConnection(url, `${format.name} in ${region}`)) {
        return true;
      }
    }
  }

  // Try direct connection (port 5432) as fallback
  console.log('\n\n============================================================');
  console.log('TESTING DIRECT MODE (Port 5432)');
  console.log('============================================================\n');

  for (const region of regions) {
    console.log(`\n📍 Region: ${region}`);

    for (const format of formats) {
      console.log(`\n🔍 ${format.name}`);
      const url = format.buildUrl(region, 5432);

      if (await testConnection(url, `${format.name} in ${region}`)) {
        return true;
      }
    }
  }

  console.log('\n❌ No working format found in any region');
  console.log('\n📌 The database might be:');
  console.log('   - Paused (needs to be resumed from dashboard)');
  console.log('   - In a different region not tested');
  console.log('   - Using a different password');
  console.log('\n📌 Please verify:');
  console.log('   1. Database is active: https://supabase.com/dashboard/project/ceipxudbpixhfsnrfjvv');
  console.log('   2. Password is correct');
  console.log('   3. Get connection string from: Settings > Database > Connection string\n');

  return false;
}

findWorkingFormat().catch(console.error);
