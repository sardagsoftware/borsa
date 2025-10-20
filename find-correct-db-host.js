#!/usr/bin/env node
/**
 * Find correct Supabase database hostname
 * Tests multiple pooler formats and regions
 */

const dns = require('dns').promises;
const { Client } = require('pg');

const projectRef = 'ceipxudbpixhfsnrfjvv';
const password = 'LCx3iR4$jLEA!3X'; // Will be URL-encoded
const encodedPassword = encodeURIComponent(password);

// Possible hostname formats for Supabase
const hostnameFormats = [
  // New pooler format (transaction mode)
  `aws-0-us-east-1.pooler.supabase.com`,
  `aws-0-us-west-2.pooler.supabase.com`,
  `aws-0-eu-west-1.pooler.supabase.com`,
  `aws-0-ap-southeast-1.pooler.supabase.com`,
  `aws-0-ap-northeast-1.pooler.supabase.com`,

  // Alternative pooler format
  `pooler.supabase.com`,

  // Old direct connection format (likely won't work but worth trying)
  `db.${projectRef}.supabase.co`,

  // Pooler with project ref
  `${projectRef}.pooler.supabase.com`,

  // Direct connection alternative
  `db.${projectRef}.supabase.com`,
];

async function testHostname(hostname, port = 5432) {
  try {
    // Test 1: DNS resolution
    console.log(`\n🔍 Testing: ${hostname}:${port}`);

    const addresses = await dns.resolve4(hostname).catch(() => null);
    if (!addresses) {
      console.log('   ❌ DNS resolution failed');
      return false;
    }
    console.log(`   ✅ DNS resolved to: ${addresses[0]}`);

    // Test 2: Try connecting
    const connectionString = `postgresql://postgres.${projectRef}:${encodedPassword}@${hostname}:${port}/postgres`;

    console.log(`   🔌 Attempting connection...`);
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      const result = await client.query('SELECT version();');
      console.log(`   ✅✅ CONNECTION SUCCESSFUL!`);
      console.log(`   📌 PostgreSQL version: ${result.rows[0].version.substring(0, 50)}...`);
      console.log(`\n🎉 FOUND WORKING CONNECTION STRING:`);
      console.log(`   postgresql://postgres.${projectRef}:[PASSWORD]@${hostname}:${port}/postgres\n`);
      await client.end();
      return true;
    } catch (connErr) {
      console.log(`   ❌ Connection failed: ${connErr.message.substring(0, 60)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function findWorkingConnection() {
  console.log('🔧 Finding correct Supabase database hostname...\n');
  console.log(`📍 Project ref: ${projectRef}`);
  console.log(`🔑 Password: ${password.substring(0, 5)}... (URL-encoded)\n`);

  let found = false;

  // Test pooler ports
  const portsToTest = [
    { port: 6543, mode: 'Transaction Mode (Pooler)' },
    { port: 5432, mode: 'Session Mode (Direct)' }
  ];

  for (const { port, mode } of portsToTest) {
    if (found) break;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${mode} - Port ${port}`);
    console.log('='.repeat(60));

    for (const hostname of hostnameFormats) {
      if (await testHostname(hostname, port)) {
        found = true;
        break;
      }
    }
  }

  if (!found) {
    console.log('\n❌ No working connection found');
    console.log('\n📌 Next steps:');
    console.log('   1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ceipxudbpixhfsnrfjvv/settings/database');
    console.log('   2. Copy the "Connection string" under "Connection pooling"');
    console.log('   3. Update .env with the correct DATABASE_URL\n');
  }
}

findWorkingConnection().catch(console.error);
