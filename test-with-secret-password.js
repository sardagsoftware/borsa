#!/usr/bin/env node
/**
 * Test connection using the sb_secret token as password
 * In case this is the actual database password
 */

const { Client } = require('pg');

const projectRef = 'ceipxudbpixhfsnrfjvv';

// Try the secret token as password
const alternativePasswords = [
  'sb_secret_wuCUMkL753VlWcT3qFhz5g_44YMYClm',
  'sb_secret_wuCUMkL753VlWcT3qFhz5g_44YMYClmYour', // In case it was truncated
  'LCx3iR4$jLEA!3X', // Original password
];

const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];

async function testWithPassword(password, region, port) {
  const encodedPassword = encodeURIComponent(password);
  const url = `postgresql://postgres:${encodedPassword}@aws-0-${region}.pooler.supabase.com:${port}/postgres`;

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    const result = await client.query('SELECT version();');
    console.log(`\n✅✅✅ CONNECTION SUCCESSFUL!`);
    console.log(`📍 Region: ${region}`);
    console.log(`🔌 Port: ${port}`);
    console.log(`🔑 Password: ${password.substring(0, 15)}...`);
    console.log(`📌 PostgreSQL: ${result.rows[0].version.substring(0, 70)}...\n`);
    console.log(`🎉 WORKING CONNECTION STRING:`);
    console.log(`postgresql://postgres:[PASSWORD]@aws-0-${region}.pooler.supabase.com:${port}/postgres\n`);
    await client.end();
    return true;
  } catch (error) {
    console.log(`   ${region}:${port} - ${error.message.substring(0, 40)}`);
    await client.end().catch(() => {});
    return false;
  }
}

async function testAll() {
  console.log('🔧 Testing alternative passwords...\n');

  for (const password of alternativePasswords) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Testing password: ${password.substring(0, 20)}...`);
    console.log('='.repeat(70));

    for (const port of [6543, 5432]) {
      console.log(`\nPort ${port}:`);

      for (const region of regions) {
        if (await testWithPassword(password, region, port)) {
          return true;
        }
      }
    }
  }

  console.log('\n❌ None of the passwords worked');
  console.log('\n📌 The database connection details need to be obtained from:');
  console.log('   https://supabase.com/dashboard/project/ceipxudbpixhfsnrfjvv/settings/database');
  console.log('\n📌 Look for:');
  console.log('   - Connection string (URI format)');
  console.log('   - Under "Connection pooling" tab');
  console.log('   - Mode: Transaction or Session');
  console.log('\n📌 Alternative: Use SQL Editor to run schema manually:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/ceipxudbpixhfsnrfjvv/sql/new');
  console.log('   2. Copy content from: schema-generated.sql');
  console.log('   3. Paste and run in SQL Editor\n');

  return false;
}

testAll().catch(console.error);
