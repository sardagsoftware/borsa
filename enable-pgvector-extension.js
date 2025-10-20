#!/usr/bin/env node
/**
 * Enable pgvector Extension via Supabase SQL Editor API
 * Uses service role key to execute SQL commands
 */

require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = 'ceipxudbpixhfsnrfjvv';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

console.log('🔧 Enabling pgvector extension via Supabase API\n');

async function enablePgVector() {
  try {
    // Method 1: Use Supabase's SQL endpoint (PostgREST)
    const sqlQuery = 'CREATE EXTENSION IF NOT EXISTS vector;';

    console.log('📝 Executing SQL:', sqlQuery);

    // Try using PostgREST's RPC endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sqlQuery
      })
    });

    if (response.ok) {
      console.log('✅ pgvector extension enabled successfully!');
      return true;
    } else {
      const errorText = await response.text();
      console.log('⚠️  PostgREST RPC not available:', response.status);
      console.log('   Error:', errorText);

      console.log('\n📌 Manual steps required:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/ceipxudbpixhfsnrfjvv/sql/new');
      console.log('   2. Run this SQL query:');
      console.log('      CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('   3. Alternatively, go to: https://supabase.com/dashboard/project/ceipxudbpixhfsnrfjvv/database/extensions');
      console.log('   4. Search for "vector" and click "Enable"\n');

      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);

    console.log('\n📌 Please enable pgvector manually:');
    console.log('   https://supabase.com/dashboard/project/ceipxudbpixhfsnrfjvv/database/extensions');
    console.log('   Search for "vector" and click "Enable"');

    return false;
  }
}

// Also create a verification script
async function verifyPgVector() {
  try {
    console.log('\n🔍 Verifying pgvector extension...');

    // Try to query pg_available_extensions via PostgREST
    const response = await fetch(`${supabaseUrl}/rest/v1/pg_available_extensions?name=eq.vector`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('📦 pgvector info:', data);
    } else {
      console.log('⚠️  Cannot query extension status via API');
    }
  } catch (error) {
    console.log('⚠️  Verification skipped:', error.message);
  }
}

(async () => {
  const enabled = await enablePgVector();
  if (enabled) {
    await verifyPgVector();
  }

  console.log('\n✅ Script completed');
  console.log('📌 Next step: Run Prisma migrations');
  console.log('   npx prisma migrate dev --name init\n');
})();
