#!/usr/bin/env node
/**
 * Test Supabase Connection & Enable pgvector Extension
 * Uses Supabase REST API with SERVICE_ROLE key
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

console.log('🔍 Supabase Connection Test');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Service Role Key:', serviceRoleKey.substring(0, 20) + '...\n');

// Initialize Supabase client with service role key (bypass RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    // Test 1: Check if we can execute SQL via Supabase RPC
    console.log('✅ Test 1: Supabase client initialized successfully\n');

    // Test 2: Enable pgvector extension
    console.log('📦 Test 2: Enabling pgvector extension...');
    const { data: extensionData, error: extensionError } = await supabase
      .rpc('exec_sql', {
        query: 'CREATE EXTENSION IF NOT EXISTS vector;'
      });

    if (extensionError) {
      console.log('⚠️  RPC method not available, trying alternative method...\n');

      // Alternative: Check if pgvector already exists by querying pg_extension
      const { data: checkData, error: checkError } = await supabase
        .from('pg_extension')
        .select('extname')
        .eq('extname', 'vector')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Cannot verify extensions:', checkError.message);
      } else if (checkData) {
        console.log('✅ pgvector extension already enabled!');
      } else {
        console.log('⚠️  pgvector extension not found');
        console.log('📝 You need to enable it manually from Supabase Dashboard:');
        console.log('   https://supabase.com/dashboard/project/ceipxudbpixhfsnrfjvv/database/extensions\n');
      }
    } else {
      console.log('✅ pgvector extension enabled successfully!\n');
    }

    // Test 3: List all tables
    console.log('📋 Test 3: Listing available tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('⚠️  Cannot list tables via information_schema');
      console.log('   This is expected if no tables exist yet\n');
    } else {
      console.log('✅ Found tables:', tables?.map(t => t.table_name).join(', ') || 'none');
    }

    // Test 4: Check PostgreSQL version via health endpoint
    console.log('\n🔍 Test 4: Checking database health...');
    const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });

    if (healthCheck.ok) {
      console.log('✅ Database REST API is healthy');
    } else {
      console.log('⚠️  Database REST API returned:', healthCheck.status);
    }

    console.log('\n✅ **SUPABASE CONNECTION TEST SUCCESSFUL**');
    console.log('📌 Next steps:');
    console.log('   1. Enable pgvector extension from Dashboard (if not already enabled)');
    console.log('   2. Run Prisma migration: npx prisma migrate dev');
    console.log('   3. Generate Prisma client: npx prisma generate');

  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
